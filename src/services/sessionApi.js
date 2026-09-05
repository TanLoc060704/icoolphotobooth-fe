import { API_PATHS } from '../config/endpoints.js'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
let accessToken = null

const apiUrl = (path) => {
  if (!API_BASE_URL) throw new Error('Thiếu VITE_API_BASE_URL trong file .env.')
  return `${API_BASE_URL}${path}`
}

const getErrorMessage = async (response, fallback) => {
  try { return (await response.json())?.message || fallback } catch { return fallback }
}

const getToken = (payload) => {
  const candidates = [payload?.accessToken, payload?.token, payload?.data?.accessToken, payload?.data?.token, payload?.data?.access_token]
  return candidates.find((value) => typeof value === 'string' && value.trim()) || null
}

async function getAccessToken() {
  if (accessToken) return accessToken
  const { VITE_API_USERNAME: username, VITE_API_PASSWORD: password } = import.meta.env
  if (!username || !password) throw new Error('Thiếu thông tin đăng nhập API trong file .env.')
  const response = await fetch(apiUrl(API_PATHS.login), {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }),
  })
  if (!response.ok) throw new Error(await getErrorMessage(response, 'Đăng nhập API không thành công.'))
  accessToken = getToken(await response.json())
  if (!accessToken) throw new Error('API đăng nhập không trả về access token.')
  return accessToken
}

async function privateJson(path, body, fallback) {
  const token = await getAccessToken()
  const response = await fetch(apiUrl(path), {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
  if (!response.ok) throw new Error(await getErrorMessage(response, fallback))
  return response.json()
}

export function createQrCodeToken() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

const normalizeSession = (payload, qrCodeToken) => {
  const data = payload?.data?.session || payload?.session || payload?.data?.result || payload?.result || payload?.data || payload
  return {
    ...data,
    id: data?.id ?? data?.sessionId ?? data?.session_id,
    qrCodeToken: data?.qrCodeToken ?? data?.qr_code_token ?? data?.qrToken ?? qrCodeToken,
  }
}

export async function startSession({ photoBoothId, frameId, frameCount, voucherId = null }) {
  const qrCodeToken = createQrCodeToken()
  const payload = await privateJson(API_PATHS.sessions, { photoBoothId, frameId, frameCount, qrCodeToken, voucherId }, 'Không thể khởi tạo phiên chụp.')
  const session = normalizeSession(payload, qrCodeToken)
  if (session.id !== undefined && session.id !== null) return session

  // Some backend versions return only a status for POST, while the public
  // session endpoint returns the persisted entity including its database ID.
  try {
    const response = await fetch(apiUrl(API_PATHS.publicSession(qrCodeToken)))
    if (response.ok) return normalizeSession(await response.json(), qrCodeToken)
  } catch {
    // The caller will show the actionable error below if no ID can be resolved.
  }
  return session
}

export async function uploadPhoto(file) {
  const formData = new FormData()
  formData.append('file', file)
  // The server currently protects this endpoint even though the original API
  // contract lists it as public. Do not set Content-Type manually: the browser
  // must add the multipart boundary for FormData.
  const token = await getAccessToken()
  const response = await fetch(apiUrl(API_PATHS.uploadPhoto), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })
  if (!response.ok) throw new Error(await getErrorMessage(response, 'Không thể tải ảnh lên máy chủ.'))
  const payload = await response.json()
  if (!payload?.url) throw new Error('API upload không trả về URL ảnh.')
  return payload
}

export function saveRawPhoto({ sessionId, imageUrl, stickersData = null, filterApplied = 'none', peopleCount = null }) {
  return privateJson(API_PATHS.photos, { sessionId, imageUrl, stickersData, filterApplied, peopleCount }, 'Không thể lưu thông tin ảnh.')
}

async function publicJson(path, body, fallback) {
  const response = await fetch(apiUrl(path), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!response.ok) throw new Error(await getErrorMessage(response, fallback))
  return response.json()
}

export function finalizeSession(qrCodeToken, finalImageUrl) {
  return publicJson(API_PATHS.finalizeSession(qrCodeToken), { finalImageUrl }, 'Không thể hoàn tất ảnh ghép.')
}

export function saveCustomerInfo(qrCodeToken, customerInfo) {
  return publicJson(API_PATHS.customerInfo(qrCodeToken), customerInfo, 'Không thể lưu thông tin khách hàng.')
}

const getPhotoUrl = (photo) => {
  if (typeof photo === 'string') return photo
  return photo?.imageUrl || photo?.image_url || photo?.url || photo?.photoUrl || photo?.photo_url || photo?.finalImageUrl || photo?.final_image_url || null
}

const normalizeGallery = (payload) => {
  const data = payload?.data || payload
  const normalizePhotoList = (items, fallbackType = null) => (
    Array.isArray(items)
      ? items
        .map((photo) => (typeof photo === 'string' ? { imageUrl: photo } : { ...photo, imageUrl: getPhotoUrl(photo) }))
        .filter((photo) => photo.imageUrl)
        .map((photo) => ({
          ...photo,
          type: photo.type || photo.photoType || photo.photo_type || fallbackType,
        }))
      : []
  )

  const photoMap = new Map()
  const addPhotos = (items, fallbackType = null) => {
    normalizePhotoList(items, fallbackType).forEach((photo) => {
      if (!photoMap.has(photo.imageUrl)) photoMap.set(photo.imageUrl, photo)
    })
  }

  addPhotos(Array.isArray(data) ? data : null)
  addPhotos(data?.rawPhotos || data?.raw_photos || data?.session?.rawPhotos || data?.session?.raw_photos, 'RAW')
  addPhotos(data?.photos || data?.session?.photos)
  addPhotos(data?.images || data?.session?.images)
  addPhotos(data?.items || data?.session?.items)

  const photos = Array.from(photoMap.values())

  const finalImageUrl = data?.finalImageUrl || data?.final_image_url || data?.session?.finalImageUrl || data?.session?.final_image_url || payload?.finalImageUrl || payload?.final_image_url || null
  const hasFinalInPhotos = finalImageUrl && photos.some((photo) => photo.imageUrl === finalImageUrl)

  return {
    ...data,
    photos: finalImageUrl && !hasFinalInPhotos
      ? [...photos, { id: 'final-image', imageUrl: finalImageUrl, type: 'FINAL' }]
      : photos,
    finalImageUrl,
  }
}

export async function getGallery(qrCodeToken, options = {}) {
  const response = await fetch(apiUrl(API_PATHS.gallerySession(qrCodeToken)), { signal: options.signal })
  if (!response.ok) throw new Error(await getErrorMessage(response, 'Khong the tai thu vien anh.'))
  return normalizeGallery(await response.json())
}

export async function getDownload(qrCodeToken) {
  const response = await fetch(apiUrl(API_PATHS.downloadSession(qrCodeToken)))
  if (!response.ok) throw new Error(await getErrorMessage(response, 'Ảnh chưa sẵn sàng để tải.'))
  const payload = await response.json()
  return payload?.data || payload
}
