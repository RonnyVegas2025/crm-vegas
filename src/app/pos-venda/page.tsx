'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'

import TopbarCrm from '@/components/crm/TopbarCrm'
import KpisCrm from '@/components/crm/KpisCrm'
import TabsCrm from '@/components/crm/TabsCrm'

import type {
  Comercio,
  Visita,
  HistoricoItem,
  NegItem,
  NegEmpItem,
} from '@/types/crm'

import {
  CAT,
  SC,
  SA,
  PO,
  RES_LABEL,
  RES_COR,
  RES_ICON,
  PRODS_COM,
  PRODS_EMP,
  SEGMENTOS,
} from '@/types/crm'

import {
  calcularDistancia,
  formatarDistancia,
  statusVisual,
  pinCor,
  segmentoParaCategoria,
} from '@/utils/geo'

import {
  calcularTotal,
  formatarDataHora,
  dataHojeIso,
} from '@/utils/crm'

import {
  buscarComerciosAtivos,
  atualizarStatusComercio,
  atualizarPosVisita,
  buscarHistoricoComercio,
  criarNovoLead,
} from '@/services/crmService'

import {
  buscarVisitasHoje,
  registrarVisita,
} from '@/services/visitaService'

export default function PosVendaPage() {
  const sb = createClient()
  const router = useRouter()
  const mr = useRef<any>(null)
  const mi = useRef<any>(null)

  const [cs, setCs] = useState<Comercio[]>([])
  const [lo, setLo] = useState(true)
  const [bk, setBk] = useState('')
  const [sf, setSf] = useState('')
  const [origemFiltro, setOrFiltro] = useState<'todos' | 'posvendas' | 'leads'>('todos')
  const [ab, setAb] = useState<'lista' | 'pipeline' | 'mapa' | 'historico'>('lista')
  const [vs, setVs] = useState<Visita[]>([])
  const [mo, setMo] = useState(false)
  const [de, setDe] = useState(false)
  const [abaDetalhe, setAbaDetalhe] = useState<'negociacao' | 'historico'>('negociacao')
  const [historico, setHistorico] = useState<HistoricoItem[]>([])
  const [carregandoHist, setCarregandoHist] = useState(false)
  const [csel, setCsel] = useState<Comercio | null>(null)
  const [rs, setRs] = useState('')
  const [ob, setOb] = useState('')
  const [pd, setPd] = useState('')
  const [psEmp, setPsEmp] = useState<number[]>([])
  const [psCom, setPsCom] = useState<number[]>([])
  const [negEmp, setNegEmp] = useState<Record<number, NegEmpItem>>({})
  const [negCom, setNegCom] = useState<Record<number, NegItem>>({})
  const [gla, setGla] = useState<number | null>(null)
  const [glo, setGlo] = useState<number | null>(null)
  const [gs, setGs] = useState<'loading' | 'ok'>('loading')
  const [gm, setGm] = useState('Capturando localização...')
  const [sv, setSv] = useState(false)
  const [sc, setSc] = useState(false)
  const [bm, setBm] = useState('')
  const [usr, setUsr] = useState<any>(null)
  const [op, setOp] = useState(false)
  const [modoLead, setModoLead] = useState(false)
  const [nlNome, setNlNome] = useState('')
  const [nlTel, setNlTel] = useState('')
  const [nlEnd, setNlEnd] = useState('')
  const [nlCep, setNlCep] = useState('')
  const [nlSeg, setNlSeg] = useState('')
  const [nlResp, setNlResp] = useState('')
  const [nlObs, setNlObs] = useState('')
  const [svLead, setSvLead] = useState(false)
  const [scLead, setScLead] = useState(false)

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
      setCs(comercios)
      setLo(false)
    }

    init()
    cgi()
  }, [])

  useEffect(() => {
    async function carregarVisitas() {
      const visitas = await buscarVisitasHoje(sb)
      setVs(visitas)
    }

    carregarVisitas()
  }, [sc, scLead])

  useEffect(() => {
    if (ab === 'mapa' && !mi.current) setTimeout(im, 300)
  }, [ab, cs, gla, glo])

  useEffect(() => {
    if (de && csel && abaDetalhe === 'historico') {
      carregarHistorico(csel.nome_fantasia)
    }
  }, [de, csel, abaDetalhe])

  async function carregarHistorico(nome: string) {
    setCarregandoHist(true)
    const data = await buscarHistoricoComercio(sb, nome)
    setHistorico(data)
    setCarregandoHist(false)
  }

  function cgi() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => {
          setGla(p.coords.latitude)
          setGlo(p.coords.longitude)
        },
        () => {},
        { timeout: 10000, enableHighAccuracy: true }
      )
    }
  }

  function im() {
    if (!mr.current || mi.current) return

    const L = (window as any).L
    if (!L) return

    const c: [number, number] = gla && glo ? [gla, glo] : [-22.733, -47.334]
    const map = L.map(mr.current, { zoomControl: false }).setView(c, 14)

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      maxZoom: 19,
    }).addTo(map)

    mi.current = map

    if (gla && glo) {
      const ic = L.divIcon({
        className: '',
        html: `<div style="width:16px;height:16px;background:#2563eb;border-radius:50%;border:3px solid white;box-shadow:0 0 0 6px rgba(37,99,235,0.2)"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      })

      L.marker([gla, glo], { icon: ic })
        .addTo(map)
        .bindPopup('<b>📍 Você está aqui</b>')
    }

    cs.forEach((c2) => {
      if (!c2.latitude || !c2.longitude) return

      const ci = CAT[c2.categoria] || CAT.outros
      const cor = pinCor(c2)
      const st = statusVisual(c2.status_crm || 'ativo')
      const isLead = c2.tipo_origem === 'lead'
      const dist = gla && glo ? formatarDistancia(calcularDistancia(gla, glo, c2.latitude, c2.longitude)) : ''

      const ic = L.divIcon({
        className: '',
        html: `<div style="width:30px;height:30px;background:${cor};border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center"><span style="transform:rotate(45deg);font-size:12px">${isLead ? '⭐' : ci.icon}</span></div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -32],
      })

      L.marker([c2.latitude, c2.longitude], { icon: ic })
        .addTo(map)
        .bindPopup(
          `<div style="font-family:sans-serif;min-width:190px"><b style="font-size:13px">${c2.nome_fantasia}</b><div style="font-size:11px;color:#6b7280;margin:3px 0">${c2.endereco?.split(' - ')[0] || ''}</div><div style="background:${st.bg};color:${st.cor};padding:2px 8px;border-radius:10px;font-size:10.5px;font-weight:700;display:inline-block;margin:4px 0">${st.icon} ${st.label}</div>${dist ? `<div style="font-size:11px;color:#2563eb;font-weight:600;margin-top:2px">📍 ${dist}</div>` : ''}<button onclick="window.__aC('${c2.id}')" style="margin-top:8px;background:#2563eb;color:#fff;border:none;border-radius:6px;padding:6px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:sans-serif;width:100%">Ver + Registrar visita</button></div>`,
          { maxWidth: 220 }
        )
    })

    ;(window as any).__aC = (id: string) => {
      const c2 = cs.find((x) => x.id === id)
      if (c2) abrirDetalhe(c2)
    }
  }

  async function logout() {
    await sb.auth.signOut()
    router.push('/login')
  }

  const ccd = cs.map((c) => ({
    ...c,
    distancia:
      gla && glo && c.latitude && c.longitude
        ? calcularDistancia(gla, glo, c.latitude, c.longitude)
        : undefined,
  }))

  const filt = ccd
    .filter((c) => {
      const mBk =
        !bk ||
        c.nome_fantasia.toLowerCase().includes(bk.toLowerCase()) ||
        c.razao_social?.toLowerCase().includes(bk.toLowerCase())

      const mSf = !sf || c.status_crm === sf

      const mOr =
        origemFiltro === 'todos' ||
        (origemFiltro === 'leads' && c.tipo_origem === 'lead') ||
        (origemFiltro === 'posvendas' && c.tipo_origem !== 'lead')

      return mBk && mSf && mOr
    })
    .sort((a, b) =>
      op && a.distancia != null && b.distancia != null
        ? a.distancia - b.distancia
        : a.nome_fantasia.localeCompare(b.nome_fantasia)
    )

  const pip = PO.map((s) => ({
    key: s,
    ...SC[s],
    total: cs.filter((c) => (c.status_crm || 'ativo') === s).length,
  }))

  const totalLeads = cs.filter((c) => c.tipo_origem === 'lead').length
  const totalPv = cs.filter((c) => c.tipo_origem !== 'lead').length

  function abrirDetalhe(c: Comercio) {
    setCsel(c)
    setPsEmp([])
    setPsCom([])
    setNegEmp({})
    setNegCom({})
    setRs('')
    setOb('')
    setPd('')
    setSc(false)
    setModoLead(false)
    setAbaDetalhe('negociacao')
    setHistorico([])
    setDe(true)
  }

  function abrirModalVisita() {
    setCsel(null)
    setRs('')
    setOb('')
    setBm('')
    setPd('')
    setSc(false)
    setModoLead(false)
    setNlNome('')
    setNlTel('')
    setNlEnd('')
    setNlCep('')
    setNlSeg('')
    setNlResp('')
    setNlObs('')
    setGs('loading')
    setGm('Capturando localização...')
    setMo(true)
    cgm()
  }

  function iniciarNovoLead() {
    setModoLead(true)
    setNlNome(bm)
  }

  function cgm() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => {
          setGla(p.coords.latitude)
          setGlo(p.coords.longitude)
          setGs('ok')
          setGm(
            `${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)} · Precisão: ${Math.round(
              p.coords.accuracy
            )}m`
          )
        },
        () => {
          setGs('ok')
          setGm('Localização aproximada')
        },
        { timeout: 8000, enableHighAccuracy: true }
      )
    } else {
      setGs('ok')
      setGm('GPS não disponível')
    }
  }

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

  function resumoNegociacao(): string {
    const p: string[] = []

    psEmp.forEach((id) => {
      const pr = PRODS_EMP.find((x) => x.id === id)
      const n = negEmp[id]

      if (pr) {
        const v =
          n?.func && n?.vlr
            ? `${n.func}func × R$${n.vlr}=${calcularTotal(n.func, n.vlr)}/mês`
            : 'selecionado'
        const o = n?.obs ? ` (${n.obs})` : ''
        p.push(`${pr.nome}: ${v}${o}`)
      }
    })

    psCom.forEach((id) => {
      const pr = PRODS_COM.find((x) => x.id === id)
      const n = negCom[id]

      if (pr) {
        const v = n?.valor ? `${n.valor}${pr.tipo === 'taxa' ? '%' : ''}` : '-'
        const o = n?.obs ? ` (${n.obs})` : ''
        p.push(`${pr.nome}: ${v}${o}`)
      }
    })

    return p.join(' | ')
  }

  async function salvarNovoLead() {
    if (!nlNome.trim()) {
      alert('Informe o nome.')
      return
    }

    if (!nlSeg) {
      alert('Selecione o segmento.')
      return
    }

    setSvLead(true)

    try {
      const categoria = segmentoParaCategoria(nlSeg)

      await criarNovoLead(sb, {
        nome_fantasia: nlNome.trim(),
        razao_social: nlNome.trim(),
        endereco: nlEnd || 'A confirmar',
        cep: nlCep || null,
        cidade: 'A confirmar',
        uf: 'SP',
        telefone: nlTel || null,
        categoria,
        subgrupo: nlSeg,
        taxa: 0,
        terminal: 'A confirmar',
        contrato: 'Lead',
        status_crm: 'novo_lead',
        tipo_origem: 'lead',
        obs_crm: nlObs || null,
        latitude: gla ?? -22.733,
        longitude: glo ?? -47.334,
        ativo: true,
        data_ultimo_contato: dataHojeIso(),
      })

      await registrarVisita(sb, {
        vendedor_id: usr?.id,
        nome_fantasia: nlNome.trim(),
        tipo_estabelecimento: categoria,
        latitude: gla ?? -22.733,
        longitude: glo ?? -47.334,
        resultado: 'contato',
        observacao: `Prospecção${nlResp ? ` | Resp: ${nlResp}` : ''}${nlObs ? ` | ${nlObs}` : ''}`,
        data_visita: new Date().toISOString(),
      })

      const comercios = await buscarComerciosAtivos(sb)
      setCs(comercios)

      setSvLead(false)
      setScLead(true)
    } catch (error: any) {
      alert('Erro ao salvar: ' + error.message)
      setSvLead(false)
    }
  }

  async function salvar() {
    if (!csel) {
      alert('Selecione o comércio.')
      return
    }

    if (!rs) {
      alert('Selecione o resultado.')
      return
    }

    setSv(true)

    try {
      const novoStatus = SA[rs] || 'visita_realizada'

      const todosProds = [
        ...psEmp.map((id) => PRODS_EMP.find((p) => p.id === id)?.nome || ''),
        ...psCom.map((id) => PRODS_COM.find((p) => p.id === id)?.nome || ''),
      ].filter(Boolean)

      const resumo = resumoNegociacao()
      const observacaoCompleta = [ob, resumo ? `Negociação: ${resumo}` : '']
        .filter(Boolean)
        .join(' | ')

      await registrarVisita(sb, {
        vendedor_id: usr?.id,
        nome_fantasia: csel.nome_fantasia,
        tipo_estabelecimento: csel.categoria,
        latitude: gla ?? -22.733,
        longitude: glo ?? -47.334,
        resultado: rs,
        observacao: observacaoCompleta || null,
        data_visita: new Date().toISOString(),
      })

      await atualizarPosVisita(sb, csel.id, {
        status_crm: novoStatus,
        data_ultimo_contato: dataHojeIso(),
        data_proximo_contato: pd || null,
        produtos_negociando: todosProds.length > 0 ? todosProds : null,
        obs_crm: ob || null,
      })

      setCs((prev) =>
        prev.map((c) =>
          c.id === csel.id
            ? {
                ...c,
                status_crm: novoStatus,
                produtos_negociando: todosProds,
                obs_crm: ob || undefined,
              }
            : c
        )
      )

      setSv(false)
      setSc(true)
      setDe(false)
    } catch (error: any) {
      alert('Erro ao salvar visita: ' + error.message)
      setSv(false)
    }
  }

  async function asmn(id: string, ns: string) {
    try {
      await atualizarStatusComercio(sb, id, ns)

      setCs((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status_crm: ns } : c))
      )

      if (csel?.id === id) {
        setCsel((prev) => (prev ? { ...prev, status_crm: ns } : null))
      }
    } catch (error: any) {
      alert('Erro ao atualizar status: ' + error.message)
    }
  }

  if (lo)
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          fontFamily: "'Plus Jakarta Sans',sans-serif",
          color: '#6b7280',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <div style={{ fontWeight: 600 }}>Carregando...</div>
        </div>
      </div>
    )

  const inp: any = {
    width: '100%',
    padding: '9px 12px',
    border: '1.5px solid #e8eaed',
    borderRadius: 8,
    fontSize: 13,
    fontFamily: 'inherit',
    outline: 'none',
    background: '#f4f5f7',
  }

  const inpSm: any = {
    padding: '7px 10px',
    border: '1.5px solid #e8eaed',
    borderRadius: 7,
    fontSize: 12.5,
    fontFamily: 'inherit',
    outline: 'none',
    background: '#f4f5f7',
    width: '100%',
  }

  const lbl: any = {
    fontSize: 10,
    fontWeight: 700,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '.5px',
    marginBottom: 4,
    display: 'block',
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        fontFamily: "'Plus Jakarta Sans',sans-serif",
        overflow: 'hidden',
      }}
    >
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" async />

      <div
        style={{
          background: '#fff',
          borderBottom: '1px solid #e8eaed',
          height: 54,
          display: 'flex',
          alignItems: 'center',
          padding: '0 18px',
          gap: 12,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            background: '#16181d',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 800,
            color: '#f59e0b',
            flexShrink: 0,
          }}
        >
          V
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>
            Vegas CRM · Campo
          </div>
          <div style={{ fontSize: 10.5, color: '#9ca3af' }}>{usr?.email}</div>
        </div>

        <button
          onClick={abrirModalVisita}
          style={{
            background: '#16a34a',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '8px 14px',
            fontSize: 12.5,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          📍 Registrar visita
        </button>

        <button
          onClick={logout}
          style={{
            background: 'transparent',
            border: '1px solid #e8eaed',
            borderRadius: 7,
            padding: '7px 12px',
            fontSize: 12,
            color: '#6b7280',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Sair
        </button>
      </div>

      <div
        style={{
          background: '#fff',
          borderBottom: '1px solid #e8eaed',
          display: 'flex',
          gap: 10,
          padding: '10px 18px',
          flexShrink: 0,
          overflowX: 'auto',
        }}
      >
        {[
          { l: 'Pós-venda', v: totalPv, c: '#2563eb' },
          { l: 'Leads', v: totalLeads, c: '#8b5cf6' },
          { l: 'Hoje', v: vs.length, c: '#16a34a' },
          { l: 'Negociando', v: cs.filter((c) => c.status_crm === 'em_negociacao').length, c: '#d97706' },
          { l: 'Fechados', v: cs.filter((c) => c.status_crm === 'fechado').length, c: '#16a34a' },
        ].map((k) => (
          <div
            key={k.l}
            style={{
              background: '#f4f5f7',
              border: '1px solid #e8eaed',
              borderRadius: 10,
              padding: '9px 14px',
              minWidth: 90,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontSize: 9.5,
                fontWeight: 600,
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '.5px',
                marginBottom: 3,
              }}
            >
              {k.l}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: k.c, lineHeight: 1 }}>{k.v}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          background: '#fff',
          borderBottom: '1px solid #e8eaed',
          display: 'flex',
          padding: '0 18px',
          flexShrink: 0,
          overflowX: 'auto',
        }}
      >
        {[
          { k: 'lista', l: `📋 Lista (${filt.length})` },
          { k: 'pipeline', l: '📊 Pipeline' },
          { k: 'mapa', l: '🗺 Mapa' },
          { k: 'historico', l: `✅ Hoje (${vs.length})` },
        ].map((t) => (
          <div
            key={t.k}
            onClick={() => setAb(t.k as any)}
            style={{
              padding: '10px 16px',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              color: ab === t.k ? '#2563eb' : '#6b7280',
              borderBottom: `2px solid ${ab === t.k ? '#2563eb' : 'transparent'}`,
              marginBottom: -1,
              whiteSpace: 'nowrap',
            }}
          >
            {t.l}
          </div>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {ab === 'lista' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div
              style={{
                padding: '10px 14px',
                borderBottom: '1px solid #e8eaed',
                background: '#fff',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', gap: 6, marginBottom: 7, flexWrap: 'wrap', alignItems: 'center' }}>
                {[
                  { k: 'todos', l: 'Todos' },
                  { k: 'posvendas', l: '🏪 Pós-venda' },
                  { k: 'leads', l: '⭐ Leads' },
                ].map((f) => (
                  <button
                    key={f.k}
                    onClick={() => setOrFiltro(f.k as any)}
                    style={{
                      padding: '5px 12px',
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

                {gla && (
                  <button
                    onClick={() => setOp(!op)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: `1.5px solid ${op ? '#16a34a' : '#e8eaed'}`,
                      background: op ? '#16a34a' : '#f4f5f7',
                      color: op ? '#fff' : '#6b7280',
                      fontFamily: 'inherit',
                      marginLeft: 'auto',
                    }}
                  >
                    📍 Próx.
                  </button>
                )}
              </div>

              <input
                type="text"
                placeholder="🔍 Buscar comércio..."
                value={bk}
                onChange={(e) => setBk(e.target.value)}
                style={{ ...inp, marginBottom: 7 }}
              />

              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {[
                  { k: '', l: 'Todos' },
                  { k: 'ativo', l: '🔵 Ativo' },
                  { k: 'novo_lead', l: '⭐ Lead' },
                  { k: 'em_negociacao', l: '🔥 Neg.' },
                  { k: 'visita_realizada', l: '✅ Visita' },
                  { k: 'ligar', l: '📞 Ligar' },
                  { k: 'proposta_enviada', l: '📄 Proposta' },
                  { k: 'problema', l: '⚠️ Prob.' },
                  { k: 'sem_contato', l: '❄️ S.Contato' },
                  { k: 'fechado', l: '🏆 Fechado' },
                ].map((f) => (
                  <button
                    key={f.k}
                    onClick={() => setSf(f.k)}
                    style={{
                      padding: '4px 9px',
                      borderRadius: 20,
                      fontSize: 10.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: `1.5px solid ${sf === f.k ? '#2563eb' : '#e8eaed'}`,
                      background: sf === f.k ? '#2563eb' : '#f4f5f7',
                      color: sf === f.k ? '#fff' : '#6b7280',
                      fontFamily: 'inherit',
                    }}
                  >
                    {f.l}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
              {filt.length === 0 && (
                <div style={{ padding: 30, textAlign: 'center', color: '#9ca3af' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
                  <div>Nenhum encontrado</div>
                </div>
              )}

              {filt.map((c) => {
                const ci = CAT[c.categoria] || CAT.outros
                const st = statusVisual(c.status_crm || 'ativo')
                const isLead = c.tipo_origem === 'lead'
                const vt = vs.find((v) => v.nome_fantasia === c.nome_fantasia)

                return (
                  <div
                    key={c.id}
                    onClick={() => abrirDetalhe(c)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #e8eaed',
                      background: '#fff',
                      cursor: 'pointer',
                      borderLeft: `3px solid ${pinCor(c)}`,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#fafbfc')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
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
                        }}
                      >
                        {isLead ? '⭐' : ci.icon}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: 13,
                              color: '#111827',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {c.nome_fantasia}
                          </div>

                          {isLead && (
                            <span
                              style={{
                                background: '#f5f3ff',
                                color: '#8b5cf6',
                                fontSize: 9.5,
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: 10,
                                border: '1px solid #c4b5fd',
                                flexShrink: 0,
                              }}
                            >
                              LEAD
                            </span>
                          )}
                        </div>

                        <div
                          style={{
                            fontSize: 11,
                            color: '#9ca3af',
                            marginTop: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {c.endereco?.split(' - ')[0] || c.subgrupo}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
                          <span
                            style={{
                              background: st.bg,
                              color: st.cor,
                              border: `1px solid ${st.border}`,
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '2px 7px',
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
                                padding: '2px 7px',
                                borderRadius: 20,
                              }}
                            >
                              ✓ {vt.hora}
                            </span>
                          )}

                          {c.distancia != null && (
                            <span style={{ fontSize: 10.5, color: '#2563eb', fontWeight: 600 }}>
                              📍 {formatarDistancia(c.distancia)}
                            </span>
                          )}
                        </div>

                        {c.produtos_negociando && c.produtos_negociando.length > 0 && (
                          <div
                            style={{
                              fontSize: 10,
                              color: '#d97706',
                              marginTop: 4,
                              fontWeight: 600,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            🔥{' '}
                            {Array.isArray(c.produtos_negociando)
                              ? c.produtos_negociando.join(', ')
                              : c.produtos_negociando}
                          </div>
                        )}
                      </div>

                      <div style={{ color: '#9ca3af', fontSize: 16, flexShrink: 0 }}>›</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {ab === 'pipeline' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div
                style={{
                  background: '#eff6ff',
                  border: '1px solid #dbeafe',
                  borderRadius: 12,
                  padding: '12px 14px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    marginBottom: 3,
                  }}
                >
                  Pós-venda Vegas
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#2563eb' }}>{totalPv}</div>
              </div>

              <div
                style={{
                  background: '#f5f3ff',
                  border: '1px solid #ddd6fe',
                  borderRadius: 12,
                  padding: '12px 14px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    marginBottom: 3,
                  }}
                >
                  Leads / Prospecção
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#8b5cf6' }}>{totalLeads}</div>
              </div>
            </div>

            {pip
              .filter((s) => s.total > 0)
              .map((s) => (
                <div
                  key={s.key}
                  style={{
                    background: '#fff',
                    border: `1px solid ${s.border}`,
                    borderRadius: 12,
                    padding: '12px 14px',
                    marginBottom: 8,
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    setSf(s.key === 'ativo' ? '' : s.key)
                    setAb('lista')
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
                      <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827' }}>{s.label}</div>
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
                            width: `${(s.total / Math.max(cs.length, 1)) * 100}%`,
                            background: s.cor,
                            borderRadius: 3,
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: s.cor, lineHeight: 1 }}>{s.total}</div>
                      <div style={{ fontSize: 10, color: '#9ca3af' }}>
                        {Math.round((s.total / Math.max(cs.length, 1)) * 100)}%
                      </div>
                    </div>
                  </div>

                  {s.total > 0 && s.total <= 3 && (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${s.border}` }}>
                      {cs
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
                            <span style={{ color: '#9ca3af' }}>{c.tipo_origem === 'lead' ? 'Lead' : ''}</span>
                          </div>
                        ))}
                    </div>
                  )}

                  {s.total > 3 && (
                    <div style={{ marginTop: 6, fontSize: 11, color: s.cor, fontWeight: 600 }}>
                      Toque para ver todos →
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}

        {ab === 'mapa' && (
          <div style={{ flex: 1, position: 'relative' }}>
            <div ref={mr} style={{ height: '100%', width: '100%' }} />

            <div
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                zIndex: 500,
                background: 'rgba(255,255,255,0.97)',
                border: '1px solid #e8eaed',
                borderRadius: 12,
                padding: '10px 14px',
                fontSize: 11,
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 7, color: '#111827', fontSize: 12 }}>Legenda</div>

              {[
                ['#2563eb', 'Pós-venda (sem ação)'],
                ['#8b5cf6', 'Lead'],
                ['#d97706', 'Em Negociação'],
                ['#0891b2', 'Visita Realizada'],
                ['#ea580c', 'Proposta Enviada'],
                ['#dc2626', 'Problema'],
                ['#64748b', 'Sem Contato'],
                ['#16a34a', 'Produto Fechado'],
              ].map(([cor, lb]) => (
                <div key={lb} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: cor, flexShrink: 0 }} />
                  <span>{lb}</span>
                </div>
              ))}
            </div>

            <button
              onClick={abrirModalVisita}
              style={{
                position: 'absolute',
                bottom: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 500,
                background: '#16a34a',
                color: '#fff',
                border: 'none',
                borderRadius: 50,
                padding: '12px 20px',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 4px 20px rgba(22,163,74,0.4)',
              }}
            >
              📍 Registrar Visita Aqui
            </button>
          </div>
        )}

        {ab === 'historico' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
            {vs.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
                <div style={{ fontWeight: 600 }}>Nenhuma visita hoje</div>
              </div>
            ) : (
              vs.map((v, i) => (
                <div
                  key={i}
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

                    {v.latitude && <div style={{ fontSize: 10, color: '#16a34a', fontWeight: 600 }}>📍 GPS</div>}
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
              ))
            )}
          </div>
        )}
      </div>

      {de && csel && (
        <div
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
                  background: csel.tipo_origem === 'lead' ? '#f5f3ff' : (CAT[csel.categoria] || CAT.outros).bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                {csel.tipo_origem === 'lead' ? '⭐' : (CAT[csel.categoria] || CAT.outros).icon}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>{csel.nome_fantasia}</div>

                  {csel.tipo_origem === 'lead' && (
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
                  {csel.subgrupo} · {csel.endereco?.split(' - ')[0]}
                </div>

                <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                  {csel.telefone && (
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
                      📞 {csel.telefone}
                    </span>
                  )}

                  {csel.distancia != null && (
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
                      📍 {formatarDistancia(csel.distancia)}
                    </span>
                  )}

                  {csel.data_proximo_contato && (
                    <span
                      style={{
                        background: '#fffbeb',
                        color: '#d97706',
                        fontSize: 10.5,
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 20,
                      }}
                    >
                      📅 Retorno: {new Date(csel.data_proximo_contato).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>

              <span
                onClick={() => setDe(false)}
                style={{ fontSize: 20, color: '#9ca3af', cursor: 'pointer', padding: 4, flexShrink: 0 }}
              >
                ✕
              </span>
            </div>

            <div style={{ padding: '10px 18px', borderBottom: '1px solid #e8eaed', flexShrink: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 5 }}>
                {PO.map((s) => {
                  const st = statusVisual(s)
                  const at = (csel.status_crm || 'ativo') === s

                  return (
                    <button
                      key={s}
                      onClick={() => asmn(csel.id, s)}
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

            <div style={{ display: 'flex', borderBottom: '1px solid #e8eaed', flexShrink: 0, background: '#fff' }}>
              {[
                { k: 'negociacao', l: '📦 Negociação' },
                { k: 'historico', l: `📋 Histórico (${historico.length})` },
              ].map((t) => (
                <div
                  key={t.k}
                  onClick={() => setAbaDetalhe(t.k as any)}
                  style={{
                    padding: '10px 20px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: abaDetalhe === t.k ? '#2563eb' : '#6b7280',
                    borderBottom: `2px solid ${abaDetalhe === t.k ? '#2563eb' : 'transparent'}`,
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
                  {csel.produtos_negociando && csel.produtos_negociando.length > 0 && (
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
                        {Array.isArray(csel.produtos_negociando)
                          ? csel.produtos_negociando.join(', ')
                          : csel.produtos_negociando}
                      </div>

                      {csel.obs_crm && (
                        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 5, fontStyle: 'italic' }}>
                          "{csel.obs_crm}"
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                    {[
                      { l: 'Endereço', v: csel.endereco },
                      { l: 'Contrato', v: csel.contrato },
                      { l: 'Segmento', v: csel.subgrupo },
                      { l: 'E-mail', v: csel.email || '—' },
                    ].map((f) => (
                      <div key={f.l}>
                        <div style={lbl}>{f.l}</div>
                        <div style={{ fontSize: 12, fontWeight: 500, color: '#111827', wordBreak: 'break-word' }}>
                          {f.v}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ ...lbl, marginBottom: 8 }}>🏪 Produtos Vegas para este comércio</div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
                      {PRODS_COM.map((p) => {
                        const sl = psCom.includes(p.id)

                        return (
                          <div
                            key={p.id}
                            onClick={() =>
                              setPsCom((prev) => (prev.includes(p.id) ? prev.filter((x) => x !== p.id) : [...prev, p.id]))
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
                              <div style={{ fontSize: 11.5, fontWeight: 700, color: sl ? '#1d4ed8' : '#111827' }}>
                                {p.nome}
                              </div>
                              <div style={{ fontSize: 10, color: '#6b7280' }}>{p.desc}</div>
                            </div>

                            {sl && <span style={{ color: '#2563eb', fontSize: 12, fontWeight: 700 }}>✓</span>}
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
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', marginBottom: 8 }}>
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
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                                {p.icon} {p.nome}
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
                                <div>
                                  <label style={lbl}>
                                    {p.tipo === 'taxa' ? 'Taxa adm. negociada (%)' : 'Valor negociado'}
                                  </label>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <input
                                      type="text"
                                      value={n.valor}
                                      onChange={(e) => updNegCom(id, 'valor', e.target.value)}
                                      placeholder={p.tipo === 'taxa' ? 'Ex: 3,50' : 'Ex: 200,00'}
                                      style={inpSm}
                                    />
                                    {p.tipo === 'taxa' && (
                                      <span style={{ fontSize: 14, fontWeight: 700, color: '#2563eb', flexShrink: 0 }}>
                                        %
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <label style={lbl}>Observação</label>
                                  <input
                                    type="text"
                                    value={n.obs}
                                    onChange={(e) => updNegCom(id, 'obs', e.target.value)}
                                    placeholder="Ex: mensal, com carência..."
                                    style={inpSm}
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
                    <div style={{ ...lbl, marginBottom: 8 }}>👥 Produtos para funcionários</div>

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

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                          {PRODS_EMP.filter((p) => p.cat === cat).map((p) => {
                            const sl = psEmp.includes(p.id)

                            return (
                              <div
                                key={p.id}
                                onClick={() =>
                                  setPsEmp((prev) => (prev.includes(p.id) ? prev.filter((x) => x !== p.id) : [...prev, p.id]))
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
                                  <div style={{ fontSize: 11.5, fontWeight: 700, color: sl ? '#15803d' : '#111827' }}>
                                    {p.nome}
                                  </div>
                                  <div style={{ fontSize: 10, color: '#6b7280' }}>{p.desc}</div>
                                </div>

                                {sl && <span style={{ color: '#16a34a', fontSize: 12, fontWeight: 700 }}>✓</span>}
                              </div>
                            )
                          })}
                        </div>

                        {PRODS_EMP.filter((p) => p.cat === cat && psEmp.includes(p.id)).map((p) => {
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
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#15803d', marginBottom: 7 }}>
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
                                  <label style={lbl}>Nº funcionários</label>
                                  <input
                                    type="number"
                                    value={n.func}
                                    onChange={(e) => updNegEmp(p.id, 'func', e.target.value)}
                                    placeholder="0"
                                    style={inpSm}
                                  />
                                </div>

                                <div>
                                  <label style={lbl}>{p.tipo === 'agregado' ? 'Valor/licença' : 'Valor/pessoa'}</label>
                                  <input
                                    type="text"
                                    value={n.vlr}
                                    onChange={(e) => updNegEmp(p.id, 'vlr', e.target.value)}
                                    placeholder="R$ 0,00"
                                    style={inpSm}
                                  />
                                </div>

                                <div>
                                  <label style={lbl}>Total/mês</label>
                                  <div
                                    style={{
                                      ...inpSm,
                                      background: '#dcfce7',
                                      color: '#15803d',
                                      fontWeight: 700,
                                      display: 'flex',
                                      alignItems: 'center',
                                    }}
                                  >
                                    {n.func && n.vlr ? calcularTotal(n.func, n.vlr) : '—'}
                                  </div>
                                </div>
                              </div>

                              <div>
                                <label style={lbl}>Observação</label>
                                <input
                                  type="text"
                                  value={n.obs}
                                  onChange={(e) => updNegEmp(p.id, 'obs', e.target.value)}
                                  placeholder="Ex: começa em abril, incluir dependentes..."
                                  style={inpSm}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>

                  <div style={lbl}>Resultado desta visita *</div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 10 }}>
                    {[
                      { k: 'contato', l: '✅ Contato feito' },
                      { k: 'ausente', l: '😔 Responsável ausente' },
                      { k: 'problema', l: '⚠️ Problema' },
                      { k: 'expansao', l: '🚀 Interesse em expansão' },
                    ].map((r) => (
                      <button
                        key={r.k}
                        onClick={() => setRs(r.k)}
                        style={{
                          padding: 10,
                          borderRadius: 10,
                          border: `2px solid ${rs === r.k ? '#2563eb' : '#e8eaed'}`,
                          background: rs === r.k ? '#eff6ff' : '#f4f5f7',
                          cursor: 'pointer',
                          fontSize: 12.5,
                          fontWeight: 600,
                          color: rs === r.k ? '#2563eb' : '#6b7280',
                          fontFamily: 'inherit',
                        }}
                      >
                        {r.l}
                      </button>
                    ))}
                  </div>

                  {rs && (
                    <div
                      style={{
                        background: statusVisual(SA[rs]).bg,
                        border: `1px solid ${statusVisual(SA[rs]).border}`,
                        borderRadius: 8,
                        padding: '9px 12px',
                        marginBottom: 10,
                        fontSize: 12,
                        fontWeight: 600,
                        color: statusVisual(SA[rs]).cor,
                      }}
                    >
                      Status automático: {statusVisual(SA[rs]).icon} {statusVisual(SA[rs]).label}
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <div>
                      <label style={lbl}>Próximo contato</label>
                      <input type="date" value={pd} onChange={(e) => setPd(e.target.value)} style={inp} />
                    </div>

                    <div>
                      <label style={lbl}>Contrato</label>
                      <div
                        style={{
                          ...inp,
                          display: 'flex',
                          alignItems: 'center',
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#374151',
                        }}
                      >
                        {csel.contrato}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={lbl}>Observação geral</label>
                    <textarea
                      rows={2}
                      value={ob}
                      onChange={(e) => setOb(e.target.value)}
                      placeholder="Ex: Gerente demonstrou interesse, retornar semana que vem..."
                      style={{ ...inp, resize: 'none' }}
                    />
                  </div>

                  <button
                    onClick={salvar}
                    disabled={sv}
                    style={{
                      width: '100%',
                      padding: 14,
                      background: sv ? '#86efac' : '#16a34a',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 12,
                      fontSize: 14,
                      fontWeight: 800,
                      cursor: sv ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {sv ? 'Salvando...' : '📍 Salvar Visita'}
                  </button>
                </div>
              )}

              {abaDetalhe === 'historico' && (
                <div style={{ padding: '14px 18px 28px' }}>
                  {carregandoHist ? (
                    <div style={{ padding: 30, textAlign: 'center', color: '#9ca3af' }}>
                      <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
                      <div>Carregando histórico...</div>
                    </div>
                  ) : historico.length === 0 ? (
                    <div style={{ padding: 30, textAlign: 'center', color: '#9ca3af' }}>
                      <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>Nenhuma interação registrada</div>
                      <div style={{ fontSize: 12 }}>
                        As visitas e negociações aparecerão aqui conforme forem sendo salvas.
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12, fontWeight: 500 }}>
                        {historico.length} interação{historico.length !== 1 ? 'ões' : ''} registrada
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
                            borderLeft: `3px solid ${RES_COR[h.resultado]?.replace('f', 'c') || '#e8eaed'}`,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: h.observacao ? 8 : 0 }}>
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
                              <div style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>
                                {RES_LABEL[h.resultado] || h.resultado}
                              </div>
                              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>
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
      )}

      {mo && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setMo(false)
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
            <div style={{ width: 38, height: 4, background: '#d1d5db', borderRadius: 2, margin: '11px auto 0' }} />

            {modoLead ? (
              <>
                <div style={{ padding: '14px 18px 0', display: 'flex', alignItems: 'flex-start', gap: 11 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 7 }}>
                      ⭐ Cadastrar Novo Lead{' '}
                      <span
                        style={{
                          background: '#f5f3ff',
                          color: '#8b5cf6',
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 20,
                        }}
                      >
                        PROSPECÇÃO
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                      Entra direto no pipeline como Novo Lead
                    </div>
                  </div>

                  <span onClick={() => setMo(false)} style={{ fontSize: 20, color: '#9ca3af', cursor: 'pointer', padding: 4 }}>
                    ✕
                  </span>
                </div>

                <div style={{ padding: '12px 18px 28px' }}>
                  <div
                    style={{
                      borderRadius: 9,
                      padding: '9px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 9,
                      marginBottom: 12,
                      fontSize: 12,
                      fontWeight: 600,
                      background: gs === 'ok' ? '#f0fdf4' : '#eff6ff',
                      border: `1px solid ${gs === 'ok' ? '#86efac' : '#dbeafe'}`,
                      color: gs === 'ok' ? '#16a34a' : '#2563eb',
                    }}
                  >
                    <span>{gs === 'ok' ? '📍' : '⏳'}</span>
                    <div>
                      <div style={{ fontWeight: 700 }}>{gs === 'ok' ? '✓ GPS capturado!' : 'Capturando GPS...'}</div>
                      <div style={{ fontSize: 10, fontWeight: 400 }}>{gm}</div>
                    </div>
                  </div>

                  {!scLead ? (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                        <div style={{ gridColumn: 'span 2' }}>
                          <label style={lbl}>Nome fantasia *</label>
                          <input
                            type="text"
                            value={nlNome}
                            onChange={(e) => setNlNome(e.target.value)}
                            placeholder="Ex: Mercado Bom Preço"
                            style={inp}
                          />
                        </div>

                        <div>
                          <label style={lbl}>Telefone *</label>
                          <input
                            type="tel"
                            value={nlTel}
                            onChange={(e) => setNlTel(e.target.value)}
                            placeholder="(00) 00000-0000"
                            style={inp}
                          />
                        </div>

                        <div>
                          <label style={lbl}>Responsável *</label>
                          <input
                            type="text"
                            value={nlResp}
                            onChange={(e) => setNlResp(e.target.value)}
                            placeholder="Nome do decisor"
                            style={inp}
                          />
                        </div>

                        <div style={{ gridColumn: 'span 2' }}>
                          <label style={lbl}>Segmento *</label>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 5 }}>
                            {SEGMENTOS.map((s) => (
                              <button
                                key={s}
                                onClick={() => setNlSeg(s)}
                                style={{
                                  padding: '7px 4px',
                                  borderRadius: 7,
                                  border: `2px solid ${nlSeg === s ? '#8b5cf6' : '#e8eaed'}`,
                                  background: nlSeg === s ? '#f5f3ff' : '#f4f5f7',
                                  cursor: 'pointer',
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  color: nlSeg === s ? '#8b5cf6' : '#6b7280',
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
                          <label style={lbl}>CEP</label>
                          <input
                            type="text"
                            value={nlCep}
                            onChange={(e) => setNlCep(e.target.value)}
                            placeholder="00000-000"
                            style={inp}
                          />
                        </div>

                        <div>
                          <label style={lbl}>Endereço</label>
                          <input
                            type="text"
                            value={nlEnd}
                            onChange={(e) => setNlEnd(e.target.value)}
                            placeholder="Rua, número"
                            style={inp}
                          />
                        </div>

                        <div style={{ gridColumn: 'span 2' }}>
                          <label style={lbl}>Observação inicial</label>
                          <textarea
                            rows={2}
                            value={nlObs}
                            onChange={(e) => setNlObs(e.target.value)}
                            placeholder="Ex: Interesse em benefícios, 40 funcionários..."
                            style={{ ...inp, resize: 'none' }}
                          />
                        </div>
                      </div>

                      <div
                        style={{
                          background: '#f5f3ff',
                          border: '1px solid #ddd6fe',
                          borderRadius: 9,
                          padding: '9px 12px',
                          marginBottom: 12,
                          fontSize: 11.5,
                          color: '#6d28d9',
                        }}
                      >
                        ⭐ Entrará no pipeline como <b>Novo Lead</b> com GPS salvo.
                      </div>

                      <button
                        onClick={salvarNovoLead}
                        disabled={svLead}
                        style={{
                          width: '100%',
                          padding: 13,
                          background: svLead ? '#c4b5fd' : '#8b5cf6',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 11,
                          fontSize: 14,
                          fontWeight: 800,
                          cursor: svLead ? 'not-allowed' : 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        {svLead ? 'Salvando...' : '⭐ Cadastrar Lead + Registrar Visita'}
                      </button>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px 0 10px' }}>
                      <div style={{ fontSize: 48, marginBottom: 10 }}>⭐</div>
                      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 5 }}>Lead cadastrado!</div>
                      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 10 }}>
                        {nlNome} entrou no pipeline
                      </div>

                      <div
                        style={{
                          background: '#f5f3ff',
                          border: '1px solid #ddd6fe',
                          borderRadius: 9,
                          padding: '9px 12px',
                          fontSize: 11.5,
                          color: '#7c3aed',
                          marginBottom: 16,
                        }}
                      >
                        📍 GPS salvo · Visita registrada · Status: Novo Lead
                      </div>

                      <div style={{ display: 'flex', gap: 9, justifyContent: 'center' }}>
                        <button
                          onClick={() => setMo(false)}
                          style={{
                            background: '#f4f5f7',
                            border: '1px solid #e8eaed',
                            borderRadius: 9,
                            padding: '9px 18px',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            color: '#374151',
                          }}
                        >
                          Fechar
                        </button>

                        <button
                          onClick={() => {
                            setScLead(false)
                            setNlNome('')
                            setNlTel('')
                            setNlEnd('')
                            setNlCep('')
                            setNlSeg('')
                            setNlResp('')
                            setNlObs('')
                            cgm()
                          }}
                          style={{
                            background: '#8b5cf6',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 9,
                            padding: '9px 18px',
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                          }}
                        >
                          + Outro lead
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {!sc ? (
                  <>
                    <div style={{ padding: '14px 18px 0', display: 'flex', alignItems: 'flex-start', gap: 11 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16, fontWeight: 800 }}>
                          {csel ? csel.nome_fantasia : 'Registrar Visita'}
                        </div>
                        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                          {csel ? `${csel.tipo_origem === 'lead' ? 'Lead' : 'Pós-venda'} · ${csel.subgrupo}` : 'Busque o comércio visitado'}
                        </div>
                      </div>

                      <span onClick={() => setMo(false)} style={{ fontSize: 20, color: '#9ca3af', cursor: 'pointer', padding: 4 }}>
                        ✕
                      </span>
                    </div>

                    <div style={{ padding: '12px 18px 28px' }}>
                      {!csel && (
                        <div style={{ marginBottom: 12 }}>
                          <label style={lbl}>Comércio visitado *</label>

                          <input
                            type="text"
                            placeholder="Digite o nome para buscar..."
                            value={bm}
                            onChange={(e) => setBm(e.target.value)}
                            style={inp}
                          />

                          {bm.length >= 2 && (
                            <div
                              style={{
                                background: '#fff',
                                border: '1px solid #e8eaed',
                                borderRadius: 9,
                                marginTop: 4,
                                maxHeight: 200,
                                overflowY: 'auto',
                                boxShadow: '0 4px 14px rgba(0,0,0,.09)',
                              }}
                            >
                              {cs
                                .filter((c) => c.nome_fantasia.toLowerCase().includes(bm.toLowerCase()))
                                .slice(0, 6)
                                .map((c) => {
                                  const ci = CAT[c.categoria] || CAT.outros

                                  return (
                                    <div
                                      key={c.id}
                                      onClick={() => {
                                        setCsel(c)
                                        setBm('')
                                      }}
                                      style={{
                                        padding: '10px 13px',
                                        cursor: 'pointer',
                                        borderBottom: '1px solid #f4f5f7',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                      }}
                                    >
                                      <span style={{ fontSize: 17 }}>{c.tipo_origem === 'lead' ? '⭐' : ci.icon}</span>

                                      <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: 13 }}>{c.nome_fantasia}</div>
                                        <div style={{ fontSize: 10.5, color: '#9ca3af' }}>
                                          {c.endereco?.split(' - ')[0]}
                                        </div>
                                      </div>

                                      {c.tipo_origem === 'lead' && (
                                        <span
                                          style={{
                                            background: '#f5f3ff',
                                            color: '#8b5cf6',
                                            fontSize: 9.5,
                                            fontWeight: 700,
                                            padding: '1px 6px',
                                            borderRadius: 10,
                                          }}
                                        >
                                          LEAD
                                        </span>
                                      )}
                                    </div>
                                  )
                                })}

                              {cs.filter((c) => c.nome_fantasia.toLowerCase().includes(bm.toLowerCase())).length === 0 && (
                                <div style={{ padding: '14px', textAlign: 'center' }}>
                                  <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 9 }}>
                                    "{bm}" não encontrado
                                  </div>

                                  <button
                                    onClick={iniciarNovoLead}
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

                          <button
                            onClick={iniciarNovoLead}
                            style={{
                              width: '100%',
                              marginTop: 7,
                              padding: '9px',
                              background: '#f5f3ff',
                              border: '1.5px dashed #c4b5fd',
                              borderRadius: 9,
                              fontSize: 12,
                              fontWeight: 700,
                              color: '#8b5cf6',
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                            }}
                          >
                            ⭐ Comércio novo? Cadastrar como Lead →
                          </button>
                        </div>
                      )}

                      <div
                        style={{
                          borderRadius: 9,
                          padding: '9px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 9,
                          marginBottom: 12,
                          fontSize: 12,
                          fontWeight: 600,
                          background: gs === 'ok' ? '#f0fdf4' : '#eff6ff',
                          border: `1px solid ${gs === 'ok' ? '#86efac' : '#dbeafe'}`,
                          color: gs === 'ok' ? '#16a34a' : '#2563eb',
                        }}
                      >
                        <span>{gs === 'ok' ? '📍' : '⏳'}</span>
                        <div>
                          <div style={{ fontWeight: 700 }}>{gs === 'ok' ? '✓ Localização capturada!' : 'Capturando...'}</div>
                          <div style={{ fontSize: 10, fontWeight: 400 }}>{gm}</div>
                        </div>
                      </div>

                      <div style={lbl}>Resultado *</div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 10 }}>
                        {[
                          { k: 'contato', l: '✅ Contato feito' },
                          { k: 'ausente', l: '😔 Ausente' },
                          { k: 'problema', l: '⚠️ Problema' },
                          { k: 'expansao', l: '🚀 Expansão' },
                        ].map((r) => (
                          <button
                            key={r.k}
                            onClick={() => setRs(r.k)}
                            style={{
                              padding: 10,
                              borderRadius: 9,
                              border: `2px solid ${rs === r.k ? '#2563eb' : '#e8eaed'}`,
                              background: rs === r.k ? '#eff6ff' : '#f4f5f7',
                              cursor: 'pointer',
                              fontSize: 12.5,
                              fontWeight: 600,
                              color: rs === r.k ? '#2563eb' : '#6b7280',
                              fontFamily: 'inherit',
                            }}
                          >
                            {r.l}
                          </button>
                        ))}
                      </div>

                      {rs && (
                        <div
                          style={{
                            background: statusVisual(SA[rs]).bg,
                            border: `1px solid ${statusVisual(SA[rs]).border}`,
                            borderRadius: 8,
                            padding: '8px 12px',
                            marginBottom: 10,
                            fontSize: 12,
                            fontWeight: 600,
                            color: statusVisual(SA[rs]).cor,
                          }}
                        >
                          Status automático: {statusVisual(SA[rs]).icon} {statusVisual(SA[rs]).label}
                        </div>
                      )}

                      <div style={{ marginBottom: 12 }}>
                        <label style={lbl}>Observação</label>
                        <textarea
                          rows={2}
                          value={ob}
                          onChange={(e) => setOb(e.target.value)}
                          placeholder="Ex: Responsável ausente, retornar amanhã..."
                          style={{ ...inp, resize: 'none' }}
                        />
                      </div>

                      <button
                        onClick={salvar}
                        disabled={sv}
                        style={{
                          width: '100%',
                          padding: 13,
                          background: sv ? '#86efac' : '#16a34a',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 11,
                          fontSize: 14,
                          fontWeight: 800,
                          cursor: sv ? 'not-allowed' : 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        {sv ? 'Salvando...' : '📍 Salvar Visita'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '30px 18px 26px' }}>
                    <div style={{ fontSize: 50, marginBottom: 10 }}>✅</div>
                    <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 5 }}>Visita registrada!</div>
                    <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 10 }}>{csel?.nome_fantasia}</div>

                    <div
                      style={{
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: 9,
                        padding: '9px 13px',
                        fontSize: 11.5,
                        color: '#16a34a',
                        marginBottom: 16,
                      }}
                    >
                      📍 {gla?.toFixed(5)}, {glo?.toFixed(5)} · Salvo no histórico
                    </div>

                    <div style={{ display: 'flex', gap: 9, justifyContent: 'center' }}>
                      <button
                        onClick={() => setMo(false)}
                        style={{
                          background: '#f4f5f7',
                          border: '1px solid #e8eaed',
                          borderRadius: 9,
                          padding: '9px 18px',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          color: '#374151',
                        }}
                      >
                        Fechar
                      </button>

                      <button
                        onClick={() => {
                          setSc(false)
                          setCsel(null)
                          setRs('')
                          setOb('')
                          setBm('')
                          cgm()
                        }}
                        style={{
                          background: '#2563eb',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 9,
                          padding: '9px 18px',
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        + Próxima
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
