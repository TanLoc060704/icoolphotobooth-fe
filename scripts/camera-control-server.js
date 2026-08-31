/* global process */

import { createServer } from 'node:http'
import { createConnection } from 'node:net'
import { basename, dirname, resolve } from 'node:path'
import { spawn, execFile } from 'node:child_process'

const PORT = Number(process.env.CAMERA_CONTROL_PORT || 5513)
const DEFAULT_CAMERA_APP_PATH = process.env.CAMERA_APP_PATH || ''
const CAMERA_SOCKET_HOST = process.env.CAMERA_SOCKET_HOST || '127.0.0.1'
const CAMERA_SOCKET_PORT = Number(process.env.CAMERA_SOCKET_PORT || 8080)
const CAMERA_START_TIMEOUT_MS = Number(process.env.CAMERA_START_TIMEOUT_MS || 20000)

let cameraProcess = null
let cameraExeName = DEFAULT_CAMERA_APP_PATH ? basename(DEFAULT_CAMERA_APP_PATH) : ''

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  })
  response.end(JSON.stringify(payload))
}

function readJson(request) {
  return new Promise((resolveRequest, reject) => {
    let body = ''
    request.on('data', (chunk) => {
      body += chunk
    })
    request.on('end', () => {
      if (!body) {
        resolveRequest({})
        return
      }

      try {
        resolveRequest(JSON.parse(body))
      } catch (error) {
        reject(error)
      }
    })
    request.on('error', reject)
  })
}

function isStartedProcessRunning() {
  return cameraProcess && cameraProcess.exitCode === null && !cameraProcess.killed
}

function delay(milliseconds) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds))
}

function canConnectToCameraSocket() {
  return new Promise((resolveConnection) => {
    const socket = createConnection({ host: CAMERA_SOCKET_HOST, port: CAMERA_SOCKET_PORT })
    let completed = false

    const finish = (connected) => {
      if (completed) return
      completed = true
      socket.destroy()
      resolveConnection(connected)
    }

    socket.setTimeout(500)
    socket.once('connect', () => finish(true))
    socket.once('timeout', () => finish(false))
    socket.once('error', () => finish(false))
  })
}

async function waitForCameraSocket(timeoutMs) {
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    if (await canConnectToCameraSocket()) return true
    if (cameraProcess && cameraProcess.exitCode !== null) return false
    await delay(300)
  }

  return false
}

function stopByImageName(imageName) {
  return new Promise((resolveStop) => {
    if (!imageName) {
      resolveStop(false)
      return
    }

    execFile('taskkill', ['/F', '/IM', imageName], { windowsHide: true }, (error) => {
      resolveStop(!error)
    })
  })
}

async function handleStart(request, response) {
  const body = await readJson(request)
  const appPath = body.path || DEFAULT_CAMERA_APP_PATH

  if (!appPath) {
    sendJson(response, 400, { ok: false, error: 'Missing camera app path.' })
    return
  }

  if (await canConnectToCameraSocket()) {
    sendJson(response, 200, { ok: true, alreadyRunning: true, pid: cameraProcess?.pid || null })
    return
  }

  const resolvedPath = resolve(appPath)
  cameraExeName = basename(resolvedPath)

  // A previous launcher may have closed while leaving the camera process alive.
  // Clear that stale process before opening a new Canon SDK session.
  if (isStartedProcessRunning()) cameraProcess.kill()
  await stopByImageName(cameraExeName)
  cameraProcess = null
  await delay(800)

  const startedProcess = spawn(resolvedPath, {
    cwd: dirname(resolvedPath),
    detached: false,
    stdio: 'ignore',
    windowsHide: false,
  })
  cameraProcess = startedProcess

  startedProcess.on('exit', () => {
    if (cameraProcess === startedProcess) cameraProcess = null
  })
  startedProcess.unref()

  const socketReady = await waitForCameraSocket(CAMERA_START_TIMEOUT_MS)
  if (!socketReady) {
    if (cameraProcess === startedProcess) cameraProcess = null
    if (startedProcess.exitCode === null) startedProcess.kill()
    await stopByImageName(cameraExeName)
    sendJson(response, 503, {
      ok: false,
      error: `Camera app did not open WebSocket port ${CAMERA_SOCKET_PORT} within ${CAMERA_START_TIMEOUT_MS / 1000} seconds.`,
    })
    return
  }

  sendJson(response, 200, { ok: true, pid: startedProcess.pid, socketReady: true })
}

async function handleStop(response) {
  if (isStartedProcessRunning()) {
    cameraProcess.kill()
  }

  const stopped = await stopByImageName(cameraExeName)
  cameraProcess = null
  sendJson(response, 200, { ok: true, stopped })
}

createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    sendJson(response, 204, {})
    return
  }

  try {
    if (request.method === 'POST' && request.url === '/start') {
      await handleStart(request, response)
      return
    }

    if (request.method === 'POST' && request.url === '/stop') {
      await handleStop(response)
      return
    }

    sendJson(response, 404, { ok: false, error: 'Not found.' })
  } catch (error) {
    sendJson(response, 500, { ok: false, error: error instanceof Error ? error.message : 'Unknown error.' })
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`Camera control server listening on http://127.0.0.1:${PORT}`)
})
