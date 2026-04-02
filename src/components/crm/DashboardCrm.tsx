'use client'

import type { Comercio, Visita } from '@/types/crm'
import { SC, PO, RES_ICON } from '@/types/crm'
import { formatarDataHora } from '@/utils/crm'

interface DashboardCrmProps {
  comercios: Comercio[]
  visitas: Visita[]
}

export default function DashboardCrm({
  comercios,
  visitas,
}: DashboardCrmProps) {
  const totalLeads = comercios.filter((c) => c.tipo_origem === 'lead').length
  const totalPosVenda = comercios.filter((c) => c.tipo_origem !== 'lead').length
  const totalNegociando = comercios.filter((c) => c.status_crm === 'em_negociacao').length
  const totalFechados = comercios.filter((c) => c.status_crm === 'fechado').length
  const totalProblema = comercios.filter((c) => c.status_crm === 'problema').length
  const totalLigar = comercios.filter((c) => c.status_crm === 'ligar').length

  const pipeline = PO.map((status) => ({
    key: status,
    ...SC[status],
    total: comercios.filter((c) => (c.status_crm || 'ativo') === status).length,
  }))

  const proximosContatos = [...comercios]
    .filter((c) => c.data_proximo_contato)
    .sort((a, b) =>
      String(a.data_proximo_contato).localeCompare(String(b.data_proximo_contato))
    )
    .slice(0, 8)

  const ultimasVisitas = [...visitas].slice(0, 8)

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 12,
          marginBottom: 14,
        }}
      >
        {[
          { l: 'Leads', v: totalLeads, c: '#8b5cf6' },
          { l: 'Pós-venda', v: totalPosVenda, c: '#2563eb' },
          { l: 'Negociando', v: totalNegociando, c: '#d97706' },
          { l: 'Fechados', v: totalFechados, c: '#16a34a' },
          { l: 'Problemas', v: totalProblema, c: '#dc2626' },
          { l: 'Ligar', v: totalLigar, c: '#7c3aed' },
        ].map((item) => (
          <div
            key={item.l}
            style={{
              background: '#fff',
              border: '1px solid #e8eaed',
              borderRadius: 12,
              padding: 14,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '.5px',
                marginBottom: 6,
              }}
            >
              {item.l}
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: item.c }}>
              {item.v}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            background: '#fff',
            border: '1px solid #e8eaed',
            borderRadius: 12,
            padding: 14,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: '#111827',
              marginBottom: 12,
            }}
          >
            📊 Funil resumido
          </div>

          {pipeline.map((item) => (
            <div key={item.key} style={{ marginBottom: 10 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#374151' }}>
                  {item.icon} {item.label}
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: item.cor }}>
                  {item.total}
                </div>
              </div>

              <div
                style={{
                  height: 7,
                  background: '#f4f5f7',
                  borderRadius: 999,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${(item.total / Math.max(comercios.length, 1)) * 100}%`,
                    height: '100%',
                    background: item.cor,
                    borderRadius: 999,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid #e8eaed',
            borderRadius: 12,
            padding: 14,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: '#111827',
              marginBottom: 12,
            }}
          >
            📅 Próximos contatos
          </div>

          {proximosContatos.length === 0 ? (
            <div style={{ fontSize: 12, color: '#9ca3af' }}>
              Nenhum próximo contato agendado.
            </div>
          ) : (
            proximosContatos.map((c) => (
              <div
                key={c.id}
                style={{
                  padding: '9px 0',
                  borderBottom: '1px solid #f3f4f6',
                }}
              >
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#111827' }}>
                  {c.nome_fantasia}
                </div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                  {c.data_proximo_contato
                    ? new Date(c.data_proximo_contato).toLocaleDateString('pt-BR')
                    : 'Sem data'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div
        style={{
          background: '#fff',
          border: '1px solid #e8eaed',
          borderRadius: 12,
          padding: 14,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: '#111827',
            marginBottom: 12,
          }}
        >
          🕒 Últimas visitas
        </div>

        {ultimasVisitas.length === 0 ? (
          <div style={{ fontSize: 12, color: '#9ca3af' }}>
            Nenhuma visita registrada ainda.
          </div>
        ) : (
          ultimasVisitas.map((v) => (
            <div
              key={v.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 0',
                borderBottom: '1px solid #f3f4f6',
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  background: '#f4f5f7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  flexShrink: 0,
                }}
              >
                {RES_ICON[v.resultado] || '📋'}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#111827' }}>
                  {v.nome_fantasia}
                </div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                  {formatarDataHora(v.data_visita)}
                </div>
              </div>

              <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280' }}>
                {v.resultado}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
