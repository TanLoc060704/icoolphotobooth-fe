import { Button } from 'primereact/button'
import { usePhotobooth } from '../../store/PhotoboothContext.jsx'

export default function ProcessingScreen() {
  const { currentStep, nextStep } = usePhotobooth()

  if (currentStep !== 4) {
    return null
  }

  return (
    <section
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '32px',
        background: 'rgba(8, 47, 73, 0.8)',
        border: '1px solid rgba(125, 211, 252, 0.18)',
        color: '#ecfeff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        textAlign: 'center',
      }}
    >
      <p style={{ margin: 0, opacity: 0.72 }}>Step 4</p>
      <h2 style={{ margin: 0, fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}>
        Đang xử lý ảnh
      </h2>
      <Button label="Mô phỏng hoàn tất" icon="pi pi-spin pi-cog" onClick={nextStep} />
    </section>
  )
}
