import type { Comercio } from '@/types/crm'
import { CAT, SC, STATUS_COR } from '@/types/crm'

export function calcularDistancia(
  la1: number,
  lo1: number,
  la2: number,
  lo2: number
) {
  const R = 6371000
  const dL = ((la2 - la1) * Math.PI) / 180
  const dG = ((lo2 - lo1) * Math.PI) / 180

  const a =
    Math.sin(dL / 2) ** 2 +
    Math.cos((la1 * Math.PI) / 180) *
      Math.cos((la2 * Math.PI) / 180) *
      Math.sin(dG / 2) ** 2

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function formatarDistancia(metros: number) {
  return metros < 1000
    ? `${Math.round(metros)}m`
    : `${(metros / 1000).toFixed(1)}km`
}

export function statusVisual(status: string) {
  return SC[status] || SC.ativo
}

export function pinCor(comercio: Comercio): string {
  return STATUS_COR[comercio.status_crm || 'ativo'] || '#2563eb'
}

export function segmentoParaCategoria(segmento: string): string {
  const mapa: Record<string, string> = {
    Alimentação: 'supermercado',
    Farmácia: 'farmacia',
    Combustível: 'posto',
    'Restaurante/Bar': 'restaurante',
    Varejo: 'varejo',
  }

  return mapa[segmento] || 'outros'
}

export function categoriaVisual(categoria: string) {
  return CAT[categoria] || CAT.outros
}
