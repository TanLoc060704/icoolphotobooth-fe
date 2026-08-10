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

const PhotoSlot = ({ src, x, y, width, height, index, radius = 0 }) => {
  const [image] = useImage(src || '', 'anonymous')

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

  return <KonvaImage image={image} x={x} y={y} width={width} height={height} crop={getCoverCrop(image, width, height)} cornerRadius={radius} />
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
  const { currentStep, nextStep, capturedPhotos, selectedLayout, setCapturedPhotos, selectedFrameId } = usePhotobooth()
  const photosList = capturedPhotos || []

  // Khung dọc tiêu chuẩn
  const canvasWidth = 218 
  const canvasHeight = 600

  const [activeTab, setActiveTab] = useState('icon')
  const [stickers, setStickers] = useState([])
  const [selectedStickerId, setSelectedStickerId] = useState(null)
  const [activeFilter, setActiveFilter] = useState('none')

  const stageRef = useRef(null)

  // -----------------------------------------------------
  // LOGIC TRUY XUẤT ĐÚNG FRAME VÀ CONFIG CHỐNG CRASH
  // -----------------------------------------------------
  const activeFrameConfig = FRAME_CONFIGS[selectedFrameId] || FRAME_CONFIGS['default'];
  const layoutSlots = buildLayoutSlots(selectedLayout || 'strip-4', canvasWidth, canvasHeight, activeFrameConfig);
  const availableIcons = buildIconLibrary()

  // Load trực tiếp URL ảnh từ Config
  const [frameImg] = useImage(activeFrameConfig.previewUrl || '', 'anonymous')

  if (currentStep !== 4) return null;

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

  const handleStagePointerDown = (e) => {
    if (e.target === e.target.getStage()) setSelectedStickerId(null)
  }

  const handleFinishCustomizing = () => {
    if (stageRef.current) {
      setSelectedStickerId(null)
      setTimeout(() => {
        const dataURL = stageRef.current.toDataURL({ pixelRatio: 2 })
        if (typeof setCapturedPhotos === 'function') setCapturedPhotos([dataURL])
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
        <h2 className="processing-title">TRANG TRÍ VÀ THÊM STICKER</h2>
      </div>

      <div className="processing-content-wrapper">
        <div className="canvas-preview-box" style={{ filter: getActiveFilterStyle(), width: canvasWidth, height: canvasHeight, overflow: 'hidden' }}>
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
                />
              ))}
              
              {photosList.length === 0 && <Text text="Đang tải ảnh chụp..." x={canvasWidth / 2 - 70} y={canvasHeight / 2} fill="#000000" fontSize={16} />}
              
              {stickers.map((st) => (
                <DraggableSticker key={st.id} sticker={st} isSelected={st.id === selectedStickerId} onUpdate={handleUpdateSticker} onSelect={(e) => { e.cancelBubble = true; setSelectedStickerId(st.id) }} />
              ))}
              
              {/* Ảnh Frame tự động ép vào khung mà không cần bấm chọn */}
              {frameImg && <KonvaImage image={frameImg} width={canvasWidth} height={canvasHeight} listening={false} />}
            </Layer>
          </Stage>
        </div>

        <div className="processing-sidebar">
          <div className="sidebar-tabs-header">
            {/* ĐÃ ẨN TAB KHUNG ẢO */}
            <button className={`tab-btn ${activeTab === 'icon' ? 'active' : ''}`} onClick={() => setActiveTab('icon')}>Sticker</button>
            <button className={`tab-btn ${activeTab === 'filter' ? 'active' : ''}`} onClick={() => setActiveTab('filter')}>Bộ Lọc</button>
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
        <Button label="Hoàn tất & Tiếp tục" icon="pi pi-check" iconPos="right" size="large" onClick={handleFinishCustomizing} />
      </div>
    </section>
  )
}