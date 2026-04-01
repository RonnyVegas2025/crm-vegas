'use client'

import { useMemo, useState } from 'react'
import type { Comercio } from '@/types/crm'

interface ModalRegistrarVisitaProps {
  aberto: boolean
  comercios: Comercio[]
  onFechar: () => void
  onSalvar: (payload: {
    comercioId: string
    nome_fantasia: string
    tipo_estabelecimento: string
    resultado: string
    observacao: string
  }) => Promise<void>
  onNovoLead: (nomeInicial: string) => void
}

const RESULTADOS = [
  { k: 'contato', l: '✅ Contato feito' },
  { k: 'ausente', l: '😔 Ausente' },
  { k: 'problema', l: '⚠️ Problema' },
  { k: 'expansao', l: '🚀 Expansão' },
]

export default function ModalRegistrarVisita({
  aberto,
  comercios,
  onFechar,
  onSalvar,
  onNovoLead,
}: ModalRegistrarVisitaProps) {
  const [busca, setBusca] = useState('')
  const [comercioId, setComercioId] = useState('')
  const [resultado, setResultado] = useState('')
  const [observacao, setObservacao] = useState('')
  const [salvando, setSalvando] = useState(false)

  const comercioSelecionado = useMemo(
    () => comercios.find((c) => c.id === comercioId) || null,
    [comercios, comercioId]
  )

  const resultadosBusca = useMemo(() => {
    if (busca.trim().length < 2) return []
    return comercios
      .filter((c) =>
        c.nome_fantasia.toLowerCase().includes(busca.toLowerCase())
      )
      .slice(0, 8)
  }, [busca, comercios])

  if (!aberto) return null

  async function handleSalvar() {
    if (!comercioSelecionado) {
      alert('Selecione um comércio.')
      return
    }

    if (!resultado) {
      alert('Selecione o resultado da visita.')
      return
    }

    setSalvando(true)

    try {
      await onSalvar({
        comercioId: comercioSelecionado.id,
        nome_fantasia: comercioSelecionado.nome_fantasia,
        tipo_estabelecimento: comercioSelecionado.categoria,
        resultado,
        observacao,
      })

      setBusca('')
      setComercioId('')
      setResultado('')
      setObservacao('')
      onFechar()
    } catch (error: any) {
      alert(error.message || 'Erro ao salvar visita.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onFechar()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(3px)',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '22px 22px 0 0',
          width: '100%',
          maxWidth: 560,
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            width: 38,
            height: 4,
            background: '#d1d5db',
            borderRadius: 2,
            margin: '11px auto 0',
          }}
        />

        <div
          style={{
            padding: '14px 18px 0',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 11,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>📍 Registrar Visita</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
              Selecione o comércio visitado e registre o resultado
            </div>
          </div>

          <span
            onClick={onFechar}
            style={{ fontSize: 20, color: '#9ca3af', cursor: 'pointer', padding: 4 }}
          >
            ✕
          </span>
        </div>

        <div style={{ padding: '12px 18px 28px' }}>
          {!comercioSelecionado && (
            <div style={{ marginBottom: 12 }}>
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
                Comércio visitado *
              </label>

              <input
                type="text"
                placeholder="Digite o nome para buscar..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
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

              {busca.length >= 2 && (
                <div
                  style={{
                    background: '#fff',
                    border: '1px solid #e8eaed',
                    borderRadius: 9,
                    marginTop: 4,
                    maxHeight: 220,
                    overflowY: 'auto',
                    boxShadow: '0 4px 14px rgba(0,0,0,.09)',
                  }}
                >
                  {resultadosBusca.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setComercioId(c.id)
                        setBusca(c.nome_fantasia)
                      }}
                      style={{
                        padding: '10px 13px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f4f5f7',
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{c.nome_fantasia}</div>
                      <div style={{ fontSize: 10.5, color: '#9ca3af' }}>
                        {c.endereco || c.subgrupo || 'Sem endereço'}
                      </div>
                    </div>
                  ))}

                  {resultadosBusca.length === 0 && (
                    <div style={{ padding: '14px', textAlign: 'center' }}>
                      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 9 }}>
                        "{busca}" não encontrado
                      </div>

                      <button
                        onClick={() => onNovoLead(busca)}
                        style={{
                          background: '#8b5cf6',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 9,
                          padding: '10px 18px',
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          width: '100%',
                        }}
                      >
                        ⭐ Cadastrar como Novo Lead
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {comercioSelecionado && (
            <div
              style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: 10,
                padding: '10px 12px',
                marginBottom: 12,
              }}
            >
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#1d4ed8', marginBottom: 4 }}>
                COMÉRCIO SELECIONADO
              </div>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827' }}>
                {comercioSelecionado.nome_fantasia}
              </div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                {comercioSelecionado.endereco || 'Endereço não informado'}
              </div>

              <button
                onClick={() => {
                  setComercioId('')
                  setBusca('')
                }}
                style={{
                  marginTop: 8,
                  background: '#fff',
                  border: '1px solid #dbeafe',
                  borderRadius: 8,
                  padding: '6px 10px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: '#2563eb',
                }}
              >
                Trocar comércio
              </button>
            </div>
          )}

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
            Resultado *
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 10 }}>
            {RESULTADOS.map((r) => (
              <button
                key={r.k}
                onClick={() => setResultado(r.k)}
                style={{
                  padding: 10,
                  borderRadius: 9,
                  border: `2px solid ${resultado === r.k ? '#2563eb' : '#e8eaed'}`,
                  background: resultado === r.k ? '#eff6ff' : '#f4f5f7',
                  cursor: 'pointer',
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: resultado === r.k ? '#2563eb' : '#6b7280',
                  fontFamily: 'inherit',
                }}
              >
                {r.l}
              </button>
            ))}
          </div>

          <div style={{ marginBottom: 12 }}>
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

            <textarea
              rows={3}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: responsável ausente, interesse em expansão, retorno semana que vem..."
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
            onClick={handleSalvar}
            disabled={salvando}
            style={{
              width: '100%',
              padding: 13,
              background: salvando ? '#86efac' : '#16a34a',
              color: '#fff',
              border: 'none',
              borderRadius: 11,
              fontSize: 14,
              fontWeight: 800,
              cursor: salvando ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {salvando ? 'Salvando...' : '📍 Salvar Visita'}
          </button>
        </div>
      </div>
    </div>
  )
}
