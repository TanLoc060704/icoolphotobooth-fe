import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from 'primereact/button'
import { usePhotobooth } from '../../store/PhotoboothContext.jsx'
import './CaptureScreen.css'

// CẤU HÌNH TỶ LỆ CẮT CAMERA CỤC BỘ
const CAPTURE_CONFIGS = {
  'FRAME-4-doc-gau-xanh-ic': { capture: 6, target: 4, width: 4, height: 3 },
  'FRAME-4-doc-da-banh': { capture: 6, target: 4, width: 4, height: 3 },
  'FRAME-4-doc-da-banh-bai-bien': { capture: 6, target: 4, width: 4, height: 3 },
  'default': { capture: 6, target: 4, width: 4, height: 3 }
};

export default function CaptureScreen() {
  const { currentStep, nextStep, prevStep, selectedFrameId, expectedPoses, setCapturedPhotos } = usePhotobooth()

  const videoRef = useRef(null)
  const mediaStreamRef = useRef(null)
  const intervalRef = useRef(null) // THÊM REF NÀY: Để dọn dẹp bộ đếm an toàn

  const [toastMessage, setToastMessage] = useState(null)
  const showToast = (message) => {
    setToastMessage(message)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const [previewImage, setPreviewImage] = useState(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const frameConf = CAPTURE_CONFIGS[selectedFrameId] || CAPTURE_CONFIGS['default'];
  const totalShots = frameConf.capture;
  const targetShots = expectedPoses || frameConf.target;
  
  const ratioConfig = { 
    css: `${frameConf.width} / ${frameConf.height}`, 
    val: frameConf.width / frameConf.height 
  };

  const [currentShotIndex, setCurrentShotIndex] = useState(0)
  const [countdown, setCountdown] = useState(null)
  const [isFlashing, setIsFlashing] = useState(false)
  const [capturedImages, setCapturedImages] = useState([])
  const [isPicking, setIsPicking] = useState(false)
  const [selectedIndices, setSelectedIndices] = useState([])

  // STATE: THỜI GIAN ĐẾM NGƯỢC
  const [selectedTimer, setSelectedTimer] = useState(3)
  
  // STATE: CỜ BẬT CHẾ ĐỘ TỰ ĐỘNG CHỤP
  const [isAutoCapturing, setIsAutoCapturing] = useState(false)

  const startCamera = useCallback(async () => {
    try {
      const constraints = {
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } },
        audio: false
      }
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia(constraints)
      if (videoRef.current) videoRef.current.srcObject = mediaStreamRef.current
    } catch (err) {
      console.error("Lỗi khởi tạo camera:", err)
      try {
        mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        if (videoRef.current) videoRef.current.srcObject = mediaStreamRef.current
      } catch (fallbackErr) {
        showToast("Không thể kết nối camera!")
      }
    }
  }, [])

  useEffect(() => {
    if (currentStep !== 3 || isPicking) return
    startCamera()
    return () => {
      if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(track => track.stop())
      if (intervalRef.current) clearInterval(intervalRef.current) // Dọn dẹp bộ đếm khi unmount
    }
  }, [currentStep, isPicking, startCamera])

  // ==============================================================
  // VÒNG LẶP AUTO CHỤP: Tự động gọi đếm ngược khi đủ điều kiện
  // ==============================================================
  useEffect(() => {
    if (isAutoCapturing && currentShotIndex < totalShots && countdown === null) {
      // Nghỉ 1.5 giây giữa các shot để khách hàng tạo dáng mới (Shot đầu tiên thì chụp ngay không nghỉ)
      const delay = currentShotIndex === 0 ? 0 : 1500; 
      
      const timer = setTimeout(() => {
        startCountdownAndCapture();
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [isAutoCapturing, currentShotIndex, countdown, totalShots]);

  const startCountdownAndCapture = () => {
    if (countdown !== null || currentShotIndex >= totalShots) return
    let count = selectedTimer 
    setCountdown(count)
    
    intervalRef.current = setInterval(() => {
      count -= 1
      if (count > 0) {
        setCountdown(count)
      } else {
        clearInterval(intervalRef.current)
        setCountdown(null)
        triggerCapture()
      }
    }, 1000)
  }

  const triggerCapture = () => {
    if (!videoRef.current) return
    const videoEl = videoRef.current
    
    const vw = videoEl.videoWidth || 1920
    const vh = videoEl.videoHeight || 1080
    const targetRatio = ratioConfig.val
    
    let cropWidth = vw
    let cropHeight = vh

    if (vw / vh > targetRatio) {
      cropWidth = vh * targetRatio
    } else {
      cropHeight = vw / targetRatio
    }

    const startX = (vw - cropWidth) / 2
    const startY = (vh - cropHeight) / 2

    const canvas = document.createElement('canvas')
    canvas.width = cropWidth
    canvas.height = cropHeight
    const ctx = canvas.getContext('2d')
    
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    
    ctx.drawImage(videoEl, startX, startY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight)
    
    let previewImageUrl = ""
    try {
      previewImageUrl = canvas.toDataURL('image/jpeg', 0.95)
    } catch (e) {
      previewImageUrl = canvas.toDataURL()
    }
    
    setIsFlashing(true)
    setTimeout(() => setIsFlashing(false), 500)

    const updatedImages = [...capturedImages, previewImageUrl]
    setCapturedImages(updatedImages)
    const nextIndex = currentShotIndex + 1
    setCurrentShotIndex(nextIndex)

    if (nextIndex >= totalShots) {
      setIsAutoCapturing(false) // Tắt chế độ tự động khi đã chụp đủ
      setTimeout(() => {
        const defaultSelected = Array.from({ length: targetShots }, (_, i) => i)
        setSelectedIndices(defaultSelected)
        setIsPicking(true) 
      }, 1000)
    }
  }

  const toggleSelectPhoto = (index) => {
    setSelectedIndices(prev => {
      if (prev.includes(index)) return prev.filter(i => i !== index)
      if (prev.length < targetShots) return [...prev, index]
      showToast(`Chỉ được chọn tối đa ${targetShots} tấm ảnh!`)
      return prev
    })
  }

  const handleConfirmPick = () => {
    const sortedIndices = [...selectedIndices].sort((a, b) => a - b)
    const finalPhotos = sortedIndices.map(i => capturedImages[i])
    
    if (typeof setCapturedPhotos === 'function') {
      setCapturedPhotos(finalPhotos)
    }
    
    nextStep()
  }

  // Chức năng nút "Chụp lại từ đầu"
  const handleRetake = () => {
    setCapturedImages([])
    setCurrentShotIndex(0)
    setIsPicking(false)
    setIsAutoCapturing(false) // Reset lại cờ
  }

  const openPreview = (imgUrl) => { setPreviewImage(imgUrl); setZoomLevel(1); setPosition({ x: 0, y: 0 }) }
  const closePreview = () => { setPreviewImage(null); setZoomLevel(1); setPosition({ x: 0, y: 0 }) }
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.5, 4))
  const handleZoomOut = () => {
    setZoomLevel(prev => {
      const newZoom = Math.max(prev - 0.5, 1)
      if (newZoom === 1) setPosition({ x: 0, y: 0 }) 
      return newZoom
    })
  }
  const handlePointerDown = (e) => {
    if (zoomLevel <= 1) return 
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }
  const handlePointerMove = (e) => {
    if (!isDragging) return
    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }
  const handlePointerUp = () => setIsDragging(false)

  if (currentStep !== 3) return null

  return (
    <>
      {toastMessage && (
        <div className="kiosk-custom-toast">
          <i className="pi pi-exclamation-triangle"></i>
          <span>{toastMessage}</span>
        </div>
      )}

      {previewImage && (
        <div className="image-preview-modal">
          <button className="preview-close-btn" onClick={closePreview}>
            <i className="pi pi-times"></i>
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
              alt="Preview" 
              draggable="false"
              style={{ 
                transform: `translate(${position.x}px, ${position.y}px) scaleX(-1) scale(${zoomLevel})`,
                cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                transition: isDragging ? 'none' : 'transform 0.2s ease' 
              }} 
            />
          </div>
          <div className="preview-zoom-controls">
            <Button icon="pi pi-minus-circle" rounded text severity="secondary" size="large" onClick={handleZoomOut} style={{ color: '#fff' }} disabled={zoomLevel <= 1} />
            <span style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', fontSize: '1.2rem', width: '50px', justifyContent: 'center' }}>{zoomLevel}x</span>
            <Button icon="pi pi-plus-circle" rounded text severity="success" size="large" onClick={handleZoomIn} style={{ color: '#00ffcc' }} disabled={zoomLevel >= 4}/>
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
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="camera-stream-preview" 
            />
            
            {countdown !== null && (
              <div className="countdown-overlay">
                <div className="countdown-number">{countdown}</div>
                <div className="countdown-text-status">Chuẩn bị cười nào!</div>
              </div>
            )}
            {isFlashing && <div className="camera-flash"></div>}
          </div>

          <div className="captured-thumbs-row">
            {Array.from({ length: totalShots }).map((_, index) => (
              <div key={index} className={`thumb-slot ${capturedImages[index] ? 'filled' : ''}`} style={{ aspectRatio: ratioConfig.css }}>
                {capturedImages[index] ? <img src={capturedImages[index]} alt={`Captured ${index + 1}`} /> : <span>#{index + 1}</span>}
              </div>
            ))}
          </div>

          <div className="capture-footer">
            <Button label="Quay lại" icon="pi pi-arrow-left" severity="secondary" outlined size="large" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} onClick={prevStep} disabled={isAutoCapturing} />
            
            <div className="timer-select-container">
              <i className="pi pi-clock timer-icon"></i>
              <select 
                value={selectedTimer} 
                onChange={(e) => setSelectedTimer(Number(e.target.value))}
                className="timer-select"
                disabled={isAutoCapturing} /* Khoá Dropdown khi đang chụp */
              >
                <option value={3}>3 Giây</option>
                <option value={5}>5 Giây</option>
                <option value={10}>10 Giây</option>
              </select>
            </div>

            <Button 
              label={isAutoCapturing ? "Đang chụp tự động..." : "Bấm chụp ngay"} 
              icon={isAutoCapturing ? "pi pi-spin pi-spinner" : "pi pi-camera"} 
              size="large" 
              className="capture-action-btn" 
              disabled={isAutoCapturing || currentShotIndex >= totalShots} 
              onClick={() => setIsAutoCapturing(true)} /* NÚT NÀY GIỜ CHỈ CẦN BẬT CỜ AUTO LÀ CHẠY */
            />
          </div>
        </section>
      ) : (
        <section className="kiosk-pick-container">
          <div style={{ textAlign: 'center' }}>
            <div className="capture-step-tag">LỌC KHOẢNH KHẮC ĐẸP NHẤT</div>
            <h2 style={{ margin: '0.2rem 0', fontSize: '2.2rem', fontWeight: 900 }}>CHỌN ẢNH ĐỂ IN</h2>
            <p style={{ color: '#94a3b8', marginTop: '0.3rem', fontSize: '1rem' }}>
              Đã chụp {capturedImages.length} ảnh. Vui lòng chọn ra <span style={{ color: '#00ffcc', fontWeight: 'bold' }}>{targetShots} ảnh</span> phù hợp nhất! 
              (Đã chọn: <strong style={{ color: '#fff' }}>{selectedIndices.length}</strong> / {targetShots})
            </p>
          </div>

          <div className="pick-grid">
            {capturedImages.map((photoUrl, index) => {
              const isSelected = selectedIndices.includes(index)
              const badgeOrder = selectedIndices.indexOf(index) + 1

              return (
                <div key={index} className={`pick-card ${isSelected ? 'selected' : ''}`} style={{ aspectRatio: ratioConfig.css }}>
                  <img src={photoUrl} alt={`Shot ${index + 1}`} />
                  {isSelected && <div className="pick-badge">{badgeOrder}</div>}
                  <div className="pick-card-actions">
                    <Button label="Xem" icon="pi pi-search-plus" size="small" severity="secondary" className="pick-action-btn" onClick={() => openPreview(photoUrl)} />
                    <Button label={isSelected ? "Đã Chọn" : "Chọn"} icon={isSelected ? "pi pi-check-circle" : "pi pi-check"} size="small" severity={isSelected ? "success" : "info"} className="pick-action-btn" onClick={() => toggleSelectPhoto(index)} />
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