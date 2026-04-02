'use client'

interface FiltrosCrmProps {
  busca: string
  onBuscaChange: (valor: string) => void
  origemFiltro: 'todos' | 'posvendas' | 'leads'
  onOrigemChange: (valor: 'todos' | 'posvendas' | 'leads') => void
  statusFiltro: string
  onStatusChange: (valor: string) => void
  ordenarPorProximidade: boolean
  onOrdenarPorProximidadeChange: (valor: boolean) => void
  temLocalizacao: boolean
}

const STATUS_OPCOES = [
  { k: '', l: 'Todos' },
  { k: 'ativo', l: '🔵 Ativo' },
  { k: 'novo_lead', l: '⭐ Lead' },
  { k: 'em_negociacao', l: '🔥 Neg.' },
  { k: 'visita_realizada', l: '✅ Visita' },
  { k: 'ligar', l: '📞 Ligar' },
  { k: 'retornar', l: '📅 Retornar' },
  { k: 'proposta_enviada', l: '📄 Proposta' },
  { k: 'problema', l: '⚠️ Problema' },
  { k: 'sem_contato', l: '❄️ Sem contato' },
  { k: 'fechado', l: '🏆 Fechado' },
]

export default function FiltrosCrm({
  busca,
  onBuscaChange,
  origemFiltro,
  onOrigemChange,
  statusFiltro,
  onStatusChange,
  ordenarPorProximidade,
  onOrdenarPorProximidadeChange,
  temLocalizacao,
}: FiltrosCrmProps) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e8eaed',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
      }}
    >
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { k: 'todos', l: 'Todos' },
          { k: 'posvendas', l: '🏪 Pós-venda' },
          { k: 'leads', l: '⭐ Leads' },
        ].map((f) => (
          <button
            key={f.k}
            onClick={() => onOrigemChange(f.k as 'todos' | 'posvendas' | 'leads')}
            style={{
              padding: '6px 12px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              border: `1.5px solid ${origemFiltro === f.k ? '#2563eb' : '#e8eaed'}`,
              background: origemFiltro === f.k ? '#2563eb' : '#f4f5f7',
              color: origemFiltro === f.k ? '#fff' : '#6b7280',
              fontFamily: 'inherit',
            }}
          >
            {f.l}
          </button>
        ))}

        {temLocalizacao && (
          <button
            onClick={() => onOrdenarPorProximidadeChange(!ordenarPorProximidade)}
            style={{
              padding: '6px 12px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              border: `1.5px solid ${ordenarPorProximidade ? '#16a34a' : '#e8eaed'}`,
              background: ordenarPorProximidade ? '#16a34a' : '#f4f5f7',
              color: ordenarPorProximidade ? '#fff' : '#6b7280',
              fontFamily: 'inherit',
              marginLeft: 'auto',
            }}
          >
            📍 Próximos primeiro
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="🔍 Buscar comércio por nome..."
        value={busca}
        onChange={(e) => onBuscaChange(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 12px',
          border: '1.5px solid #e8eaed',
          borderRadius: 8,
          fontSize: 13,
          fontFamily: 'inherit',
          outline: 'none',
          background: '#f4f5f7',
          marginBottom: 10,
        }}
      />

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {STATUS_OPCOES.map((f) => (
          <button
            key={f.k}
            onClick={() => onStatusChange(f.k)}
            style={{
              padding: '5px 9px',
              borderRadius: 20,
              fontSize: 10.5,
              fontWeight: 600,
              cursor: 'pointer',
              border: `1.5px solid ${statusFiltro === f.k ? '#2563eb' : '#e8eaed'}`,
              background: statusFiltro === f.k ? '#2563eb' : '#f4f5f7',
              color: statusFiltro === f.k ? '#fff' : '#6b7280',
              fontFamily: 'inherit',
            }}
          >
            {f.l}
          </button>
        ))}
      </div>
    </div>
  )
}
