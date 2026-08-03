import { Button } from 'primereact/button'
import { usePhotobooth } from '../../store/PhotoboothContext.jsx'

export default function PreviewScreen() {
  const { currentStep, nextStep } = usePhotobooth()

  if (currentStep !== 5) {
    return null
  }

  return (
    <section
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '32px',
        background: 'rgba(38, 24, 15, 0.82)',
        border: '1px solid rgba(251, 191, 36, 0.18)',
        color: '#fff7ed',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        textAlign: 'center',
      }}
    >
      <p style={{ margin: 0, opacity: 0.72 }}>Step 5</p>
      <h2 style={{ margin: 0, fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}>
        Xem trước kết quả
      </h2>
      <Button label="Xác nhận" icon="pi pi-check" onClick={nextStep} />
    </section>
  )
}
