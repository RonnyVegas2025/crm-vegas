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
}
interface Visita {
  nome_fantasia: string; resultado: string; observacao: string
  latitude: number|null; longitude: number|null; hora: string
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
  ativo:           {label:'Ativo',            icon:'🟢',cor:'#16a34a',bg:'#f0fdf4',border:'#86efac'},
  visita_realizada:{label:'Visita Realizada', icon:'✅',cor:'#2563eb',bg:'#eff6ff',border:'#93c5fd'},
  em_negociacao:   {label:'Em Negociação',    icon:'🔥',cor:'#d97706',bg:'#fffbeb',border:'#fcd34d'},
  ligar:           {label:'Ligar',            icon:'📞',cor:'#7c3aed',bg:'#f5f3ff',border:'#c4b5fd'},
  retornar:        {label:'Retornar',         icon:'📅',cor:'#0891b2',bg:'#ecfeff',border:'#67e8f9'},
  proposta_enviada:{label:'Proposta Enviada', icon:'📄',cor:'#ea580c',bg:'#fff7ed',border:'#fdba74'},
  problema:        {label:'Problema',         icon:'⚠️',cor:'#dc2626',bg:'#fef2f2',border:'#fca5a5'},
  sem_contato:     {label:'Sem Contato',      icon:'❄️',cor:'#64748b',bg:'#f8fafc',border:'#cbd5e1'},
  fechado:         {label:'Produto Fechado',  icon:'🏆',cor:'#16a34a',bg:'#f0fdf4',border:'#4ade80'},
}
const SA: Record<string,string> = {contato:'visita_realizada',ausente:'ligar',problema:'problema',expansao:'em_negociacao'}
const PO = ['ativo','visita_realizada','em_negociacao','ligar','retornar','proposta_enviada','problema','sem_contato','fechado']
const PRODS = [
  {id:1, nome:'Alimentação',       icon:'🍽',cat:'Benefícios',custo:0,   desc:'Cartão benefício alimentação PAT'},
  {id:2, nome:'Refeição',          icon:'🥘',cat:'Benefícios',custo:0,   desc:'Cartão refeição PAT'},
  {id:3, nome:'Aux. Farmácia',     icon:'💊',cat:'Benefícios',custo:0,   desc:'Auxílio farmácia para colaboradores'},
  {id:4, nome:'Aux. Combustível',  icon:'⛽',cat:'Benefícios',custo:0,   desc:'Vale combustível'},
  {id:5, nome:'Farmácia Convênio', icon:'🏥',cat:'Convênio',  custo:0,   desc:'Rede credenciada de farmácias'},
  {id:6, nome:'Day Bank',          icon:'🏦',cat:'Convênio',  custo:0,   desc:'Conta digital para colaboradores'},
  {id:7, nome:'Combustível Frota', icon:'🚛',cat:'Convênio',  custo:0,   desc:'Gestão de abastecimento de frota'},
  {id:8, nome:'WellHub',           icon:'🏋',cat:'Agregado',  custo:7.99,desc:'Bem-estar — R$4,99 a R$11,99/vida'},
  {id:9, nome:'Total Pass',        icon:'🎯',cat:'Agregado',  custo:5.85,desc:'Academias — R$5,85/vida'},
  {id:10,nome:'Telemedicina',      icon:'🩺',cat:'Agregado',  custo:2.50,desc:'Consultas online — R$2,50/vida'},
  {id:11,nome:'Vidalink R$50',     icon:'💊',cat:'Agregado',  custo:5.45,desc:'Aux. farmácia R$50 — R$5,45/vida'},
  {id:12,nome:'Seguro MAC+Auto',   icon:'🚗',cat:'Agregado',  custo:1.05,desc:'Seguro vida+auto — R$1,05/vida'},
]
function cd(la1:number,lo1:number,la2:number,lo2:number){const R=6371000,dL=(la2-la1)*Math.PI/180,dG=(lo2-lo1)*Math.PI/180,a=Math.sin(dL/2)**2+Math.cos(la1*Math.PI/180)*Math.cos(la2*Math.PI/180)*Math.sin(dG/2)**2;return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))}
function fd(m:number){return m<1000?`${Math.round(m)}m`:`${(m/1000).toFixed(1)}km`}
function S(s:string){return SC[s]||SC.ativo}

export default function PosVendaPage(){
  const sb=createClient(),router=useRouter(),mr=useRef<any>(null),mi=useRef<any>(null)
  const [cs,setCs]=useState<Comercio[]>([]),[lo,setLo]=useState(true)
  const [bk,setBk]=useState(''),[ca,setCa]=useState(''),[sf,setSf]=useState('')
  const [ab,setAb]=useState<'lista'|'pipeline'|'mapa'|'historico'>('lista')
  const [vs,setVs]=useState<Visita[]>([]),[mo,setMo]=useState(false),[de,setDe]=useState(false)
  const [csel,setCsel]=useState<Comercio|null>(null),[rs,setRs]=useState(''),[sm,setSm]=useState('')
  const [ob,setOb]=useState(''),[pd,setPd]=useState(''),[ps,setPs]=useState<number[]>([])
  const [gla,setGla]=useState<number|null>(null),[glo,setGlo]=useState<number|null>(null)
  const [gs,setGs]=useState<'loading'|'ok'>('loading'),[gm,setGm]=useState('Capturando localização...')
  const [sv,setSv]=useState(false),[sc,setSc]=useState(false),[bm,setBm]=useState(''),[usr,setUsr]=useState<any>(null),[op,setOp]=useState(false)

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
      if(data)setVs(data.map((v:any)=>({nome_fantasia:v.nome_fantasia,resultado:v.resultado,observacao:v.observacao||'',latitude:v.latitude,longitude:v.longitude,hora:new Date(v.data_visita).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})})))
    }
    lv()
  },[sc])

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
      const ic=L.divIcon({className:'',html:`<div style="width:32px;height:32px;background:${st.cor};border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center"><span style="transform:rotate(45deg);font-size:13px">${vt?'✓':ci.icon}</span></div>`,iconSize:[32,32],iconAnchor:[16,32],popupAnchor:[0,-34]})
      const dist=gla&&glo?fd(cd(gla,glo,c2.latitude!,c2.longitude!)):''
      L.marker([c2.latitude,c2.longitude],{icon:ic}).addTo(map).bindPopup(`<div style="font-family:sans-serif;min-width:200px"><b style="font-size:13px">${c2.nome_fantasia}</b><div style="font-size:11px;color:#6b7280;margin:3px 0">${c2.endereco?.split(' - ')[0]}</div><div style="display:inline-flex;align-items:center;gap:4px;background:${st.bg};color:${st.cor};padding:2px 8px;border-radius:10px;font-size:10.5px;font-weight:700;margin:4px 0">${st.icon} ${st.label}</div>${dist?`<div style="font-size:11px;color:#2563eb;font-weight:600;margin-top:2px">📍 ${dist} de você</div>`:''}<button onclick="window.__aC('${c2.id}')" style="margin-top:8px;background:#2563eb;color:#fff;border:none;border-radius:6px;padding:6px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:sans-serif;width:100%">Ver + Registrar visita</button></div>`,{maxWidth:220})
    })
    ;(window as any).__aC=(id:string)=>{const c2=cs.find(x=>x.id===id);if(c2){setCsel(c2);setPs([]);setRs('');setOb('');setSm(c2.status_crm||'ativo');setPd('');setSc(false);setDe(true)}}
  }

  async function logout(){await sb.auth.signOut();router.push('/login')}

  const ccd=cs.map(c=>({...c,distancia:(gla&&glo&&c.latitude&&c.longitude)?cd(gla,glo,c.latitude,c.longitude):undefined}))
  const filt=ccd.filter(c=>(!ca||c.categoria===ca)&&(!bk||c.nome_fantasia.toLowerCase().includes(bk.toLowerCase())||c.razao_social?.toLowerCase().includes(bk.toLowerCase()))&&(!sf||c.status_crm===sf)).sort((a,b)=>op&&a.distancia!=null&&b.distancia!=null?a.distancia-b.distancia:a.nome_fantasia.localeCompare(b.nome_fantasia))
  const pip=PO.map(s=>({key:s,...SC[s],total:cs.filter(c=>(c.status_crm||'ativo')===s).length}))
  const combo=PRODS.filter(p=>ps.includes(p.id))
  const cusAgg=combo.filter(p=>p.custo>0).reduce((a,p)=>a+p.custo,0)
  const nomBen=combo.filter(p=>p.custo===0).map(p=>p.nome)

  function ad(c:Comercio){setCsel(c);setPs([]);setRs('');setOb('');setSm(c.status_crm||'ativo');setPd('');setSc(false);setDe(true)}
  function amr(){setCsel(null);setRs('');setOb('');setBm('');setSm('');setPd('');setSc(false);setGs('loading');setGm('Capturando localização...');setMo(true);cgm()}
  function cgm(){
    if(navigator.geolocation)navigator.geolocation.getCurrentPosition(
      p=>{setGla(p.coords.latitude);setGlo(p.coords.longitude);setGs('ok');setGm(`${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)} · Precisão: ${Math.round(p.coords.accuracy)}m`)},
      ()=>{setGs('ok');setGm('Localização aproximada')},{timeout:8000,enableHighAccuracy:true})
    else{setGs('ok');setGm('GPS não disponível')}
  }
  function tp(id:number){setPs(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id])}

  async function salvar(){
    if(!csel){alert('Selecione o comércio.');return}
    if(!rs){alert('Selecione o resultado.');return}
    setSv(true)
    const ns=sm||SA[rs]||'visita_realizada'
    const pn=combo.map(p=>p.nome).join(', ')
    const oc=[ob,pn?`Produtos apresentados: ${pn}`:''].filter(Boolean).join(' | ')
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

  return(
    <div style={{display:'flex',flexDirection:'column',height:'100vh',fontFamily:"'Plus Jakarta Sans',sans-serif",overflow:'hidden'}}>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" async/>

      {/* TOPBAR */}
      <div style={{background:'#fff',borderBottom:'1px solid #e8eaed',height:54,display:'flex',alignItems:'center',padding:'0 18px',gap:12,flexShrink:0}}>
        <div style={{width:32,height:32,background:'#16181d',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:800,color:'#f59e0b',flexShrink:0}}>V</div>
        <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:'#111827',lineHeight:1.2}}>Vegas CRM · Pós-Venda</div><div style={{fontSize:10.5,color:'#9ca3af'}}>{usr?.email}</div></div>
        <button onClick={amr} style={{background:'#16a34a',color:'#fff',border:'none',borderRadius:8,padding:'8px 14px',fontSize:12.5,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>📍 Registrar visita</button>
        <button onClick={logout} style={{background:'transparent',border:'1px solid #e8eaed',borderRadius:7,padding:'7px 12px',fontSize:12,color:'#6b7280',cursor:'pointer',fontFamily:'inherit'}}>Sair</button>
      </div>

      {/* KPIs */}
      <div style={{background:'#fff',borderBottom:'1px solid #e8eaed',display:'flex',gap:10,padding:'10px 18px',flexShrink:0,overflowX:'auto'}}>
        {[
          {l:'Total',v:cs.length,c:'#2563eb'},
          {l:'Visitados hoje',v:vs.length,c:'#16a34a'},
          {l:'Em Negociação',v:cs.filter(c=>c.status_crm==='em_negociacao').length,c:'#d97706'},
          {l:'Sem Contato ❄',v:cs.filter(c=>c.status_crm==='sem_contato').length,c:'#dc2626'},
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
              <div style={{display:'flex',gap:8}}>
                <input type="text" placeholder="🔍 Buscar comércio..." value={bk} onChange={e=>setBk(e.target.value)} style={{flex:1,padding:'9px 13px',border:'1.5px solid #e8eaed',borderRadius:8,fontSize:13,fontFamily:'inherit',outline:'none',background:'#f4f5f7'}}/>
                {gla&&<button onClick={()=>setOp(!op)} style={{padding:'9px 14px',borderRadius:8,border:`1.5px solid ${op?'#2563eb':'#e8eaed'}`,background:op?'#eff6ff':'#f4f5f7',color:op?'#2563eb':'#6b7280',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'}}>📍 {op?'Próximos ✓':'Proximidade'}</button>}
              </div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {[{k:'',l:'Todos'},{k:'em_negociacao',l:'🔥 Negociação'},{k:'ligar',l:'📞 Ligar'},{k:'problema',l:'⚠️ Problema'},{k:'sem_contato',l:'❄️ Sem contato'},{k:'fechado',l:'🏆 Fechados'}].map(f=>(
                  <button key={f.k} onClick={()=>setSf(f.k)} style={{padding:'5px 11px',borderRadius:20,fontSize:11.5,fontWeight:600,cursor:'pointer',border:`1.5px solid ${sf===f.k?'#2563eb':'#e8eaed'}`,background:sf===f.k?'#2563eb':'#f4f5f7',color:sf===f.k?'#fff':'#6b7280',fontFamily:'inherit'}}>{f.l}</button>
                ))}
              </div>
            </div>
            {filt.map(c=>{
              const ci=CAT[c.categoria]||CAT.outros,st=S(c.status_crm||'ativo'),vt=vs.find(v=>v.nome_fantasia===c.nome_fantasia),du=c.ultima_transacao?Math.floor((Date.now()-new Date(c.ultima_transacao).getTime())/86400000):999
              return(
                <div key={c.id} onClick={()=>ad(c)} style={{padding:'13px 16px',borderBottom:'1px solid #e8eaed',background:'#fff',cursor:'pointer',borderLeft:`3px solid ${st.cor}`}} onMouseEnter={e=>(e.currentTarget.style.background='#fafbfc')} onMouseLeave={e=>(e.currentTarget.style.background='#fff')}>
                  <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
                    <div style={{width:40,height:40,borderRadius:10,background:ci.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{ci.icon}</div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:13.5,color:'#111827'}}>{c.nome_fantasia}</div>
                      <div style={{fontSize:11,color:'#9ca3af',marginTop:1}}>{c.razao_social}</div>
                      <div style={{display:'flex',alignItems:'center',gap:7,marginTop:7,flexWrap:'wrap'}}>
                        <span style={{background:st.bg,color:st.cor,border:`1px solid ${st.border}`,fontSize:10.5,fontWeight:700,padding:'2px 8px',borderRadius:20}}>{st.icon} {st.label}</span>
                        {vt&&<span style={{background:'#f0fdf4',color:'#16a34a',fontSize:10.5,fontWeight:700,padding:'2px 8px',borderRadius:20}}>✓ {vt.hora}</span>}
                        {du>30&&<span style={{background:'#fef2f2',color:'#dc2626',fontSize:10.5,fontWeight:700,padding:'2px 8px',borderRadius:20}}>⚠ +{du}d</span>}
                        {c.distancia!=null&&<span style={{fontSize:11,color:'#2563eb',fontWeight:600}}>📍 {fd(c.distancia)}</span>}
                        <span style={{fontSize:11,color:'#6b7280',fontWeight:600,marginLeft:'auto'}}>Taxa: {c.taxa}%</span>
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
            <div style={{marginBottom:14,fontSize:13,color:'#6b7280'}}>Distribuição dos {cs.length} comércios por status</div>
            {pip.filter(s=>s.total>0).map(s=>(
              <div key={s.key} style={{background:'#fff',border:`1px solid ${s.border}`,borderRadius:12,padding:'14px 16px',marginBottom:10,cursor:'pointer'}} onClick={()=>{setSf(s.key==='ativo'?'':s.key);setAb('lista')}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:44,height:44,borderRadius:12,background:s.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>{s.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:14,color:'#111827'}}>{s.label}</div>
                    <div style={{height:6,background:'#f4f5f7',borderRadius:3,overflow:'hidden',marginTop:6}}>
                      <div style={{height:'100%',width:`${(s.total/cs.length)*100}%`,background:s.cor,borderRadius:3}}/>
                    </div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    <div style={{fontSize:24,fontWeight:800,color:s.cor,lineHeight:1}}>{s.total}</div>
                    <div style={{fontSize:10,color:'#9ca3af'}}>{Math.round((s.total/cs.length)*100)}%</div>
                  </div>
                </div>
                {s.total>0&&s.total<=4&&(
                  <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${s.border}`}}>
                    {cs.filter(c=>(c.status_crm||'ativo')===s.key).map(c=>(
                      <div key={c.id} style={{fontSize:11.5,color:'#374151',padding:'3px 0',display:'flex',justifyContent:'space-between'}}><span>{c.nome_fantasia}</span><span style={{color:'#9ca3af'}}>{c.taxa}%</span></div>
                    ))}
                  </div>
                )}
                {s.total>4&&<div style={{marginTop:8,fontSize:11,color:s.cor,fontWeight:600}}>Toque para ver todos →</div>}
              </div>
            ))}
          </div>
        )}

        {/* MAPA */}
        {ab==='mapa'&&(
          <div style={{flex:1,position:'relative'}}>
            <div ref={mr} style={{height:'100%',width:'100%'}}/>
            <div style={{position:'absolute',top:12,left:12,zIndex:500,background:'rgba(255,255,255,0.95)',border:'1px solid #e8eaed',borderRadius:12,padding:'10px 14px',boxShadow:'0 4px 14px rgba(0,0,0,.08)',fontSize:11}}>
              <div style={{fontWeight:700,marginBottom:7,color:'#111827'}}>Status</div>
              {['em_negociacao','ligar','problema','sem_contato','fechado'].map(s=>{const st=S(s);return<div key={s} style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><div style={{width:10,height:10,borderRadius:'50%',background:st.cor,flexShrink:0}}/><span style={{color:'#374151'}}>{st.label}</span></div>})}
            </div>
            <button onClick={amr} style={{position:'absolute',bottom:16,left:'50%',transform:'translateX(-50%)',zIndex:500,background:'#16a34a',color:'#fff',border:'none',borderRadius:50,padding:'12px 22px',fontSize:13,fontWeight:800,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 4px 20px rgba(22,163,74,0.4)'}}>📍 Registrar Visita Aqui</button>
          </div>
        )}

        {/* HISTÓRICO */}
        {ab==='historico'&&(
          <div style={{flex:1,overflowY:'auto',padding:16}}>
            {vs.length===0?<div style={{padding:40,textAlign:'center',color:'#9ca3af'}}><div style={{fontSize:36,marginBottom:10}}>📋</div><div style={{fontWeight:600}}>Nenhuma visita hoje ainda</div></div>:vs.map((v,i)=>(
              <div key={i} style={{background:'#fff',border:'1px solid #e8eaed',borderRadius:12,padding:16,marginBottom:10}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:40,height:40,borderRadius:10,background:v.resultado==='contato'?'#f0fdf4':v.resultado==='expansao'?'#eff6ff':v.resultado==='problema'?'#fef2f2':'#fffbeb',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>{v.resultado==='contato'?'✅':v.resultado==='ausente'?'😔':v.resultado==='problema'?'⚠️':'🚀'}</div>
                  <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14}}>{v.nome_fantasia}</div><div style={{fontSize:11.5,color:'#6b7280',marginTop:2}}>{v.hora}</div></div>
                  {v.latitude&&<div style={{fontSize:10,color:'#16a34a',fontWeight:600}}>📍 GPS ✓</div>}
                </div>
                {v.observacao&&<div style={{background:'#f4f5f7',borderRadius:8,padding:'9px 12px',marginTop:10,fontSize:12.5,color:'#374151'}}>{v.observacao}</div>}
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
            {/* Header */}
            <div style={{padding:'16px 20px',borderBottom:'1px solid #e8eaed',display:'flex',alignItems:'flex-start',gap:14}}>
              <div style={{width:52,height:52,borderRadius:14,background:(CAT[csel.categoria]||CAT.outros).bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,flexShrink:0}}>{(CAT[csel.categoria]||CAT.outros).icon}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:18,fontWeight:800,color:'#111827'}}>{csel.nome_fantasia}</div>
                <div style={{fontSize:12,color:'#6b7280',marginTop:2}}>{csel.razao_social}</div>
                <div style={{display:'flex',gap:8,marginTop:6,flexWrap:'wrap'}}>
                  <span style={{background:'#eff6ff',color:'#1d4ed8',fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:20}}>Taxa: {csel.taxa}%</span>
                  <span style={{background:'#f4f5f7',color:'#6b7280',fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:20}}>{csel.terminal}</span>
                  {csel.distancia!=null&&<span style={{background:'#f0fdf4',color:'#16a34a',fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:20}}>📍 {fd(csel.distancia)}</span>}
                </div>
              </div>
              <span onClick={()=>setDe(false)} style={{fontSize:20,color:'#9ca3af',cursor:'pointer',padding:4}}>✕</span>
            </div>
            <div style={{padding:'16px 20px 28px'}}>
              {/* STATUS */}
              <div style={{marginBottom:18}}>
                <div style={{fontSize:11,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:10}}>Status de Relacionamento</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:7}}>
                  {PO.map(s=>{const st=S(s),at=(csel.status_crm||'ativo')===s;return(
                    <button key={s} onClick={()=>asmn(csel.id,s)} style={{padding:'9px 8px',borderRadius:9,border:`2px solid ${at?st.cor:st.border}`,background:at?st.bg:'#f4f5f7',cursor:'pointer',fontFamily:'inherit',textAlign:'center'}}>
                      <div style={{fontSize:16}}>{st.icon}</div>
                      <div style={{fontSize:10,fontWeight:700,color:at?st.cor:'#6b7280',marginTop:3,lineHeight:1.2}}>{st.label}</div>
                    </button>
                  )})}
                </div>
              </div>
              {/* DADOS */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:18}}>
                {[{l:'Endereço',v:csel.endereco},{l:'Telefone',v:csel.telefone||'—'},{l:'E-mail',v:csel.email||'—'},{l:'Contrato',v:csel.contrato},{l:'Segmento',v:csel.subgrupo},{l:'Última Tx',v:csel.ultima_transacao?new Date(csel.ultima_transacao).toLocaleDateString('pt-BR'):'—'}].map(f=>(
                  <div key={f.l}><div style={{fontSize:10,fontWeight:700,color:'#9ca3af',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:3}}>{f.l}</div><div style={{fontSize:12.5,fontWeight:500,color:'#111827',wordBreak:'break-word'}}>{f.v}</div></div>
                ))}
              </div>
              {/* COMBO */}
              <div style={{marginBottom:18}}>
                <div style={{fontSize:13,fontWeight:800,color:'#111827',marginBottom:6,display:'flex',alignItems:'center',gap:8}}>
                  📦 Montar Combo de Produtos
                  {ps.length>=2&&<span style={{background:'linear-gradient(135deg,#f59e0b,#ea580c)',color:'#fff',fontSize:10.5,fontWeight:700,padding:'2px 10px',borderRadius:20}}>COMBO ({ps.length})</span>}
                </div>
                {['Benefícios','Convênio','Agregado'].map(cat=>(
                  <div key={cat} style={{marginBottom:12}}>
                    <div style={{fontSize:10.5,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:7}}>{cat}</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:7}}>
                      {PRODS.filter(p=>p.cat===cat).map(p=>{const sl=ps.includes(p.id);return(
                        <div key={p.id} onClick={()=>tp(p.id)} style={{padding:'10px 12px',borderRadius:10,border:`2px solid ${sl?'#2563eb':'#e8eaed'}`,background:sl?'#eff6ff':'#f4f5f7',cursor:'pointer',display:'flex',alignItems:'flex-start',gap:8}}>
                          <span style={{fontSize:18,flexShrink:0}}>{p.icon}</span>
                          <div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:sl?'#1d4ed8':'#111827'}}>{p.nome}</div><div style={{fontSize:10.5,color:'#6b7280',marginTop:1,lineHeight:1.3}}>{p.desc}</div></div>
                          {sl&&<span style={{color:'#2563eb',fontSize:14}}>✓</span>}
                        </div>
                      )})}
                    </div>
                  </div>
                ))}
                {ps.length>=2&&(
                  <div style={{background:'linear-gradient(135deg,#fffbeb,#fff7ed)',border:'1.5px solid #fcd34d',borderRadius:12,padding:'14px 16px',marginTop:4}}>
                    <div style={{fontSize:12,fontWeight:800,color:'#92400e',marginBottom:8}}>🔥 Combo Personalizado</div>
                    {nomBen.length>0&&<div style={{fontSize:12,color:'#374151',marginBottom:4}}><b>Benefícios:</b> {nomBen.join(', ')}</div>}
                    {cusAgg>0&&<div style={{fontSize:12,color:'#374151',marginBottom:4}}><b>Agregados:</b> {combo.filter(p=>p.custo>0).map(p=>p.nome).join(' + ')}</div>}
                    {cusAgg>0&&<div style={{fontSize:13,fontWeight:800,color:'#d97706',marginTop:6}}>Custo estimado: R${cusAgg.toFixed(2).replace('.',',')}/vida/mês</div>}
                  </div>
                )}
              </div>
              {/* RESULTADO */}
              <div style={{fontSize:11,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:8}}>Resultado *</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14}}>
                {[{k:'contato',l:'✅ Contato feito'},{k:'ausente',l:'😔 Responsável ausente'},{k:'problema',l:'⚠️ Problema'},{k:'expansao',l:'🚀 Interesse em expansão'}].map(r=>(
                  <button key={r.k} onClick={()=>setRs(r.k)} style={{padding:12,borderRadius:10,border:`2px solid ${rs===r.k?'#2563eb':'#e8eaed'}`,background:rs===r.k?'#eff6ff':'#f4f5f7',cursor:'pointer',fontSize:13,fontWeight:600,color:rs===r.k?'#2563eb':'#6b7280',fontFamily:'inherit'}}>{r.l}</button>
                ))}
              </div>
              {rs&&<div style={{background:S(SA[rs]).bg,border:`1px solid ${S(SA[rs]).border}`,borderRadius:9,padding:'10px 14px',marginBottom:14,fontSize:12.5,fontWeight:600,color:S(SA[rs]).cor}}>Status automático: {S(SA[rs]).icon} {S(SA[rs]).label}</div>}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
                <div><div style={{fontSize:11,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:6}}>Próximo contato</div><input type="date" value={pd} onChange={e=>setPd(e.target.value)} style={{width:'100%',padding:'10px 13px',border:'1.5px solid #e8eaed',borderRadius:9,fontSize:13.5,fontFamily:'inherit',outline:'none',background:'#f4f5f7'}}/></div>
                <div><div style={{fontSize:11,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:6}}>Contrato</div><div style={{padding:'10px 13px',background:'#f4f5f7',borderRadius:9,fontSize:13,color:'#374151',fontWeight:600}}>{csel.contrato}</div></div>
              </div>
              <div style={{marginBottom:16}}><div style={{fontSize:11,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:6}}>Observação</div><textarea rows={2} value={ob} onChange={e=>setOb(e.target.value)} placeholder="Ex: Gerente demonstrou interesse no WellHub..." style={{width:'100%',padding:'10px 13px',border:'1.5px solid #e8eaed',borderRadius:9,fontSize:13.5,fontFamily:'inherit',outline:'none',background:'#f4f5f7',resize:'none'}}/></div>
              <button onClick={salvar} disabled={sv} style={{width:'100%',padding:15,background:sv?'#86efac':'#16a34a',color:'#fff',border:'none',borderRadius:12,fontSize:15,fontWeight:800,cursor:sv?'not-allowed':'pointer',fontFamily:'inherit'}}>{sv?'Salvando...':'📍 Salvar Visita de Pós-Venda'}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RÁPIDO */}
      {mo&&(
        <div onClick={e=>{if(e.target===e.currentTarget)setMo(false)}} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'flex-end',justifyContent:'center',zIndex:1000,backdropFilter:'blur(3px)'}}>
          <div style={{background:'#fff',borderRadius:'22px 22px 0 0',width:'100%',maxWidth:540,maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{width:40,height:4,background:'#d1d5db',borderRadius:2,margin:'12px auto 0'}}/>
            {!sc?(
              <>
                <div style={{padding:'14px 20px 0',display:'flex',alignItems:'flex-start',gap:12}}>
                  <div style={{flex:1}}><div style={{fontSize:17,fontWeight:800}}>{csel?csel.nome_fantasia:'Registrar Visita'}</div><div style={{fontSize:11.5,color:'#6b7280',marginTop:2}}>{csel?`Taxa: ${csel.taxa}%`:'Selecione o comércio'}</div></div>
                  <span onClick={()=>setMo(false)} style={{fontSize:20,color:'#9ca3af',cursor:'pointer',padding:4}}>✕</span>
                </div>
                <div style={{padding:'14px 20px 28px'}}>
                  {!csel&&(
                    <div style={{marginBottom:14}}>
                      <div style={{fontSize:11,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:6}}>Comércio *</div>
                      <input type="text" placeholder="Digite o nome..." value={bm} onChange={e=>setBm(e.target.value)} style={{width:'100%',padding:'11px 13px',border:'1.5px solid #e8eaed',borderRadius:9,fontSize:14,fontFamily:'inherit',outline:'none',background:'#f4f5f7'}}/>
                      {bm.length>=2&&(
                        <div style={{background:'#fff',border:'1px solid #e8eaed',borderRadius:9,marginTop:4,maxHeight:180,overflowY:'auto',boxShadow:'0 4px 14px rgba(0,0,0,.09)'}}>
                          {cs.filter(c=>c.nome_fantasia.toLowerCase().includes(bm.toLowerCase())).slice(0,6).map(c=>{const ci=CAT[c.categoria]||CAT.outros;return(
                            <div key={c.id} onClick={()=>{setCsel(c);setBm('')}} style={{padding:'10px 14px',cursor:'pointer',borderBottom:'1px solid #f4f5f7',display:'flex',alignItems:'center',gap:9}}>
                              <span style={{fontSize:18}}>{ci.icon}</span>
                              <div><div style={{fontWeight:600,fontSize:13}}>{c.nome_fantasia}</div><div style={{fontSize:11,color:'#9ca3af'}}>{c.endereco?.split(' - ')[0]}</div></div>
                            </div>
                          )})}
                        </div>
                      )}
                    </div>
                  )}
                  <div style={{borderRadius:10,padding:'11px 14px',display:'flex',alignItems:'center',gap:10,marginBottom:16,fontSize:12.5,fontWeight:600,background:gs==='ok'?'#f0fdf4':'#eff6ff',border:`1px solid ${gs==='ok'?'#86efac':'#dbeafe'}`,color:gs==='ok'?'#16a34a':'#2563eb'}}>
                    <span>{gs==='ok'?'📍':'⏳'}</span>
                    <div><div style={{fontWeight:700}}>{gs==='ok'?'✓ Localização capturada!':'Capturando...'}</div><div style={{fontSize:11,fontWeight:400}}>{gm}</div></div>
                  </div>
                  <div style={{fontSize:11,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:8}}>Resultado *</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14}}>
                    {[{k:'contato',l:'✅ Contato feito'},{k:'ausente',l:'😔 Ausente'},{k:'problema',l:'⚠️ Problema'},{k:'expansao',l:'🚀 Expansão'}].map(r=>(
                      <button key={r.k} onClick={()=>setRs(r.k)} style={{padding:12,borderRadius:10,border:`2px solid ${rs===r.k?'#2563eb':'#e8eaed'}`,background:rs===r.k?'#eff6ff':'#f4f5f7',cursor:'pointer',fontSize:13,fontWeight:600,color:rs===r.k?'#2563eb':'#6b7280',fontFamily:'inherit'}}>{r.l}</button>
                    ))}
                  </div>
                  {rs&&<div style={{background:S(SA[rs]).bg,border:`1px solid ${S(SA[rs]).border}`,borderRadius:9,padding:'10px 14px',marginBottom:14,fontSize:12.5,fontWeight:600,color:S(SA[rs]).cor}}>Status automático: {S(SA[rs]).icon} {S(SA[rs]).label}</div>}
                  <div style={{marginBottom:14}}><div style={{fontSize:11,fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:6}}>Observação</div><textarea rows={2} value={ob} onChange={e=>setOb(e.target.value)} placeholder="Ex: Responsável ausente, retornar amanhã..." style={{width:'100%',padding:'10px 13px',border:'1.5px solid #e8eaed',borderRadius:9,fontSize:13.5,fontFamily:'inherit',outline:'none',background:'#f4f5f7',resize:'none'}}/></div>
                  <button onClick={salvar} disabled={sv} style={{width:'100%',padding:15,background:sv?'#86efac':'#16a34a',color:'#fff',border:'none',borderRadius:12,fontSize:15,fontWeight:800,cursor:sv?'not-allowed':'pointer',fontFamily:'inherit'}}>{sv?'Salvando...':'📍 Salvar Visita'}</button>
                </div>
              </>
            ):(
              <div style={{textAlign:'center',padding:'32px 20px 28px'}}>
                <div style={{fontSize:56,marginBottom:12}}>✅</div>
                <div style={{fontSize:20,fontWeight:800,marginBottom:6}}>Visita registrada!</div>
                <div style={{fontSize:13,color:'#6b7280',marginBottom:12}}>{csel?.nome_fantasia}</div>
                <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:10,padding:'10px 14px',fontSize:12,color:'#16a34a',marginBottom:20}}>📍 {gla?.toFixed(5)}, {glo?.toFixed(5)} · Status atualizado</div>
                <div style={{display:'flex',gap:10,justifyContent:'center'}}>
                  <button onClick={()=>setMo(false)} style={{background:'#f4f5f7',border:'1px solid #e8eaed',borderRadius:9,padding:'10px 20px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit',color:'#374151'}}>Fechar</button>
                  <button onClick={()=>{setSc(false);setCsel(null);setRs('');setOb('');setBm('');cgm()}} style={{background:'#2563eb',color:'#fff',border:'none',borderRadius:9,padding:'10px 20px',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>+ Próxima</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
