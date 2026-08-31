import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { fetchFrames } from '../services/frameApi.js'
import { startSession } from '../services/sessionApi.js'

const PhotoboothContext = createContext(null)

const INITIAL_STEP = 1
const FINAL_STEP = 6

export function PhotoboothProvider({ children }) {
  const [currentStep, setCurrentStep] = useState(INITIAL_STEP)
  const [frames, setFrames] = useState([])
  const [framesLoading, setFramesLoading] = useState(true)
  const [framesError, setFramesError] = useState(null)
  const [selectedFrameId, setSelectedFrameId] = useState('FRAME-4-doc-gau-xanh-ic') // Frame ID mặc định
  const [expectedPoses, setExpectedPoses] = useState(4) // Số ảnh mặc định cho frame
  const [selectedFilter, setSelectedFilter] = useState(null)
  const [capturedPhotos, setCapturedPhotos] = useState([])
  const [finalImage, setFinalImage] = useState(null)
  const [session, setSession] = useState(null)

  const loadFrames = useCallback(async () => {
    setFramesLoading(true)
    setFramesError(null)
    try {
      const nextFrames = await fetchFrames()
      setFrames(nextFrames)
      const nextSelectedFrame = nextFrames.find((frame) => frame.id === selectedFrameId) || nextFrames[0] || null
      setSelectedFrameId(nextSelectedFrame?.id ?? null)
      setExpectedPoses(nextSelectedFrame?.slots?.length || 0)
    } catch (error) {
      setFrames([])
      setFramesError(error instanceof Error ? error.message : 'Không thể tải frame.')
    } finally {
      setFramesLoading(false)
    }
  }, [selectedFrameId])

  useEffect(() => {
    loadFrames()
  }, [loadFrames])

  const selectedFrame = frames.find((frame) => frame.id === selectedFrameId) || null

  const nextStep = useCallback(() => {
    setCurrentStep((step) => Math.min(step + 1, FINAL_STEP))
  }, [])

  const prevStep = useCallback(() => {
    setCurrentStep((step) => Math.max(step - 1, INITIAL_STEP))
  }, [])

  const resetKiosk = useCallback(() => {
    setCurrentStep(INITIAL_STEP)
    setSelectedFrameId(frames[0]?.id ?? null)
    setExpectedPoses(frames[0]?.slots?.length || 0)
    setSelectedFilter(null)
    setCapturedPhotos([])
    setFinalImage(null)
    setSession(null)
  }, [frames])

  const beginSession = useCallback(async ({ frame, voucherId = null }) => {
    if (!frame) throw new Error('Vui lòng chọn khung ảnh trước khi bắt đầu.')
    const photoBoothId = Number(import.meta.env.VITE_PHOTO_BOOTH_ID)
    if (!Number.isInteger(photoBoothId) || photoBoothId <= 0) throw new Error('Thiếu VITE_PHOTO_BOOTH_ID trong file .env.')
    const nextSession = await startSession({
      photoBoothId,
      frameId: frame.id,
      frameCount: frame.slots?.length || 0,
      voucherId,
    })
    if (nextSession?.id === undefined || nextSession?.id === null) {
      throw new Error('API đã tạo session nhưng không trả về id/sessionId để lưu ảnh.')
    }
    setSession(nextSession)
    return nextSession
  }, [])

  const value = useMemo(
    () => ({
      currentStep,
      selectedFrameId,
      setSelectedFrameId,
      selectedFrame,
      frames,
      framesLoading,
      framesError,
      loadFrames,
      expectedPoses,
      setExpectedPoses,
      selectedFilter,
      setSelectedFilter,
      capturedPhotos,
      setCapturedPhotos,
      finalImage,
      setFinalImage,
      session,
      setSession,
      beginSession,
      nextStep,
      prevStep,
      resetKiosk,
    }),
    [
      currentStep,
      selectedFrameId,
      selectedFrame,
      frames,
      framesLoading,
      framesError,
      loadFrames,
      expectedPoses,
      selectedFilter,
      capturedPhotos,
      finalImage,
      session,
      beginSession,
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
