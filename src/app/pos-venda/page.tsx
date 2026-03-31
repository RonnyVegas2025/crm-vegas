'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'

interface Comercio {
  id: string; nome_fantasia: string; razao_social: string
  endereco: string; cidade: string; uf: string; telefone: string
  email: string; categoria: string; subgrupo: string; taxa: number
  terminal: string; contrato: string; ultima_transacao: string
  latitude?: number; longitude?: number; distancia?: number
  status_crm: string; data_ultimo_contato?: string
  data_proximo_contato?: string; produtos_negociando?: string[]; obs_crm?: string
  tipo_origem?: string
}
interface Visita {
  nome_fantasia: string; resultado: string; observacao: string
  latitude: number|null; longitude: number|null; hora: string
  tipo_origem?: string
}

const CAT: Record<string,{icon:string;cor:string;bg:string}> = {
  supermercado:{icon:'🛒',cor:'#2563eb',bg:'#eff6ff'},
  restaurante:{icon:'🍽',cor:'#dc2626',bg:'#fef2f2'},
  posto:{icon:'⛽',cor:'#16a34a',bg:'#f0fdf4'},
  farmacia:{icon:'💊',cor:'#7c3aed',bg:'#f5f3ff'},
  varejo:{icon:'🛍',cor:'#d97706',bg:'#fffbeb'},
  outros:{icon:'🏪',cor:'#6b7280',bg:'#f4f5f7'},
}

const SC: Record<string,{label:string;icon:string;cor:string;bg:string;border:string}> = {
  ativo:            {label:'Ativo',            icon:'🟢',cor:'#16a34a',bg:'#f0fdf4',border:'#86efac'},
  visita_realizada: {label:'Visita Realizada', icon:'✅',cor:'#2563eb',bg:'#eff6ff',border:'#93c5fd'},
  em_negociacao:    {label:'Em Negociação',    icon:'🔥',cor:'#d97706',bg:'#fffbeb',border:'#fcd34d'},
  ligar:            {label:'Ligar',            icon:'📞',cor:'#7c3aed',bg:'#f5f3ff',border:'#c4b5fd'},
  retornar:         {label:'Retornar',         icon:'📅',cor:'#0891b2',bg:'#ecfeff',border:'#67e8f9'},
  proposta_enviada: {label:'Proposta Enviada', icon:'📄',cor:'#ea580c',bg:'#fff7ed',border:'#fdba74'},
  problema:         {label:'Problema',         icon:'⚠️',cor:'#dc2626',bg:'#fef2f2',border:'#fca5a5'},
  sem_contato:      {label:'Sem Contato',      icon:'❄️',cor:'#64748b',bg:'#f8fafc',border:'#cbd5e1'},
  fechado:          {label:'Produto Fechado',  icon:'🏆',cor:'#16a34a',bg:'#f0fdf4',border:'#4ade80'},
  novo_lead:        {label:'Novo Lead',        icon:'⭐',cor:'#8b5cf6',bg:'#f5f3ff',border:'#c4b5fd'},
}

const SA: Record<string,string> = {contato:'visita_realizada',ausente:'ligar',problema:'problema',expansao:'em_negociacao'}
const PO = ['novo_lead','ativo','visita_realizada','em_negociacao','ligar','retornar','proposta_enviada','problema','sem_contato','fechado']

const PRODS = [
  {id:1,nome:'Alimentação',      icon:'🍽',cat:'Benefícios',desc:'Benefício alimentação'},
  {id:2,nome:'Refeição',         icon:'🥘',cat:'Benefícios',desc:'Benefício refeição'},
  {id:3,nome:'Aux. Farmácia',    icon:'💊',cat:'Benefícios',desc:'Aux. farmácia'},
  {id:4,nome:'Aux. Combustível', icon:'⛽',cat:'Benefícios',desc:'Aux. combustível'},
  {id:5,nome:'Farmácia Convênio',icon:'🏥',cat:'Convênio',  desc:'Convênio farmácias'},
  {id:6,nome:'Day Bank',         icon:'🏦',cat:'Convênio',  desc:'Conta digital'},
  {id:7,nome:'Combustível Frota',icon:'🚛',cat:'Convênio',  desc:'Gestão de frota'},
  {id:8,nome:'WellHub',          icon:'🏋',cat:'Agregado',  desc:'Plataforma de bem-estar'},
  {id:9,nome:'Total Pass',       icon:'🎯',cat:'Agregado',  desc:'Acesso a academias'},
  {id:10,nome:'Telemedicina',    icon:'🩺',cat:'Agregado',  desc:'Consultas médicas online'},
  {id:11,nome:'Vidalink R$50',   icon:'💊',cat:'Agregado',  desc:'Auxílio farmácia R$50/mês'},
  {id:12,nome:'Seguro MAC+Auto', icon:'🚗',cat:'Agregado',  desc:'Seguro de vida + automóvel'},
]

const SEGMENTOS = ['Alimentação','Farmácia','Combustível','Varejo','Restaurante/Bar','Serviços','Saúde','Outros']

function cd(la1:number,lo1:number,la2:number,lo2:number){const R=6371000,dL=(la2-la1)*Math.PI/180,dG=(lo2-lo1)*Math.PI/180,a=Math.sin(dL/2)**2+Math.cos(la1*Math.PI/180)*Math.cos(la2*Math.PI/180)*Math.sin(dG/2)**2;return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))}
function fd(m:number){return m<1000?`${Math.round(m)}m`:`${(m/1000).toFixed(1)}km`}
function S(s:string){return SC[s]||SC.ativo}

// Mapeamento de segmento para categoria
function segTocat(seg:string):string{
  const m:Record<string,string>={
    'Alimentação':'supermercado','Farmácia':'farmacia',
    'Combustível':'posto','Restaurante/Bar':'restaurante',
    'Varejo':'varejo'
  }
  return m[seg]||'outros'
}

export default function PosVendaPage(){
  const sb=createClient(),router=useRouter(),mr=useRef<any>(null),mi=useRef<any>(null)
  const [cs,setCs]=useState<Comercio[]>([]),[lo,setLo]=useState(true)
  const [bk,setBk]=useState(''),[ca,setCa]=useState(''),[sf,setSf]=useState(''),[origemFiltro,setOrFiltro]=useState<'todos'|'posvendas'|'leads'>('todos')
  const [ab,setAb]=useState<'lista'|'pipeline'|'mapa'|'historico'>('lista')
  const [vs,setVs]=useState<Visita[]>([])
  // Modal visita
  const [mo,setMo]=useState(false),[de,setDe]=useState(false)
  const [csel,setCsel]=useState<Comercio|null>(null),[rs,setRs]=useState(''),[sm,setSm]=useState('')
  const [ob,setOb]=useState(''),[pd,setPd]=useState(''),[ps,setPs]=useState<number[]>([])
  const [gla,setGla]=useState<number|null>(null),[glo,setGlo]=useState<number|null>(null)
  const [gs,setGs]=useState<'loading'|'ok'>('loading'),[gm,setGm]=useState('Capturando localização...')
  const [sv,setSv]=useState(false),[sc,setSc]=useState(false),[bm,setBm]=useState(''),[usr,setUsr]=useState<any>(null),[op,setOp]=useState(false)
  // Novo lead
  const [modoLead,setModoLead]=useState(false)
  const [nlNome,setNlNome]=useState(''),[nlTel,setNlTel]=useState(''),[nlEnd,setNlEnd]=useState('')
  const [nlCep,setNlCep]=useState(''),[nlSeg,setNlSeg]=useState(''),[nlResp,setNlResp]=useState('')
  const [nlObs,setNlObs]=useState(''),[svLead,setSvLead]=useState(false),[scLead,setScLead]=useState(false)

  useEffect(()=>{
    async function init(){
      const{data:{user}}=await sb.auth.getUser()
      if(!user){router.push('/login');return}
      setUsr(user)
      const{data}=await sb.from('comercios_credenciados').select('*').eq('ativo',true).order('nome_fantasia')
      if(data)setCs(data);setLo(false)
    }
    init();cgi()
  },[])

  useEffect(()=>{
    async function lv(){
      const h=new Date().toISOString().split('T')[0]
      const{data}=await sb.from('visitas_campo').select('*').gte('data_visita',h).order('data_visita',{ascending:false})
      if(data)setVs(data.map((v:any)=>({nome_fantasia:v.nome_fantasia,resultado:v.resultado,observacao:v.observacao||'',latitude:v.latitude,longitude:v.longitude,hora:new Date(v.data_visita).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),tipo_origem:v.tipo_estabelecimento})))
    }
    lv()
  },[sc,scLead])

  useEffect(()=>{if(ab==='mapa'&&!mi.current)setTimeout(im,300)},[ab,cs])

  function cgi(){if(navigator.geolocation)navigator.geolocation.getCurrentPosition(p=>{setGla(p.coords.latitude);setGlo(p.coords.longitude)},()=>{},{timeout:10000,enableHighAccuracy:true})}

  function im(){
    if(!mr.current||mi.current)return
    const L=(window as any).L;if(!L)return
    const c:[number,number]=gla&&glo?[gla,glo]:[-22.7330,-47.3340]
    const map=L.map(mr.current,{zoomControl:false}).setView(c,14)
    L.control.zoom({position:'bottomright'}).addTo(map)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{attribution:'© OpenStreetMap © CARTO',maxZoom:19}).addTo(map)
    mi.current=map
    if(gla&&glo){const ic=L.divIcon({className:'',html:`<div style="width:16px;height:16px;background:#2563eb;border-radius:50%;border:3px solid white;box-shadow:0 0 0 6px rgba(37,99,235,0.2),0 2px 8px rgba(0,0,0,0.3)"></div>`,iconSize:[16,16],iconAnchor:[8,8]});L.marker([gla,glo],{icon:ic}).addTo(map).bindPopup('<b>📍 Você está aqui</b>')}
    cs.forEach(c2=>{
      if(!c2.latitude||!c2.longitude)return
      const ci=CAT[c2.categoria]||CAT.outros,st=S(c2.status_crm||'ativo'),vt=vs.find(v=>v.nome_fantasia===c2.nome_fantasia)
      const isLead=c2.tipo_origem==='lead'
      const ic=L.divIcon({className:'',html:`<div style="width:32px;height:32px;background:${isLead?'#8b5cf6':st.cor};border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center"><span style="transform:rotate(45deg);font-size:13px">${vt?'✓':isLead?'⭐':ci.icon}</span></div>`,iconSize:[32,32],iconAnchor:[16,32],popupAnchor:[0,-34]})
      const dist=gla&&glo?fd(cd(gla,glo,c2.latitude!,c2.longitude!)):''
      L.marker([c2.latitude,c2.longitude],{icon:ic}).addTo(map).bindPopup(`<div style="font-family:sans-serif;min-width:200px"><b style="font-size:13px">${c2.nome_fantasia}</b><div style="font-size:11px;color:#6b7280;margin:3px 0">${c2.endereco?.split(' - ')[0]}</div><div style="display:inline-flex;align-items:center;gap:4px;background:${isLead?'#f5f3ff':'#f0fdf4'};color:${isLead?'#8b5cf6':st.cor};padding:2px 8px;border-radius:10px;font-size:10.5px;font-weight:700;margin:4px 0">${isLead?'⭐ Novo Lead':st.icon+' '+st.label}</div>${dist?`<div style="font-size:11px;color:#2563eb;font-weight:600;margin-top:2px">📍 ${dist} de você</div>`:''}<button onclick="window.__aC('${c2.id}')" style="margin-top:8px;background:#2563eb;color:#fff;border:none;border-radius:6px;padding:6px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:sans-serif;width:100%">Ver + Registrar visita</button></div>`,{maxWidth:220})
    })
    ;(window as any).__aC=(id:string)=>{const c2=cs.find(x=>x.id===id);if(c2){setCsel(c2);setPs([]);setRs('');setOb('');setSm(c2.status_crm||'ativo');setPd('');setSc(false);setDe(true)}}
  }

  async function logout(){await sb.auth.signOut();router.push('/login')}

  const ccd=cs.map(c=>({...c,distancia:(gla&&glo&&c.latitude&&c.longitude)?cd(gla,glo,c.latitude,c.longitude):undefined}))
  const filt=ccd.filter(c=>{
    const mCat=!ca||c.categoria===ca
    const mBk=!bk||c.nome_fantasia.toLowerCase().includes(bk.toLowerCase())||c.razao_social?.toLowerCase().includes(bk.toLowerCase())
    const mSf=!sf||c.status_crm===sf
    const mOr=origemFiltro==='todos'||(origemFiltro==='leads'&&c.tipo_origem==='lead')||(origemFiltro==='posvendas'&&c.tipo_origem!=='lead')
    return mCat&&mBk&&mSf&&mOr
  }).sort((a,b)=>op&&a.distancia!=null&&b.distancia!=null?a.distancia-b.distancia:a.nome_fantasia.localeCompare(b.nome_fantasia))

  const pip=PO.map(s=>({key:s,...SC[s],total:cs.filter(c=>(c.status_crm||'ativo')===s).length}))
  const combo=PRODS.filter(p=>ps.includes(p.id))
  const nomBen=combo.filter(p=>['Benefícios','Convênio'].includes(p.cat)).map(p=>p.nome)
  const nomAgg=combo.filter(p=>p.cat==='Agregado').map(p=>p.nome)

  const totalLeads=cs.filter(c=>c.tipo_origem==='lead').length
  const totalPv=cs.filter(c=>c.tipo_origem!=='lead').length

  function ad(c:Comercio){setCsel(c);setPs([]);setRs('');setOb('');setSm(c.status_crm||'ativo');setPd('');setSc(false);setModoLead(false);setDe(true)}

  function abrirModalVisita(){
    setCsel(null);setRs('');setOb('');setBm('');setSm('');setPd('');setSc(false)
    setModoLead(false);setNlNome('');setNlTel('');setNlEnd('');setNlCep('');setNlSeg('');setNlResp('');setNlObs('')
    setGs('loading');setGm('Capturando localização...')
    setMo(true);cgm()
  }

  function cgm(){
    if(navigator.geolocation)navigator.geolocation.getCurrentPosition(
      p=>{setGla(p.coords.latitude);setGlo(p.coords.longitude);setGs('ok');setGm(`${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)} · Precisão: ${Math.round(p.coords.accuracy)}m`)},
      ()=>{setGs('ok');setGm('Localização aproximada')},{timeout:8000,enableHighAccuracy:true})
    else{setGs('ok');setGm('GPS não disponível')}
  }

  function tp(id:number){setPs(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id])}

  // Iniciar modo novo lead a partir da busca
  function iniciarNovoLead(){
    setModoLead(true)
    setNlNome(bm) // pré-preenche com o que foi digitado
  }

  async function salvarNovoLead(){
    if(!nlNome.trim()){alert('Informe o nome do comércio.');return}
    if(!nlSeg){alert('Selecione o segmento.');return}
    setSvLead(true)

    const cat=segTocat(nlSeg)
    const novoId=crypto.randomUUID()

    // Salva como novo comércio na base
    const{error}=await sb.from('comercios_credenciados').insert({
      id:novoId,
      nome_fantasia:nlNome.trim(),
      razao_social:nlNome.trim(),
      endereco:nlEnd||'A confirmar',
      cep:nlCep||null,
      cidade:'A confirmar',
      uf:'SP',
      telefone:nlTel||null,
      categoria:cat,
      subgrupo:nlSeg,
      taxa:0,
      terminal:'A confirmar',
      contrato:'Lead',
      status_crm:'novo_lead',
      tipo_origem:'lead',
      obs_crm:nlObs||null,
      latitude:gla??-22.7330,
      longitude:glo??-47.3340,
      ativo:true,
      data_ultimo_contato:new Date().toISOString().split('T')[0],
    })

    if(error){alert('Erro ao salvar. Tente novamente.');setSvLead(false);return}

    // Registra visita
    await sb.from('visitas_campo').insert({
      vendedor_id:usr?.id,
      nome_fantasia:nlNome.trim(),
      tipo_estabelecimento:cat,
      latitude:gla??-22.7330,
      longitude:glo??-47.3340,
      resultado:'contato',
      observacao:`Prospecção: ${nlObs||'Visita inicial'}${nlResp?` | Responsável: ${nlResp}`:''}`,
      data_visita:new Date().toISOString(),
    })

    // Atualiza lista local
    setCs(prev=>[...prev,{
      id:novoId,nome_fantasia:nlNome.trim(),razao_social:nlNome.trim(),
      endereco:nlEnd||'A confirmar',cidade:'A confirmar',uf:'SP',
      telefone:nlTel||'',email:'',categoria:cat,subgrupo:nlSeg,
      taxa:0,terminal:'A confirmar',contrato:'Lead',
      ultima_transacao:'',status_crm:'novo_lead',tipo_origem:'lead',
      latitude:gla??undefined,longitude:glo??undefined,
    }])

    setSvLead(false);setScLead(true)
  }

  async function salvar(){
    if(!csel){alert('Selecione o comércio.');return}
    if(!rs){alert('Selecione o resultado.');return}
    setSv(true)
    const ns=sm||SA[rs]||'visita_realizada'
    const pn=combo.map(p=>p.nome).join(', ')
    const oc=[ob,pn?`Produtos: ${pn}`:''].filter(Boolean).join(' | ')
    await sb.from('visitas_campo').insert({vendedor_id:usr?.id,nome_fantasia:csel.nome_fantasia,tipo_estabelecimento:csel.categoria,latitude:gla??-22.7330,longitude:glo??-47.3340,resultado:rs,observacao:oc||null,data_visita:new Date().toISOString()})
    await sb.from('comercios_credenciados').update({status_crm:ns,data_ultimo_contato:new Date().toISOString().split('T')[0],data_proximo_contato:pd||null,produtos_negociando:pn?pn.split(', '):null,obs_crm:ob||null}).eq('id',csel.id)
    setCs(prev=>prev.map(c=>c.id===csel.id?{...c,status_crm:ns,data_ultimo_contato:new Date().toISOString().split('T')[0]}:c))
    setSv(false);setSc(true);setDe(false)
  }

  async function asmn(id:string,ns:string){
    await sb.from('comercios_credenciados').update({status_crm:ns}).eq('id',id)
    setCs(prev=>prev.map(c=>c.id===id?{...c,status_crm:ns}:c))
    if(csel?.id===id)setCsel(prev=>prev?{...prev,status_crm:ns}:null)
  }

  if(lo)return(<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:"'Plus Jakarta Sans',sans-serif",color:'#6b7280'}}><div style={{textAlign:'center'}}><div style={{fontSize:32,marginBottom:12}}>⏳</div><div style={{fontWeight:600}}>Carregando...</div></div></div>)

  // Estilos reutilizáveis
  const inp={width:'100%',padding:'10px 13px',border:'1.5px solid #e8eaed',borderRadius:9,fontSize:13.5,fontFamily:'inherit',outline:'none',background:'#f4f5f7'} as any
  const lbl={fontSize:11,fontWeight:700,color:'#6b7280',textTransform:'uppercase' as any,letterSpacing:'.5px',marginBottom:6,display:'block' as any}

  return(
    <div style={{display:'flex',flexDirection:'column',height:'100vh',fontFamily:"'Plus Jakarta Sans',sans-serif",overflow:'hidden'}}>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" async/>

      {/* TOPBAR */}
      <div style={{background:'#fff',borderBottom:'1px solid #e8eaed',height:54,display:'flex',alignItems:'center',padding:'0 18px',gap:12,flexShrink:0}}>
        <div style={{width:32,height:32,background:'#16181d',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:800,color:'#f59e0b',flexShrink:0}}>V</div>
        <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:'#111827',lineHeight:1.2}}>Vegas CRM · Campo</div><div style={{fontSize:10.5,color:'#9ca3af'}}>{usr?.email}</div></div>
        <button onClick={abrirModalVisita} style={{background:'#16a34a',color:'#fff',border:'none',borderRadius:8,padding:'8px 14px',fontSize:12.5,fontWeight:700,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:6}}>📍 Registrar visita</button>
        <button onClick={logout} style={{background:'transparent',border:'1px solid #e8eaed',borderRadius:7,padding:'7px 12px',fontSize:12,color:'#6b7280',cursor:'pointer',fontFamily:'inherit'}}>Sair</button>
      </div>

      {/* KPIs */}
      <div style={{background:'#fff',borderBottom:'1px solid #e8eaed',display:'flex',gap:10,padding:'10px 18px',flexShrink:0,overflowX:'auto'}}>
        {[
          {l:'Pós-venda',v:totalPv,c:'#2563eb'},
          {l:'Leads/Prospec.',v:totalLeads,c:'#8b5cf6'},
          {l:'Visitados hoje',v:vs.length,c:'#16a34a'},
          {l:'Em Negociação',v:cs.filter(c=>c.status_crm==='em_negociacao').length,c:'#d97706'},
          {l:'Fechados 🏆',v:cs.filter(c=>c.status_crm==='fechado').length,c:'#16a34a'},
        ].map(k=>(
          <div key={k.l} style={{background:'#f4f5f7',border:'1px solid #e8eaed',borderRadius:10,padding:'9px 16px',minWidth:105,flexShrink:0}}>
            <div style={{fontSize:10,fontWeight:600,color:'#6b7280',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:3}}>{k.l}</div>
            <div style={{fontSize:20,fontWeight:800,color:k.c,lineHeight:1}}>{k.v}</div>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div style={{background:'#fff',borderBottom:'1px solid #e8eaed',display:'flex',padding:'0 18px',flexShrink:0,overflowX:'auto'}}>
        {[{k:'lista',l:`📋 Lista (${filt.length})`},{k:'pipeline',l:'📊 Pipeline'},{k:'mapa',l:'🗺 Mapa'},{k:'historico',l:`✅ Hoje (${vs.length})`}].map(t=>(
          <div key={t.k} onClick={()=>setAb(t.k as any)} style={{padding:'10px 16px',fontSize:12.5,fontWeight:600,cursor:'pointer',color:ab===t.k?'#2563eb':'#6b7280',borderBottom:`2px solid ${ab===t.k?'#2563eb':'transparent'}`,marginBottom:-1,whiteSpace:'nowrap'}}>{t.l}</div>
        ))}
      </div>

      <div style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column'}}>

        {/* LISTA */}
        {ab==='lista'&&(
          <div style={{flex:1,overflowY:'auto'}}>
            <div style={{padding:'12px 16px',borderBottom:'1px solid #e8eaed',background:'#fff',display:'flex',flexDirection:'column',gap:8}}>
              {/* Filtro origem */}
              <div style={{display:'flex',gap:6}}>
                {[{k:'todos',l:'Todos'},{ k:'posvendas',l:'🏪 Pós-venda'},{k:'leads',l:'⭐ Leads'}].map(f=>(
                  <button key={f.k} onClick={()=>setOrFiltro(f.k as any)} style={{padding:'5px 12px',borderRadius:20,fontSize:12,fontWeight:700,cursor:'pointer',border:`1.5px solid ${origemFiltro===f.k?'#2563eb':'#e8eaed'}`,background:origemFiltro===f.k?'#2563eb':'#f4f5f7',color:origemFiltro===f.k?'#fff':'#6b7280',fontFamily:'inherit'}}>{f.l}</button>
                ))}
                {gla&&<button onClick={()=>setOp(!op)} style={{padding:'5px 12px',borderRadius:20,fontSize:12,fontWeight:700,cursor:'pointer',border:`1.5px solid ${op?'#16a34a':'#e8eaed'}`,background:op?'#16a34a':'#f4f5f7',color:op?'#fff':'#6b7280',fontFamily:'inherit',marginLeft:'auto'}}>📍 {op?'Próximos ✓':'Proximidade'}</button>}
              </div>
              <input type="text" placeholder="🔍 Buscar comércio..." value={bk} onChange={e=>setBk(e.target.value)} style={{...inp,fontSize:13}}/>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {[{k:'',l:'Todos status'},{k:'novo_lead',l:'⭐ Leads'},{k:'em_negociacao',l:'🔥 Negociação'},{k:'ligar',l:'📞 Ligar'},{k:'problema',l:'⚠️ Problema'},{k:'sem_contato',l:'❄️ Sem contato'},{k:'fechado',l:'🏆 Fechados'}].map(f=>(
                  <button key={f.k} onClick={()=>setSf(f.k)} style={{padding:'4px 10px',borderRadius:20,fontSize:11,fontWeight:600,cursor:'pointer',border:`1.5px solid ${sf===f.k?'#2563eb':'#e8eaed'}`,background:sf===f.k?'#2563eb':'#f4f5f7',color:sf===f.k?'#fff':'#6b7280',fontFamily:'inherit'}}>{f.l}</button>
                ))}
              </div>
            </div>

            {filt.map(c=>{
              const ci=CAT[c.categoria]||CAT.outros,st=S(c.status_crm||'ativo')
              const isLead=c.tipo_origem==='lead'
              const vt=vs.find(v=>v.nome_fantasia===c.nome_fantasia)
              return(
                <div key={c.id} onClick={()=>ad(c)} style={{padding:'13px 16px',borderBottom:'1px solid #e8eaed',background:'#fff',cursor:'pointer',borderLeft:`3px solid ${isLead?'#8b5cf6':st.cor}`}}
                  onMouseEnter={e=>(e.currentTarget.style.background='#fafbfc')} onMouseLeave={e=>(e.currentTarget.style.background='#fff')}>
                  <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
                    <div style={{width:40,height:40,borderRadius:10,background:isLead?'#f5f3ff':ci.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{isLead?'⭐':ci.icon}</div>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',alignItems:'center',gap:7}}>
                        <div style={{fontWeight:700,fontSize:13.5,color:'#111827'}}>{c.nome_fantasia}</div>
                        {isLead&&<span style={{background:'#f5f3ff',color:'#8b5cf6',fontSize:10,fontWeight:700,padding:'1px 7px',borderRadius:20,border:'1px solid #c4b5fd'}}>LEAD</span>}
                      </div>
                      <div style={{fontSize:11,color:'#9ca3af',marginTop:1}}>{c.razao_social!==c.nome_fantasia?c.razao_social:c.endereco?.split(' - ')[0]}</div>
                      <div style={{display:'flex',alignItems:'center',gap:7,marginTop:7,flexWrap:'wrap'}}>
                        <span style={{background:st.bg,color:st.cor,border:`1px solid ${st.border}`,fontSize:10.5,fontWeight:700,padding:'2px 8px',borderRadius:20}}>{st.icon} {st.label}</span>
                        {vt&&<span style={{background:'#f0fdf4',color:'#16a34a',fontSize:10.5,fontWeight:700,padding:'2px 8px',borderRadius:20}}>✓ {vt.hora}</span>}
                        {c.distancia!=null&&<span style={{fontSize:11,color:'#2563eb',fontWeight:600}}>📍 {fd(c.distancia)}</span>}
                        {c.taxa>0&&<span style={{fontSize:11,color:'#6b7280',fontWeight:600,marginLeft:'auto'}}>Taxa: {c.taxa}%</span>}
                      </div>
                      {c.produtos_negociando&&c.produtos_negociando.length>0&&<div style={{fontSize:10.5,color:'#d97706',marginTop:5,fontWeight:600}}>🔥 {Array.isArray(c.produtos_negociando)?c.produtos_negociando.join(', '):c.produtos_negociando}</div>}
                    </div>
                    <div style={{color:'#9ca3af',fontSize:16}}>›</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* PIPELINE */}
        {ab==='pipeline'&&(
          <div style={{flex:1,overflowY:'auto',padding:16}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
              <div style={{background:'#eff6ff',border:'1px solid #dbeafe',borderRadius:12,padding:'14px 16px',textAlign:'center'}}>
                <div style={{fontSize:10,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:4}}>Pós-venda Vegas</div>
                <div style={{fontSize:28,fontWeight:800,color:'#2563eb'}}>{totalPv}</div>
                <div style={{fontSize:11,color:'#6b7280'}}>credenciados</div>
              </div>
              <div style={{background:'#f5f3ff',border:'1px solid #ddd6fe',borderRadius:12,padding:'14px 16px',textAlign:'center'}}>
                <div style={{fontSize:10,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:4}}>Leads / Prospecção</div>
                <div style={{fontSize:28,fontWeight:800,color:'#8b5cf6'}}>{totalLeads}</div>
                <div style={{fontSize:11,color:'#6b7280'}}>novos contatos</div>
              </div>
            </div>
            <div style={{fontSize:12,color:'#6b7280',marginBottom:12,fontWeight:600}}>Funil completo — toque para filtrar</div>
            {pip.filter(s=>s.total>0).map(s=>(
              <div key={s.key} style={{background:'#fff',border:`1px solid ${s.border}`,borderRadius:12,padding:'12px 14px',marginBottom:8,cursor:'pointer'}} onClick={()=>{setSf(s.key==='ativo'?'':s.key);setAb('lista')}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:42,height:42,borderRadius:12,background:s.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{s.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:13.5,color:'#111827'}}>{s.label}</div>
                    <div style={{height:5,background:'#f4f5f7',borderRadius:3,overflow:'hidden',marginTop:5}}>
                      <div style={{height:'100%',width:`${(s.total/cs.length)*100}%`,background:s.cor,borderRadius:3}}/>
                    </div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:22,fontWeight:800,color:s.cor,lineHeight:1}}>{s.total}</div>
                    <div style={{fontSize:10,color:'#9ca3af'}}>{Math.round((s.total/cs.length)*100)}%</div>
                  </div>
                </div>
                {s.total>0&&s.total<=3&&(
                  <div style={{marginTop:8,paddingTop:8,borderTop:`1px solid ${s.border}`}}>
                    {cs.filter(c=>(c.status_crm||'ativo')===s.key).map(c=>(
                      <div key={c.id} style={{fontSize:11.5,color:'#374151',padding:'2px 0',display:'flex',justifyContent:'space-between'}}><span>{c.nome_fantasia}</span><span style={{color:'#9ca3af'}}>{c.tipo_origem==='lead'?'Lead':c.taxa?`${c.taxa}%`:''}</span></div>
                    ))}
                  </div>
                )}
                {s.total>3&&<div style={{marginTop:6,fontSize:11,color:s.cor,fontWeight:600}}>Toque para ver todos →</div>}
              </div>
            ))}
          </div>
        )}

        {/* MAPA */}
        {ab==='mapa'&&(
          <div style={{flex:1,position:'relative'}}>
            <div ref={mr} style={{height:'100%',width:'100%'}}/>
            <div style={{position:'absolute',top:12,left:12,zIndex:500,background:'rgba(255,255,255,0.95)',border:'1px solid #e8eaed',borderRadius:12,padding:'10px 14px',boxShadow:'0 4px 14px rgba(0,0,0,.08)',fontSize:11}}>
              <div style={{fontWeight:700,marginBottom:7,color:'#111827'}}>Legenda</div>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><div style={{width:10,height:10,borderRadius:'50%',background:'#2563eb'}}/><span>Pós-venda</span></div>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><div style={{width:10,height:10,borderRadius:'50%',background:'#8b5cf6'}}/><span>Lead/Prospecção</span></div>
              {['em_negociacao','problema','fechado'].map(s=>{const st=S(s);return<div key={s} style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><div style={{width:10,height:10,borderRadius:'50%',background:st.cor}}/><span>{st.label}</span></div>})}
            </div>
            <button onClick={abrirModalVisita} style={{position:'absolute',bottom:16,left:'50%',transform:'translateX(-50%)',zIndex:500,background:'#16a34a',color:'#fff',border:'none',borderRadius:50,padding:'12px 22px',fontSize:13,fontWeight:800,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 4px 20px rgba(22,163,74,0.4)'}}>📍 Registrar Visita Aqui</button>
          </div>
        )}

        {/* HISTÓRICO */}
        {ab==='historico'&&(
          <div style={{flex:1,overflowY:'auto',padding:16}}>
            {vs.length===0?<div style={{padding:40,textAlign:'center',color:'#9ca3af'}}><div style={{fontSize:36,marginBottom:10}}>📋</div><div style={{fontWeight:600}}>Nenhuma visita hoje ainda</div></div>:vs.map((v,i)=>(
              <div key={i} style={{background:'#fff',border:'1px solid #e8eaed',borderRadius:12,padding:14,marginBottom:10}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:38,height:38,borderRadius:10,background:v.resultado==='contato'?'#f0fdf4':v.resultado==='expansao'?'#eff6ff':v.resultado==='problema'?'#fef2f2':'#fffbeb',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>{v.resultado==='contato'?'✅':v.resultado==='ausente'?'😔':v.resultado==='problema'?'⚠️':'🚀'}</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:13.5}}>{v.nome_fantasia}</div>
                    <div style={{fontSize:11,color:'#6b7280',marginTop:2,display:'flex',gap:6,alignItems:'center'}}>
                      <span>{v.hora}</span>
                      {v.tipo_origem==='lead'&&<span style={{background:'#f5f3ff',color:'#8b5cf6',fontSize:9.5,fontWeight:700,padding:'1px 6px',borderRadius:10}}>LEAD</span>}
                    </div>
                  </div>
                  {v.latitude&&<div style={{fontSize:10,color:'#16a34a',fontWeight:600}}>📍 GPS ✓</div>}
                </div>
                {v.observacao&&<div style={{background:'#f4f5f7',borderRadius:8,padding:'8px 12px',marginTop:9,fontSize:12,color:'#374151'}}>{v.observacao}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DETALHE CRM */}
      {de&&csel&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:1000,backdropFilter:'blur(3px)'}}>
          <div style={{background:'#fff',borderRadius:'22px 22px 0 0',width:'100%',maxWidth:600,maxHeight:'94vh',overflowY:'auto'}}>
            <div style={{width:40,height:4,background:'#d1d5db',borderRadius:2,margin:'12px auto 0'}}/>
            <div style={{padding:'16px 20px',borderBottom:'1px solid #e8eaed',display:'flex',alignItems:'flex-start',gap:14}}>
              <div style={{width:52,height:52,borderRadius:14,background:csel.tipo_origem==='lead'?'#f5f3ff':(CAT[csel.categoria]||CAT.outros).bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,flexShrink:0}}>{csel.tipo_origem==='lead'?'⭐':(CAT[csel.categoria]||CAT.outros).icon}</div>
              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{fontSize:18,fontWeight:800,color:'#111827'}}>{csel.nome_fantasia}</div>
                  {csel.tipo_origem==='lead'&&<span style={{background:'#f5f3ff',color:'#8b5cf6',fontSize:10.5,fontWeight:700,padding:'2px 9px',borderRadius:20,border:'1px solid #c4b5fd'}}>NOVO LEAD</span>}
                </div>
                <div style={{fontSize:12,color:'#6b7280',marginTop:2}}>{csel.subgrupo} · {csel.endereco?.split(' - ')[0]}</div>
                <div style={{display:'flex',gap:8,marginTop:6,flexWrap:'wrap'}}>
                  {csel.taxa>0&&<span style={{background:'#eff6ff',color:'#1d4ed8',fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:20}}>Taxa: {csel.taxa}%</span>}
                  {csel.telefone&&<span style={{background:'#f4f5f7',color:'#374151',fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:20}}>📞 {csel.telefone}</span>}
                  {csel.distancia!=null&&<span style={{background:'#f0fdf4',color:'#16a34a',fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:20}}>📍 {fd(csel.distancia)}</span>}
                </div>
              </div>
              <span onClick={()=>setDe(false)} style={{fontSize:20,color:'#9ca3af',cursor:'pointer',padding:4}}>✕</span>
            </div>
            <div style={{padding:'14px 20px 28px'}}>
              {/* STATUS */}
              <div style={{marginBottom:16}}>
                <div style={lbl}>Status de Relacionamento</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6}}>
                  {PO.map(s=>{const st=S(s),at=(csel.status_crm||'ativo')===s;return(
                    <button key={s} onClick={()=>asmn(csel.id,s)} style={{padding:'8px 6px',borderRadius:9,border:`2px solid ${at?st.cor:st.border}`,background:at?st.bg:'#f4f5f7',cursor:'pointer',fontFamily:'inherit',textAlign:'center'}}>
                      <div style={{fontSize:15}}>{st.icon}</div>
                      <div style={{fontSize:9.5,fontWeight:700,color:at?st.cor:'#6b7280',marginTop:3,lineHeight:1.2}}>{st.label}</div>
                    </button>
                  )})}
                </div>
              </div>
              {/* DADOS */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
                {[{l:'Endereço',v:csel.endereco},{l:'Telefone',v:csel.telefone||'—'},{l:'Segmento',v:csel.subgrupo},{l:'Contrato',v:csel.contrato},{l:'Terminal',v:csel.terminal},{l:'Última Tx',v:csel.ultima_transacao?new Date(csel.ultima_transacao).toLocaleDateString('pt-BR'):'—'}].map(f=>(
                  <div key={f.l}><div style={{fontSize:10,fontWeight:700,color:'#9ca3af',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:2}}>{f.l}</div><div style={{fontSize:12.5,fontWeight:500,color:'#111827',wordBreak:'break-word'}}>{f.v}</div></div>
                ))}
              </div>
              {/* COMBO PRODUTOS */}
              <div style={{marginBottom:16}}>
                <div style={{...lbl,display:'flex',alignItems:'center',gap:8}}>
                  📦 Produtos para oferecer
                  {ps.length>=2&&<span style={{background:'linear-gradient(135deg,#f59e0b,#ea580c)',color:'#fff',fontSize:10,fontWeight:700,padding:'2px 9px',borderRadius:20,textTransform:'none'}}>COMBO ({ps.length})</span>}
                </div>
                {['Benefícios','Convênio','Agregado'].map(cat=>(
                  <div key={cat} style={{marginBottom:10}}>
                    <div style={{fontSize:10,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:6}}>{cat}</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                      {PRODS.filter(p=>p.cat===cat).map(p=>{const sl=ps.includes(p.id);return(
                        <div key={p.id} onClick={()=>tp(p.id)} style={{padding:'9px 11px',borderRadius:9,border:`2px solid ${sl?'#2563eb':'#e8eaed'}`,background:sl?'#eff6ff':'#f4f5f7',cursor:'pointer',display:'flex',alignItems:'center',gap:8}}>
                          <span style={{fontSize:17,flexShrink:0}}>{p.icon}</span>
                          <div style={{flex:1}}><div style={{fontSize:11.5,fontWeight:700,color:sl?'#1d4ed8':'#111827'}}>{p.nome}</div><div style={{fontSize:10,color:'#6b7280',marginTop:1}}>{p.desc}</div></div>
                          {sl&&<span style={{color:'#2563eb',fontSize:13}}>✓</span>}
                        </div>
                      )})}
                    </div>
                  </div>
                ))}
                {ps.length>=2&&(
                  <div style={{background:'linear-gradient(135deg,#fffbeb,#fff7ed)',border:'1.5px solid #fcd34d',borderRadius:10,padding:'12px 14px',marginTop:4}}>
                    <div style={{fontSize:12,fontWeight:800,color:'#92400e',marginBottom:6}}>🔥 Combo Personalizado</div>
                    {nomBen.length>0&&<div style={{fontSize:12,color:'#374151',marginBottom:3}}><b>Benefícios/Convênio:</b> {nomBen.join(', ')}</div>}
                    {nomAgg.length>0&&<div style={{fontSize:12,color:'#374151'}}><b>Agregados:</b> {nomAgg.join(' + ')}</div>}
                  </div>
                )}
              </div>
              {/* RESULTADO */}
              <div style={lbl}>Resultado *</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
                {[{k:'contato',l:'✅ Contato feito'},{k:'ausente',l:'😔 Responsável ausente'},{k:'problema',l:'⚠️ Problema'},{k:'expansao',l:'🚀 Interesse em expansão'}].map(r=>(
                  <button key={r.k} onClick={()=>setRs(r.k)} style={{padding:11,borderRadius:10,border:`2px solid ${rs===r.k?'#2563eb':'#e8eaed'}`,background:rs===r.k?'#eff6ff':'#f4f5f7',cursor:'pointer',fontSize:12.5,fontWeight:600,color:rs===r.k?'#2563eb':'#6b7280',fontFamily:'inherit'}}>{r.l}</button>
                ))}
              </div>
              {rs&&<div style={{background:S(SA[rs]).bg,border:`1px solid ${S(SA[rs]).border}`,borderRadius:9,padding:'9px 13px',marginBottom:12,fontSize:12.5,fontWeight:600,color:S(SA[rs]).cor}}>Status automático: {S(SA[rs]).icon} {S(SA[rs]).label}</div>}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                <div><label style={lbl}>Próximo contato</label><input type="date" value={pd} onChange={e=>setPd(e.target.value)} style={inp}/></div>
                <div><label style={lbl}>Contrato</label><div style={{...inp,background:'#f4f5f7',fontSize:13,fontWeight:600,color:'#374151'}}>{csel.contrato}</div></div>
              </div>
              <div style={{marginBottom:14}}><label style={lbl}>Observação</label><textarea rows={2} value={ob} onChange={e=>setOb(e.target.value)} placeholder="Ex: Gerente demonstrou interesse no WellHub..." style={{...inp,resize:'none'}}/></div>
              <button onClick={salvar} disabled={sv} style={{width:'100%',padding:14,background:sv?'#86efac':'#16a34a',color:'#fff',border:'none',borderRadius:12,fontSize:15,fontWeight:800,cursor:sv?'not-allowed':'pointer',fontFamily:'inherit'}}>{sv?'Salvando...':'📍 Salvar Visita de Pós-Venda'}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VISITA / NOVO LEAD */}
      {mo&&(
        <div onClick={e=>{if(e.target===e.currentTarget)setMo(false)}} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:1000,backdropFilter:'blur(3px)'}}>
          <div style={{background:'#fff',borderRadius:'22px 22px 0 0',width:'100%',maxWidth:560,maxHeight:'92vh',overflowY:'auto'}}>
            <div style={{width:40,height:4,background:'#d1d5db',borderRadius:2,margin:'12px auto 0'}}/>

            {/* ── MODO NOVO LEAD ── */}
            {modoLead?(
              <>
                <div style={{padding:'14px 20px 0',display:'flex',alignItems:'flex-start',gap:12}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:17,fontWeight:800,display:'flex',alignItems:'center',gap:8}}>⭐ Cadastrar Novo Lead <span style={{background:'#f5f3ff',color:'#8b5cf6',fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:20}}>PROSPECÇÃO</span></div>
                    <div style={{fontSize:11.5,color:'#6b7280',marginTop:2}}>Preencha os dados e registre a visita — entra direto no pipeline</div>
                  </div>
                  <span onClick={()=>setMo(false)} style={{fontSize:20,color:'#9ca3af',cursor:'pointer',padding:4}}>✕</span>
                </div>
                <div style={{padding:'14px 20px 28px'}}>
                  {/* GPS */}
                  <div style={{borderRadius:10,padding:'10px 13px',display:'flex',alignItems:'center',gap:10,marginBottom:14,fontSize:12.5,fontWeight:600,background:gs==='ok'?'#f0fdf4':'#eff6ff',border:`1px solid ${gs==='ok'?'#86efac':'#dbeafe'}`,color:gs==='ok'?'#16a34a':'#2563eb'}}>
                    <span>{gs==='ok'?'📍':'⏳'}</span>
                    <div><div style={{fontWeight:700}}>{gs==='ok'?'✓ GPS capturado — localização salva!':'Capturando GPS...'}</div><div style={{fontSize:11,fontWeight:400}}>{gm}</div></div>
                  </div>

                  {!scLead?(
                    <>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:4}}>
                        <div style={{gridColumn:'span 2'}}><label style={lbl}>Nome fantasia *</label><input type="text" value={nlNome} onChange={e=>setNlNome(e.target.value)} placeholder="Ex: Mercado Bom Preço" style={inp}/></div>
                        <div><label style={lbl}>Telefone *</label><input type="tel" value={nlTel} onChange={e=>setNlTel(e.target.value)} placeholder="(00) 00000-0000" style={inp}/></div>
                        <div><label style={lbl}>Responsável *</label><input type="text" value={nlResp} onChange={e=>setNlResp(e.target.value)} placeholder="Nome do decisor" style={inp}/></div>
                        <div style={{gridColumn:'span 2'}}><label style={lbl}>Segmento *</label>
                          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6}}>
                            {SEGMENTOS.map(s=>(
                              <button key={s} onClick={()=>setNlSeg(s)} style={{padding:'8px 4px',borderRadius:8,border:`2px solid ${nlSeg===s?'#8b5cf6':'#e8eaed'}`,background:nlSeg===s?'#f5f3ff':'#f4f5f7',cursor:'pointer',fontSize:11,fontWeight:700,color:nlSeg===s?'#8b5cf6':'#6b7280',fontFamily:'inherit',textAlign:'center'}}>{s}</button>
                            ))}
                          </div>
                        </div>
                        <div><label style={lbl}>CEP</label><input type="text" value={nlCep} onChange={e=>setNlCep(e.target.value)} placeholder="00000-000" style={inp}/></div>
                        <div><label style={lbl}>Endereço</label><input type="text" value={nlEnd} onChange={e=>setNlEnd(e.target.value)} placeholder="Rua, número" style={inp}/></div>
                        <div style={{gridColumn:'span 2'}}><label style={lbl}>Observação inicial</label><textarea rows={2} value={nlObs} onChange={e=>setNlObs(e.target.value)} placeholder="Ex: Interesse em benefícios, tem 40 funcionários..." style={{...inp,resize:'none'}}/></div>
                      </div>
                      <div style={{background:'#f5f3ff',border:'1px solid #ddd6fe',borderRadius:10,padding:'10px 13px',marginBottom:14,fontSize:12,color:'#6d28d9'}}>
                        ⭐ Este comércio entrará no pipeline como <b>Novo Lead</b> e você poderá acompanhar a negociação pelo painel.
                      </div>
                      <button onClick={salvarNovoLead} disabled={svLead} style={{width:'100%',padding:14,background:svLead?'#c4b5fd':'#8b5cf6',color:'#fff',border:'none',borderRadius:12,fontSize:15,fontWeight:800,cursor:svLead?'not-allowed':'pointer',fontFamily:'inherit'}}>
                        {svLead?'Salvando...':'⭐ Cadastrar Lead + Registrar Visita'}
                      </button>
                    </>
                  ):(
                    <div style={{textAlign:'center',padding:'20px 0 10px'}}>
                      <div style={{fontSize:52,marginBottom:10}}>⭐</div>
                      <div style={{fontSize:19,fontWeight:800,marginBottom:6}}>Lead cadastrado!</div>
                      <div style={{fontSize:13,color:'#6b7280',marginBottom:12}}>{nlNome} entrou no pipeline como Novo Lead</div>
                      <div style={{background:'#f5f3ff',border:'1px solid #ddd6fe',borderRadius:10,padding:'10px 14px',fontSize:12,color:'#7c3aed',marginBottom:18}}>📍 Localização salva · Visita registrada</div>
                      <div style={{display:'flex',gap:10,justifyContent:'center'}}>
                        <button onClick={()=>setMo(false)} style={{background:'#f4f5f7',border:'1px solid #e8eaed',borderRadius:9,padding:'10px 20px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit',color:'#374151'}}>Fechar</button>
                        <button onClick={()=>{setScLead(false);setNlNome('');setNlTel('');setNlEnd('');setNlCep('');setNlSeg('');setNlResp('');setNlObs('');cgm()}} style={{background:'#8b5cf6',color:'#fff',border:'none',borderRadius:9,padding:'10px 20px',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>+ Outro lead</button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ):(
              /* ── MODO VISITA NORMAL ── */
              <>
                {!sc?(
                  <>
                    <div style={{padding:'14px 20px 0',display:'flex',alignItems:'flex-start',gap:12}}>
                      <div style={{flex:1}}><div style={{fontSize:17,fontWeight:800}}>{csel?csel.nome_fantasia:'Registrar Visita'}</div><div style={{fontSize:11.5,color:'#6b7280',marginTop:2}}>{csel?`${csel.tipo_origem==='lead'?'Lead':'Pós-venda'} · Taxa: ${csel.taxa}%`:'Busque o comércio visitado'}</div></div>
                      <span onClick={()=>setMo(false)} style={{fontSize:20,color:'#9ca3af',cursor:'pointer',padding:4}}>✕</span>
                    </div>
                    <div style={{padding:'14px 20px 28px'}}>
                      {!csel&&(
                        <div style={{marginBottom:14}}>
                          <label style={lbl}>Comércio visitado *</label>
                          <input type="text" placeholder="Digite o nome para buscar..." value={bm} onChange={e=>setBm(e.target.value)} style={inp}/>
                          {bm.length>=2&&(
                            <div style={{background:'#fff',border:'1px solid #e8eaed',borderRadius:9,marginTop:4,maxHeight:200,overflowY:'auto',boxShadow:'0 4px 14px rgba(0,0,0,.09)'}}>
                              {cs.filter(c=>c.nome_fantasia.toLowerCase().includes(bm.toLowerCase())).slice(0,6).map(c=>{const ci=CAT[c.categoria]||CAT.outros;return(
                                <div key={c.id} onClick={()=>{setCsel(c);setBm('')}} style={{padding:'10px 14px',cursor:'pointer',borderBottom:'1px solid #f4f5f7',display:'flex',alignItems:'center',gap:9}}>
                                  <span style={{fontSize:18}}>{c.tipo_origem==='lead'?'⭐':ci.icon}</span>
                                  <div style={{flex:1}}><div style={{fontWeight:600,fontSize:13}}>{c.nome_fantasia}</div><div style={{fontSize:11,color:'#9ca3af'}}>{c.endereco?.split(' - ')[0]}</div></div>
                                  {c.tipo_origem==='lead'&&<span style={{background:'#f5f3ff',color:'#8b5cf6',fontSize:9.5,fontWeight:700,padding:'1px 6px',borderRadius:10}}>LEAD</span>}
                                </div>
                              )})}
                              {/* BOTÃO NOVO LEAD quando não encontra */}
                              {cs.filter(c=>c.nome_fantasia.toLowerCase().includes(bm.toLowerCase())).length===0&&(
                                <div style={{padding:'16px 14px',textAlign:'center'}}>
                                  <div style={{fontSize:13,color:'#6b7280',marginBottom:10}}>"{bm}" não encontrado na base</div>
                                  <button onClick={iniciarNovoLead} style={{background:'#8b5cf6',color:'#fff',border:'none',borderRadius:9,padding:'10px 20px',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit',width:'100%'}}>⭐ Cadastrar como Novo Lead</button>
                                </div>
                              )}
                            </div>
                          )}
                          {/* Botão direto para novo lead */}
                          <button onClick={()=>iniciarNovoLead()} style={{width:'100%',marginTop:8,padding:'10px',background:'#f5f3ff',border:'1.5px dashed #c4b5fd',borderRadius:9,fontSize:12.5,fontWeight:700,color:'#8b5cf6',cursor:'pointer',fontFamily:'inherit'}}>⭐ É um comércio novo? Cadastrar como Lead →</button>
                        </div>
                      )}
                      <div style={{borderRadius:10,padding:'10px 13px',display:'flex',alignItems:'center',gap:10,marginBottom:14,fontSize:12.5,fontWeight:600,background:gs==='ok'?'#f0fdf4':'#eff6ff',border:`1px solid ${gs==='ok'?'#86efac':'#dbeafe'}`,color:gs==='ok'?'#16a34a':'#2563eb'}}>
                        <span>{gs==='ok'?'📍':'⏳'}</span>
                        <div><div style={{fontWeight:700}}>{gs==='ok'?'✓ Localização capturada!':'Capturando...'}</div><div style={{fontSize:11,fontWeight:400}}>{gm}</div></div>
                      </div>
                      <div style={lbl}>Resultado *</div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
                        {[{k:'contato',l:'✅ Contato feito'},{k:'ausente',l:'😔 Ausente'},{k:'problema',l:'⚠️ Problema'},{k:'expansao',l:'🚀 Expansão'}].map(r=>(
                          <button key={r.k} onClick={()=>setRs(r.k)} style={{padding:11,borderRadius:10,border:`2px solid ${rs===r.k?'#2563eb':'#e8eaed'}`,background:rs===r.k?'#eff6ff':'#f4f5f7',cursor:'pointer',fontSize:12.5,fontWeight:600,color:rs===r.k?'#2563eb':'#6b7280',fontFamily:'inherit'}}>{r.l}</button>
                        ))}
                      </div>
                      {rs&&<div style={{background:S(SA[rs]).bg,border:`1px solid ${S(SA[rs]).border}`,borderRadius:9,padding:'9px 13px',marginBottom:12,fontSize:12.5,fontWeight:600,color:S(SA[rs]).cor}}>Status automático: {S(SA[rs]).icon} {S(SA[rs]).label}</div>}
                      <div style={{marginBottom:14}}><label style={lbl}>Observação</label><textarea rows={2} value={ob} onChange={e=>setOb(e.target.value)} placeholder="Ex: Responsável ausente, retornar amanhã..." style={{...inp,resize:'none'}}/></div>
                      <button onClick={salvar} disabled={sv} style={{width:'100%',padding:14,background:sv?'#86efac':'#16a34a',color:'#fff',border:'none',borderRadius:12,fontSize:15,fontWeight:800,cursor:sv?'not-allowed':'pointer',fontFamily:'inherit'}}>{sv?'Salvando...':'📍 Salvar Visita'}</button>
                    </div>
                  </>
                ):(
                  <div style={{textAlign:'center',padding:'32px 20px 28px'}}>
                    <div style={{fontSize:52,marginBottom:12}}>✅</div>
                    <div style={{fontSize:19,fontWeight:800,marginBottom:6}}>Visita registrada!</div>
                    <div style={{fontSize:13,color:'#6b7280',marginBottom:12}}>{csel?.nome_fantasia}</div>
                    <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:10,padding:'10px 14px',fontSize:12,color:'#16a34a',marginBottom:18}}>📍 {gla?.toFixed(5)}, {glo?.toFixed(5)} · Status atualizado</div>
                    <div style={{display:'flex',gap:10,justifyContent:'center'}}>
                      <button onClick={()=>setMo(false)} style={{background:'#f4f5f7',border:'1px solid #e8eaed',borderRadius:9,padding:'10px 20px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit',color:'#374151'}}>Fechar</button>
                      <button onClick={()=>{setSc(false);setCsel(null);setRs('');setOb('');setBm('');cgm()}} style={{background:'#2563eb',color:'#fff',border:'none',borderRadius:9,padding:'10px 20px',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>+ Próxima</button>
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
