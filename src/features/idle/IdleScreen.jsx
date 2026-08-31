import { useState } from 'react'
import { Button } from 'primereact/button'
import { usePhotobooth } from '../../store/PhotoboothContext.jsx'
import { startCameraApp } from '../../services/cameraAppControl.js'
import './IdleScreen.css'

export default function IdleScreen() {
  const { currentStep, nextStep } = usePhotobooth()
  const [isStarting, setIsStarting] = useState(false)
  const [startError, setStartError] = useState(null)

  const handleStart = async () => {
    if (isStarting) return

    setIsStarting(true)
    setStartError(null)
    try {
      await startCameraApp()
      nextStep()
    } catch (error) {
      setStartError(error instanceof Error ? error.message : 'Khong the mo ung dung may anh.')
    } finally {
      setIsStarting(false)
    }
  }

  if (currentStep !== 1) {
    return null
  }

  return (
    <section className="kiosk-idle-container" onClick={handleStart}>
      
      {/* Tinh vân Galaxy */}
      <div className="nebula-top-left"></div>
      <div className="nebula-bottom-right"></div>

      <div className="idle-content-wrapper">
        <i className="pi pi-camera idle-camera-icon"></i>
        
        {/* LOGO CHUẨN XÁC 100% */}
        <div className="icool-brand-container">
          <span className="icool-text">I</span>
          
          {/* Biểu tượng Nút Play đục lỗ Nốt Nhạc (Custom SVG) */}
          <svg 
            viewBox="0 0 24 24" 
            fill="currentColor" 
            style={{ width: 'clamp(3.5rem, 7vw, 6rem)', height: 'clamp(3.5rem, 7vw, 6rem)' }}
          >
            <mask id="music-hole">
              <rect width="24" height="24" fill="white" />
              {/* Vẽ nốt nhạc màu đen để đục thủng nền */}
              <path d="M12 7.5v6.5a2.5 2.5 0 102 2.45V10h3V7.5h-5z" fill="black" />
            </mask>
            <path d="M4 2v20l18-10z" mask="url(#music-hole)" />
          </svg>

          <span className="icool-text">
            COOL
            <span className="icool-trademark">®</span>
          </span>
        </div>

        <span className="idle-subtitle">PHOTOBOOTH</span>
        
        <p className="idle-description">
          Hãy chạm vào màn hình để bắt đầu chuyến du hành lưu giữ những khoảnh khắc tuyệt vời!
        </p>
      </div>

      {startError && <p className="idle-start-error">{startError}</p>}

      <Button 
        label={isStarting ? 'ĐANG MỞ MÁY ẢNH...' : 'CHẠM ĐỂ BẮT ĐẦU'} 
        icon={isStarting ? 'pi pi-spin pi-spinner' : 'pi pi-sparkles'} 
        size="large" 
        rounded
        className="idle-start-btn" 
        disabled={isStarting}
      />
      
    </section>
  )
}
