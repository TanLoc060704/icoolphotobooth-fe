import { Button } from 'primereact/button'
import { usePhotobooth } from '../../store/PhotoboothContext.jsx'

export default function IdleScreen() {
  const { currentStep, nextStep } = usePhotobooth()

  if (currentStep !== 1) {
    return null
  }

  return (
    <>
      <style>
        {`
          /* TỐI ƯU 1: Nút bấm nhịp thở mượt mà (Chu kỳ 0 - 50 - 100) */
          @keyframes pulse-galaxy-smooth {
            0%, 100% { 
              box-shadow: 0 0 15px rgba(160, 32, 240, 0.4); 
              transform: scale(1); 
            }
            50% { 
              box-shadow: 0 0 40px rgba(160, 32, 240, 0.8), 0 0 20px rgba(0, 153, 255, 0.6); 
              transform: scale(1.04); 
            }
          }
          
          /* TỐI ƯU 2: Chữ bồng bềnh (Chỉ dùng transform để GPU xử lý, bỏ animate text-shadow) */
          @keyframes float-text-smooth {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-12px); }
          }

          /* TỐI ƯU 3: Đám mây tinh vân xoay chậm đa chiều */
          @keyframes spin-nebula {
            0% { transform: rotate(0deg) scale(1); }
            50% { transform: rotate(180deg) scale(1.1); }
            100% { transform: rotate(360deg) scale(1); }
          }

          .kiosk-idle-container {
            cursor: pointer;
            transition: background 0.3s ease;
          }
          .kiosk-idle-container:active {
            background: rgba(255, 255, 255, 0.1) !important;
          }
        `}
      </style>

      <section
        className="kiosk-idle-container"
        onClick={nextStep}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '32px',
          background: 'linear-gradient(135deg, #090a0f 0%, #120b29 50%, #0a192f 100%)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3rem',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Tinh vân góc trên (Đỏ/Hồng) - Đã thêm animation xoay mượt */}
        <div style={{
          position: 'absolute',
          width: '500px', height: '500px',
          background: 'radial-gradient(circle, rgba(255, 0, 85, 0.25) 0%, rgba(0,0,0,0) 65%)',
          top: '-15%', left: '-15%', borderRadius: '50%',
          filter: 'blur(30px)',
          animation: 'spin-nebula 20s linear infinite'
        }}></div>
        
        {/* Tinh vân góc dưới (Xanh Dương) - Đã thêm animation xoay mượt */}
        <div style={{
          position: 'absolute',
          width: '600px', height: '600px',
          background: 'radial-gradient(circle, rgba(0, 153, 255, 0.2) 0%, rgba(0,0,0,0) 65%)',
          bottom: '-20%', right: '-15%', borderRadius: '50%',
          filter: 'blur(40px)',
          animation: 'spin-nebula 25s linear infinite reverse' /* Quay ngược chiều */
        }}></div>

        <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <i 
            className="pi pi-camera" 
            style={{ 
              fontSize: '4.5rem', 
              color: '#ffffff', 
              marginBottom: '1rem',
              filter: 'drop-shadow(0 0 12px rgba(255, 255, 255, 0.6))' // Dùng drop-shadow tĩnh
            }} 
          ></i>
          
          <h1 style={{ 
            margin: 0, 
            fontSize: 'clamp(3.5rem, 8vw, 6.5rem)', 
            fontWeight: 900,
            letterSpacing: '4px',
            color: '#ffffff',
            textShadow: '0 0 20px rgba(255, 255, 255, 0.5), 0 0 30px rgba(0, 153, 255, 0.4)', // Bóng phát sáng tĩnh
            animation: 'float-text-smooth 3.5s ease-in-out infinite' // Chỉ chuyển động lên xuống
          }}>
            ICOOL PHOTOBOOTH
          </h1>
          
          <p style={{ 
            margin: 0, 
            maxWidth: '45rem', 
            fontSize: '1.5rem',
            color: '#e2e8f0',
            fontWeight: 300,
            lineHeight: '1.6',
            textShadow: '0 2px 4px rgba(0,0,0,0.8)'
          }}>
            Hãy chạm vào màn hình để bắt đầu chuyến du hành lưu giữ những khoảnh khắc tuyệt vời!
          </p>
        </div>

        <Button 
          label="CHẠM ĐỂ BẮT ĐẦU" 
          icon="pi pi-sparkles" 
          size="large" 
          rounded
          style={{ 
            zIndex: 1,
            fontSize: '1.5rem',
            padding: '1.2rem 3.5rem',
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #ff0055 0%, #8a2be2 50%, #0055ff 100%)', 
            border: '1px solid rgba(255, 255, 255, 0.4)',
            color: '#ffffff',
            animation: 'pulse-galaxy-smooth 2.5s ease-in-out infinite' 
          }} 
        />
      </section>
    </>
  )
}