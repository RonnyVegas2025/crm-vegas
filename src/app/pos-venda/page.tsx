'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'

import TopbarCrm from '@/components/crm/TopbarCrm'
import KpisCrm from '@/components/crm/KpisCrm'
import TabsCrm from '@/components/crm/TabsCrm'

import type { Comercio, Visita } from '@/types/crm'

import {
  CAT,
  SC,
  SA,
  PO,
  RES_LABEL,
  RES_COR,
  RES_ICON,
} from '@/types/crm'

import {
  calcularDistancia,
  formatarDistancia,
  statusVisual,
  pinCor,
} from '@/utils/geo'

import {
  formatarDataHora,
} from '@/utils/crm'

import {
  buscarComerciosAtivos,
  atualizarStatusComercio,
} from '@/services/crmService'

import {
  buscarVisitasHoje,
} from '@/services/visitaService'

export default function PosVendaPage() {
  const sb = createClient()
  const router = useRouter()
  const mr = useRef<any>(null)
  const mi = useRef<any>(null)

  const [cs, setCs] = useState<Comercio[]>([])
  const [vs, setVs] = useState<Visita[]>([])
  const [lo, setLo] = useState(true)
  const [ab, setAb] = useState<'lista' | 'pipeline' | 'mapa' | 'historico'>('lista')
  const [usr, setUsr] = useState<any>(null)
  const [gla, setGla] = useState<number | null>(null)
  const [glo, setGlo] = useState<number | null>(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await sb.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUsr(user)

      const comercios = await buscarComerciosAtivos(sb)
      setCs(comercios)

      const visitas = await buscarVisitasHoje(sb)
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

  async function logout() {
    await sb.auth.signOut()
    router.push('/login')
  }

  async function alterarStatus(id: string, status: string) {
    await atualizarStatusComercio(sb, id, status)

    setCs((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status_crm: status } : c))
    )
  }

  const totalLeads = cs.filter((c) => c.tipo_origem === 'lead').length
  const totalPv = cs.filter((c) => c.tipo_origem !== 'lead').length

  if (lo) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        Carregando...
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>

      {/* 🔹 Topo */}
      <TopbarCrm
        email={usr?.email}
        onRegistrarVisita={() => alert('Modal aqui depois')}
        onLogout={logout}
      />

      {/* 🔹 KPIs */}
      <KpisCrm
        totalPv={totalPv}
        totalLeads={totalLeads}
        visitasHoje={vs.length}
        negociando={cs.filter((c) => c.status_crm === 'em_negociacao').length}
        fechados={cs.filter((c) => c.status_crm === 'fechado').length}
      />

      {/* 🔹 Tabs */}
      <TabsCrm
        abaAtual={ab}
        totalLista={cs.length}
        totalHoje={vs.length}
        onChange={setAb}
      />

      {/* 🔹 Conteúdo */}
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>

        {ab === 'lista' && (
          <div>
            {cs.map((c) => (
              <div
                key={c.id}
                style={{
                  border: '1px solid #e8eaed',
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 8,
                }}
              >
                <b>{c.nome_fantasia}</b>

                <div style={{ fontSize: 12, color: '#6b7280' }}>
                  {c.endereco}
                </div>

                <div style={{ marginTop: 6 }}>
                  <span
                    style={{
                      background: statusVisual(c.status_crm).bg,
                      padding: '4px 8px',
                      borderRadius: 20,
                      fontSize: 11,
                    }}
                  >
                    {statusVisual(c.status_crm).label}
                  </span>
                </div>

                <div style={{ marginTop: 8 }}>
                  <button onClick={() => alterarStatus(c.id, 'em_negociacao')}>
                    🔥 Negociar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {ab === 'pipeline' && (
          <div>
            {PO.map((s) => (
              <div key={s}>
                {SC[s].label}: {cs.filter((c) => c.status_crm === s).length}
              </div>
            ))}
          </div>
        )}

        {ab === 'historico' && (
          <div>
            {vs.map((v) => (
              <div key={v.id}>
                {v.nome_fantasia} - {formatarDataHora(v.data_visita)}
              </div>
            ))}
          </div>
        )}

        {ab === 'mapa' && (
          <div>Mapa entra no próximo lote</div>
        )}
      </div>
    </div>
  )
}
