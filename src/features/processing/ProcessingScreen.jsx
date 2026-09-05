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
import { finalizeSession, uploadPhoto } from '../../services/sessionApi.js'
import { getFramePhotoCount, getSlotPhotoArrayIndex } from '../../utils/frameSlots.js'
import './ProcessingScreen.css'

const CUSTOMIZE_TIMER_SECONDS = 60

// ==========================================
// CÁC HELPER FUNCTIONS VÀ COMPONENT PHỤ
// ==========================================

const DraggableSticker = ({ sticker, isSelected, onSelect, onUpdate, onDelete }) => {
  const shapeRef = useRef(null)
  const trRef = useRef(null)
  const [iconImage] = useImage(sticker.src || '', 'anonymous')

  useEffect(() => {
    if (!trRef.current || !shapeRef.current) return
    if (isSelected) {
      trRef.current.nodes([shapeRef.current])
      trRef.current.rotateEnabled(true)
      trRef.current.keepRatio(true)
      trRef.current.enabledAnchors(['top-left', 'top-right', 'bottom-left', 'bottom-right'])
      trRef.current.getLayer()?.batchDraw()
      return
    }
    trRef.current.nodes([])
    trRef.current.getLayer()?.batchDraw()
  }, [iconImage, isSelected, sticker.height, sticker.width])

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
          <Rect x={0} y={0} width={sticker.width || 72} height={sticker.height || 72} fill="rgba(255, 255, 255, 0.001)" />
          {iconImage && (
              <KonvaImage image={iconImage} x={0} y={0} width={sticker.width || 72} height={sticker.height || 72} listening={false} />
          )}
          {isSelected && (
            <Group
              x={(sticker.width || 72) - 12}
              y={-12}
              onMouseDown={(event) => { event.cancelBubble = true }}
              onTouchStart={(event) => { event.cancelBubble = true }}
              onClick={(event) => { event.cancelBubble = true; onDelete?.(sticker.id) }}
              onTap={(event) => { event.cancelBubble = true; onDelete?.(sticker.id) }}
            >
              <Rect width={24} height={24} cornerRadius={12} fill="#ff335f" stroke="#ffffff" strokeWidth={2} />
              <Text text="x" width={24} height={24} align="center" verticalAlign="middle" fill="#ffffff" fontSize={16} fontStyle="bold" listening={false} />
            </Group>
          )}
        </Group>
        {isSelected && (
          <Transformer
            ref={trRef}
            borderStroke="#00ffcc"
            borderStrokeWidth={1}
            anchorFill="#ffffff"
            anchorStroke="#00ffcc"
            anchorSize={8}
            rotateAnchorOffset={18}
          />
        )}
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
      {isSelected && (
        <Transformer
          ref={trRef}
          borderStroke="#00ffcc"
          borderStrokeWidth={1}
          anchorFill="#ffffff"
          anchorStroke="#00ffcc"
          anchorSize={8}
          rotateAnchorOffset={18}
        />
      )}
    </>
  )
}

const createIconDataUri = (IconComponent, color) => {
  const svg = renderToStaticMarkup(<IconComponent size={1024} strokeWidth={2} color={color} />)
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

const buildIconLibrary = () => {
  const iconSets = [
    { id: 'heart', name: 'Trai tim', icon: FaHeart, color: '#fb7185' },
    { id: 'heart-line', name: 'Tim vien', icon: FaRegHeart, color: '#f43f5e' },
    { id: 'star', name: 'Ngoi sao', icon: FaStar, color: '#facc15' },
    { id: 'star-line', name: 'Sao vien', icon: FaRegStar, color: '#fde047' },
    { id: 'camera', name: 'May anh', icon: FaCamera, color: '#38bdf8' },
    { id: 'retro-camera', name: 'Camera', icon: FaCameraRetro, color: '#60a5fa' },
    { id: 'crown', name: 'Vuong mien', icon: FaCrown, color: '#facc15' },
    { id: 'gift', name: 'Qua', icon: FaGift, color: '#fb7185' },
    { id: 'music', name: 'Am nhac', icon: FaMusic, color: '#a78bfa' },
    { id: 'fire', name: 'Noi bat', icon: FaFire, color: '#fb923c' },
    { id: 'leaf', name: 'La', icon: FaLeaf, color: '#22c55e' },
    { id: 'sun', name: 'Mat troi', icon: FaSun, color: '#fbbf24' },
    { id: 'rocket', name: 'Ten lua', icon: FaRocket, color: '#f97316' },
    { id: 'smile', name: 'Mat cuoi', icon: FaSmileBeam, color: '#facc15' },
    { id: 'party', name: 'Party', icon: FaGlassCheers, color: '#c084fc' },
    { id: 'gem', name: 'Kim cuong', icon: FaGem, color: '#22d3ee' },
    { id: 'bolt', name: 'Tia chop', icon: FaBolt, color: '#fde047' },
    { id: 'palette', name: 'Mau sac', icon: FaPalette, color: '#34d399' },
    { id: 'film', name: 'Film', icon: FaFilm, color: '#94a3b8' },
    { id: 'paper-plane', name: 'Bay', icon: FaPaperPlane, color: '#38bdf8' },
    { id: 'thumbs-up', name: 'Like', icon: FaThumbsUp, color: '#60a5fa' },
    { id: 'kiss', name: 'Cute', icon: FaKissWinkHeart, color: '#fb7185' },
    { id: 'rainbow', name: 'Cau vong', icon: FaRainbow, color: '#f472b6' },
    { id: 'feather', name: 'Long vu', icon: FaFeather, color: '#e2e8f0' },
    { id: 'paw', name: 'Dau chan', icon: FaPaw, color: '#f59e0b' },
    { id: 'trophy', name: 'Cup', icon: FaTrophy, color: '#facc15' },
    { id: 'birthday', name: 'Sinh nhat', icon: FaBirthdayCake, color: '#f9a8d4' },
    { id: 'coffee', name: 'Cafe', icon: FaCoffee, color: '#d97706' },
    { id: 'cat', name: 'Meo', icon: FaCat, color: '#f97316' },
    { id: 'dog', name: 'Cun', icon: FaDog, color: '#a16207' },
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

const PhotoSlot = ({ src, x, y, width, height, rotation = 0, index, radius = 0, adjustment, onSelect, onZoom, onPan }) => {
  const [image] = useImage(getCanvasSafeImageUrl(src) || '', 'anonymous')
  const dragStartRef = useRef(null)

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
    <Group
      x={x}
      y={y}
      rotation={rotation}
      clipFunc={(ctx) => {
        ctx.rect(0, 0, width, height)
      }}
      draggable
      dragDistance={3}
      onClick={(event) => { event.cancelBubble = true; onSelect(index) }}
      onTap={(event) => { event.cancelBubble = true; onSelect(index) }}
      onDragStart={(event) => {
        event.cancelBubble = true
        onSelect(index)
        dragStartRef.current = {
          nodeX: event.currentTarget.x(),
          nodeY: event.currentTarget.y(),
          panX: adjustment?.panX || 0,
          panY: adjustment?.panY || 0,
        }
      }}
      onDragMove={(event) => {
        const start = dragStartRef.current
        if (!start) return

        event.cancelBubble = true
        const dx = event.currentTarget.x() - start.nodeX
        const dy = event.currentTarget.y() - start.nodeY
        onPan(index, {
          panX: start.panX + (dx / width) * 1.5,
          panY: start.panY - (dy / height) * 1.5,
        })
        event.currentTarget.position({ x: start.nodeX, y: start.nodeY })
      }}
      onDragEnd={(event) => {
        event.cancelBubble = true
        const start = dragStartRef.current
        if (start) event.currentTarget.position({ x: start.nodeX, y: start.nodeY })
        dragStartRef.current = null
      }}
      onWheel={(event) => {
        event.evt.preventDefault()
        event.cancelBubble = true
        onSelect(index)
        onZoom(index, event.evt.deltaY < 0 ? 0.1 : -0.1)
      }}
    >
      <KonvaImage
        image={image}
        x={width}
        y={0}
        width={width}
        height={height}
        scaleX={-1}
        crop={{ x: cropX, y: cropY, width: cropWidth, height: cropHeight }}
        cornerRadius={radius}
        listening={false}
      />
    </Group>
  )
}

// ==========================================
// ĐỊNH NGHĨA LOCAL CONFIG ĐỂ CHỐNG LỖI TRẮNG MÀN HÌNH
// ==========================================
// ==========================================
// MAIN COMPONENT
// ==========================================
export default function ProcessingScreen() {
  const { currentStep, nextStep, prevStep, capturedPhotos, selectedFrame, expectedPoses, session, setFinalImage } = usePhotobooth()
  const allCapturedPhotos = capturedPhotos || []
  const framePhotoCount = getFramePhotoCount(selectedFrame)
  const targetShots = Math.min(framePhotoCount || expectedPoses || 4, allCapturedPhotos.length)

  // Khung dọc tiêu chuẩn
  const canvasWidth = selectedFrame?.canvasWidth || 1
  const canvasHeight = selectedFrame?.canvasHeight || 1

  const [viewportSize, setViewportSize] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }))
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
  const [remainingCustomizeSeconds, setRemainingCustomizeSeconds] = useState(CUSTOMIZE_TIMER_SECONDS)
  const [saveError, setSaveError] = useState(null)
  const [isSavingFinal, setIsSavingFinal] = useState(false)

  const stageRef = useRef(null)
  const canvasBoxRef = useRef(null)
  const dragPreviewRef = useRef(null)
  const slotHighlightRef = useRef(null)
  const draggedPhotoIndexRef = useRef(null)
  const canvasRectRef = useRef(null)
  const dragAnimationFrameRef = useRef(null)
  const pendingPointerPositionRef = useRef(null)
  const suppressNextPhotoClickRef = useRef(false)
  const layoutSlotsRef = useRef([])
  const canvasScaleRef = useRef(1)
  const allCapturedPhotosRef = useRef([])
  const placePhotoInSlotRef = useRef(null)
  const finishCustomizingRef = useRef(null)
  const canFinishCustomizingRef = useRef(false)

  useEffect(() => {
    const handleResize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // -----------------------------------------------------
  // LOGIC TRUY XUẤT ĐÚNG FRAME VÀ CONFIG CHỐNG CRASH
  // -----------------------------------------------------
  const layoutSlots = selectedFrame?.slots?.map((slot, index) => ({ x: slot.posX, y: slot.posY, width: slot.width, height: slot.height, rotation: slot.rotation || 0, photoArrayIndex: getSlotPhotoArrayIndex(slot, index, selectedFrame) })) || []
  const availableIcons = buildIconLibrary()
  const photosList = selectedPhotoIndices
    .map((index) => allCapturedPhotos[index])
  const maxCanvasHeight = Math.max(260, Math.min(viewportSize.height - 150, 860))
  const maxCanvasWidth = Math.max(260, viewportSize.width - 500)
  const canvasScale = Math.min(1, maxCanvasHeight / canvasHeight, maxCanvasWidth / canvasWidth)
  const displayCanvasWidth = Math.round(canvasWidth * canvasScale)
  const displayCanvasHeight = Math.round(canvasHeight * canvasScale)

  useEffect(() => {
    layoutSlotsRef.current = layoutSlots
    canvasScaleRef.current = canvasScale
    allCapturedPhotosRef.current = allCapturedPhotos
  }, [allCapturedPhotos, canvasScale, layoutSlots])

  // Load trực tiếp URL ảnh từ Config
  const [frameImg] = useImage(getCanvasSafeImageUrl(selectedFrame?.previewUrl) || '', 'anonymous')

  const availableFilters = [
    { id: 'none', name: 'Anh goc', style: 'none' },
    { id: 'bright', name: 'Sang hon', style: 'brightness(112%) contrast(104%)' },
    { id: 'soft', name: 'Mem mai', style: 'brightness(106%) contrast(92%) saturate(112%)' },
    { id: 'vivid', name: 'Ruc ro', style: 'contrast(112%) saturate(145%)' },
    { id: 'fresh', name: 'Tuoi sang', style: 'brightness(108%) saturate(125%) hue-rotate(-4deg)' },
    { id: 'warm', name: 'Am ap', style: 'sepia(18%) saturate(122%) brightness(104%) hue-rotate(-8deg)' },
    { id: 'cool', name: 'Mat lanh', style: 'saturate(112%) hue-rotate(12deg) brightness(102%)' },
    { id: 'pink', name: 'Hong cute', style: 'sepia(8%) saturate(132%) hue-rotate(-18deg) brightness(105%)' },
    { id: 'cinema', name: 'Cinema', style: 'contrast(118%) saturate(88%) brightness(96%)' },
    { id: 'retro', name: 'Retro', style: 'sepia(45%) contrast(106%) saturate(92%) brightness(102%)' },
    { id: 'vintage', name: 'Vintage', style: 'sepia(80%) contrast(95%) brightness(98%)' },
    { id: 'noir', name: 'Noir', style: 'grayscale(100%) contrast(126%) brightness(92%)' },
    { id: 'grayscale', name: 'Den trang', style: 'grayscale(100%)' },
    { id: 'fade', name: 'Film fade', style: 'contrast(88%) brightness(108%) saturate(82%) sepia(12%)' },
    { id: 'dream', name: 'Mo mang', style: 'brightness(112%) contrast(86%) saturate(118%) blur(0.25px)' },
  ]
  const handleAddIcon = (icon) => {
    const stickerSize = 144
    const newSticker = {
      id: Date.now().toString(), kind: 'icon', src: icon.src, name: icon.name,
      x: (canvasWidth - stickerSize) / 2, y: (canvasHeight - stickerSize) / 2,
      width: stickerSize, height: stickerSize, rotation: 0, scaleX: 1, scaleY: 1,
    }
    setStickers([...stickers, newSticker])
    setSelectedStickerId(newSticker.id)
  }

  const handleUpdateSticker = (stickerId, updates) => {
    setStickers((prev) => prev.map((sticker) => (sticker.id === stickerId ? { ...sticker, ...updates } : sticker)))
  }

  const handleDeleteSticker = (stickerId) => {
    if (!stickerId) return
    setStickers((previous) => previous.filter((sticker) => sticker.id !== stickerId))
    setSelectedStickerId(null)
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

  const handlePhotoPan = (slotIndex, nextPan) => {
    updatePhotoAdjustment(slotIndex, (current) => ({
      ...current,
      panX: Math.min(1, Math.max(-1, nextPan.panX)),
      panY: Math.min(1, Math.max(-1, nextPan.panY)),
    }))
  }

  const placePhotoInSlot = (photoIndex, slotIndex) => {
    const targetPhotoArrayIndex = layoutSlots[slotIndex]?.photoArrayIndex
    if (slotIndex === -1 || !Number.isInteger(targetPhotoArrayIndex) || targetPhotoArrayIndex >= targetShots) return

    setSelectedPhotoIndices((previous) => {
      const next = Array.from({ length: targetShots }, (_, index) => previous[index])
      const duplicateIndex = next.indexOf(photoIndex)

      if (duplicateIndex !== -1) next[duplicateIndex] = next[targetPhotoArrayIndex]
      next[targetPhotoArrayIndex] = photoIndex

      return next.filter((index) => Number.isInteger(index))
    })
  }

  useEffect(() => {
    placePhotoInSlotRef.current = placePhotoInSlot
  }, [placePhotoInSlot])

  const getSlotIndexFromClientPoint = (clientX, clientY) => {
    const canvasRect = canvasRectRef.current || canvasBoxRef.current?.getBoundingClientRect()
    if (!canvasRect) return -1

    const dropX = ((clientX - canvasRect.left) / canvasRect.width) * canvasWidth
    const dropY = ((clientY - canvasRect.top) / canvasRect.height) * canvasHeight

    return layoutSlotsRef.current.findIndex((slot) => (
      dropX >= slot.x
      && dropX <= slot.x + slot.width
      && dropY >= slot.y
      && dropY <= slot.y + slot.height
    ))
  }

  const handlePhotoPointerDown = (event, photoIndex) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    canvasRectRef.current = canvasBoxRef.current?.getBoundingClientRect() || null
    draggedPhotoIndexRef.current = photoIndex
    setDragPreview({
      src: allCapturedPhotosRef.current[photoIndex],
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
      const slot = layoutSlotsRef.current[slotIndex]
      const highlight = slotHighlightRef.current
      const currentCanvasScale = canvasScaleRef.current

      if (highlight && slot) {
        highlight.style.display = 'block'
        highlight.style.transform = `translate3d(${slot.x * currentCanvasScale}px, ${slot.y * currentCanvasScale}px, 0)`
        highlight.style.width = `${slot.width * currentCanvasScale}px`
        highlight.style.height = `${slot.height * currentCanvasScale}px`
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
      canvasRectRef.current = null
      setDragPreview(null)
      if (slotHighlightRef.current) slotHighlightRef.current.style.display = 'none'

      if (!Number.isInteger(photoIndex)) return

      const slotIndex = getSlotIndexFromClientPoint(event.clientX, event.clientY)
      if (slotIndex !== -1) {
        suppressNextPhotoClickRef.current = true
        placePhotoInSlotRef.current?.(photoIndex, slotIndex)
      }
    }

    const cancelPointerDrag = () => {
      draggedPhotoIndexRef.current = null
      canvasRectRef.current = null
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
  }, [])

  const handlePhotoClick = (photoIndex) => {
    if (suppressNextPhotoClickRef.current) {
      suppressNextPhotoClickRef.current = false
      return
    }

    handleTogglePhoto(photoIndex)
  }

  const clearCanvasSelection = () => {
    setSelectedStickerId(null)
    setSelectedSlotIndex(null)
  }

  const handleScreenPointerDown = (event) => {
    if (event.target === event.currentTarget) clearCanvasSelection()
  }

  const handleStagePointerDown = (event) => {
    const target = event.target
    const isEmptyStage = target === target.getStage()
    const isBackground = target?.attrs?.name === 'canvas-background'

    if (isEmptyStage || isBackground) {
      clearCanvasSelection()
    }
  }

  const handleFinishCustomizing = async () => {
    if (targetShots === 0 || selectedPhotoIndices.length !== targetShots) return
    if (isSavingFinal) return
    if (!session?.qrCodeToken) {
      setSaveError('Không tìm thấy phiên chụp. Vui lòng chụp lại.')
      return
    }

    if (stageRef.current) {
      setSaveError(null)
      setIsSavingFinal(true)
      setSelectedStickerId(null)
      setSelectedSlotIndex(null)
      setTimeout(async () => {
        try {
          // Stage đang được thu nhỏ để vừa màn hình. Xuất ngược theo canvasScale
          // để ảnh trở về độ phân giải gốc của frame, nhưng giới hạn cạnh dài
          // ở 4096px để file PNG không quá lớn làm NAS reset kết nối.
          const previewLongEdge = Math.max(displayCanvasWidth, displayCanvasHeight)
          const nativePixelRatio = 1 / Math.max(canvasScale, 0.01)
          const safePixelRatio = 4096 / Math.max(previewLongEdge, 1)
          const exportPixelRatio = Math.max(1, Math.min(nativePixelRatio, safePixelRatio))
          const dataURL = stageRef.current.toDataURL({
            mimeType: 'image/png',
            pixelRatio: exportPixelRatio,
          })
          const blob = await (await fetch(dataURL)).blob()
          const uploaded = await uploadPhoto(new File([blob], `final-${session.qrCodeToken}.png`, { type: 'image/png' }))
          await finalizeSession(session.qrCodeToken, uploaded.url)
          setFinalImage(uploaded.url)
          nextStep()
        } catch (error) {
          setSaveError(error instanceof Error ? error.message : 'Không thể lưu ảnh ghép.')
        } finally {
          setIsSavingFinal(false)
        }
      }, 100)
    } else {
      setSaveError('Không thể tạo ảnh ghép.')
    }
  }

  useEffect(() => {
    finishCustomizingRef.current = handleFinishCustomizing
    canFinishCustomizingRef.current = targetShots > 0 && selectedPhotoIndices.length === targetShots
  })

  useEffect(() => {
    if (currentStep !== 4) return undefined

    setRemainingCustomizeSeconds(CUSTOMIZE_TIMER_SECONDS)
    const timerId = window.setInterval(() => {
      setRemainingCustomizeSeconds((previous) => {
        if (previous <= 1) {
          window.clearInterval(timerId)
          if (canFinishCustomizingRef.current) finishCustomizingRef.current?.()
          return 0
        }

        return previous - 1
      })
    }, 1000)

    return () => window.clearInterval(timerId)
  }, [currentStep])

  if (currentStep !== 4) return null;

  const progressPercent = (remainingCustomizeSeconds / CUSTOMIZE_TIMER_SECONDS) * 100

  const getActiveFilterStyle = () => {
    const found = availableFilters.find(f => f.id === activeFilter)
    return found ? found.style : 'none'
  }

  return (
    <section className="processing-screen-container" onPointerDown={handleScreenPointerDown}>
      <div className="processing-header">
        {/* <div className="processing-step-tag">Bước 04 / 07</div> */}
        <h2 className="processing-title">TRANG TRÍ VÀ THÊM STICKER</h2>
        <div className="countdown-container">
          <div className="countdown-text">
            Thoi gian chinh sua: <span>{remainingCustomizeSeconds} giay</span>
          </div>
          <div className="countdown-bar-bg">
            <div className="countdown-bar-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      <div className="processing-content-wrapper" onPointerDown={handleScreenPointerDown}>
        <div
          ref={canvasBoxRef}
          className="canvas-preview-box"
          style={{ filter: getActiveFilterStyle(), width: displayCanvasWidth, height: displayCanvasHeight, overflow: 'hidden' }}
        >
          <Stage
            width={displayCanvasWidth}
            height={displayCanvasHeight}
            scaleX={canvasScale}
            scaleY={canvasScale}
            ref={stageRef}
            onMouseDown={handleStagePointerDown}
            onTouchStart={handleStagePointerDown}
          >
            <Layer>
              {layoutSlots.map((slot, index) => (
                <PhotoSlot 
                  key={`${index}-${selectedFrame?.id || 'frame'}`} 
                  src={photosList[slot.photoArrayIndex]}
                  x={slot.x} 
                  y={slot.y} 
                  width={slot.width} 
                  height={slot.height} 
                  rotation={slot.rotation}
                  index={index} 
                  radius={0} 
                  adjustment={photoAdjustments[index]}
                  onSelect={setSelectedSlotIndex}
                  onZoom={handlePhotoZoom}
                  onPan={handlePhotoPan}
                />
              ))}
              
              {photosList.length === 0 && <Text text="Đang tải ảnh chụp..." x={canvasWidth / 2 - 70} y={canvasHeight / 2} fill="#000000" fontSize={16} />}
              

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

              {stickers.map((st) => (
                <DraggableSticker key={st.id} sticker={st} isSelected={st.id === selectedStickerId} onUpdate={handleUpdateSticker} onDelete={handleDeleteSticker} onSelect={(e) => { e.cancelBubble = true; setSelectedStickerId(st.id) }} />
              ))}
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
              </div>
            )}

            {activeTab === 'icon' && (
              <div className="processing-sticker-panel">
                <div className="grid-options-container">
                  {availableIcons.map((item) => (
                    <div key={item.id} className="option-item-card" onClick={() => handleAddIcon(item)}>
                      <img src={item.src} alt={item.name} style={{ width: '28px', height: '28px' }} />
                      <span>{item.name}</span>
                    </div>
                  ))}
                </div>
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
        {saveError && <p style={{ color: '#fecaca', margin: 0 }}>{saveError}</p>}
        {isSavingFinal && <p style={{ color: '#d1fae5', margin: 0 }}>Đang tải ảnh ghép và hoàn tất phiên...</p>}
        <Button label={isSavingFinal ? 'Đang lưu ảnh...' : 'Hoàn tất & Tiếp tục'} icon={isSavingFinal ? 'pi pi-spin pi-spinner' : 'pi pi-check'} iconPos="right" size="large" disabled={isSavingFinal || targetShots === 0 || selectedPhotoIndices.length !== targetShots} onClick={handleFinishCustomizing} />
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
