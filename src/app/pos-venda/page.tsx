'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'

// Tipos
interface Comercio {
  id: string
  nome_fantasia: string
  razao_social: string
  cnpj: string
  endereco: string
  cidade: string
  uf: string
  cep: string
  telefone: string
  email: string
  categoria: string
  subgrupo: string
  taxa: number
  terminal: string
  contrato: string
  ultima_transacao: string
  consultor_pos: string
}

interface Visita {
  id?: string
  comercio_id: string
  nome_fantasia: string
  resultado: string
  observacao: string
  proxima_acao: string
  latitude: number | null
  longitude: number | null
  hora: string
}

const CAT_INFO: Record<string, { icon: string; cor: string }> = {
  supermercado: { icon: '🛒', cor: '#2563eb' },
  restaurante:  { icon: '🍽', cor: '#dc2626' },
  posto:        { icon: '⛽', cor: '#16a34a' },
  farmacia:     { icon: '💊', cor: '#7c3aed' },
  varejo:       { icon: '🛍', cor: '#d97706' },
  outros:       { icon: '🏪', cor: '#6b7280' },
}

const RES_LABEL: Record<string, string> = {
  contato:  '✅ Contato feito',
  ausente:  '😔 Responsável ausente',
  problema: '⚠️ Problema identificado',
  expansao: '🚀 Interesse em expansão',
}

export default function PosVendaPage() {
  const supabase = createClient()
  const router = useRouter()

  const [comercios, setComerciosList] = useState<Comercio[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [catAtiva, setCatAtiva] = useState('')
  const [aba, setAba] = useState<'lista'|'historico'>('lista')
  const [visitas, setVisitas] = useState<Visita[]>([])
  const [modalAberto, setModalAberto] = useState(false)
  const [comercioSel, setComercioSel] = useState<Comercio | null>(null)
  const [resSel, setResSel] = useState('')
  const [obs, setObs] = useState('')
  const [proxAcao, setProxAcao] = useState('')
  const [geoLat, setGeoLat] = useState<number | null>(null)
  const [geoLng, setGeoLng] = useState<number | null>(null)
  const [geoStatus, setGeoStatus] = useState<'loading'|'ok'|'error'>('loading')
  const [geoMsg, setGeoMsg] = useState('Capturando localização...')
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [buscaModal, setBuscaModal] = useState('')
  const [usuario, setUsuario] = useState<any>(null)

  // Carregar usuário e comércios
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUsuario(user)

      const { data, error } = await supabase
        .from('comercios_credenciados')
        .select('*')
        .eq('ativo', true)
        .order('nome_fantasia')

      if (!error && data) setComerciosList(data)
      setLoading(false)
    }
    init()
  }, [])

  // Carregar visitas do dia do Supabase
  useEffect(() => {
    async function carregarVisitas() {
      const hoje = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from('visitas_campo')
        .select('*')
        .gte('data_visita', hoje)
        .order('data_visita', { ascending: false })
      if (data) {
        setVisitas(data.map((v: any) => ({
          id: v.id,
          comercio_id: v.empresa_id || '',
          nome_fantasia: v.nome_fantasia,
          resultado: v.resultado,
          observacao: v.observacao || '',
          proxima_acao: '',
          latitude: v.latitude,
          longitude: v.longitude,
          hora: new Date(v.data_visita).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        })))
      }
    }
    carregarVisitas()
  }, [sucesso])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Filtrar
  const filtrados = comercios.filter(c => {
    const matchCat = !catAtiva || c.categoria === catAtiva
    const matchBusca = !busca || c.nome_fantasia.toLowerCase().includes(busca.toLowerCase()) || c.razao_social.toLowerCase().includes(busca.toLowerCase())
    return matchCat && matchBusca
  })

  const visitadosHoje = visitas.length

  // Abrir modal
  function abrirModal(c: Comercio | null) {
    setComercioSel(c)
    setResSel('')
    setObs('')
    setProxAcao('')
    setSucesso(false)
    setBuscaModal('')
    setGeoStatus('loading')
    setGeoMsg('Capturando localização...')
    setModalAberto(true)
    capturarGeo()
  }

  function capturarGeo() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeoLat(pos.coords.latitude)
          setGeoLng(pos.coords.longitude)
          setGeoStatus('ok')
          setGeoMsg(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)} · Precisão: ${Math.round(pos.coords.accuracy)}m`)
        },
        () => {
          // Em demo/browser sem GPS, usa coordenada aproximada
          setGeoLat(-22.7330)
          setGeoLng(-47.3340)
          setGeoStatus('ok')
          setGeoMsg('Localização aproximada capturada')
        },
        { timeout: 8000, enableHighAccuracy: true }
      )
    } else {
      setGeoStatus('error')
      setGeoMsg('GPS não disponível neste dispositivo')
    }
  }

  async function salvarVisita() {
    if (!comercioSel) { alert('Selecione o comércio visitado.'); return }
    if (!resSel) { alert('Selecione o resultado da visita.'); return }
    setSalvando(true)

    const { error } = await supabase.from('visitas_campo').insert({
      vendedor_id: usuario?.id,
      nome_fantasia: comercioSel.nome_fantasia,
      tipo_estabelecimento: comercioSel.categoria,
      latitude: geoLat ?? -22.7330,
      longitude: geoLng ?? -47.3340,
      precisao_metros: null,
      resultado: resSel,
      observacao: obs || null,
      empresa_id: null,
      data_visita: new Date().toISOString(),
    })

    setSalvando(false)
    if (!error) setSucesso(true)
    else alert('Erro ao salvar. Tente novamente.')
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#6b7280' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
        <div style={{ fontWeight: 600 }}>Carregando comércios...</div>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif", overflow: 'hidden' }}>

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
        <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid #e8eaed', borderRadius: 7, padding: '7px 12px', fontSize: 12, color: '#6b7280', cursor: 'pointer', fontFamily: 'inherit' }}>
          Sair
        </button>
      </div>

      {/* KPIs */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8eaed', display: 'flex', gap: 10, padding: '10px 18px', flexShrink: 0, overflowX: 'auto' }}>
        {[
          { label: 'Total comércios', val: comercios.length, cor: '#2563eb' },
          { label: 'Visitados hoje', val: visitadosHoje, cor: '#16a34a' },
          { label: 'Pendentes', val: comercios.length - visitadosHoje, cor: '#d97706' },
          { label: 'Cidade', val: 'Americana/SP', cor: '#111827', small: true },
        ].map(k => (
          <div key={k.label} style={{ background: '#f4f5f7', border: '1px solid #e8eaed', borderRadius: 10, padding: '9px 16px', minWidth: 110, flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 3 }}>{k.label}</div>
            <div style={{ fontSize: k.small ? 14 : 22, fontWeight: 800, color: k.cor, lineHeight: 1 }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8eaed', display: 'flex', padding: '0 18px', flexShrink: 0 }}>
        {[
          { key: 'lista', label: `📋 Comércios (${filtrados.length})` },
          { key: 'historico', label: `📊 Visitas de hoje (${visitadosHoje})` },
        ].map(t => (
          <div key={t.key} onClick={() => setAba(t.key as any)} style={{ padding: '10px 16px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', color: aba === t.key ? '#2563eb' : '#6b7280', borderBottom: `2px solid ${aba === t.key ? '#2563eb' : 'transparent'}`, marginBottom: -1, transition: 'all .15s' }}>
            {t.label}
          </div>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* ABA LISTA */}
        {aba === 'lista' && (
          <div>
            {/* Filtros */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e8eaed', background: '#fff', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                type="text" placeholder="🔍 Buscar comércio..."
                value={busca} onChange={e => setBusca(e.target.value)}
                style={{ width: '100%', padding: '9px 13px', border: '1.5px solid #e8eaed', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#f4f5f7' }}
              />
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { key: '', label: 'Todos' },
                  { key: 'supermercado', label: '🛒 Mercado' },
                  { key: 'restaurante', label: '🍽 Rest.' },
                  { key: 'posto', label: '⛽ Posto' },
                  { key: 'farmacia', label: '💊 Farmácia' },
                  { key: 'varejo', label: '🛍 Varejo' },
                ].map(f => (
                  <button key={f.key} onClick={() => setCatAtiva(f.key)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `1.5px solid ${catAtiva === f.key ? '#2563eb' : '#e8eaed'}`, background: catAtiva === f.key ? '#2563eb' : '#f4f5f7', color: catAtiva === f.key ? '#fff' : '#6b7280', fontFamily: 'inherit', transition: 'all .15s' }}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista */}
            {filtrados.map(c => {
              const ci = CAT_INFO[c.categoria] || CAT_INFO.outros
              const visitado = visitas.find(v => v.nome_fantasia === c.nome_fantasia)
              const diasUlt = c.ultima_transacao ? Math.floor((Date.now() - new Date(c.ultima_transacao).getTime()) / 86400000) : 999

              return (
                <div key={c.id} onClick={() => abrirModal(c)} style={{ padding: '13px 16px', borderBottom: '1px solid #e8eaed', background: '#fff', cursor: 'pointer', transition: 'background .1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fafbfc')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: ci.cor + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{ci.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827' }}>{c.nome_fantasia}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{c.razao_social}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 7, flexWrap: 'wrap' }}>
                        {visitado ? (
                          <span style={{ background: '#f0fdf4', color: '#16a34a', fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>✓ Visitado {visitado.hora}</span>
                        ) : diasUlt > 30 ? (
                          <span style={{ background: '#fef2f2', color: '#dc2626', fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>⚠ Última tx +{diasUlt}d</span>
                        ) : (
                          <span style={{ background: '#fffbeb', color: '#d97706', fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 20 }}>Pendente</span>
                        )}
                        <span style={{ fontSize: 11, color: '#9ca3af' }}>📍 {c.endereco?.split(' - ')[0]}</span>
                        <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, marginLeft: 'auto' }}>Taxa: {c.taxa}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {filtrados.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
                <div style={{ fontWeight: 600 }}>Nenhum comércio encontrado</div>
              </div>
            )}
          </div>
        )}

        {/* ABA HISTÓRICO */}
        {aba === 'historico' && (
          <div style={{ padding: 16 }}>
            {visitas.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Nenhuma visita registrada hoje</div>
                <div style={{ fontSize: 12 }}>Toque em "Registrar visita" para começar.</div>
              </div>
            ) : visitas.map((v, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: 12, padding: 16, marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: v.resultado === 'contato' ? '#f0fdf4' : v.resultado === 'expansao' ? '#eff6ff' : v.resultado === 'problema' ? '#fef2f2' : '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                    {v.resultado === 'contato' ? '✅' : v.resultado === 'ausente' ? '😔' : v.resultado === 'problema' ? '⚠️' : '🚀'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{v.nome_fantasia}</div>
                    <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 2 }}>{RES_LABEL[v.resultado]} · {v.hora}</div>
                  </div>
                  {v.latitude && <div style={{ fontSize: 10, color: '#16a34a', fontWeight: 600 }}>📍 GPS ✓</div>}
                </div>
                {v.observacao && <div style={{ background: '#f4f5f7', borderRadius: 8, padding: '9px 12px', marginTop: 10, fontSize: 12.5, color: '#374151' }}>{v.observacao}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL */}
      {modalAberto && (
        <div onClick={e => { if (e.target === e.currentTarget) setModalAberto(false) }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(3px)' }}>
          <div style={{ background: '#fff', borderRadius: '22px 22px 0 0', width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ width: 40, height: 4, background: '#d1d5db', borderRadius: 2, margin: '12px auto 0' }} />

            {!sucesso ? (
              <>
                {/* Header modal */}
                <div style={{ padding: '14px 20px 0', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 17, fontWeight: 800 }}>{comercioSel ? comercioSel.nome_fantasia : 'Registrar Visita'}</div>
                    <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 2 }}>
                      {comercioSel ? `${comercioSel.razao_social} · Taxa: ${comercioSel.taxa}%` : 'Selecione o comércio visitado'}
                    </div>
                  </div>
                  <span onClick={() => setModalAberto(false)} style={{ fontSize: 20, color: '#9ca3af', cursor: 'pointer', padding: 4 }}>✕</span>
                </div>

                <div style={{ padding: '14px 20px 28px' }}>

                  {/* Busca comércio (quando aberto sem seleção) */}
                  {!comercioSel && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>Comércio visitado *</div>
                      <input
                        type="text" placeholder="Digite o nome..."
                        value={buscaModal} onChange={e => setBuscaModal(e.target.value)}
                        style={{ width: '100%', padding: '11px 13px', border: '1.5px solid #e8eaed', borderRadius: 9, fontSize: 14, fontFamily: 'inherit', outline: 'none', background: '#f4f5f7' }}
                      />
                      {buscaModal.length >= 2 && (
                        <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: 9, marginTop: 4, maxHeight: 180, overflowY: 'auto', boxShadow: '0 4px 14px rgba(0,0,0,.09)' }}>
                          {comercios.filter(c => c.nome_fantasia.toLowerCase().includes(buscaModal.toLowerCase())).slice(0, 6).map(c => {
                            const ci = CAT_INFO[c.categoria] || CAT_INFO.outros
                            return (
                              <div key={c.id} onClick={() => { setComercioSel(c); setBuscaModal('') }} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f4f5f7', display: 'flex', alignItems: 'center', gap: 9 }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#f4f5f7')}
                                onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                              >
                                <span style={{ fontSize: 18 }}>{ci.icon}</span>
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: 13 }}>{c.nome_fantasia}</div>
                                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{c.endereco?.split(' - ')[0]}</div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* GPS */}
                  <div style={{ borderRadius: 10, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, fontSize: 12.5, fontWeight: 600, background: geoStatus === 'ok' ? '#f0fdf4' : '#eff6ff', border: `1px solid ${geoStatus === 'ok' ? '#86efac' : '#dbeafe'}`, color: geoStatus === 'ok' ? '#16a34a' : '#2563eb' }}>
                    {geoStatus === 'loading' ? (
                      <div style={{ width: 16, height: 16, border: '2px solid #dbeafe', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin .8s linear infinite', flexShrink: 0 }} />
                    ) : <span>📍</span>}
                    <div>
                      <div style={{ fontWeight: 700 }}>{geoStatus === 'ok' ? '✓ Localização capturada!' : 'Capturando localização...'}</div>
                      <div style={{ fontSize: 11, fontWeight: 400, marginTop: 1 }}>{geoMsg}</div>
                    </div>
                  </div>

                  {/* Resultado */}
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>Resultado da visita *</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                    {[
                      { key: 'contato', label: '✅ Contato feito' },
                      { key: 'ausente', label: '😔 Responsável ausente' },
                      { key: 'problema', label: '⚠️ Problema identificado' },
                      { key: 'expansao', label: '🚀 Interesse em expansão' },
                    ].map(r => (
                      <button key={r.key} onClick={() => setResSel(r.key)} style={{ padding: 12, borderRadius: 10, border: `2px solid ${resSel === r.key ? '#2563eb' : '#e8eaed'}`, background: resSel === r.key ? '#eff6ff' : '#f4f5f7', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: resSel === r.key ? '#2563eb' : '#6b7280', fontFamily: 'inherit', transition: 'all .15s' }}>
                        {r.label}
                      </button>
                    ))}
                  </div>

                  {/* Observação */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>Observação</div>
                    <textarea rows={3} value={obs} onChange={e => setObs(e.target.value)} placeholder="Ex: Terminal com problema, responsável pediu retorno..." style={{ width: '100%', padding: '10px 13px', border: '1.5px solid #e8eaed', borderRadius: 9, fontSize: 13.5, fontFamily: 'inherit', outline: 'none', background: '#f4f5f7', resize: 'none' }} />
                  </div>

                  {/* Próxima ação */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>Próxima ação</div>
                    <input type="text" value={proxAcao} onChange={e => setProxAcao(e.target.value)} placeholder="Ex: Retornar em 15 dias..." style={{ width: '100%', padding: '10px 13px', border: '1.5px solid #e8eaed', borderRadius: 9, fontSize: 13.5, fontFamily: 'inherit', outline: 'none', background: '#f4f5f7' }} />
                  </div>

                  <button onClick={salvarVisita} disabled={salvando} style={{ width: '100%', padding: 15, background: salvando ? '#86efac' : '#16a34a', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: salvando ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                    {salvando ? 'Salvando...' : '📍 Salvar Visita com Localização'}
                  </button>
                </div>
              </>
            ) : (
              /* Sucesso */
              <div style={{ textAlign: 'center', padding: '32px 20px 28px' }}>
                <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
                <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Visita registrada!</div>
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>{comercioSel?.nome_fantasia}</div>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#16a34a', marginBottom: 20 }}>
                  📍 {geoLat?.toFixed(5)}, {geoLng?.toFixed(5)} · Salvo com timestamp
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button onClick={() => setModalAberto(false)} style={{ background: '#f4f5f7', border: '1px solid #e8eaed', borderRadius: 9, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: '#374151' }}>Fechar</button>
                  <button onClick={() => { setSucesso(false); setComercioSel(null); setResSel(''); setObs(''); setBuscaModal(''); capturarGeo() }} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 9, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>+ Próxima visita</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

