import { Button } from 'primereact/button'
import { usePhotobooth } from '../../store/PhotoboothContext.jsx'

export default function SelectionScreen() {
  const { currentStep, nextStep } = usePhotobooth()

  if (currentStep !== 2) {
    return null
  }

  return (
    <section
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '32px',
        background: 'rgba(15, 23, 42, 0.78)',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        color: '#e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        textAlign: 'center',
      }}
    >
      <p style={{ margin: 0, opacity: 0.75 }}>Step 2</p>
      <h2 style={{ margin: 0, fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}>
        Chọn layout và filter
      </h2>
      <Button label="Tiếp tục" icon="pi pi-arrow-right" onClick={nextStep} />
    </section>
  )
}
