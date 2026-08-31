const CAMERA_CONTROL_ENABLED = import.meta.env.VITE_CAMERA_CONTROL_ENABLED === 'true'
const CAMERA_CONTROL_BASE_URL = import.meta.env.VITE_CAMERA_CONTROL_BASE_URL || 'http://127.0.0.1:5513'
const CAMERA_APP_PATH = import.meta.env.VITE_CAMERA_APP_PATH || ''

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
  return sendCameraCommand('start')
}

export function stopCameraApp() {
  return sendCameraCommand('stop')
}
