import { Button } from 'primereact/button'
import { usePhotobooth } from '../../store/PhotoboothContext.jsx'

export default function DeliveryScreen() {
  const { currentStep, nextStep, resetKiosk } = usePhotobooth()

  if (currentStep !== 6 && currentStep !== 7) {
    return null
  }

  const isFinalStep = currentStep === 7

  return (
    <section
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '32px',
        background: 'rgba(20, 83, 45, 0.82)',
        border: '1px solid rgba(134, 239, 172, 0.18)',
        color: '#f0fdf4',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        textAlign: 'center',
      }}
    >
      <p style={{ margin: 0, opacity: 0.72 }}>Step {currentStep}</p>
      <h2 style={{ margin: 0, fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}>
        {isFinalStep ? 'Hoàn tất phiên chụp' : 'Giao ảnh cho khách'}
      </h2>
      <Button
        label={isFinalStep ? 'Reset kiosk' : 'Sang bước 7'}
        icon={isFinalStep ? 'pi pi-refresh' : 'pi pi-arrow-right'}
        severity={isFinalStep ? 'success' : 'secondary'}
        onClick={isFinalStep ? resetKiosk : nextStep}
      />
    </section>
  )
}
