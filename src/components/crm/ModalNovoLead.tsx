'use client'

import { useEffect, useState } from 'react'
import { SEGMENTOS } from '@/types/crm'

interface ModalNovoLeadProps {
  aberto: boolean
  nomeInicial?: string
  onFechar: () => void
  onSalvar: (payload: {
    nome_fantasia: string
    telefone: string
    responsavel: string
    segmento: string
    cep: string
    endereco: string
    observacao: string
  }) => Promise<void>
}

export default function ModalNovoLead({
  aberto,
  nomeInicial,
  onFechar,
  onSalvar,
}: ModalNovoLeadProps) {
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [responsavel, setResponsavel] = useState('')
  const [segmento, setSegmento] = useState('')
  const [cep, setCep] = useState('')
  const [endereco, setEndereco] = useState('')
  const [observacao, setObservacao] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (aberto) {
      setNome(nomeInicial || '')
    }
  }, [aberto, nomeInicial])

  if (!aberto) return null

  async function handleSalvar() {
    if (!nome.trim()) {
      alert('Informe o nome fantasia.')
      return
    }

    if (!segmento) {
      alert('Selecione o segmento.')
      return
    }

    setSalvando(true)

    try {
      await onSalvar({
        nome_fantasia: nome.trim(),
        telefone,
        responsavel,
        segmento,
        cep,
        endereco,
        observacao,
      })

      setNome('')
      setTelefone('')
      setResponsavel('')
      setSegmento('')
      setCep('')
      setEndereco('')
      setObservacao('')
      onFechar()
    } catch (error: any) {
      alert(error.message || 'Erro ao salvar lead.')
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
        zIndex: 1001,
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
            <div style={{ fontSize: 16, fontWeight: 800 }}>⭐ Cadastrar Novo Lead</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
              O lead entra direto no pipeline comercial
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div style={{ gridColumn: 'span 2' }}>
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
                Nome fantasia *
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Mercado Bom Preço"
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
                Telefone
              </label>
              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(00) 00000-0000"
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
                Responsável
              </label>
              <input
                type="text"
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                placeholder="Nome do decisor"
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

            <div style={{ gridColumn: 'span 2' }}>
              <label
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '.5px',
                  marginBottom: 6,
                  display: 'block',
                }}
              >
                Segmento *
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 5 }}>
                {SEGMENTOS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSegmento(s)}
                    style={{
                      padding: '7px 4px',
                      borderRadius: 7,
                      border: `2px solid ${segmento === s ? '#8b5cf6' : '#e8eaed'}`,
                      background: segmento === s ? '#f5f3ff' : '#f4f5f7',
                      cursor: 'pointer',
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: segmento === s ? '#8b5cf6' : '#6b7280',
                      fontFamily: 'inherit',
                      textAlign: 'center',
                    }}
                  >
                    {s}
                  </button>
                ))}
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
                CEP
              </label>
              <input
                type="text"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                placeholder="00000-000"
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
                Endereço
              </label>
              <input
                type="text"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Rua, número"
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

            <div style={{ gridColumn: 'span 2' }}>
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
                Observação inicial
              </label>
              <textarea
                rows={3}
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Ex: interesse em benefícios, 40 funcionários, retorno em 7 dias..."
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
          </div>

          <button
            onClick={handleSalvar}
            disabled={salvando}
            style={{
              width: '100%',
              padding: 13,
              background: salvando ? '#c4b5fd' : '#8b5cf6',
              color: '#fff',
              border: 'none',
              borderRadius: 11,
              fontSize: 14,
              fontWeight: 800,
              cursor: salvando ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {salvando ? 'Salvando...' : '⭐ Salvar Novo Lead'}
          </button>
        </div>
      </div>
    </div>
  )
}
