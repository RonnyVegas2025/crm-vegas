'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) { setErro('E-mail ou senha incorretos.'); setLoading(false) }
    else { router.push('/pos-venda'); router.refresh() }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#f4f5f7',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Plus Jakarta Sans', sans-serif", padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '40px 36px',
        width: '100%', maxWidth: 400,
        boxShadow: '0 10px 32px rgba(0,0,0,0.10)', border: '1px solid #e8eaed',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, background: '#16181d', borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 800, color: '#f59e0b', margin: '0 auto 12px',
          }}>V</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: -0.5 }}>
            Vegas <span style={{ color: '#f59e0b' }}>CRM</span>
          </div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
            Pós-Venda · Visitas de Campo
          </div>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
              E-mail
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              required placeholder="seu@email.com"
              style={{ width: '100%', padding: '11px 14px', background: '#f4f5f7', border: '1.5px solid #e8eaed', borderRadius: 9, fontSize: 14, color: '#111827', outline: 'none', fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
              Senha
            </label>
            <input
              type="password" value={senha} onChange={e => setSenha(e.target.value)}
              required placeholder="••••••••"
              style={{ width: '100%', padding: '11px 14px', background: '#f4f5f7', border: '1.5px solid #e8eaed', borderRadius: 9, fontSize: 14, color: '#111827', outline: 'none', fontFamily: 'inherit' }}
            />
          </div>

          {erro && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626', marginBottom: 14 }}>
              {erro}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            style={{ width: '100%', padding: 13, background: loading ? '#93c5fd' : '#2563eb', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#9ca3af' }}>
          Acesso restrito · Vegas Card
        </div>
      </div>
    </div>
  )
}

