import { useEffect } from 'react'
import { PhotoboothProvider, usePhotobooth } from './store/PhotoboothContext.jsx'
import { ensureCameraAppRunning } from './services/cameraAppControl.js'
import KioskLayout from './layouts/KioskLayout.jsx'
import IdleScreen from './features/idle/IdleScreen.jsx'
import SelectionScreen from './features/selection/SelectionScreen.jsx'
import CaptureScreen from './features/capture/CaptureScreen.jsx'
import ProcessingScreen from './features/processing/ProcessingScreen.jsx'
import PreviewScreen from './features/preview/PreviewScreen.jsx'
import DeliveryScreen from './features/delivery/DeliveryScreen.jsx'

function StepRouter() {
  const { currentStep } = usePhotobooth()

  switch (currentStep) {
    case 1:
      return <IdleScreen />
    case 2:
      return <SelectionScreen />
    case 3:
      return <CaptureScreen />
    case 4:
      return <ProcessingScreen />
    case 5:
      return <PreviewScreen />
    case 6:
      return <DeliveryScreen />
    default:
      return <IdleScreen />
  }
}

function App() {
  useEffect(() => {
    ensureCameraAppRunning().catch((error) => {
      console.error('Could not initialize camera app:', error)
    })
  }, [])

  return (
    <PhotoboothProvider>
      <KioskLayout>
        <StepRouter />
      </KioskLayout>
    </PhotoboothProvider>
  )
}

export default App
