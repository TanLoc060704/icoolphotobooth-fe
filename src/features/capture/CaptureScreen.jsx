import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from 'primereact/button'
import { usePhotobooth } from '../../store/PhotoboothContext.jsx'
import './CaptureScreen.css'

const CAMERA_SOCKET_URL = 'ws://localhost:8080/'
const CAPTURE_HEADER = 'CAPTURE:'
const CAPTURE_HEADER_LENGTH = 8
const CAPTURE_RESPONSE_TIMEOUT_MS = 30000
const MAX_CAPTURED_IMAGES = 6
const SHOT_DELAY_MS = 1500

const CAPTURE_CONFIGS = {
  'FRAME-4-doc-gau-xanh-ic': { capture: 6, target: 4, width: 4, height: 3 },
  'FRAME-4-doc-da-banh': { capture: 6, target: 4, width: 4, height: 3 },
  'FRAME-4-doc-da-banh-bai-bien': { capture: 6, target: 4, width: 4, height: 3 },
  default: { capture: 6, target: 4, width: 4, height: 3 },
}

export default function CaptureScreen() {
  const {
    currentStep,
    nextStep,
    prevStep,
    selectedFrameId,
    expectedPoses,
    setCapturedPhotos,
  } = usePhotobooth()

  const socketRef = useRef(null)
  const latestFrameBlobRef = useRef(null)
  const liveFrameUrlRef = useRef(null)
  const capturedObjectUrlsRef = useRef(new Set())
  const currentShotIndexRef = useRef(0)
  const countdownIntervalRef = useRef(null)
  const nextShotTimeoutRef = useRef(null)
  const pickerTimeoutRef = useRef(null)
  const flashTimeoutRef = useRef(null)
  const captureResponseTimeoutRef = useRef(null)
  const toastTimeoutRef = useRef(null)
  const isWaitingForCaptureRef = useRef(false)

  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const [liveViewFrame, setLiveViewFrame] = useState(null)
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

  const frameConf = CAPTURE_CONFIGS[selectedFrameId] || CAPTURE_CONFIGS.default
  const totalShots = Math.min(frameConf.capture, MAX_CAPTURED_IMAGES)
  const targetShots = Math.min(expectedPoses || frameConf.target, totalShots)
  const ratioConfig = {
    css: `${frameConf.width} / ${frameConf.height}`,
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

  const handleCapturedImage = useCallback((jpegBuffer) => {
    if (!isWaitingForCaptureRef.current || jpegBuffer.byteLength === 0) return

    clearTimeout(captureResponseTimeoutRef.current)
    captureResponseTimeoutRef.current = null
    isWaitingForCaptureRef.current = false
    setIsWaitingForCapture(false)

    const capturedUrl = URL.createObjectURL(new Blob([jpegBuffer], { type: 'image/jpeg' }))
    capturedObjectUrlsRef.current.add(capturedUrl)
    setCapturedImages((previous) => [...previous, capturedUrl].slice(-MAX_CAPTURED_IMAGES))

    setIsFlashing(true)
    flashTimeoutRef.current = setTimeout(() => setIsFlashing(false), 500)

    const nextIndex = currentShotIndexRef.current + 1
    currentShotIndexRef.current = nextIndex
    setCurrentShotIndex(nextIndex)

    if (nextIndex >= totalShots) {
      setIsAutoCapturing(false)
      pickerTimeoutRef.current = setTimeout(() => {
        setSelectedIndices(Array.from({ length: targetShots }, (_, index) => index))
        setIsPicking(true)
      }, 1000)
    }
  }, [targetShots, totalShots])

  useEffect(() => {
    if (currentStep !== 3) return undefined

    const socket = new WebSocket(CAMERA_SOCKET_URL)
    socket.binaryType = 'arraybuffer'
    socketRef.current = socket

    socket.onopen = () => {
      setConnectionStatus('connected')
    }
    socket.onmessage = (event) => {
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
      setLiveViewFrame(nextUrl)

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
      if (liveFrameUrlRef.current) {
        URL.revokeObjectURL(liveFrameUrlRef.current)
        liveFrameUrlRef.current = null
      }
    }
  }, [clearCaptureTimers, currentStep, handleCapturedImage, showToast])

  useEffect(() => () => {
    clearCaptureTimers()
    clearTimeout(toastTimeoutRef.current)
    capturedObjectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    capturedObjectUrlsRef.current.clear()
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
    isWaitingForCaptureRef.current = false
    currentShotIndexRef.current = 0
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
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel})`,
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
            <div className="capture-step-tag">Bước 03 / 07 (Chụp {totalShots} chọn {targetShots})</div>
            <h2 className="capture-title">
              {currentShotIndex < totalShots ? `Tạo dáng nào! (Ảnh ${currentShotIndex + 1} / ${totalShots})` : 'Đang hoàn tất...'}
            </h2>
          </div>

          <div className="camera-viewport-wrapper" style={{ aspectRatio: ratioConfig.css }}>
            {liveViewFrame ? (
              <img className="live-view-frame" src={liveViewFrame} alt="Live view từ máy ảnh" />
            ) : (
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
              <select value={selectedTimer} onChange={(event) => setSelectedTimer(Number(event.target.value))} className="timer-select" disabled={isAutoCapturing}>
                <option value={3}>3 Giây</option>
                <option value={5}>5 Giây</option>
                <option value={10}>10 Giây</option>
              </select>
            </div>
            <Button
              label={isAutoCapturing ? 'Đang chụp tự động...' : 'Bắt đầu chụp tự động'}
              icon={isAutoCapturing ? 'pi pi-spin pi-spinner' : 'pi pi-camera'}
              size="large"
              className="capture-action-btn"
              disabled={isAutoCapturing || currentShotIndex >= totalShots || connectionStatus !== 'connected' || !liveViewFrame}
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
