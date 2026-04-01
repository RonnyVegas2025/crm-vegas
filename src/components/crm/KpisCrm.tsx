interface KpisCrmProps {
  totalPv: number
  totalLeads: number
  visitasHoje: number
  negociando: number
  fechados: number
}

export default function KpisCrm({
  totalPv,
  totalLeads,
  visitasHoje,
  negociando,
  fechados,
}: KpisCrmProps) {
  const items = [
    { l: 'Pós-venda', v: totalPv, c: '#2563eb' },
    { l: 'Leads', v: totalLeads, c: '#8b5cf6' },
    { l: 'Hoje', v: visitasHoje, c: '#16a34a' },
    { l: 'Negociando', v: negociando, c: '#d97706' },
    { l: 'Fechados', v: fechados, c: '#16a34a' },
  ]

  return (
    <div
      style={{
        background: '#fff',
        borderBottom: '1px solid #e8eaed',
        display: 'flex',
        gap: 10,
        padding: '10px 18px',
        flexShrink: 0,
        overflowX: 'auto',
      }}
    >
      {items.map((k) => (
        <div
          key={k.l}
          style={{
            background: '#f4f5f7',
            border: '1px solid #e8eaed',
            borderRadius: 10,
            padding: '9px 14px',
            minWidth: 90,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: 9.5,
              fontWeight: 600,
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '.5px',
              marginBottom: 3,
            }}
          >
            {k.l}
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: k.c, lineHeight: 1 }}>
            {k.v}
          </div>
        </div>
      ))}
    </div>
  )
}
