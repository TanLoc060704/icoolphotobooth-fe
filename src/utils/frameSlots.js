const getSlotPhotoIndex = (slot, fallbackIndex) => {
  const parsedIndex = Number(slot?.photoIndex)
  if (Number.isInteger(parsedIndex) && parsedIndex > 0) return parsedIndex

  const parsedSlotIndex = Number(slot?.slotIndex)
  if (Number.isInteger(parsedSlotIndex) && parsedSlotIndex > 0) return parsedSlotIndex

  return fallbackIndex + 1
}

const getFramePhotoIndices = (frame) => {
  const slots = frame?.slots || []
  const indices = []

  slots.forEach((slot, index) => {
    const photoIndex = getSlotPhotoIndex(slot, index)
    if (!indices.includes(photoIndex)) indices.push(photoIndex)
  })

  return indices
}

export const getFramePhotoCount = (frame) => {
  return getFramePhotoIndices(frame).length
}

export const getSlotPhotoArrayIndex = (slot, fallbackIndex, frame = null) => {
  const photoIndex = getSlotPhotoIndex(slot, fallbackIndex)
  const framePhotoIndex = frame ? getFramePhotoIndices(frame).indexOf(photoIndex) : -1

  return framePhotoIndex >= 0 ? framePhotoIndex : photoIndex - 1
}
