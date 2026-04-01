import type { Comercio, HistoricoItem } from '@/types/crm'
import { formatarHora } from '@/utils/crm'

export async function buscarComerciosAtivos(sb: any): Promise<Comercio[]> {
  const { data, error } = await sb
    .from('comercios_credenciados')
    .select('*')
    .eq('ativo', true)
    .order('nome_fantasia')

  if (error) {
    console.error('Erro ao buscar comércios:', error.message)
    return []
  }

  return data || []
}

export async function atualizarStatusComercio(
  sb: any,
  id: string,
  status: string
) {
  const { error } = await sb
    .from('comercios_credenciados')
    .update({ status_crm: status })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}

export async function atualizarPosVisita(
  sb: any,
  comercioId: string,
  payload: {
    status_crm: string
    data_ultimo_contato: string
    data_proximo_contato: string | null
    produtos_negociando: string[] | null
    obs_crm: string | null
  }
) {
  const { error } = await sb
    .from('comercios_credenciados')
    .update(payload)
    .eq('id', comercioId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function buscarHistoricoComercio(
  sb: any,
  nomeFantasia: string
): Promise<HistoricoItem[]> {
  const { data, error } = await sb
    .from('visitas_campo')
    .select('id,resultado,observacao,data_visita')
    .eq('nome_fantasia', nomeFantasia)
    .order('data_visita', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Erro ao buscar histórico:', error.message)
    return []
  }

  return (data || []).map((v: any) => ({
    id: v.id,
    resultado: v.resultado,
    observacao: v.observacao || '',
    data_visita: v.data_visita,
    hora: formatarHora(v.data_visita),
  }))
}

export async function criarNovoLead(
  sb: any,
  payload: Record<string, any>
) {
  const { error } = await sb.from('comercios_credenciados').insert(payload)

  if (error) {
    throw new Error(error.message)
  }
}
