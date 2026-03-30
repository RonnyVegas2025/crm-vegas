'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'

interface Comercio {
  id: string
  nome_fantasia: string
  razao_social: string
  cnpj: string
  endereco: string
  cidade: string
  uf: string
  telefone: string
  email: string
  categoria: string
  subgrupo: string
  taxa: number
  terminal: string
  contrato: string
  ultima_transacao: string
  consultor_pos: string
  latitude?: number
  longitude?: number
  distancia?: number
}

interface Visita {
  nome_fantasia: string
  resultado: string
  observacao: string
  latitude: number | null
  longitude: number | null
  hora: string
}

const CAT: Record<string, { icon: string; cor: string; bg: string }> = {
  supermercado: { icon: '🛒', cor: '#2563eb', bg: '#eff6ff' },
  restaurante:  { icon: '🍽', cor: '#dc2626', bg: '#fef2f2' },
  posto:        { icon: '⛽', cor: '#16a34a', bg: '#f0fdf4' },
  farmacia:     { icon: '💊', cor: '#7c3aed', bg: '#f5f3ff' },
  varejo:       { icon: '🛍', cor: '#d97706', bg: '#fffbeb' },
  outros:       { icon: '🏪', cor: '#6b7280', bg: '#f4f5f7' },
}

const PRODUTOS = [
  { id: 1, nome: 'Alimentação', icon: '🍽', cat: 'Benefícios', desc: 'Cartão benefício alimentação PAT' },
  { id: 2, nome: 'Refeição', icon: '🥘', cat: 'Benefícios', desc: 'Cartão refeição PAT' },
  { id: 3, nome: 'Aux. Farmácia', icon: '💊', cat: 'Benefícios', desc: 'Auxílio farmácia para colaboradores' },
  { id: 4, nome: 'Aux. Combustível', icon: '⛽', cat: 'Benefícios', desc: 'Vale combustível' },
  { id: 5, nome: 'Farmácia Convênio', icon: '🏥', cat: 'Convênio', desc: 'Rede credenciada de farmácias' },
  { id: 6, nome: 'Day Bank', icon: '🏦', cat: 'Convênio', desc: 'Conta digital para colaboradores' },
  { id: 7, nome: 'Combustível Frota', icon: '🚛', cat: 'Convênio', desc: 'Gestão de abastecimento de frota' },
  { id: 8, nome: 'WellHub', icon: '🏋', cat: 'Agregado', desc: 'Plataforma de bem-estar — R$4,99 a R$11,99/vida' },
  { id: 9, nome: 'Total Pass', icon: '🎯', cat: 'Agregado', desc: 'Acesso a academias — R$5,85/vida' },
  { id: 10, nome: 'Telemedicina', icon: '🩺', cat: 'Agregado', desc: 'Consultas médicas online — R$2,50/vida' },
  { id: 11, nome: 'Vidalink R$50', icon: '💊', cat: 'Agregado', desc: 'Auxílio farmácia R$50 — R$5,45/vida' },
  { id: 12, nome: 'Seguro MAC+Auto', icon: '🚗', cat: 'Agregado', desc: 'Seguro de vida + auto — R$1,05/vida' },
]

function calcularDistancia(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

function formatDist(m: number): string {
  return m < 1000 ? `${Math.round(m)}m` : `${(m/1000).toFixed(1)}km`
}

export default function PosVendaPage() {
  const supabase = createClient()
  const router = useRouter()
  const mapRef = useRef<any>(null)
  const mapInstanceRef = useRef<any>(null)

  const [comercios, setComerciosList] = useState<Comercio[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [catAtiva, setCatAtiva] = useState('')
  const [aba, setAba] = useState<'lista'|'mapa'|'historico'>('lista')
  const [visitas, setVisitas] = useState<Visita[]>([])
  const [modalAberto, setModalAberto] = useState(false)
  const [comercioSel, setComercioSel] = useState<Comercio | null>(null)
  const [detalheAberto, setDetalheAberto] = useState(false)
  const [resSel, setResSel] = useState('')
  const [obs, setObs] = useState('')
  const [proxAcao, setProxAcao] = useState('')
  const [produtosSel, setProdutosSel] = useState<number[]>([])
  const [geoLat, setGeoLat] = useState<number | null>(null)
  const [geoLng, setGeoLng] = useState<number | null>(null)
  const [geoStatus, setGeoStatus] = useState<'loading'|'ok'>('loading')
  const [geoMsg, setGeoMsg] = useState('Capturando localização...')
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [buscaModal, setBuscaModal] = useState('')
  const [usuario, setUsuario] = useState<any>(null)
  const [ordenarProx, setOrdenarProx] = useState(false)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUsuario(user)
      const { data } = await supabase.from('comercios_credenciados').select('*').eq('ativo', true).order('nome_fantasia')
      if (data) setComerciosList(data)
      setLoading(false)
    }
    init()
    capturarGeoInicial()
  }, [])

  useEffect(() => {
    async function carregarVisitas() {
      const hoje = new Date().toISOString().split('T')[0]
      const { data } = await supabase.from('visitas_campo').select('*').gte('data_visita', hoje).order('data_visita', { ascending: false })
      if (data) setVisitas(data.map((v: any) => ({
        nome_fantasia: v.nome_fantasia,
        resultado: v.resultado,
        observacao: v.observacao || '',
        latitude: v.latitude,
        longitude: v.longitude,
        hora: new Date(v.data_visita).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      })))
    }
    carregarVisitas()
  }, [sucesso])

  // Inicializar mapa quando aba muda para mapa
  useEffect(() => {
    if (aba === 'mapa' && !mapInstanceRef.current) {
      setTimeout(() => iniciarMapa(), 300)
    }
  }, [aba])

  function capturarGeoInicial() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => { setGeoLat(p.coords.latitude); setGeoLng(p.coords.longitude) },
        () => {},
        { timeout: 10000, enableHighAccuracy: true }
      )
    }
  }

  function iniciarMapa() {
    if (typeof window === 'undefined' || !mapRef.current || mapInstanceRef.current) return
    const L = (window as any).L
    if (!L) return

    const centro: [number, number] = geoLat && geoLng ? [geoLat, geoLng] : [-22.7330, -47.3340]
    const map = L.map(mapRef.current, { zoomControl: false }).setView(centro, 14)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO', maxZoom: 19
    }).addTo(map)
    mapInstanceRef.current = map

    // Pin da vendedora
    if (geoLat && geoLng) {
      const myIco = L.divIcon({
        className: '',
        html: `<div style="width:16px;height:16px;background:#2563eb;border-radius:50%;border:3px solid white;box-shadow:0 0 0 6px rgba(37,99,235,0.2),0 2px 8px rgba(0,0,0,0.3)"></div>`,
        iconSize: [16, 16], iconAnchor: [8, 8]
      })
      L.marker([geoLat, geoLng], { icon: myIco }).addTo(map).bindPopup('<b style="font-family:sans-serif">📍 Você está aqui</b>')
    }

    // Pins dos comércios
    comercios.forEach(c => {
      if (!c.latitude || !c.longitude) return
      const ci = CAT[c.categoria] || CAT.outros
      const visitado = visitas.find(v => v.nome_fantasia === c.nome_fantasia)
      const cor = visitado ? '#16a34a' : ci.cor
      const ico = L.divIcon({
        className: '',
        html: `<div style="width:32px;height:32px;background:${cor};border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center"><span style="transform:rotate(45deg);font-size:14px">${visitado ? '✓' : ci.icon}</span></div>`,
        iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -34]
      })
      const diasUlt = c.ultima_transacao ? Math.floor((Date.now() - new Date(c.ultima_transacao).getTime()) / 86400000) : 999
      const dist = geoLat && geoLng ? formatDist(calcularDistancia(geoLat, geoLng, c.latitude!, c.longitude!)) : ''
      L.marker([c.latitude, c.longitude], { icon: ico }).addTo(map).bindPopup(`
        <div style="font-family:sans-serif;min-width:190px">
          <b style="font-size:13px">${c.nome_fantasia}</b>
          <div style="font-size:11px;color:#6b7280;margin:3px 0">${c.endereco?.split(' - ')[0]}</div>
          <div style="font-size:11px;margin:4px 0">📞 ${c.telefone} · Taxa: <b>${c.taxa}%</b></div>
          ${dist ? `<div style="font-size:11px;color:#2563eb;font-weight:600">📍 ${dist} de você</div>` : ''}
          ${diasUlt > 30 ? `<div style="font-size:11px;color:#dc2626;margin-top:4px">⚠ Última tx há ${diasUlt} dias</div>` : ''}
          <button onclick="window.__abrirComercio('${c.id}')" style="margin-top:8px;background:#2563eb;color:#fff;border:none;border-radius:6px;padding:6px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:sans-serif;width:100%">Ver detalhes + Registrar visita</button>
        </div>`, { maxWidth: 220 })
    })

    // Função global para abrir do popup
    ;(window as any).__abrirComercio = (id: string) => {
      const c = comercios.find(x => x.id === id)
      if (c) { setComercioSel(c); setDetalheAberto(true) }
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Calcular distâncias
  const comerciosComDist = comercios.map(c => ({
    ...c,
    distancia: (geoLat && geoLng && c.latitude && c.longitude)
      ? calcularDistancia(geoLat, geoLng, c.latitude, c.longitude)
      : undefined
  }))

  const filtrados = comerciosComDist
    .filter(c => {
      const matchCat = !catAtiva || c.categoria === catAtiva
      const matchBusca = !busca || c.nome_fantasia.toLowerCase().includes(busca.toLowerCase()) || c.razao_social?.toLowerCase().includes(busca.toLowerCase())
      return matchCat && matchBusca
    })
    .sort((a, b) => {
      if (ordenarProx && a.distancia != null && b.distancia != null) return a.distancia - b.distancia
      return a.nome_fantasia.localeCompare(b.nome_fantasia)
    })

  function abrirDetalhe(c: Comercio) {
    setComercioSel(c)
    setProdutosSel([])
    setDetalheAberto(true)
  }

  function abrirModal(c: Comercio | null) {
    setComercioSel(c)
    setResSel(''); setObs(''); setProxAcao(''); setProdutosSel([])
    setSucesso(false); setBuscaModal('')
    setGeoStatus('loading'); setGeoMsg('Capturando localização...')
    setModalAberto(true)
    capturarGeoModal()
  }

  function capturarGeoModal() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => {
          setGeoLat(p.coords.latitude); setGeoLng(p.coords.longitude)
          setGeoStatus('ok'); setGeoMsg(`${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)} · Precisão: ${Math.round(p.coords.accuracy)}m`)
        },
        () => { setGeoStatus('ok'); setGeoMsg('Localização aproximada') },
        { timeout: 8000, enableHighAccuracy: true }
      )
    } else { setGeoStatus('ok'); setGeoMsg('GPS não disponível') }
  }

  function toggleProduto(id: number) {
    setProdutosSel(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function salvarVisita() {
    if (!comercioSel) { alert('Selecione o comércio.'); return }
    if (!resSel) { alert('Selecione o resultado.'); return }
    setSalvando(true)

    const produtoNomes = PRODUTOS.filter(p => produtosSel.includes(p.id)).map(p => p.nome).join(', ')
    const obsCompleta = [obs, produtoNomes ? `Produtos apresentados: ${produtoNomes}` : ''].filter(Boolean).join(' | ')

    const { error } = await supabase.from('visitas_campo').insert({
      vendedor_id: usuario?.id,
      nome_fantasia: comercioSel.nome_fantasia,
      tipo_estabelecimento: comercioSel.categoria,
      latitude: geoLat ?? -22.7330,
      longitude: geoLng ?? -47.3340,
      resultado: resSel,
      observacao: obsCompleta || null,
      data_visita: new Date().toISOString(),
    })
    setSalvando(false)
    if (!error) { setSucesso(true); setDetalheAberto(false) }
    else alert('Erro ao salvar. Tente novamente.')
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: "'Plus Jakarta Sans',sans-serif", color: '#6b7280' }}>
      <div style={{ textAlign: 'center' }}><div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div><div style={{ fontWeight: 600 }}>Carregando comércios...</div></div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: "'Plus Jakarta Sans',sans-serif", overflow: 'hidden' }}>

      {/* Leaflet CSS */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" async />

      {/* TOPBAR */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8eaed', height: 54, display: 'flex', alignItems: 'center', padding: '0 18px', gap: 12, flexShrink: 0 }}>
        <div style={{ width: 32, height: 32, background: '#16181d', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#f59e0b', flexShrink: 0 }}>V</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>Vegas CRM · Pós-Venda</div>
          <div style={{ fontSize: 10.5, color: '#9ca3af' }}>{usuario?.email}</div>
        </div>
        <button onClick={() => abrirModal(null)} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
          📍 Registrar visita
        </button>
        <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid #e8eaed', borderRadius: 7, padding: '7px 12px', fontSize: 12, color: '#6b7280', cursor: 'pointer', fontFamily: 'inherit' }}>Sair</button>
      </div>

      {/* KPIs */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8eaed', display: 'flex', gap: 10, padding: '10px 18px', flexShrink: 0, overflowX: 'auto' }}>
        {[
          { label: 'Total comércios', val: comercios.length, cor: '#2563eb' },
          { label: 'Visitados hoje', val: visitas.length, cor: '#16a34a' },
          { label: 'Pendentes', val: comercios.length - visitas.length, cor: '#d97706' },
          { label: 'Cidade', val: 'Americana/SP', cor: '#111827', small: true },
          { label: 'GPS', val: geoLat ? '✓ Ativo' : '⏳', cor: geoLat ? '#16a34a' : '#9ca3af', small: true },
        ].map(k => (
          <div key={k.label} style={{ background: '#f4f5f7', border: '1px solid #e8eaed', borderRadius: 10, padding: '9px 16px', minWidth: 110, flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 3 }}>{k.label}</div>
            <div style={{ fontSize: (k as any).small ? 14 : 22, fontWeight: 800, color: k.cor, lineHeight: 1 }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8eaed', display: 'flex', padding: '0 18px', flexShrink: 0 }}>
        {[
          { key: 'lista', label: `📋 Comércios (${filtrados.length})` },
          { key: 'mapa', label: '🗺 Mapa' },
          { key: 'historico', label: `📊 Hoje (${visitas.length})` },
        ].map(t => (
          <div key={t.key} onClick={() => setAba(t.key as any)} style={{ padding: '10px 16px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', color: aba === t.key ? '#2563eb' : '#6b7280', borderBottom: `2px solid ${aba === t.key ? '#2563eb' : 'transparent'}`, marginBottom: -1 }}>
            {t.label}
          </div>
        ))}
      </div>

      {/* CONTEÚDO */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* ABA LISTA */}
        {aba === 'lista' && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e8eaed', background: '#fff', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" placeholder="🔍 Buscar comércio..." value={busca} onChange={e => setBusca(e.target.value)}
                  style={{ flex: 1, padding: '9px 13px', border: '1.5px solid #e8eaed', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#f4f5f7' }} />
                {geoLat && (
                  <button onClick={() => setOrdenarProx(!ordenarProx)} style={{ padding: '9px 14px', borderRadius: 8, border: `1.5px solid ${ordenarProx ? '#2563eb' : '#e8eaed'}`, background: ordenarProx ? '#eff6ff' : '#f4f5f7', color: ordenarProx ? '#2563eb' : '#6b7280', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                    📍 {ordenarProx ? 'Mais próximos ✓' : 'Por proximidade'}
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[{ key: '', label: 'Todos' }, { key: 'supermercado', label: '🛒 Mercado' }, { key: 'restaurante', label: '🍽 Rest.' }, { key: 'posto', label: '⛽ Posto' }, { key: 'farmacia', label: '💊 Farmácia' }, { key: 'varejo', label: '🛍 Varejo' }].map(f => (
                  <button key={f.key} onClick={() => setCatAtiva(f.key)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `1.5px solid ${catAtiva === f.key ? '#2563eb' : '#e8eaed'}`, background: catAtiva === f.key ? '#2563eb' : '#f4f5f7', color: catAtiva === f.key ? '#fff' : '#6b7280', fontFamily: 'inherit' }}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {filtrados.map(c => {
              const ci = CAT[c.categoria] || CAT.outros
              const visitado = visitas.find(v => v.nome_fantasia === c.nome_fantasia)
              const diasUlt = c.ultima_transacao ? Math.floor((Date.now() - new Date(c.ultima_transacao).getTime()) / 86400000) : 999
              return (
                <div key={c.id} onClick={() => abrirDetalhe(c)} style={{ padding: '13px 16px', borderBottom: '1px solid #e8eaed', background: '#fff', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fafbfc')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: ci.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{ci.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827' }}>{c.nome_fantasia}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{c.razao_social}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 7, flexWrap: 'wrap' }}>
                        {visitado
                          ? <span style={{ background: '#f0fdf4', color: '#16a34a', fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>✓ Visitado {visitado.hora}</span>
                          : diasUlt > 30
                            ? <span style={{ background: '#fef2f2', color: '#dc2626', fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>⚠ Última tx +{diasUlt}d</span>
                            : <span style={{ background: '#fffbeb', color: '#d97706', fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 20 }}>Pendente</span>
                        }
                        <span style={{ fontSize: 11, color: '#9ca3af' }}>📍 {c.endereco?.split(' - ')[0]}</span>
                        {c.distancia != null && <span style={{ fontSize: 11, color: '#2563eb', fontWeight: 600 }}>📍 {formatDist(c.distancia)}</span>}
                        <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, marginLeft: 'auto' }}>Taxa: {c.taxa}%</span>
                      </div>
                    </div>
                    <div style={{ color: '#9ca3af', fontSize: 16, marginLeft: 4 }}>›</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ABA MAPA */}
        {aba === 'mapa' && (
          <div style={{ flex: 1, position: 'relative' }}>
            <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
            <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 500 }}>
              <button onClick={() => abrirModal(null)} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 50, padding: '12px 22px', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(22,163,74,0.4)', display: 'flex', alignItems: 'center', gap: 8 }}>
                📍 Registrar Visita Aqui
              </button>
            </div>
          </div>
        )}

        {/* ABA HISTÓRICO */}
        {aba === 'historico' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {visitas.length === 0
              ? <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}><div style={{ fontSize: 36, marginBottom: 10 }}>📋</div><div style={{ fontWeight: 600 }}>Nenhuma visita hoje ainda</div></div>
              : visitas.map((v, i) => (
                <div key={i} style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: 12, padding: 16, marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: v.resultado === 'contato' ? '#f0fdf4' : v.resultado === 'expansao' ? '#eff6ff' : v.resultado === 'problema' ? '#fef2f2' : '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                      {v.resultado === 'contato' ? '✅' : v.resultado === 'ausente' ? '😔' : v.resultado === 'problema' ? '⚠️' : '🚀'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{v.nome_fantasia}</div>
                      <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 2 }}>{v.hora}</div>
                    </div>
                    {v.latitude && <div style={{ fontSize: 10, color: '#16a34a', fontWeight: 600 }}>📍 GPS ✓</div>}
                  </div>
                  {v.observacao && <div style={{ background: '#f4f5f7', borderRadius: 8, padding: '9px 12px', marginTop: 10, fontSize: 12.5, color: '#374151' }}>{v.observacao}</div>}
                </div>
              ))
            }
          </div>
        )}
      </div>

      {/* MODAL DETALHE DO COMÉRCIO */}
      {detalheAberto && comercioSel && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(3px)' }}>
          <div style={{ background: '#fff', borderRadius: '22px 22px 0 0', width: '100%', maxWidth: 600, maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ width: 40, height: 4, background: '#d1d5db', borderRadius: 2, margin: '12px auto 0' }} />

            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e8eaed', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: (CAT[comercioSel.categoria] || CAT.outros).bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
                {(CAT[comercioSel.categoria] || CAT.outros).icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>{comercioSel.nome_fantasia}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{comercioSel.razao_social}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                  <span style={{ background: '#eff6ff', color: '#1d4ed8', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20 }}>Taxa: {comercioSel.taxa}%</span>
                  <span style={{ background: '#f4f5f7', color: '#6b7280', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20 }}>{comercioSel.terminal}</span>
                  {comercioSel.distancia != null && <span style={{ background: '#f0fdf4', color: '#16a34a', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20 }}>📍 {formatDist(comercioSel.distancia)} de você</span>}
                </div>
              </div>
              <span onClick={() => setDetalheAberto(false)} style={{ fontSize: 20, color: '#9ca3af', cursor: 'pointer', padding: 4 }}>✕</span>
            </div>

            <div style={{ padding: '16px 20px' }}>

              {/* Dados do comércio */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                {[
                  { label: 'Endereço', val: comercioSel.endereco },
                  { label: 'Telefone', val: comercioSel.telefone || '—' },
                  { label: 'E-mail', val: comercioSel.email || '—' },
                  { label: 'Contrato', val: comercioSel.contrato },
                  { label: 'Segmento', val: comercioSel.subgrupo },
                  { label: 'Última Transação', val: comercioSel.ultima_transacao ? new Date(comercioSel.ultima_transacao).toLocaleDateString('pt-BR') : '—' },
                ].map(f => (
                  <div key={f.label}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 3 }}>{f.label}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: '#111827', wordBreak: 'break-word' }}>{f.val}</div>
                  </div>
                ))}
              </div>

              {/* Produtos para apresentar */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#111827', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  📦 Produtos para apresentar
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', background: '#f4f5f7', padding: '2px 8px', borderRadius: 20 }}>Selecione os que vai oferecer</span>
                </div>

                {['Benefícios', 'Convênio', 'Agregado'].map(cat => (
                  <div key={cat} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 7 }}>{cat}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
                      {PRODUTOS.filter(p => p.cat === cat).map(p => (
                        <div key={p.id} onClick={() => toggleProduto(p.id)} style={{ padding: '10px 12px', borderRadius: 10, border: `2px solid ${produtosSel.includes(p.id) ? '#2563eb' : '#e8eaed'}`, background: produtosSel.includes(p.id) ? '#eff6ff' : '#f4f5f7', cursor: 'pointer', transition: 'all .15s', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <span style={{ fontSize: 18, flexShrink: 0 }}>{p.icon}</span>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: produtosSel.includes(p.id) ? '#1d4ed8' : '#111827' }}>{p.nome}</div>
                            <div style={{ fontSize: 10.5, color: '#6b7280', marginTop: 1, lineHeight: 1.3 }}>{p.desc}</div>
                          </div>
                          {produtosSel.includes(p.id) && <span style={{ marginLeft: 'auto', color: '#2563eb', fontSize: 14, flexShrink: 0 }}>✓</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Resultado da visita */}
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>Resultado da visita *</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                {[{ key: 'contato', label: '✅ Contato feito' }, { key: 'ausente', label: '😔 Responsável ausente' }, { key: 'problema', label: '⚠️ Problema identificado' }, { key: 'expansao', label: '🚀 Interesse em expansão' }].map(r => (
                  <button key={r.key} onClick={() => setResSel(r.key)} style={{ padding: 12, borderRadius: 10, border: `2px solid ${resSel === r.key ? '#2563eb' : '#e8eaed'}`, background: resSel === r.key ? '#eff6ff' : '#f4f5f7', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: resSel === r.key ? '#2563eb' : '#6b7280', fontFamily: 'inherit' }}>
                    {r.label}
                  </button>
                ))}
              </div>

              {/* Observação */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>Observação</div>
                <textarea rows={2} value={obs} onChange={e => setObs(e.target.value)} placeholder="Ex: Gerente demonstrou interesse no WellHub, ligar semana que vem..."
                  style={{ width: '100%', padding: '10px 13px', border: '1.5px solid #e8eaed', borderRadius: 9, fontSize: 13.5, fontFamily: 'inherit', outline: 'none', background: '#f4f5f7', resize: 'none' }} />
              </div>

              <button onClick={salvarVisita} disabled={salvando} style={{ width: '100%', padding: 15, background: salvando ? '#86efac' : '#16a34a', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: salvando ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginBottom: 8 }}>
                {salvando ? 'Salvando...' : '📍 Salvar Visita de Pós-Venda'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR RÁPIDO */}
      {modalAberto && (
        <div onClick={e => { if (e.target === e.currentTarget) setModalAberto(false) }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(3px)' }}>
          <div style={{ background: '#fff', borderRadius: '22px 22px 0 0', width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ width: 40, height: 4, background: '#d1d5db', borderRadius: 2, margin: '12px auto 0' }} />

            {!sucesso ? (
              <>
                <div style={{ padding: '14px 20px 0', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 17, fontWeight: 800 }}>{comercioSel ? comercioSel.nome_fantasia : 'Registrar Visita'}</div>
                    <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 2 }}>{comercioSel ? `Taxa: ${comercioSel.taxa}% · ${comercioSel.terminal}` : 'Selecione o comércio visitado'}</div>
                  </div>
                  <span onClick={() => setModalAberto(false)} style={{ fontSize: 20, color: '#9ca3af', cursor: 'pointer', padding: 4 }}>✕</span>
                </div>

                <div style={{ padding: '14px 20px 28px' }}>
                  {!comercioSel && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>Comércio visitado *</div>
                      <input type="text" placeholder="Digite o nome..." value={buscaModal} onChange={e => setBuscaModal(e.target.value)}
                        style={{ width: '100%', padding: '11px 13px', border: '1.5px solid #e8eaed', borderRadius: 9, fontSize: 14, fontFamily: 'inherit', outline: 'none', background: '#f4f5f7' }} />
                      {buscaModal.length >= 2 && (
                        <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: 9, marginTop: 4, maxHeight: 180, overflowY: 'auto', boxShadow: '0 4px 14px rgba(0,0,0,.09)' }}>
                          {comercios.filter(c => c.nome_fantasia.toLowerCase().includes(buscaModal.toLowerCase())).slice(0, 6).map(c => {
                            const ci = CAT[c.categoria] || CAT.outros
                            return (
                              <div key={c.id} onClick={() => { setComercioSel(c); setBuscaModal('') }} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f4f5f7', display: 'flex', alignItems: 'center', gap: 9 }}>
                                <span style={{ fontSize: 18 }}>{ci.icon}</span>
                                <div><div style={{ fontWeight: 600, fontSize: 13 }}>{c.nome_fantasia}</div><div style={{ fontSize: 11, color: '#9ca3af' }}>{c.endereco?.split(' - ')[0]}</div></div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ borderRadius: 10, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, fontSize: 12.5, fontWeight: 600, background: geoStatus === 'ok' ? '#f0fdf4' : '#eff6ff', border: `1px solid ${geoStatus === 'ok' ? '#86efac' : '#dbeafe'}`, color: geoStatus === 'ok' ? '#16a34a' : '#2563eb' }}>
                    <span>{geoStatus === 'ok' ? '📍' : '⏳'}</span>
                    <div><div style={{ fontWeight: 700 }}>{geoStatus === 'ok' ? '✓ Localização capturada!' : 'Capturando...'}</div><div style={{ fontSize: 11, fontWeight: 400 }}>{geoMsg}</div></div>
                  </div>

                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>Resultado *</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                    {[{ key: 'contato', label: '✅ Contato feito' }, { key: 'ausente', label: '😔 Responsável ausente' }, { key: 'problema', label: '⚠️ Problema' }, { key: 'expansao', label: '🚀 Expansão' }].map(r => (
                      <button key={r.key} onClick={() => setResSel(r.key)} style={{ padding: 12, borderRadius: 10, border: `2px solid ${resSel === r.key ? '#2563eb' : '#e8eaed'}`, background: resSel === r.key ? '#eff6ff' : '#f4f5f7', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: resSel === r.key ? '#2563eb' : '#6b7280', fontFamily: 'inherit' }}>
                        {r.label}
                      </button>
                    ))}
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>Observação</div>
                    <textarea rows={2} value={obs} onChange={e => setObs(e.target.value)} placeholder="Ex: Responsável ausente, retornar amanhã cedo..."
                      style={{ width: '100%', padding: '10px 13px', border: '1.5px solid #e8eaed', borderRadius: 9, fontSize: 13.5, fontFamily: 'inherit', outline: 'none', background: '#f4f5f7', resize: 'none' }} />
                  </div>

                  <button onClick={salvarVisita} disabled={salvando} style={{ width: '100%', padding: 15, background: salvando ? '#86efac' : '#16a34a', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: salvando ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                    {salvando ? 'Salvando...' : '📍 Salvar Visita'}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 20px 28px' }}>
                <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
                <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Visita registrada!</div>
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>{comercioSel?.nome_fantasia}</div>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#16a34a', marginBottom: 20 }}>
                  📍 {geoLat?.toFixed(5)}, {geoLng?.toFixed(5)} · Salvo com timestamp
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button onClick={() => setModalAberto(false)} style={{ background: '#f4f5f7', border: '1px solid #e8eaed', borderRadius: 9, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: '#374151' }}>Fechar</button>
                  <button onClick={() => { setSucesso(false); setComercioSel(null); setResSel(''); setObs(''); setBuscaModal(''); capturarGeoModal() }} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 9, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>+ Próxima visita</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
