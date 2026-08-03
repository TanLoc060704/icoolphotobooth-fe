import { useState, useEffect } from 'react'
import { Button } from 'primereact/button'
import { usePhotobooth } from '../../store/PhotoboothContext.jsx'
import './SelectionScreen.css'

export default function SelectionScreen() {
  const { currentStep, nextStep, prevStep, resetKiosk } = usePhotobooth()

  const [layout, setLayout] = useState('strip-4')
  const [filter, setFilter] = useState('original')
  const [timeLeft, setTimeLeft] = useState(60)

  useEffect(() => {
    if (currentStep !== 2) {
      setTimeLeft(60)
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          resetKiosk()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [currentStep, resetKiosk])

  if (currentStep !== 2) {
    return null
  }

  const handleContinue = () => {
    nextStep()
  }

  const progressPercent = (timeLeft / 60) * 100

  return (
    <section className="kiosk-selection-container">
      
      <div className="selection-header">
        {/* <div className="selection-step-tag">Bước 02 / 07</div> */}
        <h2 className="selection-title">Lựa chọn trải nghiệm</h2>
        
        <div className="countdown-container">
          <div className="countdown-text">
            Thời gian lựa chọn: <span>{timeLeft} giây</span>
          </div>
          <div className="countdown-bar-bg">
            <div className="countdown-bar-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>
      </div>

      <div className="selection-grid">
        
        {/* 1. Nhóm Dải dọc (Photo Strips) */}
        <div className="selection-group">
          <h3>1. DẠNG DẢI DỌC (PHOTO STRIPS)</h3>
          <div className="options-scroll-row">
            
            {/* Dải 4 ô */}
            <div 
              className={`kiosk-card ${layout === 'strip-4' ? 'active' : ''}`}
              onClick={() => setLayout('strip-4')}
            >
              <div className="layout-preview-icon">
                <div className="strip-mockup double">
                  <div className="strip-cell header-footer"></div>
                  <div className="strip-cell"></div>
                  <div className="strip-cell"></div>
                  <div className="strip-cell"></div>
                  <div className="strip-cell"></div>
                  <div className="strip-cell header-footer"></div>
                </div>
                <div className="strip-mockup double double-right">
                  <div className="strip-cell header-footer"></div>
                  <div className="strip-cell"></div>
                  <div className="strip-cell"></div>
                  <div className="strip-cell"></div>
                  <div className="strip-cell"></div>
                  <div className="strip-cell header-footer"></div>
                </div>
              </div>
              <span>Dải 4 Ô (1x4)</span>
            </div>

            {/* Dải 3 ô (Đã sửa hiển thị đúng 3 ô ảnh) */}
            <div 
              className={`kiosk-card ${layout === 'strip-3' ? 'active' : ''}`}
              onClick={() => setLayout('strip-3')}
            >
              <div className="layout-preview-icon">
                <div className="strip-mockup double">
                  <div className="strip-cell header-footer"></div>
                  <div className="strip-cell"></div>
                  <div className="strip-cell"></div>
                  <div className="strip-cell"></div>
                  <div className="strip-cell header-footer"></div>
                </div>
                <div className="strip-mockup double double-right">
                  <div className="strip-cell header-footer"></div>
                  <div className="strip-cell"></div>
                  <div className="strip-cell"></div>
                  <div className="strip-cell"></div>
                  <div className="strip-cell header-footer"></div>
                </div>
              </div>
              <span>Dải 3 Ô (1x3)</span>
            </div>

          </div>
        </div>

        {/* 2. Nhóm Dạng lưới (Grid Layouts) */}
        <div className="selection-group">
          <h3>2. DẠNG LƯỚI (GRID LAYOUTS)</h3>
          <div className="options-scroll-row">
            
            <div 
              className={`kiosk-card ${layout === 'grid-2x2' ? 'active' : ''}`}
              onClick={() => setLayout('grid-2x2')}
            >
              <div className="layout-preview-icon">
                <div className="grid-mockup cols-2">
                  <div className="grid-cell"></div><div className="grid-cell"></div>
                  <div className="grid-cell"></div><div className="grid-cell"></div>
                </div>
              </div>
              <span>Lưới 4 Ô (2x2)</span>
            </div>

            <div 
              className={`kiosk-card ${layout === 'grid-6' ? 'active' : ''}`}
              onClick={() => setLayout('grid-6')}
            >
              <div className="layout-preview-icon">
                <div className="grid-mockup cols-3">
                  <div className="grid-cell"></div><div className="grid-cell"></div><div className="grid-cell"></div>
                  <div className="grid-cell"></div><div className="grid-cell"></div><div className="grid-cell"></div>
                </div>
              </div>
              <span>Lưới 6 Ô</span>
            </div>

            <div 
              className={`kiosk-card ${layout === 'grid-9' ? 'active' : ''}`}
              onClick={() => setLayout('grid-9')}
            >
              <div className="layout-preview-icon">
                <div className="grid-mockup cols-3-3">
                  <div className="grid-cell"></div><div className="grid-cell"></div><div className="grid-cell"></div>
                  <div className="grid-cell"></div><div className="grid-cell"></div><div className="grid-cell"></div>
                  <div className="grid-cell"></div><div className="grid-cell"></div><div className="grid-cell"></div>
                </div>
              </div>
              <span>Lưới 9 Ô</span>
            </div>

          </div>
        </div>

        {/* 3. Nhóm Polaroid & Khung Đơn */}
        <div className="selection-group">
          <h3>3. POLAROID & KHUNG SÁNG TẠO</h3>
          <div className="options-scroll-row">
            
            <div 
              className={`kiosk-card ${layout === 'polaroid' ? 'active' : ''}`}
              onClick={() => setLayout('polaroid')}
            >
              <div className="layout-preview-icon">
                <div className="single-mockup" style={{ height: '36px' }}>
                  <div className="single-img-area"></div>
                  <div style={{ height: '6px', background: '#e2e8f0' }}></div>
                </div>
              </div>
              <span>Polaroid Cổ Điển</span>
            </div>

            <div 
              className={`kiosk-card ${layout === 'single-4x6' ? 'active' : ''}`}
              onClick={() => setLayout('single-4x6')}
            >
              <div className="layout-preview-icon">
                <div className="single-mockup" style={{ width: '36px', height: '30px' }}>
                  <div className="single-img-area"></div>
                  <div className="single-bottom-bar"></div>
                </div>
              </div>
              <span>Khung Đơn (4x6)</span>
            </div>

            <div 
              className={`kiosk-card ${layout === 'asymmetric-3' ? 'active' : ''}`}
              onClick={() => setLayout('asymmetric-3')}
            >
              <div className="layout-preview-icon" style={{ gap: '2px' }}>
                <div style={{ width: '14px', height: '32px', background: '#fff', borderRadius: '2px', padding: '2px' }}>
                  <div style={{ width: '100%', height: '100%', background: '#0a192f', borderRadius: '1px' }}></div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ width: '12px', height: '15px', background: '#fff', borderRadius: '2px', padding: '2px' }}>
                    <div style={{ width: '100%', height: '100%', background: '#0a192f', borderRadius: '1px' }}></div>
                  </div>
                  <div style={{ width: '12px', height: '15px', background: '#fff', borderRadius: '2px', padding: '2px' }}>
                    <div style={{ width: '100%', height: '100%', background: '#0a192f', borderRadius: '1px' }}></div>
                  </div>
                </div>
              </div>
              <span>Layout 3 Ảnh</span>
            </div>

          </div>
        </div>

        {/* 4. Nhóm Bộ lọc màu (Filter) */}
        <div className="selection-group">
          <h3>4. CHỌN HIỆU ỨNG MÀU (FILTER)</h3>
          <div className="options-scroll-row">
            <div className={`kiosk-card ${filter === 'original' ? 'active' : ''}`} onClick={() => setFilter('original')}>
              <i className="pi pi-palette" style={{ fontSize: '1.3rem', margin: '4px 0' }}></i>
              <span>Màu Gốc</span>
            </div>
            <div className={`kiosk-card ${filter === 'bw' ? 'active' : ''}`} onClick={() => setFilter('bw')}>
              <i className="pi pi-moon" style={{ fontSize: '1.3rem', margin: '4px 0' }}></i>
              <span>Trắng Đen</span>
            </div>
            <div className={`kiosk-card ${filter === 'vintage' ? 'active' : ''}`} onClick={() => setFilter('vintage')}>
              <i className="pi pi-camera" style={{ fontSize: '1.3rem', margin: '4px 0' }}></i>
              <span>Vintage</span>
            </div>
            <div className={`kiosk-card ${filter === 'cinematic' ? 'active' : ''}`} onClick={() => setFilter('cinematic')}>
              <i className="pi pi-video" style={{ fontSize: '1.3rem', margin: '4px 0' }}></i>
              <span>Cinematic</span>
            </div>
          </div>
        </div>

      </div>

      <div className="selection-footer">
        <Button 
          label="Quay lại" 
          icon="pi pi-arrow-left" 
          severity="secondary" 
          outlined 
          size="large"
          style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
          onClick={prevStep} 
        />
        <Button 
          label="Tiếp tục chụp" 
          icon="pi pi-arrow-right" 
          iconPos="right"
          size="large" 
          className="selection-next-btn"
          onClick={handleContinue} 
        />
      </div>

    </section>
  )
}