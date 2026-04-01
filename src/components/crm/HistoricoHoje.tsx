import type { Visita } from '@/types/crm'
import { RES_COR, RES_ICON } from '@/types/crm'

interface HistoricoHojeProps {
  visitas: Visita[]
}

export default function HistoricoHoje({ visitas }: HistoricoHojeProps) {
  if (visitas.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
        <div style={{ fontWeight: 600 }}>Nenhuma visita hoje</div>
      </div>
    )
  }

  return (
    <div>
      {visitas.map((v) => (
        <div
          key={v.id}
          style={{
            background: '#fff',
            border: '1px solid #e8eaed',
            borderRadius: 12,
            padding: 14,
            marginBottom: 9,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                background: RES_COR[v.resultado] || '#f4f5f7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 17,
              }}
            >
              {RES_ICON[v.resultado] || '📋'}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{v.nome_fantasia}</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>{v.hora}</div>
            </div>

            {v.latitude && (
              <div style={{ fontSize: 10, color: '#16a34a', fontWeight: 600 }}>
                📍 GPS
              </div>
            )}
          </div>

          {v.observacao && (
            <div
              style={{
                background: '#f4f5f7',
                borderRadius: 7,
                padding: '8px 11px',
                marginTop: 8,
                fontSize: 11.5,
                color: '#374151',
              }}
            >
              {v.observacao}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
