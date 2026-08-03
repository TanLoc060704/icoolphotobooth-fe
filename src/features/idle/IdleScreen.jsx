import { Button } from 'primereact/button'
import { usePhotobooth } from '../../store/PhotoboothContext.jsx'

export default function IdleScreen() {
  const { currentStep, nextStep } = usePhotobooth()

  if (currentStep !== 1) {
    return null
  }

  return (
    <section
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '32px',
        background: 'rgba(255, 255, 255, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        textAlign: 'center',
        backdropFilter: 'blur(18px)',
      }}
    >
      <p style={{ margin: 0, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
        Step 1
      </p>
      <h1 style={{ margin: 0, fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}>
        Kiosk Photobooth
      </h1>
      <p style={{ margin: 0, maxWidth: '42rem', opacity: 0.82 }}>
        Chạm để bắt đầu quy trình chụp ảnh tuyến tính 7 bước.
      </p>
      <Button label="Bắt đầu" icon="pi pi-play" size="large" onClick={nextStep} />
    </section>
  )
}
