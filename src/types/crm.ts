export interface Comercio {
  id: string
  nome_fantasia: string
  razao_social: string
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
  latitude?: number
  longitude?: number
  distancia?: number
  status_crm: string
  data_ultimo_contato?: string
  data_proximo_contato?: string
  produtos_negociando?: string[]
  obs_crm?: string
  tipo_origem?: string
  cep?: string
  ativo?: boolean
}

export interface Visita {
  id: string
  nome_fantasia: string
  resultado: string
  observacao: string
  latitude: number | null
  longitude: number | null
  hora: string
  data_visita: string
  tipo_origem?: string
}

export interface HistoricoItem {
  id: string
  resultado: string
  observacao: string
  data_visita: string
  hora: string
}

export interface NegItem {
  valor: string
  obs: string
}

export interface NegEmpItem {
  func: string
  vlr: string
  obs: string
}

export const CAT: Record<string, { icon: string; cor: string; bg: string }> = {
  supermercado: { icon: '🛒', cor: '#2563eb', bg: '#eff6ff' },
  restaurante: { icon: '🍽', cor: '#dc2626', bg: '#fef2f2' },
  posto: { icon: '⛽', cor: '#16a34a', bg: '#f0fdf4' },
  farmacia: { icon: '💊', cor: '#7c3aed', bg: '#f5f3ff' },
  varejo: { icon: '🛍', cor: '#d97706', bg: '#fffbeb' },
  outros: { icon: '🏪', cor: '#6b7280', bg: '#f4f5f7' },
}

export const STATUS_COR: Record<string, string> = {
  ativo: '#2563eb',
  novo_lead: '#8b5cf6',
  visita_realizada: '#0891b2',
  em_negociacao: '#d97706',
  ligar: '#7c3aed',
  retornar: '#06b6d4',
  proposta_enviada: '#ea580c',
  problema: '#dc2626',
  sem_contato: '#64748b',
  fechado: '#16a34a',
}

export const SC: Record<
  string,
  { label: string; icon: string; cor: string; bg: string; border: string }
> = {
  ativo: {
    label: 'Ativo',
    icon: '🔵',
    cor: '#2563eb',
    bg: '#eff6ff',
    border: '#93c5fd',
  },
  novo_lead: {
    label: 'Novo Lead',
    icon: '⭐',
    cor: '#8b5cf6',
    bg: '#f5f3ff',
    border: '#c4b5fd',
  },
  visita_realizada: {
    label: 'Visita Realizada',
    icon: '✅',
    cor: '#0891b2',
    bg: '#ecfeff',
    border: '#67e8f9',
  },
  em_negociacao: {
    label: 'Em Negociação',
    icon: '🔥',
    cor: '#d97706',
    bg: '#fffbeb',
    border: '#fcd34d',
  },
  ligar: {
    label: 'Ligar',
    icon: '📞',
    cor: '#7c3aed',
    bg: '#f5f3ff',
    border: '#c4b5fd',
  },
  retornar: {
    label: 'Retornar',
    icon: '📅',
    cor: '#06b6d4',
    bg: '#ecfeff',
    border: '#67e8f9',
  },
  proposta_enviada: {
    label: 'Proposta Enviada',
    icon: '📄',
    cor: '#ea580c',
    bg: '#fff7ed',
    border: '#fdba74',
  },
  problema: {
    label: 'Problema',
    icon: '⚠️',
    cor: '#dc2626',
    bg: '#fef2f2',
    border: '#fca5a5',
  },
  sem_contato: {
    label: 'Sem Contato',
    icon: '❄️',
    cor: '#64748b',
    bg: '#f8fafc',
    border: '#cbd5e1',
  },
  fechado: {
    label: 'Produto Fechado',
    icon: '🏆',
    cor: '#16a34a',
    bg: '#f0fdf4',
    border: '#4ade80',
  },
}

export const SA: Record<string, string> = {
  contato: 'visita_realizada',
  ausente: 'ligar',
  problema: 'problema',
  expansao: 'em_negociacao',
}

export const PO = [
  'novo_lead',
  'ativo',
  'visita_realizada',
  'em_negociacao',
  'ligar',
  'retornar',
  'proposta_enviada',
  'problema',
  'sem_contato',
  'fechado',
]

export const RES_LABEL: Record<string, string> = {
  contato: '✅ Contato feito',
  ausente: '😔 Ausente',
  problema: '⚠️ Problema',
  expansao: '🚀 Expansão',
}

export const RES_COR: Record<string, string> = {
  contato: '#f0fdf4',
  ausente: '#fffbeb',
  problema: '#fef2f2',
  expansao: '#eff6ff',
}

export const RES_ICON: Record<string, string> = {
  contato: '✅',
  ausente: '😔',
  problema: '⚠️',
  expansao: '🚀',
}

export const PRODS_COM = [
  { id: 21, nome: 'Credenciamento', icon: '🏪', desc: 'Credenciar na rede Vegas', tipo: 'taxa' },
  { id: 22, nome: 'Clube Vegas', icon: '🎁', desc: 'Programa de vantagens', tipo: 'livre' },
  { id: 23, nome: 'Cash Clube', icon: '💰', desc: 'Cashback e benefícios', tipo: 'taxa' },
  { id: 24, nome: 'Vegas Pay', icon: '💳', desc: 'Solução de pagamentos Vegas', tipo: 'taxa' },
] as const

export const PRODS_EMP = [
  { id: 1, nome: 'Alimentação', icon: '🍽', cat: 'Benefícios', tipo: 'beneficio', desc: 'Benefício alimentação' },
  { id: 2, nome: 'Refeição', icon: '🥘', cat: 'Benefícios', tipo: 'beneficio', desc: 'Benefício refeição' },
  { id: 3, nome: 'Aux. Farmácia', icon: '💊', cat: 'Benefícios', tipo: 'beneficio', desc: 'Aux. farmácia' },
  { id: 4, nome: 'Aux. Combustível', icon: '⛽', cat: 'Benefícios', tipo: 'beneficio', desc: 'Aux. combustível' },
  { id: 5, nome: 'Farmácia Convênio', icon: '🏥', cat: 'Convênio', tipo: 'beneficio', desc: 'Convênio farmácias' },
  { id: 6, nome: 'Day Bank', icon: '🏦', cat: 'Convênio', tipo: 'beneficio', desc: 'Conta digital' },
  { id: 7, nome: 'Combustível Frota', icon: '🚛', cat: 'Convênio', tipo: 'beneficio', desc: 'Gestão de frota' },
  { id: 8, nome: 'WellHub', icon: '🏋', cat: 'Agregado', tipo: 'agregado', desc: 'Plataforma de bem-estar' },
  { id: 9, nome: 'Total Pass', icon: '🎯', cat: 'Agregado', tipo: 'agregado', desc: 'Acesso a academias' },
  { id: 10, nome: 'Telemedicina', icon: '🩺', cat: 'Agregado', tipo: 'agregado', desc: 'Consultas médicas online' },
  { id: 11, nome: 'Vidalink', icon: '💊', cat: 'Agregado', tipo: 'agregado', desc: 'Auxílio Farmácia' },
  { id: 12, nome: 'Seguro MAC+Auto', icon: '🚗', cat: 'Agregado', tipo: 'agregado', desc: 'Seguro de vida + automóvel' },
] as const

export const SEGMENTOS = [
  'Alimentação',
  'Farmácia',
  'Combustível',
  'Varejo',
  'Restaurante/Bar',
  'Serviços',
  'Saúde',
  'Outros',
]
