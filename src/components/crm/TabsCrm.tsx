type AbaCrm = 'lista' | 'pipeline' | 'mapa' | 'historico'

interface TabsCrmProps {
  abaAtual: AbaCrm
  totalLista: number
  totalHoje: number
  onChange: (aba: AbaCrm) => void
}

export default function TabsCrm({
  abaAtual,
  totalLista,
  totalHoje,
  onChange,
}: TabsCrmProps) {
  const tabs: { k: AbaCrm; l: string }[] = [
    { k: 'lista', l: `📋 Lista (${totalLista})` },
    { k: 'pipeline', l: '📊 Pipeline' },
    { k: 'mapa', l: '🗺 Mapa' },
    { k: 'historico', l: `✅ Hoje (${totalHoje})` },
  ]

  return (
    <div
      style={{
        background: '#fff',
        borderBottom: '1px solid #e8eaed',
        display: 'flex',
        padding: '0 18px',
        flexShrink: 0,
        overflowX: 'auto',
      }}
    >
      {tabs.map((t) => (
        <div
          key={t.k}
          onClick={() => onChange(t.k)}
          style={{
            padding: '10px 16px',
            fontSize: 12.5,
            fontWeight: 600,
            cursor: 'pointer',
            color: abaAtual === t.k ? '#2563eb' : '#6b7280',
            borderBottom: `2px solid ${abaAtual === t.k ? '#2563eb' : 'transparent'}`,
            marginBottom: -1,
            whiteSpace: 'nowrap',
          }}
        >
          {t.l}
        </div>
      ))}
    </div>
  )
}
