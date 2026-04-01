export function calcularTotal(func: string, vlr: string): string {
  const funcionarios = parseInt(func)
  const valor = parseFloat(vlr.replace(',', '.'))

  if (isNaN(funcionarios) || isNaN(valor) || funcionarios <= 0 || valor <= 0) {
    return ''
  }

  return 'R$' + (funcionarios * valor).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
  })
}

export function formatarDataHora(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function formatarHora(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

export function dataHojeIso() {
  return new Date().toISOString().split('T')[0]
}
