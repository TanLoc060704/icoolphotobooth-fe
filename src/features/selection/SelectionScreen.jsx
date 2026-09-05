import { useEffect, useRef, useState } from 'react'
import { Button } from 'primereact/button'
import { usePhotobooth } from '../../store/PhotoboothContext.jsx'
import { getFramePhotoCount } from '../../utils/frameSlots.js'
import './SelectionScreen.css'

const FrameCard = ({ frame, isActive }) => (
  <div className={`frame-slide-card ${isActive ? 'active' : ''}`}>
    <div className="frame-image-wrapper"><img src={frame.previewUrl} alt={frame.name} /></div>
    <div className="frame-info">
      <h3>{frame.name}</h3>
      <div className="frame-configs">
        <span className="config-badge">📸 {getFramePhotoCount(frame)} Ảnh</span>
        <span className="config-badge">📐 {frame.canvasWidth} × {frame.canvasHeight}</span>
      </div>
    </div>
  </div>
)

export default function SelectionScreen() {
  const { currentStep, nextStep, prevStep, resetKiosk, setSelectedFrameId, setExpectedPoses, frames, framesLoading, framesError, loadFrames, beginSession } = usePhotobooth()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [slideDirection, setSlideDirection] = useState(null)
  const [isResetting, setIsResetting] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60)
  const [startError, setStartError] = useState(null)
  const [isStarting, setIsStarting] = useState(false)
  const resetAnimationFrameRef = useRef(null)

  useEffect(() => () => {
    if (resetAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(resetAnimationFrameRef.current)
    }
  }, [])

  useEffect(() => {
    if (currentStep !== 2) {
      const resetTimer = window.setTimeout(() => setTimeLeft(60), 0)
      return () => window.clearTimeout(resetTimer)
    }
    const timer = setInterval(() => setTimeLeft((previous) => {
      if (previous <= 1) { clearInterval(timer); resetKiosk(); return 0 }
      return previous - 1
    }), 1000)
    return () => clearInterval(timer)
  }, [currentStep, resetKiosk])

  if (currentStep !== 2) return null
  if (framesLoading) return <section className="kiosk-selection-container"><p>Đang tải frame...</p></section>
  if (framesError || !frames.length) return (
    <section className="kiosk-selection-container">
      <p>{framesError || 'Chưa có frame đang hoạt động.'}</p>
      <Button label="Tải lại" icon="pi pi-refresh" onClick={loadFrames} />
    </section>
  )

  const selectedFrame = frames[currentIndex] || frames[0]
  const carouselFrames = [-2, -1, 0, 1, 2].map((offset) => ({
    frame: frames[(currentIndex + offset + frames.length) % frames.length],
    offset,
  }))
  const isAnimating = slideDirection !== null
  const isBusy = isAnimating || isResetting
  const activePosition = slideDirection === 'next' ? 3 : slideDirection === 'prev' ? 1 : 2
  const trackOffset = slideDirection === 'next' ? -640 : slideDirection === 'prev' ? 0 : -320

  const moveCarousel = (direction) => {
    if (isBusy || frames.length <= 1) return
    setSlideDirection(direction > 0 ? 'next' : 'prev')
  }

  const handleTransitionEnd = (event) => {
    if (event.target !== event.currentTarget || !slideDirection) return
    const step = slideDirection === 'next' ? 1 : -1
    setIsResetting(true)
    setCurrentIndex((index) => (index + step + frames.length) % frames.length)
    setSlideDirection(null)
    resetAnimationFrameRef.current = window.requestAnimationFrame(() => {
      resetAnimationFrameRef.current = window.requestAnimationFrame(() => {
        setIsResetting(false)
        resetAnimationFrameRef.current = null
      })
    })
  }

  const handleFrameClick = (position) => {
    if (position < 2) moveCarousel(-1)
    if (position > 2) moveCarousel(1)
  }

  const handleContinue = async () => {
    if (isStarting) return
    setStartError(null)
    setIsStarting(true)
    setSelectedFrameId(selectedFrame.id)
    setExpectedPoses(getFramePhotoCount(selectedFrame))
    try {
      await beginSession({ frame: selectedFrame })
      nextStep()
    } catch (error) {
      setStartError(error instanceof Error ? error.message : 'Không thể bắt đầu phiên chụp.')
    } finally {
      setIsStarting(false)
    }
  }
  const progressPercent = (timeLeft / 60) * 100

  return (
    <section className="kiosk-selection-container">
      <div className="selection-header" style={{ zIndex: 10 }}>
        <h2 className="selection-title">Lựa chọn layout</h2>
        <div className="countdown-container"><div className="countdown-text">Thời gian lựa chọn: <span>{timeLeft} giây</span></div><div className="countdown-bar-bg"><div className="countdown-bar-fill" style={{ width: `${progressPercent}%` }} /></div></div>
      </div>
      <div className="frame-slideshow-container">
        <Button icon="pi pi-chevron-left" rounded className="slideshow-nav-btn prev" disabled={frames.length <= 1 || isBusy} onClick={() => moveCarousel(-1)} />
        <div className="frame-slideshow-viewport"><div
          className={`frame-slideshow-track ${isResetting ? 'is-jumping' : ''}`}
          style={{
            transform: `translateX(${trackOffset}px)`,
            transition: isAnimating ? 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)' : 'none',
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {carouselFrames.map(({ frame, offset }, position) => <div className="frame-slide-item" key={offset} onClick={() => handleFrameClick(position)}><FrameCard frame={frame} isActive={position === activePosition} /></div>)}
        </div></div>
        <Button icon="pi pi-chevron-right" rounded className="slideshow-nav-btn next" disabled={frames.length <= 1 || isBusy} onClick={() => moveCarousel(1)} />
      </div>
      <div className="selection-footer" style={{ zIndex: 10 }}>
        {startError && <p style={{ color: '#fecaca', margin: 0 }}>{startError}</p>}
        {isStarting && <p style={{ color: '#d1fae5', margin: 0 }}>Đang tạo phiên chụp...</p>}
        <Button label="Quay lại" icon="pi pi-arrow-left" severity="secondary" outlined size="large" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} onClick={prevStep} />
        <Button label="Tiếp tục chụp" icon="pi pi-arrow-right" iconPos="right" size="large" className="selection-next-btn" disabled={isBusy} onClick={handleContinue} />
      </div>
    </section>
  )
}
