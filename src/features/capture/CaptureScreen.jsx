import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from 'primereact/button'
import { usePhotobooth } from '../../store/PhotoboothContext.jsx'
import { saveRawPhoto } from '../../services/sessionApi.js'
import { getSlotPhotoArrayIndex } from '../../utils/frameSlots.js'
import './CaptureScreen.css'

const CAMERA_SOCKET_URL = 'ws://localhost:8080/'
const CAPTURE_HEADER = 'CAPTURE:'
const CAPTURE_HEADER_LENGTH = 8
const PHOTO_URL_PREFIX = 'PHOTO_URL:'
const CAPTURE_RESPONSE_TIMEOUT_MS = 30000
const MAX_CAPTURED_IMAGES = 6
const SHOT_DELAY_MS = 1500
const USE_MOCK_CAPTURE_PHOTOS = false
const MOCK_CAPTURE_PHOTOS = [
  'http://cam-dd.synology.me:8080/media/596cfc1e-fa5a-401a-bcb2-a3ebed546699.JPG',
  'http://cam-dd.synology.me:8080/media/116bfc79-0657-4938-ad63-e8d4c5d7515b.JPG',
  'http://cam-dd.synology.me:8080/media/d106bb96-7b70-47bd-986e-eeec80915952.JPG',
  'http://cam-dd.synology.me:8080/media/c75546c6-d05c-404c-b5f2-da4fab78d01e.JPG',
  'http://cam-dd.synology.me:8080/media/97b63b07-735f-4b69-9b67-792b5a487f9f.JPG',
  'http://cam-dd.synology.me:8080/media/72767cfa-c17c-4669-9ed9-f261ab3406f7.JPG',
]

export default function CaptureScreen() {
  const {
    currentStep,
    nextStep,
    prevStep,
    selectedFrame,
    expectedPoses,
    setCapturedPhotos,
    session,
  } = usePhotobooth()

  const socketRef = useRef(null)
  const liveViewImageRef = useRef(null)
  const latestFrameBlobRef = useRef(null)
  const liveFrameUrlRef = useRef(null)
  const hasLiveViewRef = useRef(false)
  const capturedObjectUrlsRef = useRef(new Set())
  const currentShotIndexRef = useRef(0)
  const countdownIntervalRef = useRef(null)
  const nextShotTimeoutRef = useRef(null)
  const pickerTimeoutRef = useRef(null)
  const flashTimeoutRef = useRef(null)
  const captureResponseTimeoutRef = useRef(null)
  const toastTimeoutRef = useRef(null)
  const isWaitingForCaptureRef = useRef(false)
  const pendingOfficialPhotoSlotsRef = useRef([])
  const capturedImagesRef = useRef([])
  const hasLoadedMockPhotosRef = useRef(false)

  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const [hasLiveView, setHasLiveView] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [currentShotIndex, setCurrentShotIndex] = useState(0)
  const [countdown, setCountdown] = useState(null)
  const [isFlashing, setIsFlashing] = useState(false)
  const [capturedImages, setCapturedImages] = useState([])
  const [isPicking, setIsPicking] = useState(false)
  const [selectedIndices, setSelectedIndices] = useState([])
  const [selectedTimer, setSelectedTimer] = useState(3)
  const [isAutoCapturing, setIsAutoCapturing] = useState(false)
  const [isWaitingForCapture, setIsWaitingForCapture] = useState(false)

  const totalShots = Math.min(expectedPoses, MAX_CAPTURED_IMAGES)
  const targetShots = totalShots
  const activeSlot = selectedFrame?.slots?.find((slot, index) => getSlotPhotoArrayIndex(slot, index, selectedFrame) === currentShotIndex) || selectedFrame?.slots?.[currentShotIndex % Math.max(selectedFrame.slots.length, 1)] || selectedFrame?.slots?.[0]
  const activeSlotWidth = activeSlot?.rotation % 180 === 0 ? activeSlot?.width : activeSlot?.height
  const activeSlotHeight = activeSlot?.rotation % 180 === 0 ? activeSlot?.height : activeSlot?.width
  const ratioConfig = {
    css: activeSlotWidth && activeSlotHeight ? `${activeSlotWidth} / ${activeSlotHeight}` : '4 / 3',
    value: activeSlotWidth && activeSlotHeight ? activeSlotWidth / activeSlotHeight : 4 / 3,
  }

  const clearCaptureTimers = useCallback(() => {
    clearInterval(countdownIntervalRef.current)
    clearTimeout(nextShotTimeoutRef.current)
    clearTimeout(pickerTimeoutRef.current)
    clearTimeout(flashTimeoutRef.current)
    clearTimeout(captureResponseTimeoutRef.current)
    countdownIntervalRef.current = null
    nextShotTimeoutRef.current = null
    pickerTimeoutRef.current = null
    flashTimeoutRef.current = null
    captureResponseTimeoutRef.current = null
  }, [])

  const showToast = useCallback((message) => {
    clearTimeout(toastTimeoutRef.current)
    setToastMessage(message)
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3000)
  }, [])

  const completeCapture = useCallback((capturedUrl, shouldAppend = true) => {
    clearTimeout(captureResponseTimeoutRef.current)
    captureResponseTimeoutRef.current = null
    isWaitingForCaptureRef.current = false
    setIsWaitingForCapture(false)

    const nextIndex = currentShotIndexRef.current + 1
    const nextImages = shouldAppend
      ? [...capturedImagesRef.current, capturedUrl].slice(-MAX_CAPTURED_IMAGES)
      : capturedImagesRef.current
    capturedImagesRef.current = nextImages
    setCapturedImages(nextImages)

    setIsFlashing(true)
    flashTimeoutRef.current = setTimeout(() => setIsFlashing(false), 500)

    currentShotIndexRef.current = nextIndex
    setCurrentShotIndex(nextIndex)

    if (nextIndex >= totalShots) {
      setIsAutoCapturing(false)
      pickerTimeoutRef.current = setTimeout(() => {
        capturedObjectUrlsRef.current.clear()
        setCapturedPhotos(capturedImagesRef.current)
        nextStep()
      }, 1000)
    }
  }, [nextStep, setCapturedPhotos, totalShots])

  const replaceTemporaryPhoto = useCallback((officialUrl) => {
    const pendingSlot = pendingOfficialPhotoSlotsRef.current.shift()
    if (!pendingSlot) return false

    if (capturedImagesRef.current[pendingSlot.index] !== pendingSlot.temporaryUrl) return false

    const nextImages = [...capturedImagesRef.current]
    nextImages[pendingSlot.index] = officialUrl
    capturedImagesRef.current = nextImages
    setCapturedImages(nextImages)
    setPreviewImage((currentPreview) => (
      currentPreview === pendingSlot.temporaryUrl ? officialUrl : currentPreview
    ))

    if (capturedObjectUrlsRef.current.has(pendingSlot.temporaryUrl)) {
      URL.revokeObjectURL(pendingSlot.temporaryUrl)
      capturedObjectUrlsRef.current.delete(pendingSlot.temporaryUrl)
    }

    return true
  }, [])

  const handleCapturedImage = useCallback((jpegBuffer) => {
    if (!isWaitingForCaptureRef.current || jpegBuffer.byteLength === 0) return
    if (pendingOfficialPhotoSlotsRef.current.length > 0) return

    const temporaryUrl = URL.createObjectURL(new Blob([jpegBuffer], { type: 'image/jpeg' }))
    const index = capturedImagesRef.current.length
    const nextImages = [...capturedImagesRef.current, temporaryUrl].slice(-MAX_CAPTURED_IMAGES)

    capturedObjectUrlsRef.current.add(temporaryUrl)
    pendingOfficialPhotoSlotsRef.current.push({ index, temporaryUrl })
    capturedImagesRef.current = nextImages
    setCapturedImages(nextImages)
  }, [])

  const handleUploadedPhoto = useCallback((message) => {
    if (!message.startsWith(PHOTO_URL_PREFIX)) return false

    try {
      const photo = JSON.parse(message.slice(PHOTO_URL_PREFIX.length))
      console.log('Uploaded photo:', photo)

      if (photo?.url && typeof photo.url === 'string') {
        if (!session?.id) throw new Error('Không tìm thấy phiên chụp.')
        saveRawPhoto({
          sessionId: session.id,
          imageUrl: photo.url,
          filterApplied: 'none',
          peopleCount: 1,
        })
          .then(() => {
            const replacedTemporaryPhoto = replaceTemporaryPhoto(photo.url)
            completeCapture(photo.url, !replacedTemporaryPhoto)
          })
          .catch((error) => showToast(error instanceof Error ? error.message : 'Không thể lưu thông tin ảnh.'))
      }
    } catch (error) {
      console.error('Invalid PHOTO_URL message:', error)
      showToast('Khong doc duoc duong dan anh da upload!')
    }

    return true
  }, [completeCapture, replaceTemporaryPhoto, session, showToast])

  useEffect(() => {
    if (!USE_MOCK_CAPTURE_PHOTOS || currentStep !== 3) {
      hasLoadedMockPhotosRef.current = false
      return
    }
    if (hasLoadedMockPhotosRef.current) return

    hasLoadedMockPhotosRef.current = true
    capturedImagesRef.current = MOCK_CAPTURE_PHOTOS
    setCapturedImages(MOCK_CAPTURE_PHOTOS)
    setCapturedPhotos(MOCK_CAPTURE_PHOTOS)
    nextStep()
  }, [currentStep, nextStep, setCapturedPhotos])

  useEffect(() => {
    if (currentStep !== 3 || USE_MOCK_CAPTURE_PHOTOS) return undefined

    const socket = new WebSocket(CAMERA_SOCKET_URL)
    socket.binaryType = 'arraybuffer'
    socketRef.current = socket

    socket.onopen = () => {
      setConnectionStatus('connected')
    }
    socket.onmessage = (event) => {
      if (typeof event.data === 'string') {
        if (handleUploadedPhoto(event.data)) return
        return
      }

      if (!(event.data instanceof ArrayBuffer)) return

      const buffer = event.data
      const bytes = new Uint8Array(buffer)
      const header = bytes.length >= CAPTURE_HEADER_LENGTH
        ? new TextDecoder().decode(bytes.subarray(0, CAPTURE_HEADER_LENGTH))
        : ''

      if (header === CAPTURE_HEADER) {
        handleCapturedImage(buffer.slice(CAPTURE_HEADER_LENGTH))
        return
      }

      const jpegBlob = new Blob([buffer], { type: 'image/jpeg' })
      if (jpegBlob.size === 0) return

      const nextUrl = URL.createObjectURL(jpegBlob)
      const previousUrl = liveFrameUrlRef.current

      latestFrameBlobRef.current = jpegBlob
      liveFrameUrlRef.current = nextUrl
      if (liveViewImageRef.current) liveViewImageRef.current.src = nextUrl
      if (!hasLiveViewRef.current) {
        hasLiveViewRef.current = true
        setHasLiveView(true)
      }

      if (previousUrl) URL.revokeObjectURL(previousUrl)
    }
    socket.onerror = () => {
      setConnectionStatus('error')
      clearCaptureTimers()
      isWaitingForCaptureRef.current = false
      setIsWaitingForCapture(false)
      setIsAutoCapturing(false)
      showToast('Không thể kết nối tới máy ảnh!')
    }
    socket.onclose = () => {
      if (socketRef.current === socket) {
        socketRef.current = null
        setConnectionStatus('disconnected')
        clearCaptureTimers()
        setIsAutoCapturing(false)
        isWaitingForCaptureRef.current = false
        setIsWaitingForCapture(false)
      }
    }

    return () => {
      socket.onopen = null
      socket.onmessage = null
      socket.onerror = null
      socket.onclose = null
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close()
      }
      if (socketRef.current === socket) socketRef.current = null
      latestFrameBlobRef.current = null
      hasLiveViewRef.current = false
      pendingOfficialPhotoSlotsRef.current = []
      capturedImagesRef.current = []
      if (liveFrameUrlRef.current) {
        URL.revokeObjectURL(liveFrameUrlRef.current)
        liveFrameUrlRef.current = null
      }
    }
  }, [clearCaptureTimers, currentStep, handleCapturedImage, handleUploadedPhoto, showToast])

  useEffect(() => () => {
    clearCaptureTimers()
    clearTimeout(toastTimeoutRef.current)
    capturedObjectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    capturedObjectUrlsRef.current.clear()
    pendingOfficialPhotoSlotsRef.current = []
    capturedImagesRef.current = []
  }, [clearCaptureTimers])

  const triggerCapture = useCallback(() => {
    const socket = socketRef.current

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setIsAutoCapturing(false)
      showToast('Máy ảnh chưa được kết nối!')
      return
    }
    if (isWaitingForCaptureRef.current) return

    try {
      isWaitingForCaptureRef.current = true
      setIsWaitingForCapture(true)
      socket.send('CAPTURE')
      captureResponseTimeoutRef.current = setTimeout(() => {
        isWaitingForCaptureRef.current = false
        setIsWaitingForCapture(false)
        setIsAutoCapturing(false)
        showToast('Không nhận được ảnh chụp từ backend!')
      }, CAPTURE_RESPONSE_TIMEOUT_MS)
    } catch {
      isWaitingForCaptureRef.current = false
      setIsWaitingForCapture(false)
      setIsAutoCapturing(false)
      showToast('Không thể gửi lệnh chụp tới máy ảnh!')
    }
  }, [showToast])

  const startCountdownAndCapture = useCallback(() => {
    if (countdownIntervalRef.current || currentShotIndexRef.current >= totalShots) return

    let count = selectedTimer
    setCountdown(count)
    countdownIntervalRef.current = setInterval(() => {
      count -= 1
      if (count > 0) {
        setCountdown(count)
        return
      }

      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
      setCountdown(null)
      triggerCapture()
    }, 1000)
  }, [selectedTimer, totalShots, triggerCapture])

  useEffect(() => {
    if (!isAutoCapturing || isWaitingForCapture || currentShotIndex >= totalShots || countdown !== null) return undefined

    const delay = currentShotIndexRef.current === 0 ? 0 : SHOT_DELAY_MS
    nextShotTimeoutRef.current = setTimeout(startCountdownAndCapture, delay)
    return () => {
      clearTimeout(nextShotTimeoutRef.current)
      nextShotTimeoutRef.current = null
    }
  }, [countdown, currentShotIndex, isAutoCapturing, isWaitingForCapture, startCountdownAndCapture, totalShots])

  const handleStartAutoCapture = () => {
    if (connectionStatus !== 'connected' || !latestFrameBlobRef.current) {
      showToast('Vui lòng chờ máy ảnh kết nối và hiển thị hình ảnh!')
      return
    }
    setIsAutoCapturing(true)
  }

  const toggleSelectPhoto = (index) => {
    setSelectedIndices((previous) => {
      if (previous.includes(index)) return previous.filter((item) => item !== index)
      if (previous.length < targetShots) return [...previous, index]
      showToast(`Chỉ được chọn tối đa ${targetShots} tấm ảnh!`)
      return previous
    })
  }

  const handleConfirmPick = () => {
    const finalPhotos = [...selectedIndices]
      .sort((a, b) => a - b)
      .map((index) => capturedImages[index])

    const selectedUrls = new Set(finalPhotos)
    capturedObjectUrlsRef.current.forEach((url) => {
      if (selectedUrls.has(url)) {
        capturedObjectUrlsRef.current.delete(url)
      } else {
        URL.revokeObjectURL(url)
        capturedObjectUrlsRef.current.delete(url)
      }
    })
    setCapturedPhotos(finalPhotos)
    nextStep()
  }

  const handleRetake = () => {
    clearCaptureTimers()
    capturedObjectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    capturedObjectUrlsRef.current.clear()
    pendingOfficialPhotoSlotsRef.current = []
    isWaitingForCaptureRef.current = false
    currentShotIndexRef.current = 0
    capturedImagesRef.current = []
    setCapturedImages([])
    setSelectedIndices([])
    setCurrentShotIndex(0)
    setCountdown(null)
    setIsFlashing(false)
    setIsPicking(false)
    setIsAutoCapturing(false)
    setIsWaitingForCapture(false)
  }

  const openPreview = (imageUrl) => {
    setPreviewImage(imageUrl)
    setZoomLevel(1)
    setPosition({ x: 0, y: 0 })
  }
  const closePreview = () => {
    setPreviewImage(null)
    setZoomLevel(1)
    setPosition({ x: 0, y: 0 })
  }
  const handleZoomIn = () => setZoomLevel((previous) => Math.min(previous + 0.5, 4))
  const handleZoomOut = () => {
    setZoomLevel((previous) => {
      const nextZoom = Math.max(previous - 0.5, 1)
      if (nextZoom === 1) setPosition({ x: 0, y: 0 })
      return nextZoom
    })
  }
  const handlePointerDown = (event) => {
    if (zoomLevel <= 1) return
    setIsDragging(true)
    setDragStart({ x: event.clientX - position.x, y: event.clientY - position.y })
  }
  const handlePointerMove = (event) => {
    if (!isDragging) return
    setPosition({ x: event.clientX - dragStart.x, y: event.clientY - dragStart.y })
  }
  const handlePointerUp = () => setIsDragging(false)

  if (currentStep !== 3) return null

  return (
    <>
      {toastMessage && (
        <div className="kiosk-custom-toast">
          <i className="pi pi-exclamation-triangle" />
          <span>{toastMessage}</span>
        </div>
      )}

      {previewImage && (
        <div className="image-preview-modal">
          <button className="preview-close-btn" onClick={closePreview} aria-label="Đóng ảnh xem trước">
            <i className="pi pi-times" />
          </button>
          <div
            className="preview-image-container"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <img
              src={previewImage}
              alt="Ảnh xem trước"
              draggable="false"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scaleX(-1) scale(${zoomLevel})`,
                cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                transition: isDragging ? 'none' : 'transform 0.2s ease',
              }}
            />
          </div>
          <div className="preview-zoom-controls">
            <Button icon="pi pi-minus-circle" rounded text severity="secondary" size="large" onClick={handleZoomOut} style={{ color: '#fff' }} disabled={zoomLevel <= 1} aria-label="Thu nhỏ" />
            <span style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', fontSize: '1.2rem', width: '50px', justifyContent: 'center' }}>{zoomLevel}x</span>
            <Button icon="pi pi-plus-circle" rounded text severity="success" size="large" onClick={handleZoomIn} style={{ color: '#00ffcc' }} disabled={zoomLevel >= 4} aria-label="Phóng to" />
          </div>
        </div>
      )}

      {!isPicking ? (
        <section className="kiosk-capture-container">
          <div className="capture-header">
            {/* <div className="capture-step-tag">Bước 03 / 07 (Chụp {totalShots} chọn {targetShots})</div> */}
            <h2 className="capture-title">
              {currentShotIndex < totalShots ? `Tạo dáng nào! (Ảnh ${currentShotIndex + 1} / ${totalShots})` : 'Đang hoàn tất...'}
            </h2>
          </div>

          <div
            className="camera-viewport-wrapper"
            style={{ aspectRatio: ratioConfig.css, '--slot-ratio': ratioConfig.value }}
          >
            <img
              ref={liveViewImageRef}
              className="live-view-frame"
              alt="Live view từ máy ảnh"
              style={{ visibility: hasLiveView ? 'visible' : 'hidden' }}
            />
            {!hasLiveView && (
              <div className="live-view-status">
                {connectionStatus === 'connecting' ? 'Đang kết nối máy ảnh...' : 'Chưa nhận được hình ảnh từ máy ảnh'}
              </div>
            )}
            {countdown !== null && (
              <div className="countdown-overlay">
                <div className="countdown-number">{countdown}</div>
                <div className="countdown-text-status">Chuẩn bị cười nào!</div>
              </div>
            )}
            {isFlashing && <div className="camera-flash" />}
          </div>

          <div className="captured-thumbs-row">
            {Array.from({ length: totalShots }).map((_, index) => (
              <div key={index} className={`thumb-slot ${capturedImages[index] ? 'filled' : ''}`} style={{ aspectRatio: ratioConfig.css }}>
                {capturedImages[index] ? <img src={capturedImages[index]} alt={`Ảnh đã chụp ${index + 1}`} /> : <span>#{index + 1}</span>}
              </div>
            ))}
          </div>

          <div className="capture-footer">
            <Button label="Quay lại" icon="pi pi-arrow-left" severity="secondary" outlined size="large" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} onClick={prevStep} disabled={isAutoCapturing} />
            <div className="timer-select-container">
              <i className="pi pi-clock timer-icon" />
              {[3, 5, 10].map((seconds) => (
                <button
                  key={seconds}
                  type="button"
                  className={`timer-option-btn ${selectedTimer === seconds ? 'active' : ''}`}
                  onClick={() => setSelectedTimer(seconds)}
                  disabled={isAutoCapturing}
                >
                  {seconds}s
                </button>
              ))}
            </div>
            <Button
              label={isAutoCapturing ? 'Đang chụp tự động...' : 'Bắt đầu chụp tự động'}
              icon={isAutoCapturing ? 'pi pi-spin pi-spinner' : 'pi pi-camera'}
              size="large"
              className="capture-action-btn"
              disabled={isAutoCapturing || currentShotIndex >= totalShots || connectionStatus !== 'connected' || !hasLiveView}
              onClick={handleStartAutoCapture}
            />
          </div>
        </section>
      ) : (
        <section className="kiosk-pick-container">
          <div style={{ textAlign: 'center' }}>
            <div className="capture-step-tag">LỌC KHOẢNH KHẮC ĐẸP NHẤT</div>
            <h2 style={{ margin: '0.2rem 0', fontSize: '2.2rem', fontWeight: 900 }}>CHỌN ẢNH ĐỂ IN</h2>
            <p style={{ color: '#94a3b8', marginTop: '0.3rem', fontSize: '1rem' }}>
              Đã chụp {capturedImages.length} ảnh. Vui lòng chọn ra <span style={{ color: '#00ffcc', fontWeight: 'bold' }}>{targetShots} ảnh</span> phù hợp nhất!{' '}
              (Đã chọn: <strong style={{ color: '#fff' }}>{selectedIndices.length}</strong> / {targetShots})
            </p>
          </div>

          <div className="pick-grid">
            {capturedImages.map((photoUrl, index) => {
              const isSelected = selectedIndices.includes(index)
              const badgeOrder = selectedIndices.indexOf(index) + 1
              return (
                <div key={index} className={`pick-card ${isSelected ? 'selected' : ''}`} style={{ aspectRatio: ratioConfig.css }}>
                  <img src={photoUrl} alt={`Ảnh ${index + 1}`} />
                  {isSelected && <div className="pick-badge">{badgeOrder}</div>}
                  <div className="pick-card-actions">
                    <Button label="Xem" icon="pi pi-search-plus" size="small" severity="secondary" className="pick-action-btn" onClick={() => openPreview(photoUrl)} />
                    <Button label={isSelected ? 'Đã Chọn' : 'Chọn'} icon={isSelected ? 'pi pi-check-circle' : 'pi pi-check'} size="small" severity={isSelected ? 'success' : 'info'} className="pick-action-btn" onClick={() => toggleSelectPhoto(index)} />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="capture-footer" style={{ justifyContent: 'center', width: '100%' }}>
            <Button label="Chụp lại từ đầu" icon="pi pi-refresh" severity="secondary" outlined size="large" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} onClick={handleRetake} />
            <Button label="Xác nhận & Tiếp tục" icon="pi pi-check" iconPos="right" size="large" disabled={selectedIndices.length !== targetShots} className="capture-action-btn" onClick={handleConfirmPick} />
          </div>
        </section>
      )}
    </>
  )
}

