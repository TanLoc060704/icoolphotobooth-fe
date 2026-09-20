const CAMERA_CONTROL_ENABLED = import.meta.env.VITE_CAMERA_CONTROL_ENABLED === 'true'
const CAMERA_CONTROL_BASE_URL = import.meta.env.VITE_CAMERA_CONTROL_BASE_URL || 'http://127.0.0.1:5513'
const CAMERA_APP_PATH = import.meta.env.VITE_CAMERA_APP_PATH || ''
const CAMERA_READY_TIMEOUT_MS = 20000
const CAMERA_REQUEST_TIMEOUT_MS = 5000
const CAMERA_MAX_WAKE_ATTEMPTS = 3

let startPromise = null
let wakePromise = null

function delay(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

async function requestCameraControl(path, options = {}) {
  if (!CAMERA_CONTROL_ENABLED) return { skipped: true }

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), CAMERA_REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${CAMERA_CONTROL_BASE_URL.replace(/\/$/, '')}/${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
      signal: controller.signal,
    })
    const result = await response.json().catch(() => ({}))

    if (!response.ok) {
      const error = new Error(result.error || `Camera control request /${path} failed.`)
      error.status = response.status
      throw error
    }

    return result
  } finally {
    window.clearTimeout(timeoutId)
  }
}

async function sendCameraCommand(command) {
  if (!CAMERA_CONTROL_ENABLED) return { skipped: true }

  let response
  try {
    response = await fetch(`${CAMERA_CONTROL_BASE_URL.replace(/\/$/, '')}/${command}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: CAMERA_APP_PATH }),
    })
  } catch {
    throw new Error('Chua bat camera-control. Hay chay lenh: npm run camera-control')
  }

  if (!response.ok) {
    const result = await response.json().catch(() => ({}))
    throw new Error(
      result.error || `Khong the ${command === 'start' ? 'mo' : 'dong'} ung dung may anh.`,
    )
  }

  return response.json().catch(() => ({}))
}

export function startCameraApp() {
  if (!startPromise) {
    startPromise = sendCameraCommand('start').finally(() => {
      startPromise = null
    })
  }
  return startPromise
}

export function stopCameraApp() {
  return sendCameraCommand('stop')
}

export function getCameraStatus() {
  return requestCameraControl('status', { method: 'GET' })
}

function isCameraReady(status) {
  return status?.connected === true && status?.ready === true
}

async function waitForCameraReady(deadline) {
  let lastStatus = null

  while (Date.now() < deadline) {
    try {
      lastStatus = await getCameraStatus()
      if (isCameraReady(lastStatus)) return lastStatus
    } catch {
      return null
    }
    await delay(500)
  }

  return lastStatus
}

export async function ensureCameraAppRunning() {
  if (!CAMERA_CONTROL_ENABLED) return { skipped: true }

  try {
    return await getCameraStatus()
  } catch {
    await startCameraApp()
    return waitForCameraReady(Date.now() + CAMERA_READY_TIMEOUT_MS)
  }
}

async function wakeCameraWithFallback() {
  if (!CAMERA_CONTROL_ENABLED) return { skipped: true, connected: true, ready: true }

  const deadline = Date.now() + CAMERA_READY_TIMEOUT_MS
  let lastError = null

  for (let attempt = 1; attempt <= CAMERA_MAX_WAKE_ATTEMPTS && Date.now() < deadline; attempt += 1) {
    try {
      await requestCameraControl('wake', { method: 'POST' })
      const attemptDeadline = Math.min(deadline, Date.now() + 5000)
      const status = await waitForCameraReady(attemptDeadline)
      if (isCameraReady(status)) return status
      lastError = new Error('Máy ảnh chưa sẵn sàng.')
      if (!status) await startCameraApp()
    } catch (error) {
      lastError = error
      try {
        await startCameraApp()
      } catch (startError) {
        lastError = startError
      }
    }

    if (Date.now() < deadline) await delay(500)
  }

  throw new Error(
    lastError?.message
      ? `Không thể khởi động máy ảnh: ${lastError.message} Vui lòng liên hệ nhân viên hỗ trợ.`
      : 'Không thể khởi động máy ảnh. Vui lòng liên hệ nhân viên hỗ trợ.',
  )
}

export function wakeCameraApp() {
  if (!wakePromise) {
    wakePromise = wakeCameraWithFallback().finally(() => {
      wakePromise = null
    })
  }
  return wakePromise
}
