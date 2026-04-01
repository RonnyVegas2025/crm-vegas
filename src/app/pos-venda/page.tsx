'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'

import TopbarCrm from '@/components/crm/TopbarCrm'
import KpisCrm from '@/components/crm/KpisCrm'
import TabsCrm from '@/components/crm/TabsCrm'
import ListaComercios from '@/components/crm/ListaComercios'
import HistoricoHoje from '@/components/crm/HistoricoHoje'
import PipelineCrm from '@/components/crm/PipelineCrm'
import MapaCrm from '@/components/crm/MapaCrm'
import ModalRegistrarVisita from '@/components/crm/ModalRegistrarVisita'
import ModalNovoLead from '@/components/crm/ModalNovoLead'
import ModalDetalheComercio from '@/components/crm/ModalDetalheComercio'

import type { Comercio, HistoricoItem, Visita } from '@/types/crm'
import { calcularDistancia, segmentoParaCategoria } from '@/utils/geo'
import { dataHojeIso } from '@/utils/crm'

import {
  buscarComerciosAtivos,
  atualizarStatusComercio,
  criarNovoLead,
  buscarHistoricoComercio,
  atualizarPosVisita,
} from '@/services/crmService'

import {
  buscarVisitasHoje,
  registrarVisita,
} from '@/services/visitaService'

export default function PosVendaPage() {
  const sb = createClient()
  const router = useRouter()

  const [cs, setCs] = useState<Comercio[]>([])
  const [vs, setVs] = useState<Visita[]>([])
  const [lo, setLo] = useState(true)
  const [ab, setAb] = useState<'lista' | 'pipeline' | 'mapa' | 'historico'>('lista')
  const [usr, setUsr] = useState<any>(null)
  const [gla, setGla] = useState<number | null>(null)
  const [glo, setGlo] = useState<number | null>(null)
  const [statusFiltro, setStatusFiltro] = useState<string>('')

  const [modalVisitaAberto, setModalVisitaAberto] = useState(false)
  const [modalLeadAberto, setModalLeadAberto] = useState(false)
  const [nomeLeadInicial, setNomeLeadInicial] = useState('')

  const [detalheAberto, setDetalheAberto] = useState(false)
  const [comercioSelecionado, setComercioSelecionado] = useState<Comercio | null>(null)
  const [historicoDetalhe, setHistoricoDetalhe] = useState<HistoricoItem[]>([])
  const [carregandoHistorico, setCarregandoHistorico] = useState(false)

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await sb.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUsr(user)

      const comercios = await buscarComerciosAtivos(sb)
      const visitas = await buscarVisitasHoje(sb)

      setCs(comercios)
      setVs(visitas)
      setLo(false)
    }

    init()
    capturarGeo()
  }, [])

  function capturarGeo() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((p) => {
        setGla(p.coords.latitude)
        setGlo(p.coords.longitude)
      })
    }
  }

  async function recarregarDados() {
    const comercios = await buscarComerciosAtivos(sb)
    const visitas = await buscarVisitasHoje(sb)

    setCs(comercios)
    setVs(visitas)

    if (comercioSelecionado) {
      const atualizado = comercios.find((c) => c.id === comercioSelecionado.id) || null
      setComercioSelecionado(atualizado)
    }
  }

  async function carregarHistorico(nomeFantasia: string) {
    setCarregandoHistorico(true)
    const data = await buscarHistoricoComercio(sb, nomeFantasia)
    setHistoricoDetalhe(data)
    setCarregandoHistorico(false)
  }

  function abrirDetalhe(comercio: Comercio) {
    setComercioSelecionado(comercio)
    setDetalheAberto(true)
    carregarHistorico(comercio.nome_fantasia)
  }

  async function logout() {
    await sb.auth.signOut()
    router.push('/login')
  }

  async function alterarStatus(id: string, status: string) {
    await atualizarStatusComercio(sb, id, status)

    setCs((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status_crm: status } : c))
    )

    if (comercioSelecionado?.id === id) {
      setComercioSelecionado((prev) => (prev ? { ...prev, status_crm: status } : null))
    }
  }

  async function salvarNegociacao(payload: {
    comercioId: string
    status_crm: string
    data_proximo_contato: string | null
    produtos_negociando: string[]
    obs_crm: string | null
  }) {
    await atualizarPosVisita(sb, payload.comercioId, {
      status_crm: payload.status_crm,
      data_ultimo_contato: dataHojeIso(),
      data_proximo_contato: payload.data_proximo_contato,
      produtos_negociando: payload.produtos_negociando.length > 0 ? payload.produtos_negociando : null,
      obs_crm: payload.obs_crm,
    })

    await recarregarDados()
  }

  async function salvarVisita(payload: {
    comercioId: string
    nome_fantasia: string
    tipo_estabelecimento: string
    resultado: string
    observacao: string
  }) {
    await registrarVisita(sb, {
      vendedor_id: usr?.id,
      nome_fantasia: payload.nome_fantasia,
      tipo_estabelecimento: payload.tipo_estabelecimento,
      latitude: gla ?? null,
      longitude: glo ?? null,
      resultado: payload.resultado,
      observacao: payload.observacao || null,
      data_visita: new Date().toISOString(),
    })

    const mapaStatus: Record<string, string> = {
      contato: 'visita_realizada',
      ausente: 'ligar',
      problema: 'problema',
      expansao: 'em_negociacao',
    }

    await atualizarStatusComercio(
      sb,
      payload.comercioId,
      mapaStatus[payload.resultado] || 'visita_realizada'
    )

    await recarregarDados()
  }

  async function salvarNovoLead(payload: {
    nome_fantasia: string
    telefone: string
    responsavel: string
    segmento: string
    cep: string
    endereco: string
    observacao: string
  }) {
    const categoria = segmentoParaCategoria(payload.segmento)

    await criarNovoLead(sb, {
      nome_fantasia: payload.nome_fantasia,
      razao_social: payload.nome_fantasia,
      endereco: payload.endereco || 'A confirmar',
      cep: payload.cep || null,
      cidade: 'A confirmar',
      uf: 'SP',
      telefone: payload.telefone || null,
      categoria,
      subgrupo: payload.segmento,
      taxa: 0,
      terminal: 'A confirmar',
      contrato: 'Lead',
      status_crm: 'novo_lead',
      tipo_origem: 'lead',
      obs_crm: [payload.responsavel ? `Resp: ${payload.responsavel}` : '', payload.observacao]
        .filter(Boolean)
        .join(' | ') || null,
      latitude: gla ?? null,
      longitude: glo ?? null,
      ativo: true,
      data_ultimo_contato: dataHojeIso(),
    })

    await registrarVisita(sb, {
      vendedor_id: usr?.id,
      nome_fantasia: payload.nome_fantasia,
      tipo_estabelecimento: categoria,
      latitude: gla ?? null,
      longitude: glo ?? null,
      resultado: 'contato',
      observacao: `Novo lead${payload.responsavel ? ` | Resp: ${payload.responsavel}` : ''}${payload.observacao ? ` | ${payload.observacao}` : ''}`,
      data_visita: new Date().toISOString(),
    })

    await recarregarDados()
  }

  const comerciosComDistancia = cs.map((c) => ({
    ...c,
    distancia:
      gla && glo && c.latitude && c.longitude
        ? calcularDistancia(gla, glo, c.latitude, c.longitude)
        : undefined,
  }))

  const comercioSelecionadoComDistancia = comercioSelecionado
    ? {
        ...comercioSelecionado,
        distancia:
          gla && glo && comercioSelecionado.latitude && comercioSelecionado.longitude
            ? calcularDistancia(gla, glo, comercioSelecionado.latitude, comercioSelecionado.longitude)
            : comercioSelecionado.distancia,
      }
    : null

  const comerciosFiltrados = statusFiltro
    ? comerciosComDistancia.filter((c) => (c.status_crm || 'ativo') === statusFiltro)
    : comerciosComDistancia

  const totalLeads = cs.filter((c) => c.tipo_origem === 'lead').length
  const totalPv = cs.filter((c) => c.tipo_origem !== 'lead').length

  if (lo) {
    return (
      <div
        style={{
          display: 'flex',
          height: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        Carregando...
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: '#f4f5f7',
      }}
    >
      <TopbarCrm
        email={usr?.email}
        onRegistrarVisita={() => setModalVisitaAberto(true)}
        onLogout={logout}
      />

      <KpisCrm
        totalPv={totalPv}
        totalLeads={totalLeads}
        visitasHoje={vs.length}
        negociando={cs.filter((c) => c.status_crm === 'em_negociacao').length}
        fechados={cs.filter((c) => c.status_crm === 'fechado').length}
      />

      <TabsCrm
        abaAtual={ab}
        totalLista={comerciosFiltrados.length}
        totalHoje={vs.length}
        onChange={setAb}
      />

      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {ab === 'lista' && (
          <>
            {statusFiltro && (
              <div
                style={{
                  background: '#fff',
                  border: '1px solid #e8eaed',
                  borderRadius: 10,
                  padding: '10px 12px',
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <div style={{ fontSize: 12.5, color: '#374151' }}>
                  Filtro ativo no funil: <b>{statusFiltro}</b>
                </div>

                <button
                  onClick={() => setStatusFiltro('')}
                  style={{
                    background: '#f4f5f7',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    padding: '6px 10px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    color: '#374151',
                  }}
                >
                  Limpar filtro
                </button>
              </div>
            )}

            <ListaComercios
              comercios={comerciosFiltrados}
              visitasHoje={vs}
              onAlterarStatus={alterarStatus}
              onAbrirDetalhe={abrirDetalhe}
            />
          </>
        )}

        {ab === 'pipeline' && (
          <PipelineCrm
            comercios={cs}
            onSelecionarStatus={(status) => {
              setStatusFiltro(status)
              setAb('lista')
            }}
          />
        )}

        {ab === 'historico' && <HistoricoHoje visitas={vs} />}

        {ab === 'mapa' && (
          <MapaCrm
            comercios={comerciosFiltrados}
            latitudeAtual={gla}
            longitudeAtual={glo}
          />
        )}
      </div>

      <ModalRegistrarVisita
        aberto={modalVisitaAberto}
        comercios={cs}
        onFechar={() => setModalVisitaAberto(false)}
        onSalvar={salvarVisita}
        onNovoLead={(nomeInicial) => {
          setModalVisitaAberto(false)
          setNomeLeadInicial(nomeInicial)
          setModalLeadAberto(true)
        }}
      />

      <ModalNovoLead
        aberto={modalLeadAberto}
        nomeInicial={nomeLeadInicial}
        onFechar={() => {
          setModalLeadAberto(false)
          setNomeLeadInicial('')
        }}
        onSalvar={async (payload) => {
          await salvarNovoLead(payload)
          setModalLeadAberto(false)
          setNomeLeadInicial('')
        }}
      />

      <ModalDetalheComercio
        aberto={detalheAberto}
        comercio={comercioSelecionadoComDistancia}
        historico={historicoDetalhe}
        carregandoHistorico={carregandoHistorico}
        onFechar={() => {
          setDetalheAberto(false)
          setComercioSelecionado(null)
          setHistoricoDetalhe([])
        }}
        onAlterarStatus={alterarStatus}
        onSalvarNegociacao={salvarNegociacao}
      />
    </div>
  )
}
