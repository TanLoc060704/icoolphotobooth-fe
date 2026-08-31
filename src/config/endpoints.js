const PRIVATE_API_PREFIX = '/api/private'

export const API_PATHS = {
  login: '/api/v1/auth/login',
  frames: `${PRIVATE_API_PREFIX}/frames`,
  sessions: `${PRIVATE_API_PREFIX}/sessions`,
  photos: `${PRIVATE_API_PREFIX}/photos`,
  uploadPhoto: '/api/v1/photos',
  publicSession: (qrCodeToken) => `/api/public/sessions/${encodeURIComponent(qrCodeToken)}`,
  gallerySession: (qrCodeToken) => `/api/public/sessions/${encodeURIComponent(qrCodeToken)}/gallery`,
  finalizeSession: (qrCodeToken) => `/api/public/sessions/${encodeURIComponent(qrCodeToken)}/finalize`,
  customerInfo: (qrCodeToken) => `/api/public/sessions/${encodeURIComponent(qrCodeToken)}/customer-info`,
  downloadSession: (qrCodeToken) => `/api/public/sessions/${encodeURIComponent(qrCodeToken)}/download`,
}
