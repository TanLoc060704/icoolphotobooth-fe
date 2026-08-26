import React, { useState, useRef, useEffect } from 'react'
import { Button } from 'primereact/button'
import { Stage, Layer, Group, Image as KonvaImage, Transformer, Text, Rect } from 'react-konva'
import useImage from 'use-image'
import { renderToStaticMarkup } from 'react-dom/server'
import { Heart, Star, Sparkles, Crown, Camera, PartyPopper, Flame, Flower2, Gift, Smile, Rainbow, SunMedium, Wand2, Music, Rocket, Glasses, Coffee, Leaf, Balloon, Diamond, Gem, Zap, Palette, Film, Image as ImageIcon } from 'lucide-react'
import { FaHeart, FaRegHeart, FaStar, FaRegStar, FaCamera, FaCameraRetro, FaCrown, FaGift, FaMusic, FaFire, FaLeaf, FaSun, FaRocket, FaSmileBeam, FaGlassCheers, FaGem, FaBolt, FaPalette, FaFilm, FaImage, FaPaperPlane, FaThumbsUp, FaKissWinkHeart, FaRainbow, FaFeather, FaPaw, FaTrophy, FaBirthdayCake, FaCoffee, FaCat, FaDog } from 'react-icons/fa'
import { MdOutlineCelebration, MdOutlineCake, MdOutlineCameraAlt, MdOutlineFilterVintage, MdOutlineLocalCafe, MdOutlinePets, MdOutlineWavingHand, MdOutlinePhotoCamera, MdOutlineAutoAwesome } from 'react-icons/md'
import { BsEmojiSunglasses, BsEmojiSmile, BsBalloonFill, BsPatchCheckFill, BsCameraFill, BsFlower1, BsLightningChargeFill, BsMusicNoteBeamed, BsSunFill, BsGem, BsGiftFill } from 'react-icons/bs'
import { TbMoodSmile, TbMoodSmileBeam, TbMoodCrazyHappy, TbBalloon, TbHeartHandshake, TbStars, TbSparkles, TbPhoto, TbCameraHeart, TbCandy, TbFlower } from 'react-icons/tb'
import { HiOutlineSparkles, HiOutlinePhoto, HiOutlineFaceSmile, HiOutlineCake } from 'react-icons/hi2'
import { usePhotobooth } from '../../store/PhotoboothContext.jsx'
import './ProcessingScreen.css'

// ==========================================
// CÁC HELPER FUNCTIONS VÀ COMPONENT PHỤ
// ==========================================

const DraggableSticker = ({ sticker, isSelected, onSelect, onUpdate }) => {
  const shapeRef = useRef(null)
  const trRef = useRef(null)
  const [iconImage] = useImage(sticker.src || '', 'anonymous')

  useEffect(() => {
    if (!trRef.current || !shapeRef.current) return
    if (isSelected) {
      trRef.current.nodes([shapeRef.current])
      trRef.current.rotateEnabled(true)
      trRef.current.keepRatio(false)
      trRef.current.enabledAnchors(['top-left', 'top-right', 'bottom-left', 'bottom-right'])
      trRef.current.getLayer()?.batchDraw()
      return
    }
    trRef.current.nodes([])
    trRef.current.getLayer()?.batchDraw()
  }, [isSelected])

  const handleTransformEnd = () => {
    const node = shapeRef.current
    if (!node || typeof onUpdate !== 'function') return
    const scaleX = node.scaleX() || 1
    const scaleY = node.scaleY() || 1

    onUpdate(sticker.id, {
      x: node.x(), y: node.y(), rotation: node.rotation(),
      width: Math.max(24, (sticker.width || 72) * scaleX), height: Math.max(24, (sticker.height || 72) * scaleY),
      scaleX: 1, scaleY: 1,
    })
    node.scaleX(1)
    node.scaleY(1)
  }

  if (sticker.kind === 'icon') {
    return (
      <>
        <Group
          ref={shapeRef} x={sticker.x} y={sticker.y} rotation={sticker.rotation || 0} draggable dragDistance={8}
          onMouseDown={onSelect} onTouchStart={onSelect} onDragStart={onSelect}
          onDragEnd={(e) => { onUpdate?.(sticker.id, { x: e.target.x(), y: e.target.y() }) }}
          onTransformEnd={handleTransformEnd}
        >
          {iconImage && (
            <>
              <Rect x={0} y={0} width={sticker.width || 72} height={sticker.height || 72} fill="rgba(255, 255, 255, 0.001)" />
              <KonvaImage image={iconImage} x={0} y={0} width={sticker.width || 72} height={sticker.height || 72} listening={false} />
            </>
          )}
        </Group>
        {isSelected && <Transformer ref={trRef} />}
      </>
    )
  }

  return (
    <>
      <Text
        text={sticker.text} x={sticker.x} y={sticker.y} fontSize={sticker.fontSize || 50} rotation={sticker.rotation || 0}
        draggable onClick={onSelect} onTap={onSelect} ref={shapeRef}
        onDragEnd={(e) => { onUpdate?.(sticker.id, { x: e.target.x(), y: e.target.y() }) }}
        onTransformEnd={handleTransformEnd}
      />
      {isSelected && <Transformer ref={trRef} />}
    </>
  )
}

const createIconDataUri = (IconComponent, color) => {
  const svg = renderToStaticMarkup(<IconComponent size={96} strokeWidth={2} color={color} />)
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

const buildIconLibrary = () => {
  const iconSets = [
    { id: 'heart', name: 'Trái tim', icon: FaHeart, color: '#fb7185' },
    { id: 'star', name: 'Ngôi sao', icon: FaStar, color: '#facc15' },
    { id: 'sparkles', name: 'Lấp lánh', icon: HiOutlineSparkles, color: '#00ffcc' },
  ]
  return iconSets.map((item) => ({ ...item, src: createIconDataUri(item.icon, item.color) }))
}

const getCoverCrop = (image, width, height) => {
  const imageRatio = image.width / image.height
  const targetRatio = width / height
  let cropWidth = image.width, cropHeight = image.height, cropX = 0, cropY = 0

  if (imageRatio > targetRatio) {
    cropWidth = image.height * targetRatio
    cropX = (image.width - cropWidth) / 2
  } else {
    cropHeight = image.width / targetRatio
    cropY = (image.height - cropHeight) / 2
  }
  return { x: cropX, y: cropY, width: cropWidth, height: cropHeight }
}

const getCanvasSafeImageUrl = (src) => {
  if (!src || !src.startsWith('http')) return src

  try {
    const url = new URL(src)
    if (url.hostname === 'cam-dd.synology.me' && url.port === '8080') {
      return `/camera-media${url.pathname}${url.search}`
    }
  } catch {
    return src
  }

  return src
}

const PhotoSlot = ({ src, x, y, width, height, index, radius = 0, adjustment, onSelect, onZoom }) => {
  const [image] = useImage(getCanvasSafeImageUrl(src) || '', 'anonymous')

  if (!src) {
    return (
      <>
        <Rect x={x} y={y} width={width} height={height} fill="rgba(255, 255, 255, 0.06)" stroke="rgba(255, 255, 255, 0.12)" strokeWidth={2} cornerRadius={radius} />
        <Text text={`#${index + 1}`} x={x} y={y + height / 2 - 10} width={width} align="center" fill="rgba(255, 255, 255, 0.55)" fontSize={16} fontStyle="bold" />
      </>
    )
  }

  if (!image) {
    return <Rect x={x} y={y} width={width} height={height} fill="rgba(255, 255, 255, 0.08)" stroke="rgba(255, 255, 255, 0.12)" strokeWidth={2} cornerRadius={radius} />
  }

  const baseCrop = getCoverCrop(image, width, height)
  const zoom = adjustment?.zoom || 1
  const cropWidth = baseCrop.width / zoom
  const cropHeight = baseCrop.height / zoom
  const availablePanX = Math.max(0, image.width - cropWidth)
  const availablePanY = Math.max(0, image.height - cropHeight)
  const cropX = availablePanX * (0.5 + (adjustment?.panX || 0) / 2)
  const cropY = availablePanY * (0.5 + (adjustment?.panY || 0) / 2)

  return (
    <KonvaImage
      image={image}
      x={x + width}
      y={y}
      width={width}
      height={height}
      scaleX={-1}
      crop={{ x: cropX, y: cropY, width: cropWidth, height: cropHeight }}
      cornerRadius={radius}
      onClick={(event) => { event.cancelBubble = true; onSelect(index) }}
      onTap={(event) => { event.cancelBubble = true; onSelect(index) }}
      onWheel={(event) => {
        event.evt.preventDefault()
        event.cancelBubble = true
        onSelect(index)
        onZoom(index, event.evt.deltaY < 0 ? 0.1 : -0.1)
      }}
    />
  )
}

// ==========================================
// ĐỊNH NGHĨA LOCAL CONFIG ĐỂ CHỐNG LỖI TRẮNG MÀN HÌNH
// ==========================================
const FRAME_CONFIGS = {
  'FRAME-4-doc-gau-xanh-ic': {
    previewUrl: '/frames/FRAME-4-doc-gau-xanh-ic.png',
    paddingTop: 17, paddingBottom: 37, paddingSide: 15, gap: 10, radius: 0, poses: 4
  },
  'FRAME-4-doc-da-banh': {
    previewUrl: '/frames/FRAME-4-doc-da-banh.png',
    paddingTop: 34, paddingBottom: 20, paddingSide: 18, gap: 12, radius: 0, poses: 4
  },
  'FRAME-4-doc-da-banh-bai-bien': {
    previewUrl: '/frames/FRAME-4-doc-da-banh-bai-bien.png',
    paddingTop: 31, paddingBottom: 55, paddingSide: 20, gap: 15, radius: 0, poses: 4
  },
  'default': {
    previewUrl: '',
    paddingTop: 50, paddingBottom: 50, paddingSide: 16, gap: 12, radius: 0, poses: 4
  }
};

const buildLayoutSlots = (layoutType, canvasWidth, canvasHeight, config) => {
  if (!config) return [];
  const count = config.poses || 4;
  const { paddingTop, paddingBottom, paddingSide, gap } = config;
  const availableHeight = canvasHeight - paddingTop - paddingBottom;
  const slotHeight = (availableHeight - gap * (count - 1)) / count;
  const slotWidth = canvasWidth - paddingSide * 2;

  return Array.from({ length: count }, (_, index) => ({
    x: paddingSide,
    y: paddingTop + index * (slotHeight + gap),
    width: slotWidth,
    height: slotHeight,
  }))
}

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function ProcessingScreen() {
  const { currentStep, nextStep, prevStep, capturedPhotos, selectedLayout, setCapturedPhotos, selectedFrameId, expectedPoses } = usePhotobooth()
  const allCapturedPhotos = capturedPhotos || []
  const targetShots = Math.min(expectedPoses || 4, allCapturedPhotos.length)

  // Khung dọc tiêu chuẩn
  const canvasWidth = 218 
  const canvasHeight = 600

  const [activeTab, setActiveTab] = useState('photos')
  const [stickers, setStickers] = useState([])
  const [selectedStickerId, setSelectedStickerId] = useState(null)
  const [activeFilter, setActiveFilter] = useState('none')
  const [selectedPhotoIndices, setSelectedPhotoIndices] = useState(() => (
    Array.from({ length: targetShots }, (_, index) => index)
  ))
  const [dragPreview, setDragPreview] = useState(null)
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(null)
  const [photoAdjustments, setPhotoAdjustments] = useState({})

  const stageRef = useRef(null)
  const canvasBoxRef = useRef(null)
  const dragPreviewRef = useRef(null)
  const slotHighlightRef = useRef(null)
  const draggedPhotoIndexRef = useRef(null)
  const dragAnimationFrameRef = useRef(null)
  const pendingPointerPositionRef = useRef(null)
  const suppressNextPhotoClickRef = useRef(false)

  // -----------------------------------------------------
  // LOGIC TRUY XUẤT ĐÚNG FRAME VÀ CONFIG CHỐNG CRASH
  // -----------------------------------------------------
  const activeFrameConfig = FRAME_CONFIGS[selectedFrameId] || FRAME_CONFIGS['default'];
  const layoutSlots = buildLayoutSlots(selectedLayout || 'strip-4', canvasWidth, canvasHeight, activeFrameConfig);
  const availableIcons = buildIconLibrary()
  const photosList = selectedPhotoIndices
    .map((index) => allCapturedPhotos[index])

  // Load trực tiếp URL ảnh từ Config
  const [frameImg] = useImage(activeFrameConfig.previewUrl || '', 'anonymous')

  const availableFilters = [
    { id: 'none', name: 'Ảnh Gốc', style: 'none' },
    { id: 'grayscale', name: 'Đen Trắng', style: 'grayscale(100%)' },
    { id: 'sepia', name: 'Vintage', style: 'sepia(80%)' },
  ]

  const handleAddIcon = (icon) => {
    const newSticker = {
      id: Date.now().toString(), kind: 'icon', src: icon.src, name: icon.name,
      x: canvasWidth / 2 - 36, y: canvasHeight / 2 - 36, width: 72, height: 72, rotation: 0, scaleX: 1, scaleY: 1,
    }
    setStickers([...stickers, newSticker])
    setSelectedStickerId(newSticker.id)
  }

  const handleUpdateSticker = (stickerId, updates) => {
    setStickers((prev) => prev.map((sticker) => (sticker.id === stickerId ? { ...sticker, ...updates } : sticker)))
  }

  const handleTogglePhoto = (photoIndex) => {
    setSelectedPhotoIndices((previous) => {
      if (previous.includes(photoIndex)) return previous.filter((index) => index !== photoIndex)
      if (previous.length >= targetShots) return previous
      return [...previous, photoIndex]
    })
  }

  const updatePhotoAdjustment = (slotIndex, updates) => {
    setPhotoAdjustments((previous) => {
      const current = previous[slotIndex] || { zoom: 1, panX: 0, panY: 0 }
      const next = typeof updates === 'function' ? updates(current) : { ...current, ...updates }
      return { ...previous, [slotIndex]: next }
    })
  }

  const handlePhotoZoom = (slotIndex, amount) => {
    updatePhotoAdjustment(slotIndex, (current) => ({
      ...current,
      zoom: Math.min(3, Math.max(1, current.zoom + amount)),
    }))
  }

  const handlePhotoMove = (direction) => {
    if (!Number.isInteger(selectedSlotIndex)) return

    const step = 0.08
    updatePhotoAdjustment(selectedSlotIndex, (current) => ({
      ...current,
      panX: Math.min(1, Math.max(-1, current.panX + (direction === 'left' ? -1 : direction === 'right' ? 1 : 0) * step)),
      panY: Math.min(1, Math.max(-1, current.panY + (direction === 'up' ? 1 : direction === 'down' ? -1 : 0) * step)),
    }))
  }

  const placePhotoInSlot = (photoIndex, slotIndex) => {
    if (slotIndex === -1 || slotIndex >= targetShots) return

    setSelectedPhotoIndices((previous) => {
      const next = Array.from({ length: targetShots }, (_, index) => previous[index])
      const duplicateIndex = next.indexOf(photoIndex)

      if (duplicateIndex !== -1) next[duplicateIndex] = next[slotIndex]
      next[slotIndex] = photoIndex

      return next.filter((index) => Number.isInteger(index))
    })
  }

  const getSlotIndexFromClientPoint = (clientX, clientY) => {
    const canvasRect = canvasBoxRef.current?.getBoundingClientRect()
    if (!canvasRect) return -1

    const dropX = ((clientX - canvasRect.left) / canvasRect.width) * canvasWidth
    const dropY = ((clientY - canvasRect.top) / canvasRect.height) * canvasHeight

    return layoutSlots.findIndex((slot) => (
      dropX >= slot.x
      && dropX <= slot.x + slot.width
      && dropY >= slot.y
      && dropY <= slot.y + slot.height
    ))
  }

  const handlePhotoPointerDown = (event, photoIndex) => {
    event.preventDefault()
    draggedPhotoIndexRef.current = photoIndex
    setDragPreview({
      src: allCapturedPhotos[photoIndex],
      x: event.clientX,
      y: event.clientY,
    })
  }

  useEffect(() => {
    const renderDragPosition = () => {
      dragAnimationFrameRef.current = null
      const position = pendingPointerPositionRef.current
      if (!position || !Number.isInteger(draggedPhotoIndexRef.current)) return

      if (dragPreviewRef.current) {
        dragPreviewRef.current.style.transform = `translate3d(${position.x - 56}px, ${position.y - 42}px, 0) scaleX(-1)`
      }

      const slotIndex = getSlotIndexFromClientPoint(position.x, position.y)
      const slot = layoutSlots[slotIndex]
      const highlight = slotHighlightRef.current

      if (highlight && slot) {
        highlight.style.display = 'block'
        highlight.style.transform = `translate3d(${slot.x}px, ${slot.y}px, 0)`
        highlight.style.width = `${slot.width}px`
        highlight.style.height = `${slot.height}px`
      } else if (highlight) {
        highlight.style.display = 'none'
      }
    }

    const handlePointerMove = (event) => {
      if (!Number.isInteger(draggedPhotoIndexRef.current)) return

      pendingPointerPositionRef.current = { x: event.clientX, y: event.clientY }
      if (dragAnimationFrameRef.current === null) {
        dragAnimationFrameRef.current = window.requestAnimationFrame(renderDragPosition)
      }
    }

    const handlePointerUp = (event) => {
      const photoIndex = draggedPhotoIndexRef.current
      draggedPhotoIndexRef.current = null
      setDragPreview(null)
      if (slotHighlightRef.current) slotHighlightRef.current.style.display = 'none'

      if (!Number.isInteger(photoIndex)) return

      const slotIndex = getSlotIndexFromClientPoint(event.clientX, event.clientY)
      if (slotIndex !== -1) {
        suppressNextPhotoClickRef.current = true
        placePhotoInSlot(photoIndex, slotIndex)
      }
    }

    const cancelPointerDrag = () => {
      draggedPhotoIndexRef.current = null
      setDragPreview(null)
      if (slotHighlightRef.current) slotHighlightRef.current.style.display = 'none'
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', cancelPointerDrag)

    return () => {
      if (dragAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(dragAnimationFrameRef.current)
        dragAnimationFrameRef.current = null
      }
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', cancelPointerDrag)
    }
  })

  const handlePhotoClick = (photoIndex) => {
    if (suppressNextPhotoClickRef.current) {
      suppressNextPhotoClickRef.current = false
      return
    }

    handleTogglePhoto(photoIndex)
  }

  const handleStagePointerDown = (e) => {
    if (e.target === e.target.getStage()) {
      setSelectedStickerId(null)
      setSelectedSlotIndex(null)
    }
  }

  const handleFinishCustomizing = () => {
    if (targetShots === 0 || selectedPhotoIndices.length !== targetShots) return

    if (stageRef.current) {
      setSelectedStickerId(null)
      setSelectedSlotIndex(null)
      setTimeout(() => {
        const dataURL = stageRef.current.toDataURL({ pixelRatio: 2 })
        if (typeof setCapturedPhotos === 'function') setCapturedPhotos([dataURL])
        nextStep()
      }, 100)
    } else {
      nextStep()
    }
  }

  if (currentStep !== 4) return null;

  const getActiveFilterStyle = () => {
    const found = availableFilters.find(f => f.id === activeFilter)
    return found ? found.style : 'none'
  }

  return (
    <section className="processing-screen-container">
      <div className="processing-header">
        <div className="processing-step-tag">Bước 04 / 07</div>
        <h2 className="processing-title">TRANG TRÍ VÀ THÊM STICKER</h2>
      </div>

      <div className="processing-content-wrapper">
        <div
          ref={canvasBoxRef}
          className="canvas-preview-box"
          style={{ filter: getActiveFilterStyle(), width: canvasWidth, height: canvasHeight, overflow: 'hidden' }}
        >
          <Stage width={canvasWidth} height={canvasHeight} ref={stageRef} onMouseDown={handleStagePointerDown} onTouchStart={handleStagePointerDown}>
            <Layer>
              <Rect x={0} y={0} width={canvasWidth} height={canvasHeight} fill="#ffffff" />
              
              {layoutSlots.map((slot, index) => (
                <PhotoSlot 
                  key={`${index}-${selectedFrameId}`} 
                  src={photosList[index]} 
                  x={slot.x} 
                  y={slot.y} 
                  width={slot.width} 
                  height={slot.height} 
                  index={index} 
                  radius={activeFrameConfig.radius || 0} 
                  adjustment={photoAdjustments[index]}
                  onSelect={setSelectedSlotIndex}
                  onZoom={handlePhotoZoom}
                />
              ))}
              
              {photosList.length === 0 && <Text text="Đang tải ảnh chụp..." x={canvasWidth / 2 - 70} y={canvasHeight / 2} fill="#000000" fontSize={16} />}
              
              {stickers.map((st) => (
                <DraggableSticker key={st.id} sticker={st} isSelected={st.id === selectedStickerId} onUpdate={handleUpdateSticker} onSelect={(e) => { e.cancelBubble = true; setSelectedStickerId(st.id) }} />
              ))}
              
              {/* Ảnh Frame tự động ép vào khung mà không cần bấm chọn */}
              {frameImg && <KonvaImage image={frameImg} width={canvasWidth} height={canvasHeight} listening={false} />}
              {Number.isInteger(selectedSlotIndex) && layoutSlots[selectedSlotIndex] && (
                <Rect
                  {...layoutSlots[selectedSlotIndex]}
                  stroke="#00ffcc"
                  strokeWidth={4}
                  shadowColor="#00ffcc"
                  shadowBlur={10}
                  listening={false}
                />
              )}
            </Layer>
          </Stage>
          <div ref={slotHighlightRef} className="processing-slot-drop-highlight" />
        </div>

        <div className="processing-sidebar">
          <div className="sidebar-tabs-header">
            {/* ĐÃ ẨN TAB KHUNG ẢO */}
            <button className={`tab-btn ${activeTab === 'photos' ? 'active' : ''}`} onClick={() => setActiveTab('photos')}>Ảnh in</button>
            <button className={`tab-btn ${activeTab === 'icon' ? 'active' : ''}`} onClick={() => setActiveTab('icon')}>Sticker</button>
            <button className={`tab-btn ${activeTab === 'filter' ? 'active' : ''}`} onClick={() => setActiveTab('filter')}>Bộ Lọc</button>
          </div>
          
          <div className="sidebar-tab-content">
            {activeTab === 'photos' && (
              <div className="processing-photo-picker">
                <div className="processing-photo-count">
                  Đã chọn <strong>{selectedPhotoIndices.length}</strong> / {targetShots} ảnh
                </div>

                {Number.isInteger(selectedSlotIndex) && (
                  <div className="processing-photo-edit-controls">
                    <div className="processing-photo-control-title">Chỉnh ảnh ô {selectedSlotIndex + 1}</div>
                    <div className="processing-photo-zoom-controls">
                      <Button icon="pi pi-search-minus" aria-label="Thu nhỏ ảnh" title="Thu nhỏ ảnh" onClick={() => handlePhotoZoom(selectedSlotIndex, -0.1)} />
                      <span>{Math.round((photoAdjustments[selectedSlotIndex]?.zoom || 1) * 100)}%</span>
                      <Button icon="pi pi-search-plus" aria-label="Phóng to ảnh" title="Phóng to ảnh" onClick={() => handlePhotoZoom(selectedSlotIndex, 0.1)} />
                    </div>
                    <div className="processing-photo-direction-controls">
                      <Button className="move-up" icon="pi pi-arrow-up" aria-label="Di chuyển lên" title="Di chuyển lên" onClick={() => handlePhotoMove('up')} />
                      <Button className="move-left" icon="pi pi-arrow-left" aria-label="Di chuyển trái" title="Di chuyển trái" onClick={() => handlePhotoMove('left')} />
                      <Button className="move-reset" icon="pi pi-refresh" aria-label="Đặt lại ảnh" title="Đặt lại ảnh" onClick={() => updatePhotoAdjustment(selectedSlotIndex, { zoom: 1, panX: 0, panY: 0 })} />
                      <Button className="move-right" icon="pi pi-arrow-right" aria-label="Di chuyển phải" title="Di chuyển phải" onClick={() => handlePhotoMove('right')} />
                      <Button className="move-down" icon="pi pi-arrow-down" aria-label="Di chuyển xuống" title="Di chuyển xuống" onClick={() => handlePhotoMove('down')} />
                    </div>
                  </div>
                )}

                <div className="processing-photo-grid">
                  {allCapturedPhotos.map((photoUrl, index) => {
                    const isSelected = selectedPhotoIndices.includes(index)
                    const badgeOrder = selectedPhotoIndices.indexOf(index) + 1

                    return (
                      <button
                        type="button"
                        key={`${photoUrl}-${index}`}
                        className={`processing-photo-card ${isSelected ? 'selected' : ''}`}
                        onPointerDown={(event) => handlePhotoPointerDown(event, index)}
                        onClick={() => handlePhotoClick(index)}
                      >
                        <img src={photoUrl} alt={`Ảnh ${index + 1}`} draggable="false" />
                        {isSelected && <span className="processing-photo-badge">{badgeOrder}</span>}
                      </button>
                    )
                  })}
                </div>

                <Button label="Chụp lại" icon="pi pi-refresh" severity="secondary" outlined onClick={prevStep} />
              </div>
            )}

            {activeTab === 'icon' && (
              <div className="grid-options-container">
                {availableIcons.map((item) => (
                  <div key={item.id} className="option-item-card" onClick={() => handleAddIcon(item)}>
                    <img src={item.src} alt={item.name} style={{ width: '28px', height: '28px' }} />
                    <span>{item.name}</span>
                  </div>
                ))}
              </div>
            )}
            
            {activeTab === 'filter' && (
              <div className="grid-options-container" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                {availableFilters.map((fl) => (
                  <div key={fl.id} className={`option-item-card ${activeFilter === fl.id ? 'selected' : ''}`} style={{ height: '55px', flexDirection: 'row', justifyContent: 'flex-start', padding: '0 10px', gap: '8px' }} onClick={() => setActiveFilter(fl.id)}>
                    <span style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>{fl.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="processing-footer">
        <Button label="Hoàn tất & Tiếp tục" icon="pi pi-check" iconPos="right" size="large" disabled={targetShots === 0 || selectedPhotoIndices.length !== targetShots} onClick={handleFinishCustomizing} />
      </div>

      {dragPreview && (
        <img
          ref={dragPreviewRef}
          className="processing-photo-drag-preview"
          src={dragPreview.src}
          alt=""
          draggable="false"
          style={{ transform: `translate3d(${dragPreview.x - 56}px, ${dragPreview.y - 42}px, 0) scaleX(-1)` }}
        />
      )}
    </section>
  )
}
