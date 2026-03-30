import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Vegas CRM — Pós-Venda',
  description: 'Sistema de visitas pós-venda Vegas Card',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}

