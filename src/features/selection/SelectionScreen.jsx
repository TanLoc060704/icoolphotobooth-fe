import { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { usePhotobooth } from '../../store/PhotoboothContext.jsx';
import './SelectionScreen.css';

// ==========================================
// 1. CẤU HÌNH DỮ LIỆU & MẢNG ẢO THUẬT
// ==========================================
export const FRAME_DATA = {
  'FRAME-4-doc-gau-xanh-ic': {
    name: 'Gấu Xanh ICOOL',
    poses: 4,
    aspectRatio: '370 x 115',
    previewUrl: '/frames/FRAME-4-doc-gau-xanh-ic.png',
  },
  'FRAME-4-doc-da-banh': {
    name: 'EURO Xanh',
    poses: 4,
    aspectRatio: '400 x 150',
    previewUrl: '/frames/FRAME-4-doc-da-banh.png',
  },
  'FRAME-4-doc-da-banh-bai-bien': {
    name: 'Mùa Hè Biển',
    poses: 4,
    aspectRatio: '340 x 105',
    previewUrl: '/frames/FRAME-4-doc-da-banh-bai-bien.png',
  },
};

const AVAILABLE_FRAMES = Object.keys(FRAME_DATA);

// Thêm 2 clone ở hai đầu để lấp đầy viewport 3 items (Chỉ khai báo 1 lần ở đây)
const EXTENDED_FRAMES = [
  ...AVAILABLE_FRAMES.slice(-2), 
  ...AVAILABLE_FRAMES,
  ...AVAILABLE_FRAMES.slice(0, 2)
];

// ==========================================
// 2. COMPONENT THẺ HIỂN THỊ
// ==========================================
const FrameCard = ({ frameId, isActive }) => {
  const frame = FRAME_DATA[frameId];
  return (
    <div className={`frame-slide-card ${isActive ? 'active' : ''}`}>
      <div className="frame-image-wrapper">
        <img src={frame.previewUrl} alt={frame.name} />
      </div>
      <div className="frame-info">
        <h3>{frame.name}</h3>
        <div className="frame-configs">
          <span className="config-badge">📸 {frame.poses} Ảnh</span>
          <span className="config-badge">📐 {frame.aspectRatio}</span>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. MÀN HÌNH CHÍNH
// ==========================================
export default function SelectionScreen() {
  const { 
    currentStep, nextStep, prevStep, resetKiosk, 
    selectedFrameId, setSelectedFrameId, setExpectedPoses 
  } = usePhotobooth();
  
  // States
  const [currentIndex, setCurrentIndex] = useState(() => {
    const idx = AVAILABLE_FRAMES.indexOf(selectedFrameId);
    return (idx >= 0 ? idx : 0) + 2; 
  });
  const [isJumping, setIsJumping] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  // Countdown Timer
  useEffect(() => {
    if (currentStep !== 2) {
      setTimeLeft(60);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          resetKiosk();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentStep, resetKiosk]);

  if (currentStep !== 2) return null;

  // Handlers
  const handleContinue = () => {
    const selectedId = EXTENDED_FRAMES[currentIndex];
    const frameConfig = FRAME_DATA[selectedId];
    if (typeof setSelectedFrameId === 'function') setSelectedFrameId(selectedId);
    if (typeof setExpectedPoses === 'function') setExpectedPoses(frameConfig.poses);
    nextStep();
  };

  const handlePrev = () => {
    if (isJumping || currentIndex <= 0) return; 
    setCurrentIndex((prev) => prev - 1);
  };
  
  const handleNext = () => {
    if (isJumping || currentIndex >= EXTENDED_FRAMES.length - 1) return; 
    setCurrentIndex((prev) => prev + 1);
  };

  const handleTransitionEnd = () => {
    if (currentIndex <= 1) {
      setIsJumping(true); 
      setCurrentIndex(currentIndex + AVAILABLE_FRAMES.length); 
      setTimeout(() => setIsJumping(false), 50); 
    } 
    else if (currentIndex >= EXTENDED_FRAMES.length - 2) {
      setIsJumping(true);
      setCurrentIndex(currentIndex - AVAILABLE_FRAMES.length); 
      setTimeout(() => setIsJumping(false), 50);
    }
  };

  const progressPercent = (timeLeft / 60) * 100;

  // Render
  return (
    <section className="kiosk-selection-container">
      <div className="selection-header" style={{ zIndex: 10 }}>
        <h2 className="selection-title">Lựa chọn layout </h2>
        <div className="countdown-container">
          <div className="countdown-text">
            Thời gian lựa chọn: <span>{timeLeft} giây</span>
          </div>
          <div className="countdown-bar-bg">
            <div className="countdown-bar-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>
      </div>

      <div className="frame-slideshow-container">
        <Button icon="pi pi-chevron-left" rounded className="slideshow-nav-btn prev" onClick={handlePrev} />
        
        <div className="frame-slideshow-viewport">
          <div 
            // Cập nhật: Thêm class is-jumping khi đang nhảy
            className={`frame-slideshow-track ${isJumping ? 'is-jumping' : ''}`} 
            style={{ 
              transform: `translateX(-${(currentIndex - 1) * 320}px)`,
              transition: isJumping ? 'none' : 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)'
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {EXTENDED_FRAMES.map((frameId, idx) => (
              <div className="frame-slide-item" key={`${frameId}-${idx}`}>
                <FrameCard frameId={frameId} isActive={idx === currentIndex} />
              </div>
            ))}
          </div>
        </div>

        <Button icon="pi pi-chevron-right" rounded className="slideshow-nav-btn next" onClick={handleNext} />
      </div>

      <div className="selection-footer" style={{ zIndex: 10 }}>
        <Button label="Quay lại" icon="pi pi-arrow-left" severity="secondary" outlined size="large"
          style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} onClick={prevStep} />
        <Button label="Tiếp tục chụp" icon="pi pi-arrow-right" iconPos="right" size="large" 
          className="selection-next-btn" onClick={handleContinue} />
      </div>
    </section>
  );
}