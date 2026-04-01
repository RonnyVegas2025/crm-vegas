import type { Visita } from '@/types/crm'
import { dataHojeIso, formatarHora } from '@/utils/crm'

export async function buscarVisitasHoje(sb: any): Promise<Visita[]> {
  const hoje = dataHojeIso()

  const { data, error } = await sb
    .from('visitas_campo')
    .select('*')
    .gte('data_visita', hoje)
    .order('data_visita', { ascending: false })

  if (error) {
    console.error('Erro ao buscar visitas de hoje:', error.message)
    return []
  }

  return (data || []).map((v: any) => ({
    id: v.id,
    nome_fantasia: v.nome_fantasia,
    resultado: v.resultado,
    observacao: v.observacao || '',
    latitude: v.latitude,
    longitude: v.longitude,
    hora: formatarHora(v.data_visita),
    data_visita: v.data_visita,
    tipo_origem: v.tipo_origem,
  }))
}

export async function registrarVisita(
  sb: any,
  payload: Record<string, any>
) {
  const { error } = await sb.from('visitas_campo').insert(payload)

  if (error) {
    throw new Error(error.message)
  }
}
