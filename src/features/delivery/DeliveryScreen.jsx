import { useEffect, useState } from 'react'
import { Button } from 'primereact/button'
import { usePhotobooth } from '../../store/PhotoboothContext.jsx'
import { stopCameraApp } from '../../services/cameraAppControl.js'
import './DeliveryScreen.css'

const THANK_YOU_TIMEOUT_SECONDS = 60

export default function DeliveryScreen() {
  const { currentStep, resetKiosk, session } = usePhotobooth()
  const [timeLeft, setTimeLeft] = useState(THANK_YOU_TIMEOUT_SECONDS)

  useEffect(() => {
    if (currentStep !== 6) return undefined

    stopCameraApp().catch((error) => {
      console.error('Could not stop camera app:', error)
    })
    setTimeLeft(THANK_YOU_TIMEOUT_SECONDS)
    const timerId = window.setInterval(() => {
      setTimeLeft((value) => Math.max(0, value - 1))
    }, 1000)

    return () => window.clearInterval(timerId)
  }, [currentStep])

  useEffect(() => {
    if (currentStep === 6 && timeLeft === 0) resetKiosk()
  }, [currentStep, resetKiosk, timeLeft])

  if (currentStep !== 6) return null

  return (
    <section className="thank-you-screen">
      <div className="thank-you-nebula thank-you-nebula-left" />
      <div className="thank-you-nebula thank-you-nebula-right" />

      <main className="thank-you-card">
        <div className="thank-you-icon-wrap">
          <i className="pi pi-check" />
        </div>

        <span className="thank-you-eyebrow">Hoàn tất phiên chụp</span>
        <h1>Cảm ơn bạn đã sử dụng!</h1>
        <p className="thank-you-message">
          Khoảnh khắc của bạn đã được lưu thành công. Hãy quét mã QR ở bước trước để điền thông tin và tải ảnh về điện thoại.
        </p>

        {session?.qrCodeToken && (
          <div className="thank-you-session">
            <i className="pi pi-images" />
            <span>Mã phiên</span>
            <strong>{session.qrCodeToken}</strong>
          </div>
        )}

        <div className="thank-you-countdown">
          <div className="thank-you-countdown-copy">
            <span>Tự động trở về màn hình chính</span>
            <strong>{timeLeft} giây</strong>
          </div>
          <div className="thank-you-countdown-track">
            <div
              className="thank-you-countdown-fill"
              style={{ width: `${(timeLeft / THANK_YOU_TIMEOUT_SECONDS) * 100}%` }}
            />
          </div>
        </div>

        <Button
          label="Kết thúc ngay"
          icon="pi pi-home"
          size="large"
          className="thank-you-finish-btn"
          onClick={resetKiosk}
        />
      </main>
    </section>
  )
}
