interface TopbarCrmProps {
  email?: string
  onRegistrarVisita: () => void
  onLogout: () => void
}

export default function TopbarCrm({
  email,
  onRegistrarVisita,
  onLogout,
}: TopbarCrmProps) {
  return (
    <div
      style={{
        background: '#fff',
        borderBottom: '1px solid #e8eaed',
        height: 54,
        display: 'flex',
        alignItems: 'center',
        padding: '0 18px',
        gap: 12,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          background: '#16181d',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          fontWeight: 800,
          color: '#f59e0b',
          flexShrink: 0,
        }}
      >
        V
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>
          Vegas CRM · Campo
        </div>
        <div style={{ fontSize: 10.5, color: '#9ca3af' }}>{email}</div>
      </div>

      <button
        onClick={onRegistrarVisita}
        style={{
          background: '#16a34a',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '8px 14px',
          fontSize: 12.5,
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        📍 Registrar visita
      </button>

      <button
        onClick={onLogout}
        style={{
          background: 'transparent',
          border: '1px solid #e8eaed',
          borderRadius: 7,
          padding: '7px 12px',
          fontSize: 12,
          color: '#6b7280',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        Sair
      </button>
    </div>
  )
}
