import type { Comercio } from '@/types/crm'
import { CAT } from '@/types/crm'
import { formatarDistancia, pinCor, statusVisual } from '@/utils/geo'

interface MapaCrmProps {
  comercios: Comercio[]
  latitudeAtual: number | null
  longitudeAtual: number | null
}

export default function MapaCrm({
  comercios,
  latitudeAtual,
  longitudeAtual,
}: MapaCrmProps) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e8eaed',
        borderRadius: 12,
        padding: 16,
      }}
    >
      <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 8 }}>
        🗺 Mapa comercial
      </div>

      <div style={{ color: '#6b7280', marginBottom: 14, fontSize: 13 }}>
        Nesta etapa, o mapa fica em formato de visão de campo com localização atual e
        carteira geográfica resumida.
      </div>

      <div
        style={{
          background: '#f8fafc',
          border: '1px dashed #cbd5e1',
          borderRadius: 12,
          padding: 16,
          marginBottom: 14,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
          Sua localização atual
        </div>

        <div style={{ fontSize: 12, color: '#475569' }}>
          {latitudeAtual && longitudeAtual
            ? `${latitudeAtual.toFixed(5)}, ${longitudeAtual.toFixed(5)}`
            : 'Localização ainda não capturada'}
        </div>
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 10 }}>
        Pontos da carteira
      </div>

      {comercios.length === 0 ? (
        <div style={{ color: '#9ca3af', fontSize: 13 }}>Nenhum comércio para exibir.</div>
      ) : (
        <div>
          {comercios.map((c) => {
            const ci = CAT[c.categoria] || CAT.outros
            const st = statusVisual(c.status_crm || 'ativo')
            const isLead = c.tipo_origem === 'lead'

            return (
              <div
                key={c.id}
                style={{
                  border: '1px solid #e8eaed',
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: isLead ? '#f5f3ff' : ci.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    flexShrink: 0,
                    border: `2px solid ${pinCor(c)}`,
                  }}
                >
                  {isLead ? '⭐' : ci.icon}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827' }}>
                    {c.nome_fantasia}
                  </div>

                  <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 2 }}>
                    {c.endereco || 'Endereço não informado'}
                  </div>

                  <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
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

                  {(c.latitude || c.longitude) && (
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
                      GPS: {c.latitude ?? '-'}, {c.longitude ?? '-'}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
