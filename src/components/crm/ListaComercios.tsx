import type { Comercio, Visita } from '@/types/crm'
import { CAT } from '@/types/crm'
import { formatarDistancia, pinCor, statusVisual } from '@/utils/geo'

interface ListaComerciosProps {
  comercios: Comercio[]
  visitasHoje: Visita[]
  onAlterarStatus: (id: string, status: string) => void
  onAbrirDetalhe: (comercio: Comercio) => void
}

export default function ListaComercios({
  comercios,
  visitasHoje,
  onAlterarStatus,
  onAbrirDetalhe,
}: ListaComerciosProps) {
  if (comercios.length === 0) {
    return (
      <div style={{ padding: 30, textAlign: 'center', color: '#9ca3af' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
        <div>Nenhum comércio encontrado</div>
      </div>
    )
  }

  return (
    <div>
      {comercios.map((c) => {
        const ci = CAT[c.categoria] || CAT.outros
        const st = statusVisual(c.status_crm || 'ativo')
        const isLead = c.tipo_origem === 'lead'
        const vt = visitasHoje.find((v) => v.nome_fantasia === c.nome_fantasia)

        return (
          <div
            key={c.id}
            onClick={() => onAbrirDetalhe(c)}
            style={{
              border: '1px solid #e8eaed',
              borderRadius: 12,
              padding: 14,
              marginBottom: 10,
              background: '#fff',
              borderLeft: `4px solid ${pinCor(c)}`,
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: isLead ? '#f5f3ff' : ci.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                {isLead ? '⭐' : ci.icon}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    flexWrap: 'wrap',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      color: '#111827',
                    }}
                  >
                    {c.nome_fantasia}
                  </div>

                  {isLead && (
                    <span
                      style={{
                        background: '#f5f3ff',
                        color: '#8b5cf6',
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: 10,
                        border: '1px solid #c4b5fd',
                      }}
                    >
                      LEAD
                    </span>
                  )}
                </div>

                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                  {c.endereco || 'Endereço não informado'}
                </div>

                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                  👤 {c.vendedor_responsavel || 'Sem responsável'}
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: 6,
                    marginTop: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      background: st.bg,
                      color: st.cor,
                      border: `1px solid ${st.border}`,
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 20,
                    }}
                  >
                    {st.icon} {st.label}
                  </span>

                  {vt && (
                    <span
                      style={{
                        background: '#f0fdf4',
                        color: '#16a34a',
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 20,
                      }}
                    >
                      ✓ Visitado hoje
                    </span>
                  )}

                  {c.distancia != null && (
                    <span
                      style={{
                        background: '#eff6ff',
                        color: '#2563eb',
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 20,
                      }}
                    >
                      📍 {formatarDistancia(c.distancia)}
                    </span>
                  )}
                </div>

                {c.produtos_negociando && c.produtos_negociando.length > 0 && (
                  <div
                    style={{
                      fontSize: 11,
                      color: '#d97706',
                      marginTop: 8,
                      fontWeight: 600,
                    }}
                  >
                    🔥{' '}
                    {Array.isArray(c.produtos_negociando)
                      ? c.produtos_negociando.join(', ')
                      : c.produtos_negociando}
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    marginTop: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onAlterarStatus(c.id, 'em_negociacao')
                    }}
                    style={{
                      background: '#fff7ed',
                      color: '#ea580c',
                      border: '1px solid #fdba74',
                      borderRadius: 8,
                      padding: '7px 10px',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    🔥 Negociar
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onAlterarStatus(c.id, 'fechado')
                    }}
                    style={{
                      background: '#f0fdf4',
                      color: '#16a34a',
                      border: '1px solid #86efac',
                      borderRadius: 8,
                      padding: '7px 10px',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    🏆 Fechar
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onAlterarStatus(c.id, 'ligar')
                    }}
                    style={{
                      background: '#f5f3ff',
                      color: '#7c3aed',
                      border: '1px solid #c4b5fd',
                      borderRadius: 8,
                      padding: '7px 10px',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    📞 Ligar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
