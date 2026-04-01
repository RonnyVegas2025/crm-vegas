import type { Comercio } from '@/types/crm'
import { PO, SC } from '@/types/crm'

interface PipelineCrmProps {
  comercios: Comercio[]
  onSelecionarStatus?: (status: string) => void
}

export default function PipelineCrm({
  comercios,
  onSelecionarStatus,
}: PipelineCrmProps) {
  const pip = PO.map((s) => ({
    key: s,
    ...SC[s],
    total: comercios.filter((c) => (c.status_crm || 'ativo') === s).length,
  }))

  return (
    <div>
      {pip.map((s) => (
        <div
          key={s.key}
          onClick={() => onSelecionarStatus?.(s.key)}
          style={{
            background: '#fff',
            border: `1px solid ${s.border}`,
            borderRadius: 12,
            padding: '12px 14px',
            marginBottom: 10,
            cursor: onSelecionarStatus ? 'pointer' : 'default',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 11,
                background: s.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                flexShrink: 0,
              }}
            >
              {s.icon}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827' }}>
                {s.label}
              </div>

              <div
                style={{
                  height: 5,
                  background: '#f4f5f7',
                  borderRadius: 3,
                  overflow: 'hidden',
                  marginTop: 5,
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${(s.total / Math.max(comercios.length, 1)) * 100}%`,
                    background: s.cor,
                    borderRadius: 3,
                  }}
                />
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: s.cor,
                  lineHeight: 1,
                }}
              >
                {s.total}
              </div>
              <div style={{ fontSize: 10, color: '#9ca3af' }}>
                {Math.round((s.total / Math.max(comercios.length, 1)) * 100)}%
              </div>
            </div>
          </div>

          {s.total > 0 && s.total <= 3 && (
            <div
              style={{
                marginTop: 8,
                paddingTop: 8,
                borderTop: `1px solid ${s.border}`,
              }}
            >
              {comercios
                .filter((c) => (c.status_crm || 'ativo') === s.key)
                .map((c) => (
                  <div
                    key={c.id}
                    style={{
                      fontSize: 11.5,
                      color: '#374151',
                      padding: '2px 0',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>{c.nome_fantasia}</span>
                    <span style={{ color: '#9ca3af' }}>
                      {c.tipo_origem === 'lead' ? 'Lead' : ''}
                    </span>
                  </div>
                ))}
            </div>
          )}

          {s.total > 3 && (
            <div style={{ marginTop: 6, fontSize: 11, color: s.cor, fontWeight: 600 }}>
              Toque para filtrar →
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
