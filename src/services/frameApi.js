import { API_PATHS } from '../config/endpoints.js'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

const getToken = (payload) => {
  const candidates = [payload?.accessToken, payload?.token, payload?.data?.accessToken, payload?.data?.token, payload?.data?.access_token]
  return candidates.find((value) => typeof value === 'string' && value.trim()) || null
}

const getErrorMessage = async (response, fallback) => {
  try { return (await response.json())?.message || fallback } catch { return fallback }
}

export async function fetchFrames() {
  if (!API_BASE_URL) throw new Error('Thiếu VITE_API_BASE_URL trong file .env.')
  const { VITE_API_USERNAME: username, VITE_API_PASSWORD: password } = import.meta.env
  if (!username || !password) throw new Error('Thiếu thông tin đăng nhập API trong file .env.')
  const loginResponse = await fetch(`${API_BASE_URL}${API_PATHS.login}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }),
  })
  if (!loginResponse.ok) throw new Error(await getErrorMessage(loginResponse, 'Đăng nhập API không thành công.'))
  const token = getToken(await loginResponse.json())
  if (!token) throw new Error('API đăng nhập không trả về access token.')
  const framesResponse = await fetch(`${API_BASE_URL}${API_PATHS.frames}`, { headers: { Authorization: `Bearer ${token}` } })
  if (!framesResponse.ok) throw new Error(await getErrorMessage(framesResponse, 'Không thể tải danh sách frame.'))
  const payload = await framesResponse.json()
  if (!Array.isArray(payload?.data)) throw new Error('Dữ liệu frame từ API không hợp lệ.')
  return payload.data.filter((frame) => frame?.status === 'ACTIVE').map((frame) => ({ ...frame, slots: [...(frame.slots || [])].sort((a, b) => a.slotIndex - b.slotIndex) }))
}
