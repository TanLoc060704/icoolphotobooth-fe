import React, { useState, useRef, useEffect } from 'react'
import { Button } from 'primereact/button'
import { Stage, Layer, Group, Image as KonvaImage, Transformer, Text, Rect } from 'react-konva'
import useImage from 'use-image'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  Heart,
  Star,
  Sparkles,
  Crown,
  Camera,
  PartyPopper,
  Flame,
  Flower2,
  Gift,
  Smile,
  Rainbow,
  SunMedium,
  Wand2,
  Music,
  Rocket,
  Glasses,
  Coffee,
  Leaf,
  Balloon,
  Diamond,
  Gem,
  Zap,
  Palette,
  Film,
  Image as ImageIcon,
} from 'lucide-react'
import {
  FaHeart,
  FaRegHeart,
  FaStar,
  FaRegStar,
  FaCamera,
  FaCameraRetro,
  FaCrown,
  FaGift,
  FaMusic,
  FaFire,
  FaLeaf,
  FaSun,
  FaRocket,
  FaSmileBeam,
  FaGlassCheers,
  FaGem,
  FaBolt,
  FaPalette,
  FaFilm,
  FaImage,
  FaPaperPlane,
  FaThumbsUp,
  FaKissWinkHeart,
  FaRainbow,
  FaFeather,
  FaPaw,
  FaTrophy,
  FaBirthdayCake,
  FaCoffee,
  FaCat,
  FaDog,
} from 'react-icons/fa'
import {
  MdOutlineCelebration,
  MdOutlineCake,
  MdOutlineCameraAlt,
  MdOutlineFilterVintage,
  MdOutlineLocalCafe,
  MdOutlinePets,
  MdOutlineWavingHand,
  MdOutlinePhotoCamera,
  MdOutlineAutoAwesome,
} from 'react-icons/md'
import {
  BsEmojiSunglasses,
  BsEmojiSmile,
  BsBalloonFill,
  BsPatchCheckFill,
  BsCameraFill,
  BsFlower1,
  BsLightningChargeFill,
  BsMusicNoteBeamed,
  BsSunFill,
  BsGem,
  BsGiftFill,
} from 'react-icons/bs'
import {
  TbMoodSmile,
  TbMoodSmileBeam,
  TbMoodCrazyHappy,
  TbBalloon,
  TbHeartHandshake,
  TbStars,
  TbSparkles,
  TbPhoto,
  TbCameraHeart,
  TbCandy,
  TbFlower,
} from 'react-icons/tb'
import {
  HiOutlineSparkles,
  HiOutlinePhoto,
  HiOutlineFaceSmile,
  HiOutlineCake,
} from 'react-icons/hi2'
import { usePhotobooth } from '../../store/PhotoboothContext.jsx'
import './ProcessingScreen.css'

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
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
      width: Math.max(24, (sticker.width || 72) * scaleX),
      height: Math.max(24, (sticker.height || 72) * scaleY),
      scaleX: 1,
      scaleY: 1,
    })

    node.scaleX(1)
    node.scaleY(1)
  }

  if (sticker.kind === 'icon') {
    return (
      <>
        <Group
          ref={shapeRef}
          x={sticker.x}
          y={sticker.y}
          rotation={sticker.rotation || 0}
          draggable
          dragDistance={8}
          onMouseDown={onSelect}
          onTouchStart={onSelect}
          onDragStart={onSelect}
          onDragEnd={(e) => {
            onUpdate?.(sticker.id, { x: e.target.x(), y: e.target.y() })
          }}
          onTransformEnd={handleTransformEnd}
        >
          {iconImage && (
            <>
              <Rect
                x={0}
                y={0}
                width={sticker.width || 72}
                height={sticker.height || 72}
                fill="rgba(255, 255, 255, 0.001)"
              />
              <KonvaImage
                image={iconImage}
                x={0}
                y={0}
                width={sticker.width || 72}
                height={sticker.height || 72}
                listening={false}
              />
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
        text={sticker.text}
        x={sticker.x}
        y={sticker.y}
        fontSize={sticker.fontSize || 50}
        rotation={sticker.rotation || 0}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        ref={shapeRef}
        onDragEnd={(e) => {
          onUpdate?.(sticker.id, { x: e.target.x(), y: e.target.y() })
        }}
        onTransformEnd={handleTransformEnd}
      />
      {isSelected && <Transformer ref={trRef} />}
    </>
  )
}

const createIconDataUri = (IconComponent, color) => {
  const svg = renderToStaticMarkup(
    <IconComponent size={96} strokeWidth={2} color={color} />,
  )

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

const svgToDataUri = (svg) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`

const createFrameSvg = ({ title, accent = '#00ffcc', secondary = '#ffffff', glow = 'rgba(0, 255, 204, 0.22)' }) => svgToDataUri(`
  <svg xmlns="http://www.w3.org/2000/svg" width="900" height="1350" viewBox="0 0 900 1350">
    <defs>
      <linearGradient id="frameGradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${accent}" stop-opacity="0.18" />
        <stop offset="100%" stop-color="${secondary}" stop-opacity="0.02" />
      </linearGradient>
      <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="8" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <rect x="40" y="40" width="820" height="1270" rx="56" fill="none" stroke="${accent}" stroke-width="12" />
    <rect x="64" y="64" width="772" height="1222" rx="44" fill="none" stroke="${glow}" stroke-width="18" filter="url(#softGlow)" />
    <rect x="95" y="95" width="710" height="1160" rx="30" fill="url(#frameGradient)" stroke="${accent}" stroke-opacity="0.5" stroke-width="4" stroke-dasharray="18 12" />
    <circle cx="125" cy="125" r="18" fill="${accent}" />
    <circle cx="775" cy="125" r="18" fill="${accent}" />
    <circle cx="125" cy="1225" r="18" fill="${accent}" />
    <circle cx="775" cy="1225" r="18" fill="${accent}" />
    <text x="450" y="129" fill="${accent}" font-size="34" font-family="Arial, Helvetica, sans-serif" text-anchor="middle" font-weight="700" letter-spacing="4">${title}</text>
    <text x="450" y="1260" fill="${secondary}" fill-opacity="0.55" font-size="22" font-family="Arial, Helvetica, sans-serif" text-anchor="middle" letter-spacing="3">PHOTO BOOTH</text>
  </svg>
`)

const createFilmFrameSvg = ({ title, accent = '#facc15', secondary = '#ffffff' }) => svgToDataUri(`
  <svg xmlns="http://www.w3.org/2000/svg" width="900" height="1350" viewBox="0 0 900 1350">
    <rect x="48" y="40" width="804" height="1270" rx="32" fill="none" stroke="${accent}" stroke-width="16" />
    <rect x="82" y="76" width="736" height="1198" rx="22" fill="none" stroke="${secondary}" stroke-opacity="0.35" stroke-width="3" />
    <g fill="${accent}">
      ${Array.from({ length: 14 }, (_, index) => `<rect x="${index < 7 ? 66 : 822}" y="${90 + (index % 7) * 170}" width="12" height="92" rx="6" />`).join('')}
      ${Array.from({ length: 10 }, (_, index) => `<rect x="${110 + (index % 5) * 146}" y="${64 + Math.floor(index / 5) * 1220}" width="86" height="12" rx="6" />`).join('')}
    </g>
    <text x="450" y="126" fill="${accent}" font-size="30" font-family="Arial, Helvetica, sans-serif" text-anchor="middle" font-weight="700" letter-spacing="6">${title}</text>
    <text x="450" y="1260" fill="${secondary}" fill-opacity="0.65" font-size="20" font-family="Arial, Helvetica, sans-serif" text-anchor="middle" letter-spacing="3">35MM STYLE</text>
  </svg>
`)

const createRetroFrameSvg = ({ title, accent = '#fb7185', secondary = '#f8fafc' }) => svgToDataUri(`
  <svg xmlns="http://www.w3.org/2000/svg" width="900" height="1350" viewBox="0 0 900 1350">
    <defs>
      <linearGradient id="retroGradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${accent}" stop-opacity="0.24" />
        <stop offset="100%" stop-color="${secondary}" stop-opacity="0.03" />
      </linearGradient>
    </defs>
    <rect x="36" y="36" width="828" height="1278" rx="58" fill="none" stroke="${accent}" stroke-width="10" />
    <rect x="78" y="78" width="744" height="1194" rx="44" fill="url(#retroGradient)" stroke="${secondary}" stroke-opacity="0.45" stroke-width="4" />
    <path d="M105 150 C220 80, 680 80, 795 150" fill="none" stroke="${accent}" stroke-width="10" stroke-linecap="round" />
    <path d="M105 1200 C220 1270, 680 1270, 795 1200" fill="none" stroke="${accent}" stroke-width="10" stroke-linecap="round" />
    <circle cx="165" cy="165" r="16" fill="${accent}" />
    <circle cx="735" cy="165" r="16" fill="${accent}" />
    <circle cx="165" cy="1185" r="16" fill="${accent}" />
    <circle cx="735" cy="1185" r="16" fill="${accent}" />
    <text x="450" y="129" fill="${accent}" font-size="32" font-family="Arial, Helvetica, sans-serif" text-anchor="middle" font-weight="700" letter-spacing="4">${title}</text>
  </svg>
`)

const createNeonFrameSvg = ({ title, accent = '#22d3ee', secondary = '#f8fafc' }) => svgToDataUri(`
  <svg xmlns="http://www.w3.org/2000/svg" width="900" height="1350" viewBox="0 0 900 1350">
    <defs>
      <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="10" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <rect x="46" y="46" width="808" height="1258" rx="52" fill="none" stroke="${accent}" stroke-width="8" filter="url(#neonGlow)" />
    <rect x="86" y="86" width="728" height="1178" rx="40" fill="none" stroke="${secondary}" stroke-opacity="0.25" stroke-width="3" />
    <circle cx="120" cy="120" r="10" fill="${accent}" />
    <circle cx="780" cy="120" r="10" fill="${accent}" />
    <circle cx="120" cy="1230" r="10" fill="${accent}" />
    <circle cx="780" cy="1230" r="10" fill="${accent}" />
    <text x="450" y="130" fill="${accent}" font-size="28" font-family="Arial, Helvetica, sans-serif" text-anchor="middle" font-weight="700" letter-spacing="6">${title}</text>
    <text x="450" y="1258" fill="${secondary}" fill-opacity="0.6" font-size="18" font-family="Arial, Helvetica, sans-serif" text-anchor="middle" letter-spacing="5">NEON EDITION</text>
  </svg>
`)

const buildIconLibrary = () => {
  const iconSets = [
    { id: 'heart', name: 'Trái tim', icon: FaHeart, color: '#fb7185' },
    { id: 'heart-outline', name: 'Tim viền', icon: FaRegHeart, color: '#ef4444' },
    { id: 'star', name: 'Ngôi sao', icon: FaStar, color: '#facc15' },
    { id: 'star-outline', name: 'Sao viền', icon: FaRegStar, color: '#f59e0b' },
    { id: 'sparkles', name: 'Lấp lánh', icon: HiOutlineSparkles, color: '#00ffcc' },
    { id: 'crown', name: 'Vương miện', icon: FaCrown, color: '#f59e0b' },
    { id: 'camera', name: 'Máy ảnh', icon: FaCamera, color: '#38bdf8' },
    { id: 'camera-retro', name: 'Camera retro', icon: FaCameraRetro, color: '#0ea5e9' },
    { id: 'camera-md', name: 'Máy ảnh mới', icon: MdOutlineCameraAlt, color: '#60a5fa' },
    { id: 'photo-md', name: 'Ảnh chụp', icon: MdOutlinePhotoCamera, color: '#818cf8' },
    { id: 'party', name: 'Ăn mừng', icon: MdOutlineCelebration, color: '#c084fc' },
    { id: 'cake', name: 'Bánh kem', icon: FaBirthdayCake, color: '#fb7185' },
    { id: 'cake-md', name: 'Cake line', icon: MdOutlineCake, color: '#f472b6' },
    { id: 'flame', name: 'Ngọn lửa', icon: FaFire, color: '#f97316' },
    { id: 'flower', name: 'Hoa', icon: BsFlower1, color: '#fb7185' },
    { id: 'flower-tb', name: 'Bông hoa', icon: TbFlower, color: '#f472b6' },
    { id: 'gift', name: 'Quà tặng', icon: FaGift, color: '#22c55e' },
    { id: 'gift-bs', name: 'Gift box', icon: BsGiftFill, color: '#10b981' },
    { id: 'smile', name: 'Vui vẻ', icon: FaSmileBeam, color: '#fde047' },
    { id: 'smile-bs', name: 'Smiley', icon: BsEmojiSmile, color: '#facc15' },
    { id: 'smile-tb', name: 'Mood', icon: TbMoodSmileBeam, color: '#fbbf24' },
    { id: 'mood', name: 'Rạng rỡ', icon: TbMoodSmile, color: '#fde68a' },
    { id: 'crazy', name: 'Lầy vui', icon: TbMoodCrazyHappy, color: '#f59e0b' },
    { id: 'rainbow', name: 'Cầu vồng', icon: FaRainbow, color: '#60a5fa' },
    { id: 'sun', name: 'Mặt trời', icon: FaSun, color: '#f59e0b' },
    { id: 'sun-bs', name: 'Sunny', icon: BsSunFill, color: '#facc15' },
    { id: 'wand', name: 'Phép màu', icon: MdOutlineAutoAwesome, color: '#a78bfa' },
    { id: 'sparkle-tb', name: 'Spark', icon: TbSparkles, color: '#c084fc' },
    { id: 'music', name: 'Âm nhạc', icon: FaMusic, color: '#34d399' },
    { id: 'music-bs', name: 'Note', icon: BsMusicNoteBeamed, color: '#22c55e' },
    { id: 'rocket', name: 'Phi thuyền', icon: FaRocket, color: '#22d3ee' },
    { id: 'glasses', name: 'Kính', icon: BsEmojiSunglasses, color: '#94a3b8' },
    { id: 'coffee', name: 'Cà phê', icon: FaCoffee, color: '#d97706' },
    { id: 'coffee-md', name: 'Cafe', icon: MdOutlineLocalCafe, color: '#b45309' },
    { id: 'leaf', name: 'Lá', icon: FaLeaf, color: '#22c55e' },
    { id: 'leaf-2', name: 'Xanh', icon: MdOutlineFilterVintage, color: '#84cc16' },
    { id: 'balloon', name: 'Bóng bay', icon: BsBalloonFill, color: '#fb7185' },
    { id: 'balloon-tb', name: 'Balloon', icon: TbBalloon, color: '#f472b6' },
    { id: 'diamond', name: 'Kim cương', icon: FaGem, color: '#38bdf8' },
    { id: 'diamond-bs', name: 'Gem', icon: BsGem, color: '#0ea5e9' },
    { id: 'zap', name: 'Tia sét', icon: FaBolt, color: '#facc15' },
    { id: 'zap-bs', name: 'Flash', icon: BsLightningChargeFill, color: '#fde047' },
    { id: 'palette', name: 'Màu vẽ', icon: FaPalette, color: '#f472b6' },
    { id: 'film', name: 'Cuộn phim', icon: FaFilm, color: '#e2e8f0' },
    { id: 'image', name: 'Ảnh', icon: FaImage, color: '#0ea5e9' },
    { id: 'photo-tb', name: 'Photo', icon: TbPhoto, color: '#38bdf8' },
    { id: 'thumb', name: 'Like', icon: FaThumbsUp, color: '#22c55e' },
    { id: 'plane', name: 'Paper plane', icon: FaPaperPlane, color: '#60a5fa' },
    { id: 'kiss', name: 'Tình yêu', icon: FaKissWinkHeart, color: '#ef4444' },
    { id: 'hand', name: 'Chào', icon: MdOutlineWavingHand, color: '#f59e0b' },
    { id: 'handshake', name: 'Kết nối', icon: TbHeartHandshake, color: '#fb7185' },
    { id: 'stars', name: 'Sao đôi', icon: TbStars, color: '#facc15' },
    { id: 'camera-heart', name: 'Camera tim', icon: TbCameraHeart, color: '#f472b6' },
    { id: 'photo-hi', name: 'Ảnh đẹp', icon: HiOutlinePhoto, color: '#38bdf8' },
    { id: 'smile-hi', name: 'Cười', icon: HiOutlineFaceSmile, color: '#fde047' },
    { id: 'cake-hi', name: 'Cake', icon: HiOutlineCake, color: '#fb7185' },
    { id: 'paw', name: 'Dấu chân', icon: FaPaw, color: '#94a3b8' },
    { id: 'pet-md', name: 'Thú cưng', icon: MdOutlinePets, color: '#a855f7' },
    { id: 'cat', name: 'Mèo', icon: FaCat, color: '#f59e0b' },
    { id: 'dog', name: 'Chó', icon: FaDog, color: '#22c55e' },
    { id: 'trophy', name: 'Cúp', icon: FaTrophy, color: '#fbbf24' },
    { id: 'feather', name: 'Lông vũ', icon: FaFeather, color: '#60a5fa' },
    { id: 'candy', name: 'Kẹo', icon: TbCandy, color: '#f472b6' },
  ]

  return iconSets.map((item) => ({
    ...item,
    src: createIconDataUri(item.icon, item.color),
  }))
}

const getCoverCrop = (image, width, height) => {
  const imageRatio = image.width / image.height
  const targetRatio = width / height

  let cropWidth = image.width
  let cropHeight = image.height
  let cropX = 0
  let cropY = 0

  if (imageRatio > targetRatio) {
    cropWidth = image.height * targetRatio
    cropX = (image.width - cropWidth) / 2
  } else {
    cropHeight = image.width / targetRatio
    cropY = (image.height - cropHeight) / 2
  }

  return { x: cropX, y: cropY, width: cropWidth, height: cropHeight }
}

const PhotoSlot = ({ src, x, y, width, height, index }) => {
  const [image] = useImage(src || '', 'anonymous')

  if (!src) {
    return (
      <>
        <Rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill="rgba(255, 255, 255, 0.06)"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth={2}
          cornerRadius={14}
        />
        <Text
          text={`#${index + 1}`}
          x={x}
          y={y + height / 2 - 10}
          width={width}
          align="center"
          fill="rgba(255, 255, 255, 0.55)"
          fontSize={16}
          fontStyle="bold"
        />
      </>
    )
  }

  if (!image) {
    return (
      <Rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="rgba(255, 255, 255, 0.08)"
        stroke="rgba(255, 255, 255, 0.12)"
        strokeWidth={2}
        cornerRadius={14}
      />
    )
  }

  return (
    <KonvaImage
      image={image}
      x={x}
      y={y}
      width={width}
      height={height}
      crop={getCoverCrop(image, width, height)}
      cornerRadius={14}
    />
  )
}

const buildLayoutSlots = (layoutType, canvasWidth, canvasHeight) => {
  const padding = 16
  const gap = 10

  switch (layoutType) {
    case 'strip-3':
    case 'strip-4': {
      const count = layoutType === 'strip-4' ? 4 : 3
      const slotHeight = (canvasHeight - padding * 2 - gap * (count - 1)) / count
      const slotWidth = canvasWidth - padding * 2

      return Array.from({ length: count }, (_, index) => ({
        x: padding,
        y: padding + index * (slotHeight + gap),
        width: slotWidth,
        height: slotHeight,
      }))
    }

    case 'grid-2x2': {
      const cols = 2
      const rows = 2
      const slotWidth = (canvasWidth - padding * 2 - gap * (cols - 1)) / cols
      const slotHeight = (canvasHeight - padding * 2 - gap * (rows - 1)) / rows

      return Array.from({ length: cols * rows }, (_, index) => {
        const col = index % cols
        const row = Math.floor(index / cols)

        return {
          x: padding + col * (slotWidth + gap),
          y: padding + row * (slotHeight + gap),
          width: slotWidth,
          height: slotHeight,
        }
      })
    }

    case 'grid-6': {
      const cols = 2
      const rows = 3
      const slotWidth = (canvasWidth - padding * 2 - gap * (cols - 1)) / cols
      const slotHeight = (canvasHeight - padding * 2 - gap * (rows - 1)) / rows

      return Array.from({ length: cols * rows }, (_, index) => {
        const col = index % cols
        const row = Math.floor(index / cols)

        return {
          x: padding + col * (slotWidth + gap),
          y: padding + row * (slotHeight + gap),
          width: slotWidth,
          height: slotHeight,
        }
      })
    }

    case 'grid-9': {
      const cols = 3
      const rows = 3
      const slotWidth = (canvasWidth - padding * 2 - gap * (cols - 1)) / cols
      const slotHeight = (canvasHeight - padding * 2 - gap * (rows - 1)) / rows

      return Array.from({ length: cols * rows }, (_, index) => {
        const col = index % cols
        const row = Math.floor(index / cols)

        return {
          x: padding + col * (slotWidth + gap),
          y: padding + row * (slotHeight + gap),
          width: slotWidth,
          height: slotHeight,
        }
      })
    }

    case 'asymmetric-3': {
      const contentWidth = canvasWidth - padding * 2
      const contentHeight = canvasHeight - padding * 2
      const leftWidth = Math.floor(contentWidth * 0.58)
      const rightWidth = contentWidth - leftWidth - gap
      const rightHeight = (contentHeight - gap) / 2

      return [
        { x: padding, y: padding, width: leftWidth, height: contentHeight },
        { x: padding + leftWidth + gap, y: padding, width: rightWidth, height: rightHeight },
        { x: padding + leftWidth + gap, y: padding + rightHeight + gap, width: rightWidth, height: rightHeight },
      ]
    }

    case 'polaroid':
    case 'single-4x6':
    default:
      return [
        {
          x: padding,
          y: padding,
          width: canvasWidth - padding * 2,
          height: canvasHeight - padding * 2,
        },
      ]
  }
}

export default function ProcessingScreen() {
  const { currentStep, nextStep, capturedPhotos, selectedLayout, setCapturedPhotos } = usePhotobooth()

  // Lấy chính xác mảng ảnh từ bước chụp truyền sang (Không dùng ảnh mẫu ngoài)
  const photosList = capturedPhotos || []

  // Tự động nhận diện khung dọc nếu là layout dải hoặc polaroid
  const isTallLayout = selectedLayout && (selectedLayout.includes('strip') || selectedLayout.includes('polaroid') || selectedLayout.includes('asymmetric'))
  const canvasWidth = selectedLayout && selectedLayout.includes('strip') ? 320 : 450
  const canvasHeight = isTallLayout ? 560 : 450

  const [activeTab, setActiveTab] = useState('icon')
  const [stickers, setStickers] = useState([])
  const [selectedStickerId, setSelectedStickerId] = useState(null)
  const [activeFilter, setActiveFilter] = useState('none')
  const [activeFrame, setActiveFrame] = useState(null)

  const stageRef = useRef(null)
  const layoutSlots = buildLayoutSlots(selectedLayout || 'strip-4', canvasWidth, canvasHeight)
  const availableIcons = buildIconLibrary()

  // Load ảnh nền thật và khung Frame
  const [frameImg] = useImage(activeFrame || '', 'anonymous')

  if (currentStep !== 4) return null

  // Bộ lọc màu
  const availableFilters = [
    { id: 'none', name: 'Ảnh Gốc', style: 'none' },
    { id: 'grayscale', name: 'Đen Trắng', style: 'grayscale(100%)' },
    { id: 'sepia', name: 'Vintage', style: 'sepia(80%)' },
    { id: 'bright', name: 'Tươi Sáng', style: 'brightness(1.2) contrast(1.1)' },
    { id: 'warm', name: 'Ấm Áp', style: 'saturate(1.15) sepia(18%) contrast(1.05) hue-rotate(-10deg)' },
    { id: 'cool', name: 'Mát Lạnh', style: 'saturate(1.15) brightness(1.05) hue-rotate(165deg)' },
    { id: 'vivid', name: 'Rực Rỡ', style: 'saturate(1.6) contrast(1.15)' },
    { id: 'soft', name: 'Mềm Mại', style: 'brightness(1.08) contrast(0.95) saturate(0.95)' },
    { id: 'film', name: 'Phim Cũ', style: 'sepia(35%) contrast(1.1) brightness(0.96) saturate(0.85)' },
    { id: 'mono', name: 'Mono Đậm', style: 'grayscale(100%) contrast(1.25) brightness(0.92)' },
    { id: 'cyber', name: 'Cyber', style: 'saturate(1.6) hue-rotate(185deg) contrast(1.15) brightness(1.1)' },
    { id: 'pastel', name: 'Pastel', style: 'saturate(0.9) brightness(1.15) contrast(0.9)' },
    { id: 'dream', name: 'Dreamy', style: 'blur(0.3px) brightness(1.12) saturate(0.92)' },
    { id: 'noir', name: 'Noir', style: 'grayscale(100%) contrast(1.4) brightness(0.85)' },
    { id: 'gold', name: 'Golden', style: 'sepia(55%) saturate(1.6) brightness(1.05)' },
    { id: 'ice', name: 'Ice', style: 'hue-rotate(180deg) saturate(1.05) brightness(1.1)' },
    { id: 'berry', name: 'Berry', style: 'hue-rotate(-18deg) saturate(1.3) contrast(1.08)' },
    { id: 'forest', name: 'Forest', style: 'hue-rotate(70deg) saturate(1.2) contrast(1.05)' },
    { id: 'sunset', name: 'Sunset', style: 'sepia(32%) saturate(1.45) hue-rotate(-12deg) brightness(1.02)' },
    { id: 'mono2', name: 'Mono Soft', style: 'grayscale(100%) contrast(1.08) brightness(1.04)' },
    { id: 'vapor', name: 'Vapor', style: 'saturate(1.55) hue-rotate(155deg) brightness(1.08)' },
    { id: 'peach', name: 'Peach', style: 'sepia(22%) saturate(1.3) hue-rotate(-22deg) brightness(1.08)' },
    { id: 'lilac', name: 'Lilac', style: 'hue-rotate(230deg) saturate(1.18) brightness(1.07)' },
    { id: 'emerald', name: 'Emerald', style: 'hue-rotate(85deg) saturate(1.25) contrast(1.04)' },
    { id: 'sunbeam', name: 'Sunbeam', style: 'sepia(16%) saturate(1.35) brightness(1.12)' },
    { id: 'noir2', name: 'Noir Plus', style: 'grayscale(100%) contrast(1.55) brightness(0.8)' },
    { id: 'velvet', name: 'Velvet', style: 'saturate(1.25) contrast(1.2) brightness(0.96)' },
    { id: 'pastel2', name: 'Pastel 2', style: 'saturate(0.85) brightness(1.16) contrast(0.88)' },
    { id: 'warm2', name: 'Warm 2', style: 'sepia(48%) saturate(1.2) contrast(1.08) hue-rotate(-8deg)' },
    { id: 'cool2', name: 'Cool 2', style: 'hue-rotate(170deg) saturate(1.1) brightness(1.06)' },
    { id: 'cinema', name: 'Cinema', style: 'contrast(1.22) brightness(0.98) saturate(0.92)' }
  ]

  // Kho Frame photo booth tự sinh bằng SVG
  const availableFrames = [
    { id: 'f0', name: 'Không khung', url: null },
    { id: 'f1', name: 'Neon Mint', url: createFrameSvg({ title: 'NEON MINT', accent: '#00ffcc', secondary: '#f8fafc', glow: 'rgba(0, 255, 204, 0.24)' }) },
    { id: 'f2', name: 'Gold Classic', url: createFrameSvg({ title: 'GOLD CLASSIC', accent: '#fbbf24', secondary: '#fff7ed', glow: 'rgba(251, 191, 36, 0.22)' }) },
    { id: 'f3', name: 'Rose Studio', url: createFrameSvg({ title: 'ROSE STUDIO', accent: '#fb7185', secondary: '#fff1f2', glow: 'rgba(251, 113, 133, 0.2)' }) },
    { id: 'f4', name: 'Ocean Glow', url: createFrameSvg({ title: 'OCEAN GLOW', accent: '#38bdf8', secondary: '#eff6ff', glow: 'rgba(56, 189, 248, 0.22)' }) },
    { id: 'f5', name: 'Midnight', url: createFrameSvg({ title: 'MIDNIGHT', accent: '#818cf8', secondary: '#e0e7ff', glow: 'rgba(129, 140, 248, 0.2)' }) },
    { id: 'f6', name: 'Film Strip', url: createFilmFrameSvg({ title: 'FILM STRIP', accent: '#facc15', secondary: '#fafaf9' }) },
    { id: 'f7', name: 'Retro Pop', url: createRetroFrameSvg({ title: 'RETRO POP', accent: '#fb7185', secondary: '#f8fafc' }) },
    { id: 'f8', name: 'Clean White', url: createFrameSvg({ title: 'CLEAN WHITE', accent: '#e2e8f0', secondary: '#ffffff', glow: 'rgba(226, 232, 240, 0.28)' }) },
    { id: 'f9', name: 'Cyber Neon', url: createNeonFrameSvg({ title: 'CYBER NEON', accent: '#22d3ee', secondary: '#f8fafc' }) },
    { id: 'f10', name: 'Lavender', url: createFrameSvg({ title: 'LAVENDER', accent: '#c084fc', secondary: '#faf5ff', glow: 'rgba(192, 132, 252, 0.22)' }) },
    { id: 'f11', name: 'Sunset', url: createFrameSvg({ title: 'SUNSET', accent: '#fb923c', secondary: '#fff7ed', glow: 'rgba(251, 146, 60, 0.2)' }) },
    { id: 'f12', name: 'Mint Soft', url: createFrameSvg({ title: 'MINT SOFT', accent: '#34d399', secondary: '#ecfdf5', glow: 'rgba(52, 211, 153, 0.22)' }) },
    { id: 'f13', name: 'Berry Pop', url: createRetroFrameSvg({ title: 'BERRY POP', accent: '#f472b6', secondary: '#fff1f2' }) },
    { id: 'f14', name: 'Ice Clean', url: createNeonFrameSvg({ title: 'ICE CLEAN', accent: '#60a5fa', secondary: '#eff6ff' }) },
    { id: 'f15', name: 'Studio Black', url: createFrameSvg({ title: 'STUDIO BLACK', accent: '#94a3b8', secondary: '#e2e8f0', glow: 'rgba(148, 163, 184, 0.16)' }) },
    { id: 'f16', name: 'Candy', url: createFrameSvg({ title: 'CANDY', accent: '#f472b6', secondary: '#fff1f2', glow: 'rgba(244, 114, 182, 0.22)' }) },
    { id: 'f17', name: 'Electric', url: createNeonFrameSvg({ title: 'ELECTRIC', accent: '#facc15', secondary: '#ffffff' }) },
    { id: 'f18', name: 'Minimal White', url: createFrameSvg({ title: 'MINIMAL WHITE', accent: '#cbd5e1', secondary: '#ffffff', glow: 'rgba(203, 213, 225, 0.26)' }) },
    { id: 'f19', name: 'Retro Warm', url: createRetroFrameSvg({ title: 'RETRO WARM', accent: '#fb923c', secondary: '#fff7ed' }) },
    { id: 'f20', name: 'Party Night', url: createFilmFrameSvg({ title: 'PARTY NIGHT', accent: '#c084fc', secondary: '#faf5ff' }) },
    { id: 'f21', name: 'Crystal', url: createFrameSvg({ title: 'CRYSTAL', accent: '#67e8f9', secondary: '#ecfeff', glow: 'rgba(103, 232, 249, 0.2)' }) },
    { id: 'f22', name: 'Cherry', url: createRetroFrameSvg({ title: 'CHERRY', accent: '#f43f5e', secondary: '#fff1f2' }) },
    { id: 'f23', name: 'Aqua', url: createNeonFrameSvg({ title: 'AQUA', accent: '#22d3ee', secondary: '#e0f2fe' }) },
    { id: 'f24', name: 'Midnight Blue', url: createFrameSvg({ title: 'MIDNIGHT BLUE', accent: '#1d4ed8', secondary: '#dbeafe', glow: 'rgba(29, 78, 216, 0.2)' }) },
    { id: 'f25', name: 'Rose Gold', url: createFrameSvg({ title: 'ROSE GOLD', accent: '#fb7185', secondary: '#fff1f2', glow: 'rgba(251, 113, 133, 0.18)' }) },
    { id: 'f26', name: 'Honey', url: createFilmFrameSvg({ title: 'HONEY', accent: '#f59e0b', secondary: '#fffbeb' }) },
    { id: 'f27', name: 'Galaxy', url: createNeonFrameSvg({ title: 'GALAXY', accent: '#8b5cf6', secondary: '#f8fafc' }) },
    { id: 'f28', name: 'Mint Fresh', url: createFrameSvg({ title: 'MINT FRESH', accent: '#34d399', secondary: '#ecfdf5', glow: 'rgba(52, 211, 153, 0.22)' }) },
    { id: 'f29', name: 'Black Label', url: createFrameSvg({ title: 'BLACK LABEL', accent: '#64748b', secondary: '#e2e8f0', glow: 'rgba(100, 116, 139, 0.18)' }) },
    { id: 'f30', name: 'Candy Pop', url: createRetroFrameSvg({ title: 'CANDY POP', accent: '#ec4899', secondary: '#fff1f2' }) }
  ]

  const handleAddIcon = (icon) => {
    const newSticker = {
      id: Date.now().toString(),
      kind: 'icon',
      src: icon.src,
      name: icon.name,
      x: canvasWidth / 2 - 36,
      y: canvasHeight / 2 - 36,
      width: 72,
      height: 72,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    }
    setStickers([...stickers, newSticker])
    setSelectedStickerId(newSticker.id)
  }

  const handleUpdateSticker = (stickerId, updates) => {
    setStickers((prev) =>
      prev.map((sticker) => (sticker.id === stickerId ? { ...sticker, ...updates } : sticker)),
    )
  }

  const handleStagePointerDown = (e) => {
    if (e.target === e.target.getStage()) {
      setSelectedStickerId(null)
    }
  }

  const handleFinishCustomizing = () => {
    if (stageRef.current) {
      setSelectedStickerId(null)
      setTimeout(() => {
        const dataURL = stageRef.current.toDataURL({ pixelRatio: 2 })
        if (typeof setCapturedPhotos === 'function') {
          setCapturedPhotos([dataURL])
        }
        nextStep()
      }, 100)
    } else {
      nextStep()
    }
  }

  const getActiveFilterStyle = () => {
    const found = availableFilters.find(f => f.id === activeFilter)
    return found ? found.style : 'none'
  }

  return (
    <section className="processing-screen-container">
      <div className="processing-header">
        <div className="processing-step-tag">Bước 04 / 07</div>
        <h2 className="processing-title">TRANG TRÍ VÀ THÊM FRAME</h2>
      </div>

      <div className="processing-content-wrapper">
        <div 
          className="canvas-preview-box"
          style={{ filter: getActiveFilterStyle(), width: canvasWidth, height: canvasHeight }}
        >
          <Stage width={canvasWidth} height={canvasHeight} ref={stageRef} onMouseDown={handleStagePointerDown} onTouchStart={handleStagePointerDown}>
            <Layer>
              <Rect x={0} y={0} width={canvasWidth} height={canvasHeight} fill="#000000" />

              {/* Hiển thị tất cả ảnh đã chọn theo layout */}
              {layoutSlots.map((slot, index) => (
                <PhotoSlot
                  key={`${index}-${selectedLayout || 'layout'}`}
                  src={photosList[index]}
                  x={slot.x}
                  y={slot.y}
                  width={slot.width}
                  height={slot.height}
                  index={index}
                />
              ))}

              {photosList.length === 0 && (
                <Text text="Đang tải ảnh chụp..." x={canvasWidth / 2 - 70} y={canvasHeight / 2} fill="#ffffff" fontSize={16} />
              )}

              {/* Các Sticker Emoji kéo thả */}
              {stickers.map((st) => (
                <DraggableSticker
                  key={st.id}
                  sticker={st}
                  isSelected={st.id === selectedStickerId}
                  onUpdate={handleUpdateSticker}
                  onSelect={(e) => {
                    e.cancelBubble = true
                    setSelectedStickerId(st.id)
                  }}
                />
              ))}

              {/* Khung Frame đè lên trên */}
              {activeFrame && frameImg && (
                <KonvaImage image={frameImg} width={canvasWidth} height={canvasHeight} listening={false} opacity={0.9} />
              )}
            </Layer>
          </Stage>
        </div>

        {/* Bảng điều khiển Sidebar 3 Tab */}
        <div className="processing-sidebar">
          <div className="sidebar-tabs-header">
            <button className={`tab-btn ${activeTab === 'icon' ? 'active' : ''}`} onClick={() => setActiveTab('icon')}>Icon</button>
            <button className={`tab-btn ${activeTab === 'filter' ? 'active' : ''}`} onClick={() => setActiveTab('filter')}>Filter</button>
            <button className={`tab-btn ${activeTab === 'frame' ? 'active' : ''}`} onClick={() => setActiveTab('frame')}>Frame</button>
          </div>

          <div className="sidebar-tab-content">
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
                  <div 
                    key={fl.id} 
                    className={`option-item-card ${activeFilter === fl.id ? 'selected' : ''}`} 
                    style={{ height: '55px', flexDirection: 'row', justifyContent: 'flex-start', padding: '0 10px', gap: '8px' }}
                    onClick={() => setActiveFilter(fl.id)}
                  >
                    <span style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>{fl.name}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'frame' && (
              <div className="grid-options-container" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                {availableFrames.map((fr) => (
                  <div 
                    key={fr.id} 
                    className={`option-item-card ${activeFrame === fr.url ? 'selected' : ''}`}
                    style={{ height: '70px' }}
                    onClick={() => setActiveFrame(fr.url)}
                  >
                    <i className="pi pi-clone" style={{ fontSize: '1.2rem', color: '#00ffcc' }}></i>
                    <span>{fr.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="processing-footer">
        <Button label="Hoàn tất & Tiếp tục" icon="pi pi-check" iconPos="right" size="large" onClick={handleFinishCustomizing} />
      </div>
    </section>
  )
}