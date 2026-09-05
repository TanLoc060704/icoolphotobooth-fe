import { useEffect, useMemo, useState } from 'react'
import { Button } from 'primereact/button'
import { usePhotobooth } from '../../store/PhotoboothContext.jsx'
import { getGallery } from '../../services/sessionApi.js'
import './PreviewScreen.css'

const PREVIEW_TIMEOUT_SECONDS = 60
const PUBLIC_WEB_BASE_URL = (import.meta.env.VITE_PUBLIC_WEB_BASE_URL || 'http://cam-dd.synology.me:3000').replace(/\/$/, '')

const getPhotoType = (photo) => String(photo?.type || photo?.photoType || '').toUpperCase()
const getBoothUrl = (qrCodeToken) => `${PUBLIC_WEB_BASE_URL}/booth/${encodeURIComponent(qrCodeToken)}`
const getQrImageUrl = (value) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(value)}`

export default function PreviewScreen() {
  const { currentStep, nextStep, session, capturedPhotos, finalImage } = usePhotobooth()
  const [gallery, setGallery] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const [timeLeft, setTimeLeft] = useState(PREVIEW_TIMEOUT_SECONDS)

  const photos = useMemo(() => {
    const photoMap = new Map()
    const addPhoto = (photo, fallbackType) => {
      const normalizedPhoto = typeof photo === 'string'
        ? { imageUrl: photo, type: fallbackType }
        : {
            ...photo,
            imageUrl: photo?.imageUrl || photo?.image_url || photo?.url || photo?.photoUrl || photo?.photo_url,
            type: photo?.type || photo?.photoType || photo?.photo_type || fallbackType,
          }

      if (!normalizedPhoto.imageUrl) return

      const existingPhoto = photoMap.get(normalizedPhoto.imageUrl)
      photoMap.set(normalizedPhoto.imageUrl, existingPhoto
        ? { ...existingPhoto, ...normalizedPhoto, type: normalizedPhoto.type || existingPhoto.type }
        : normalizedPhoto)
    }

    ;(gallery?.photos || []).forEach((photo) => addPhoto(photo))
    ;(capturedPhotos || []).forEach((photo) => addPhoto(photo, 'RAW'))
    if (finalImage) addPhoto(finalImage, 'FINAL')

    return Array.from(photoMap.values())
  }, [capturedPhotos, finalImage, gallery])
  const finalPhoto = useMemo(
    () => photos.find((photo) => getPhotoType(photo) === 'FINAL') || null,
    [photos],
  )
  const rawPhotos = useMemo(
    () => photos.filter((photo) => getPhotoType(photo) !== 'FINAL'),
    [photos],
  )
  const sessionError = currentStep === 5 && !session?.qrCodeToken
    ? 'KhÃ´ng tÃ¬m tháº¥y mÃ£ QR cá»§a phiÃªn chá»¥p.'
    : null
  const displayError = sessionError || error
  const boothUrl = session?.qrCodeToken ? getBoothUrl(session.qrCodeToken) : null
  const qrImageUrl = boothUrl ? getQrImageUrl(boothUrl) : null

  useEffect(() => {
    if (currentStep !== 5) return undefined

    const resetTimerId = window.setTimeout(() => setTimeLeft(PREVIEW_TIMEOUT_SECONDS), 0)
    const timerId = window.setInterval(() => {
      setTimeLeft((value) => Math.max(0, value - 1))
    }, 1000)

    return () => {
      window.clearTimeout(resetTimerId)
      window.clearInterval(timerId)
    }
  }, [currentStep])

  useEffect(() => {
    if (currentStep === 5 && timeLeft === 0) nextStep()
  }, [currentStep, nextStep, timeLeft])

  useEffect(() => {
    if (currentStep !== 5) return undefined
    if (!session?.qrCodeToken) {
      window.setTimeout(() => setGallery(null), 0)
      window.setTimeout(() => setError('Không tìm thấy mã QR của phiên chụp.'), 0)
      return undefined
    }

    const controller = new AbortController()
    const loadingTimerId = window.setTimeout(() => {
      if (controller.signal.aborted) return
      setIsLoading(true)
      setError(null)
    }, 0)

    getGallery(session.qrCodeToken, { signal: controller.signal })
      .then(setGallery)
      .catch((requestError) => {
        if (controller.signal.aborted) return
        setError(requestError instanceof Error ? requestError.message : 'Không thể tải thư viện ảnh.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => {
      window.clearTimeout(loadingTimerId)
      controller.abort()
    }
  }, [currentStep, retryCount, session?.qrCodeToken])

  if (currentStep !== 5) return null

  const canContinue = !isLoading && !displayError && photos.length > 0

  return (
    <section className="preview-screen-container">
      <div className="preview-nebula preview-nebula-left" />
      <div className="preview-nebula preview-nebula-right" />

      <header className="preview-header">
        {/* <span className="preview-step-tag">Bước 05 / 07</span> */}
        <h2 className="preview-title">Xem lại ảnh của bạn</h2>
        <p className="preview-subtitle">Kiểm tra ảnh ghép và toàn bộ ảnh đã chụp trước khi nhận ảnh</p>
        <div className="preview-countdown">
          <span>Thời gian xem lại: <strong>{timeLeft} giây</strong></span>
          <div className="preview-countdown-track">
            <div
              className="preview-countdown-fill"
              style={{ width: `${(timeLeft / PREVIEW_TIMEOUT_SECONDS) * 100}%` }}
            />
          </div>
        </div>
      </header>

      <main className="preview-content">
        {isLoading && (
          <div className="preview-state-card">
            <i className="pi pi-spin pi-spinner preview-state-icon" />
            <strong>Đang tải thư viện ảnh...</strong>
            <span>Vui lòng chờ trong giây lát</span>
          </div>
        )}

        {!isLoading && displayError && (
          <div className="preview-state-card preview-error-card">
            <i className="pi pi-exclamation-circle preview-state-icon" />
            <strong>Không thể hiển thị ảnh</strong>
            <span>{displayError}</span>
            <Button
              label="Thử lại"
              icon="pi pi-refresh"
              severity="secondary"
              outlined
              onClick={() => setRetryCount((value) => value + 1)}
            />
          </div>
        )}

        {!isLoading && !displayError && !photos.length && (
          <div className="preview-state-card">
            <i className="pi pi-images preview-state-icon" />
            <strong>Gallery chưa có ảnh</strong>
            <span>Ảnh sẽ xuất hiện tại đây sau khi phiên chụp hoàn tất.</span>
          </div>
        )}

        {!isLoading && !displayError && photos.length > 0 && (
          <div className="preview-gallery-layout">
            <article className="preview-final-panel">
              <div className="preview-panel-heading">
                <div>
                  <span className="preview-panel-eyebrow">Thành phẩm</span>
                  <h3>Ảnh ghép hoàn chỉnh</h3>
                </div>
                <span className="preview-ready-badge">
                  <i className="pi pi-check-circle" /> Sẵn sàng
                </span>
              </div>

              <div className="preview-final-frame">
                {finalPhoto ? (
                  <img src={finalPhoto.imageUrl} alt="Ảnh ghép hoàn chỉnh" />
                ) : (
                  <div className="preview-final-placeholder">
                    <i className="pi pi-image" />
                    <span>Chưa có ảnh ghép</span>
                  </div>
                )}
              </div>
            </article>

            <aside className="preview-raw-panel">
              <div className="preview-panel-heading">
                <div>
                  <span className="preview-panel-eyebrow">Ảnh gốc</span>
                  <h3>{rawPhotos.length} ảnh đã chụp</h3>
                </div>
                <span className="preview-photo-count">{rawPhotos.length}</span>
              </div>

              <div className="preview-raw-grid">
                {rawPhotos.map((photo, index) => (
                  <figure className="preview-photo-card" key={photo.id ?? photo.imageUrl ?? index}>
                    <img src={photo.imageUrl} alt={`Ảnh chụp ${index + 1}`} />
                    <figcaption>
                      <span>Ảnh {index + 1}</span>
                      <i className="pi pi-check" aria-hidden="true" />
                    </figcaption>
                  </figure>
                ))}
              </div>

              {qrImageUrl && (
                <div className="preview-qr-card">
                  <img src={qrImageUrl} alt="Mã QR nhận và tải ảnh" />
                  <div>
                    <span className="preview-panel-eyebrow">Nhận ảnh</span>
                    <h3>Quét QR để tải ảnh</h3>
                    <p>Điền thông tin trên điện thoại để mở liên kết tải ảnh.</p>
                  </div>
                </div>
              )}
            </aside>
          </div>
        )}
      </main>

      <footer className="preview-footer">
        <div className="preview-session-info">
          <i className="pi pi-qrcode" />
          <span>Ảnh đã được lưu theo mã phiên</span>
          <strong>{gallery?.qrCodeToken || session?.qrCodeToken}</strong>
        </div>
        <Button
          label="Xác nhận và nhận ảnh"
          icon="pi pi-arrow-right"
          iconPos="right"
          size="large"
          className="preview-next-btn"
          disabled={!canContinue}
          onClick={nextStep}
        />
      </footer>
    </section>
  )
}
