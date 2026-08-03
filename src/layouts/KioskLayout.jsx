export default function KioskLayout({ children }) {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'radial-gradient(circle at top, rgba(255, 255, 255, 0.18), transparent 40%), linear-gradient(135deg, #10131a 0%, #161b28 50%, #0c1017 100%)',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          padding: 'clamp(16px, 3vw, 32px)',
          display: 'flex',
          alignItems: 'stretch',
          justifyContent: 'stretch',
        }}
      >
        {children}
      </div>
    </div>
  )
}
