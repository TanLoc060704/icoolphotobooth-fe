import { Button } from 'primereact/button'
import { usePhotobooth } from '../../store/PhotoboothContext.jsx'

export default function CaptureScreen() {
  const { currentStep, nextStep } = usePhotobooth()

  if (currentStep !== 3) {
    return null
  }

  return (
    <section
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '32px',
        background: 'rgba(3, 7, 18, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        textAlign: 'center',
      }}
    >
      <p style={{ margin: 0, opacity: 0.7 }}>Step 3</p>
      <h2 style={{ margin: 0, fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}>
        Chụp ảnh
      </h2>
      <Button label="Đã chụp xong" icon="pi pi-camera" onClick={nextStep} />
    </section>
  )
}
