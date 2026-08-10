import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const PhotoboothContext = createContext(null)

const INITIAL_STEP = 1
const FINAL_STEP = 7

export function PhotoboothProvider({ children }) {
  const [currentStep, setCurrentStep] = useState(INITIAL_STEP)
  const [selectedFrameId, setSelectedFrameId] = useState('FRAME-4-doc-gau-xanh-ic') // Frame ID mặc định
  const [expectedPoses, setExpectedPoses] = useState(4) // Số ảnh mặc định cho frame
  const [selectedFilter, setSelectedFilter] = useState(null)
  const [capturedPhotos, setCapturedPhotos] = useState([])
  const [finalImage, setFinalImage] = useState(null)

  const nextStep = useCallback(() => {
    setCurrentStep((step) => Math.min(step + 1, FINAL_STEP))
  }, [])

  const prevStep = useCallback(() => {
    setCurrentStep((step) => Math.max(step - 1, INITIAL_STEP))
  }, [])

  const resetKiosk = useCallback(() => {
    setCurrentStep(INITIAL_STEP)
    setSelectedFrameId('FRAME-4-doc-gau-xanh-ic')
    setExpectedPoses(4)
    setSelectedFilter(null)
    setCapturedPhotos([])
    setFinalImage(null)
  }, [])

  const value = useMemo(
    () => ({
      currentStep,
      selectedFrameId,
      setSelectedFrameId,
      expectedPoses,
      setExpectedPoses,
      selectedFilter,
      setSelectedFilter,
      capturedPhotos,
      setCapturedPhotos,
      finalImage,
      setFinalImage,
      nextStep,
      prevStep,
      resetKiosk,
    }),
    [
      currentStep,
      selectedFrameId,
      expectedPoses,
      selectedFilter,
      capturedPhotos,
      finalImage,
      nextStep,
      prevStep,
      resetKiosk,
    ],
  )

  return <PhotoboothContext.Provider value={value}>{children}</PhotoboothContext.Provider>
}

export function usePhotobooth() {
  const context = useContext(PhotoboothContext)

  if (!context) {
    throw new Error('usePhotobooth must be used within a PhotoboothProvider')
  }

  return context
}
