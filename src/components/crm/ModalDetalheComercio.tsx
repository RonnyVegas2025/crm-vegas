'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Comercio, HistoricoItem } from '@/types/crm'
import {
  CAT,
  PO,
  PRODS_COM,
  PRODS_EMP,
  RES_COR,
  RES_ICON,
  RES_LABEL,
} from '@/types/crm'
import { calcularTotal, formatarDataHora } from '@/utils/crm'
import { formatarDistancia, statusVisual } from '@/utils/geo'

interface NegItem {
  valor: string
  obs: string
}

interface NegEmpItem {
  func: string
  vlr: string
  obs: string
}

interface ModalDetalheComercioProps {
  aberto: boolean
  comercio: Comercio | null
  historico: HistoricoItem[]
  carregandoHistorico: boolean
  onFechar: () => void
  onAlterarStatus: (id: string, status: string) => Promise<void> | void
  onSalvarNegociacao: (payload: {
    comercioId: string
    status_crm: string
    data_proximo_contato: string | null
    produtos_negociando: string[]
    obs_crm: string | null
  }) => Promise<void>
}

export default function ModalDetalheComercio({
  aberto,
  comercio,
  historico,
  carregandoHistorico,
  onFechar,
  onAlterarStatus,
  onSalvarNegociacao,
}: ModalDetalheComercioProps) {
  const [abaDetalhe, setAbaDetalhe] = useState<'negociacao' | 'historico'>(
    'negociacao'
  )
  const [psEmp, setPsEmp] = useState<number[]>([])
  const [psCom, setPsCom] = useState<number[]>([])
  const [negEmp, setNegEmp] = useState<Record<number, NegEmpItem>>({})
  const [negCom, setNegCom] = useState<Record<number, NegItem>>({})
  const [obsGeral, setObsGeral] = useState('')
  const [proximoContato, setProximoContato] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!comercio || !aberto) return

    setObsGeral(comercio.obs_crm || '')
    setProximoContato(comercio.data_proximo_contato || '')
    setPsEmp([])
    setPsCom([])
    setNegEmp({})
    setNegCom({})
    setAbaDetalhe('negociacao')
  }, [comercio, aberto])

  const ci = useMemo(() => {
    if (!comercio) return CAT.outros
    return CAT[comercio.categoria] || CAT.outros
  }, [comercio])

  if (!aberto || !comercio) return null

  function updNegEmp(id: number, campo: 'func' | 'vlr' | 'obs', val: string) {
    setNegEmp((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || { func: '', vlr: '', obs: '' }), [campo]: val },
    }))
  }

  function updNegCom(id: number, campo: 'valor' | 'obs', val: string) {
    setNegCom((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || { valor: '', obs: '' }), [campo]: val },
    }))
  }

  function montarResumoNegociacao(): string {
    const partes: string[] = []

    psEmp.forEach((id) => {
      const pr = PRODS_EMP.find((x) => x.id === id)
      const n = negEmp[id]
      if (!pr) return

      const valor =
        n?.func && n?.vlr
          ? `${n.func} func × R$${n.vlr} = ${calcularTotal(n.func, n.vlr)}/mês`
          : 'selecionado'

      const obs = n?.obs ? ` (${n.obs})` : ''
      partes.push(`${pr.nome}: ${valor}${obs}`)
    })

    psCom.forEach((id) => {
      const pr = PRODS_COM.find((x) => x.id === id)
      const n = negCom[id]
      if (!pr) return

      const valor = n?.valor ? `${n.valor}${pr.tipo === 'taxa' ? '%' : ''}` : '-'
      const obs = n?.obs ? ` (${n.obs})` : ''
      partes.push(`${pr.nome}: ${valor}${obs}`)
    })

    return partes.join(' | ')
  }

  async function handleSalvarNegociacao() {
    if (!comercio) return

    setSalvando(true)

    try {
      const produtosSelecionados = [
        ...psEmp.map((id) => PRODS_EMP.find((p) => p.id === id)?.nome || ''),
        ...psCom.map((id) => PRODS_COM.find((p) => p.id === id)?.nome || ''),
      ].filter(Boolean)

      const resumo = montarResumoNegociacao()
      const observacaoFinal = [obsGeral, resumo ? `Negociação: ${resumo}` : '']
        .filter(Boolean)
        .join(' | ')

      await onSalvarNegociacao({
        comercioId: comercio.id,
        status_crm:
          produtosSelecionados.length > 0
            ? 'em_negociacao'
            : comercio.status_crm || 'ativo',
        data_proximo_contato: proximoContato || null,
        produtos_negociando: produtosSelecionados,
        obs_crm: observacaoFinal || null,
      })

      alert('Negociação salva com sucesso.')
    } catch (error: any) {
      alert(error.message || 'Erro ao salvar negociação.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 1100,
        backdropFilter: 'blur(3px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onFechar()
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '22px 22px 0 0',
          width: '100%',
          maxWidth: 620,
          maxHeight: '96vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            width: 38,
            height: 4,
            background: '#d1d5db',
            borderRadius: 2,
            margin: '11px auto 0',
            flexShrink: 0,
          }}
        />

        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid #e8eaed',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 13,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              background: comercio.tipo_origem === 'lead' ? '#f5f3ff' : ci.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              flexShrink: 0,
            }}
          >
            {comercio.tipo_origem === 'lead' ? '⭐' : ci.icon}
          </div>

          <div style={{ flex: 1 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}
              >
                {comercio.nome_fantasia}
              </div>

              {comercio.tipo_origem === 'lead' && (
                <span
                  style={{
                    background: '#f5f3ff',
                    color: '#8b5cf6',
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 20,
                    border: '1px solid #c4b5fd',
                  }}
                >
                  NOVO LEAD
                </span>
              )}
            </div>

            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
              {comercio.subgrupo} · {comercio.endereco || 'Sem endereço'}
            </div>

            <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
              {comercio.telefone && (
                <span
                  style={{
                    background: '#f4f5f7',
                    color: '#374151',
                    fontSize: 10.5,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 20,
                  }}
                >
                  📞 {comercio.telefone}
                </span>
              )}

              {comercio.distancia != null && (
                <span
                  style={{
                    background: '#f0fdf4',
                    color: '#16a34a',
                    fontSize: 10.5,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 20,
                  }}
                >
                  📍 {formatarDistancia(comercio.distancia)}
                </span>
              )}
            </div>
          </div>

          <span
            onClick={onFechar}
            style={{
              fontSize: 20,
              color: '#9ca3af',
              cursor: 'pointer',
              padding: 4,
              flexShrink: 0,
            }}
          >
            ✕
          </span>
        </div>

        <div
          style={{
            padding: '10px 18px',
            borderBottom: '1px solid #e8eaed',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 5 }}>
            {PO.map((s) => {
              const st = statusVisual(s)
              const at = (comercio.status_crm || 'ativo') === s

              return (
                <button
                  key={s}
                  onClick={() => onAlterarStatus(comercio.id, s)}
                  style={{
                    padding: '6px 4px',
                    borderRadius: 8,
                    border: `2px solid ${at ? st.cor : st.border}`,
                    background: at ? st.bg : '#f4f5f7',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 13 }}>{st.icon}</div>
                  <div
                    style={{
                      fontSize: 8.5,
                      fontWeight: 700,
                      color: at ? st.cor : '#6b7280',
                      marginTop: 2,
                      lineHeight: 1.2,
                    }}
                  >
                    {st.label}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #e8eaed',
            flexShrink: 0,
            background: '#fff',
          }}
        >
          {[
            { k: 'negociacao', l: '📦 Negociação' },
            { k: 'historico', l: `📋 Histórico (${historico.length})` },
          ].map((t) => (
            <div
              key={t.k}
              onClick={() => setAbaDetalhe(t.k as 'negociacao' | 'historico')}
              style={{
                padding: '10px 20px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                color: abaDetalhe === t.k ? '#2563eb' : '#6b7280',
                borderBottom: `2px solid ${
                  abaDetalhe === t.k ? '#2563eb' : 'transparent'
                }`,
                marginBottom: -1,
              }}
            >
              {t.l}
            </div>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {abaDetalhe === 'negociacao' && (
            <div style={{ padding: '14px 18px 28px' }}>
              {comercio.produtos_negociando &&
                comercio.produtos_negociando.length > 0 && (
                  <div
                    style={{
                      background: '#fffbeb',
                      border: '1px solid #fcd34d',
                      borderRadius: 10,
                      padding: '11px 13px',
                      marginBottom: 14,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        color: '#92400e',
                        marginBottom: 5,
                        textTransform: 'uppercase',
                        letterSpacing: '.5px',
                      }}
                    >
                      🔥 Em negociação
                    </div>

                    <div style={{ fontSize: 12.5, color: '#374151' }}>
                      {Array.isArray(comercio.produtos_negociando)
                        ? comercio.produtos_negociando.join(', ')
                        : comercio.produtos_negociando}
                    </div>

                    {comercio.obs_crm && (
                      <div
                        style={{
                          fontSize: 12,
                          color: '#6b7280',
                          marginTop: 5,
                          fontStyle: 'italic',
                        }}
                      >
                        "{comercio.obs_crm}"
                      </div>
                    )}
                  </div>
                )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                  marginBottom: 14,
                }}
              >
                {[
                  { l: 'Endereço', v: comercio.endereco || '—' },
                  { l: 'Contrato', v: comercio.contrato || '—' },
                  { l: 'Segmento', v: comercio.subgrupo || '—' },
                  { l: 'E-mail', v: comercio.email || '—' },
                ].map((f) => (
                  <div key={f.l}>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '.5px',
                        marginBottom: 4,
                      }}
                    >
                      {f.l}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: '#111827',
                        wordBreak: 'break-word',
                      }}
                    >
                      {f.v}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                  marginBottom: 14,
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '.5px',
                      marginBottom: 4,
                      display: 'block',
                    }}
                  >
                    Próximo contato
                  </label>
                  <input
                    type="date"
                    value={proximoContato}
                    onChange={(e) => setProximoContato(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      border: '1.5px solid #e8eaed',
                      borderRadius: 8,
                      fontSize: 13,
                      fontFamily: 'inherit',
                      outline: 'none',
                      background: '#f4f5f7',
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '.5px',
                      marginBottom: 4,
                      display: 'block',
                    }}
                  >
                    Status atual
                  </label>
                  <div
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      border: '1.5px solid #e8eaed',
                      borderRadius: 8,
                      fontSize: 13,
                      background: '#f4f5f7',
                      color: '#374151',
                      fontWeight: 600,
                    }}
                  >
                    {statusVisual(comercio.status_crm || 'ativo').label}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '.5px',
                    marginBottom: 8,
                  }}
                >
                  🏪 Produtos Vegas para este comércio
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 6,
                    marginBottom: 8,
                  }}
                >
                  {PRODS_COM.map((p) => {
                    const sl = psCom.includes(p.id)
                    return (
                      <div
                        key={p.id}
                        onClick={() =>
                          setPsCom((prev) =>
                            prev.includes(p.id)
                              ? prev.filter((x) => x !== p.id)
                              : [...prev, p.id]
                          )
                        }
                        style={{
                          padding: '9px 10px',
                          borderRadius: 9,
                          border: `2px solid ${sl ? '#2563eb' : '#e8eaed'}`,
                          background: sl ? '#eff6ff' : '#f4f5f7',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 7,
                        }}
                      >
                        <span style={{ fontSize: 17 }}>{p.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: 11.5,
                              fontWeight: 700,
                              color: sl ? '#1d4ed8' : '#111827',
                            }}
                          >
                            {p.nome}
                          </div>
                          <div style={{ fontSize: 10, color: '#6b7280' }}>
                            {p.desc}
                          </div>
                        </div>
                        {sl && (
                          <span
                            style={{
                              color: '#2563eb',
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            ✓
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>

                {psCom.length > 0 && (
                  <div
                    style={{
                      background: '#eff6ff',
                      border: '1px solid #dbeafe',
                      borderRadius: 9,
                      padding: '11px 13px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#1d4ed8',
                        marginBottom: 8,
                      }}
                    >
                      💰 Detalhes da negociação
                    </div>

                    {psCom.map((id) => {
                      const p = PRODS_COM.find((x) => x.id === id)
                      if (!p) return null
                      const n = negCom[id] || { valor: '', obs: '' }

                      return (
                        <div
                          key={id}
                          style={{
                            marginBottom: 10,
                            paddingBottom: 10,
                            borderBottom: '1px solid #dbeafe',
                          }}
                        >
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#374151',
                              marginBottom: 6,
                            }}
                          >
                            {p.icon} {p.nome}
                          </div>

                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: 7,
                            }}
                          >
                            <div>
                              <label
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color: '#6b7280',
                                  textTransform: 'uppercase',
                                  letterSpacing: '.5px',
                                  marginBottom: 4,
                                  display: 'block',
                                }}
                              >
                                {p.tipo === 'taxa'
                                  ? 'Taxa adm. negociada (%)'
                                  : 'Valor negociado'}
                              </label>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                <input
                                  type="text"
                                  value={n.valor}
                                  onChange={(e) =>
                                    updNegCom(id, 'valor', e.target.value)
                                  }
                                  placeholder={
                                    p.tipo === 'taxa' ? 'Ex: 3,50' : 'Ex: 200,00'
                                  }
                                  style={{
                                    padding: '7px 10px',
                                    border: '1.5px solid #e8eaed',
                                    borderRadius: 7,
                                    fontSize: 12.5,
                                    fontFamily: 'inherit',
                                    outline: 'none',
                                    background: '#f4f5f7',
                                    width: '100%',
                                  }}
                                />
                                {p.tipo === 'taxa' && (
                                  <span
                                    style={{
                                      fontSize: 14,
                                      fontWeight: 700,
                                      color: '#2563eb',
                                      flexShrink: 0,
                                    }}
                                  >
                                    %
                                  </span>
                                )}
                              </div>
                            </div>

                            <div>
                              <label
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color: '#6b7280',
                                  textTransform: 'uppercase',
                                  letterSpacing: '.5px',
                                  marginBottom: 4,
                                  display: 'block',
                                }}
                              >
                                Observação
                              </label>
                              <input
                                type="text"
                                value={n.obs}
                                onChange={(e) =>
                                  updNegCom(id, 'obs', e.target.value)
                                }
                                placeholder="Ex: mensal, com carência..."
                                style={{
                                  padding: '7px 10px',
                                  border: '1.5px solid #e8eaed',
                                  borderRadius: 7,
                                  fontSize: 12.5,
                                  fontFamily: 'inherit',
                                  outline: 'none',
                                  background: '#f4f5f7',
                                  width: '100%',
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 14 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '.5px',
                    marginBottom: 8,
                  }}
                >
                  👥 Produtos para funcionários
                </div>

                {['Benefícios', 'Convênio', 'Agregado'].map((cat) => (
                  <div key={cat} style={{ marginBottom: 10 }}>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: '#9ca3af',
                        textTransform: 'uppercase',
                        letterSpacing: '.5px',
                        marginBottom: 5,
                      }}
                    >
                      {cat}
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 6,
                      }}
                    >
                      {PRODS_EMP.filter((p) => p.cat === cat).map((p) => {
                        const sl = psEmp.includes(p.id)
                        return (
                          <div
                            key={p.id}
                            onClick={() =>
                              setPsEmp((prev) =>
                                prev.includes(p.id)
                                  ? prev.filter((x) => x !== p.id)
                                  : [...prev, p.id]
                              )
                            }
                            style={{
                              padding: '9px 10px',
                              borderRadius: 9,
                              border: `2px solid ${sl ? '#16a34a' : '#e8eaed'}`,
                              background: sl ? '#f0fdf4' : '#f4f5f7',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 7,
                            }}
                          >
                            <span style={{ fontSize: 16 }}>{p.icon}</span>
                            <div style={{ flex: 1 }}>
                              <div
                                style={{
                                  fontSize: 11.5,
                                  fontWeight: 700,
                                  color: sl ? '#15803d' : '#111827',
                                }}
                              >
                                {p.nome}
                              </div>
                              <div style={{ fontSize: 10, color: '#6b7280' }}>
                                {p.desc}
                              </div>
                            </div>
                            {sl && (
                              <span
                                style={{
                                  color: '#16a34a',
                                  fontSize: 12,
                                  fontWeight: 700,
                                }}
                              >
                                ✓
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {PRODS_EMP.filter(
                      (p) => p.cat === cat && psEmp.includes(p.id)
                    ).map((p) => {
                      const n = negEmp[p.id] || { func: '', vlr: '', obs: '' }
                      return (
                        <div
                          key={p.id}
                          style={{
                            background: '#f0fdf4',
                            border: '1px solid #86efac',
                            borderRadius: 8,
                            padding: '10px 12px',
                            marginTop: 5,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#15803d',
                              marginBottom: 7,
                            }}
                          >
                            {p.icon} {p.nome} — negociação
                          </div>

                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr 1fr',
                              gap: 7,
                              marginBottom: 7,
                            }}
                          >
                            <div>
                              <label
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color: '#6b7280',
                                  textTransform: 'uppercase',
                                  letterSpacing: '.5px',
                                  marginBottom: 4,
                                  display: 'block',
                                }}
                              >
                                Nº funcionários
                              </label>
                              <input
                                type="number"
                                value={n.func}
                                onChange={(e) =>
                                  updNegEmp(p.id, 'func', e.target.value)
                                }
                                placeholder="0"
                                style={{
                                  padding: '7px 10px',
                                  border: '1.5px solid #e8eaed',
                                  borderRadius: 7,
                                  fontSize: 12.5,
                                  fontFamily: 'inherit',
                                  outline: 'none',
                                  background: '#f4f5f7',
                                  width: '100%',
                                }}
                              />
                            </div>

                            <div>
                              <label
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color: '#6b7280',
                                  textTransform: 'uppercase',
                                  letterSpacing: '.5px',
                                  marginBottom: 4,
                                  display: 'block',
                                }}
                              >
                                {p.tipo === 'agregado'
                                  ? 'Valor/licença'
                                  : 'Valor/pessoa'}
                              </label>
                              <input
                                type="text"
                                value={n.vlr}
                                onChange={(e) =>
                                  updNegEmp(p.id, 'vlr', e.target.value)
                                }
                                placeholder="R$ 0,00"
                                style={{
                                  padding: '7px 10px',
                                  border: '1.5px solid #e8eaed',
                                  borderRadius: 7,
                                  fontSize: 12.5,
                                  fontFamily: 'inherit',
                                  outline: 'none',
                                  background: '#f4f5f7',
                                  width: '100%',
                                }}
                              />
                            </div>

                            <div>
                              <label
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color: '#6b7280',
                                  textTransform: 'uppercase',
                                  letterSpacing: '.5px',
                                  marginBottom: 4,
                                  display: 'block',
                                }}
                              >
                                Total/mês
                              </label>
                              <div
                                style={{
                                  padding: '7px 10px',
                                  border: '1.5px solid #e8eaed',
                                  borderRadius: 7,
                                  fontSize: 12.5,
                                  fontFamily: 'inherit',
                                  outline: 'none',
                                  width: '100%',
                                  background: '#dcfce7',
                                  color: '#15803d',
                                  fontWeight: 700,
                                  display: 'flex',
                                  alignItems: 'center',
                                }}
                              >
                                {n.func && n.vlr
                                  ? calcularTotal(n.func, n.vlr)
                                  : '—'}
                              </div>
                            </div>
                          </div>

                          <div>
                            <label
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                color: '#6b7280',
                                textTransform: 'uppercase',
                                letterSpacing: '.5px',
                                marginBottom: 4,
                                display: 'block',
                              }}
                            >
                              Observação
                            </label>
                            <input
                              type="text"
                              value={n.obs}
                              onChange={(e) =>
                                updNegEmp(p.id, 'obs', e.target.value)
                              }
                              placeholder="Ex: começa em abril, incluir dependentes..."
                              style={{
                                padding: '7px 10px',
                                border: '1.5px solid #e8eaed',
                                borderRadius: 7,
                                fontSize: 12.5,
                                fontFamily: 'inherit',
                                outline: 'none',
                                background: '#f4f5f7',
                                width: '100%',
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 14 }}>
                <label
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '.5px',
                    marginBottom: 4,
                    display: 'block',
                  }}
                >
                  Observação geral
                </label>
                <textarea
                  rows={3}
                  value={obsGeral}
                  onChange={(e) => setObsGeral(e.target.value)}
                  placeholder="Ex: gerente demonstrou interesse, retorno em 7 dias..."
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: '1.5px solid #e8eaed',
                    borderRadius: 8,
                    fontSize: 13,
                    fontFamily: 'inherit',
                    outline: 'none',
                    background: '#f4f5f7',
                    resize: 'none',
                  }}
                />
              </div>

              <button
                onClick={handleSalvarNegociacao}
                disabled={salvando}
                style={{
                  width: '100%',
                  padding: 14,
                  background: salvando ? '#93c5fd' : '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: salvando ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {salvando ? 'Salvando negociação...' : '💾 Salvar negociação'}
              </button>
            </div>
          )}

          {abaDetalhe === 'historico' && (
            <div style={{ padding: '14px 18px 28px' }}>
              {carregandoHistorico ? (
                <div style={{ padding: 30, textAlign: 'center', color: '#9ca3af' }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
                  <div>Carregando histórico...</div>
                </div>
              ) : historico.length === 0 ? (
                <div style={{ padding: 30, textAlign: 'center', color: '#9ca3af' }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    Nenhuma interação registrada
                  </div>
                  <div style={{ fontSize: 12 }}>
                    As visitas e negociações aparecerão aqui conforme forem sendo salvas.
                  </div>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      fontSize: 12,
                      color: '#6b7280',
                      marginBottom: 12,
                      fontWeight: 500,
                    }}
                  >
                    {historico.length} interação
                    {historico.length !== 1 ? 'ões' : ''} registrada
                    {historico.length !== 1 ? 's' : ''}
                  </div>

                  {historico.map((h, i) => (
                    <div
                      key={h.id}
                      style={{
                        background: '#fff',
                        border: '1px solid #e8eaed',
                        borderRadius: 12,
                        padding: '13px 15px',
                        marginBottom: 10,
                        borderLeft: `3px solid ${
                          RES_COR[h.resultado]?.replace('f', 'c') || '#e8eaed'
                        }`,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          marginBottom: h.observacao ? 8 : 0,
                        }}
                      >
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 9,
                            background: RES_COR[h.resultado] || '#f4f5f7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 16,
                            flexShrink: 0,
                          }}
                        >
                          {RES_ICON[h.resultado] || '📋'}
                        </div>

                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: 13,
                              color: '#111827',
                            }}
                          >
                            {RES_LABEL[h.resultado] || h.resultado}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: '#9ca3af',
                              marginTop: 1,
                            }}
                          >
                            {formatarDataHora(h.data_visita)}
                          </div>
                        </div>

                        {i === 0 && (
                          <span
                            style={{
                              background: '#eff6ff',
                              color: '#2563eb',
                              fontSize: 9.5,
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: 10,
                            }}
                          >
                            Mais recente
                          </span>
                        )}
                      </div>

                      {h.observacao && (
                        <div
                          style={{
                            background: '#f4f5f7',
                            borderRadius: 8,
                            padding: '9px 12px',
                            fontSize: 12,
                            color: '#374151',
                            lineHeight: 1.5,
                          }}
                        >
                          {h.observacao}
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
