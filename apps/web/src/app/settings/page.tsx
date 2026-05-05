'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Navbar } from '@/components/navbar'
import { api } from '@/lib/api'
import { Camera, Check, X } from 'lucide-react'

interface UserProfile {
  id:          string
  name:        string
  email:       string
  avatarUrl:   string | null
  hasPassword: boolean
}

const inputCls = 'w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors'

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
        {description && <p className="text-xs text-zinc-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  )
}

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div className={`fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-xl z-50 ${
      type === 'success'
        ? 'bg-emerald-900/90 border border-emerald-700 text-emerald-200'
        : 'bg-red-900/90 border border-red-700 text-red-200'
    }`}>
      {type === 'success' ? <Check size={15} /> : <X size={15} />}
      {message}
    </div>
  )
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const router = useRouter()

  const [profile,     setProfile]     = useState<UserProfile | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [toast,       setToast]       = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const avatarRef = useRef<HTMLInputElement>(null)

  // Profile form
  const [name,  setName]  = useState('')
  const [email, setEmail] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  // Password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword,     setNewPassword]     = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword,  setSavingPassword]  = useState(false)

  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => {
    if (!session) return
    api.get('/auth/me').then(r => {
      setProfile(r.data)
      setName(r.data.name)
      setEmail(r.data.email)
    }).catch(() => router.push('/')).finally(() => setLoading(false))
  }, [session?.user?.email])

  if (!session) {
    router.push('/login')
    return null
  }

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    try {
      const { data: presign } = await api.post('/upload/presign', {
        filename:    file.name,
        contentType: file.type,
        folder:      'avatars',
      })
      await fetch(presign.uploadUrl, {
        method:  'PUT',
        body:    file,
        headers: { 'Content-Type': file.type },
      })
      await api.patch('/auth/profile', { avatarUrl: presign.publicUrl })
      setProfile(p => p ? { ...p, avatarUrl: presign.publicUrl } : p)
      showToast('Foto atualizada!', 'success')
    } catch {
      showToast('Erro ao enviar foto.', 'error')
    } finally {
      setUploadingAvatar(false)
      if (avatarRef.current) avatarRef.current.value = ''
    }
  }

  async function handleSaveProfile(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setSavingProfile(true)
    try {
      await api.patch('/auth/profile', { name, email })
      setProfile(p => p ? { ...p, name, email } : p)
      showToast('Perfil atualizado!', 'success')
    } catch (err: any) {
      showToast(err.response?.data?.error ?? 'Erro ao salvar.', 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleSavePassword(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (newPassword !== confirmPassword) { showToast('As senhas não coincidem.', 'error'); return }
    if (newPassword.length < 8) { showToast('A senha deve ter pelo menos 8 caracteres.', 'error'); return }
    setSavingPassword(true)
    try {
      await api.patch('/auth/password', {
        currentPassword: currentPassword || undefined,
        newPassword,
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      if (profile) setProfile({ ...profile, hasPassword: true })
      showToast('Senha alterada!', 'success')
    } catch (err: any) {
      showToast(err.response?.data?.error ?? 'Erro ao alterar senha.', 'error')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        <h1 className="text-xl font-semibold text-zinc-100">Configurações de perfil</h1>

        {loading ? (
          <p className="text-sm text-zinc-500">Carregando...</p>
        ) : (
          <>
            {/* ── Avatar ─────────────────────────────────────────────── */}
            <Section title="Foto de perfil">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center text-2xl text-zinc-500">
                    {profile?.avatarUrl ? (
                      <Image src={profile.avatarUrl} alt="Avatar" fill className="object-cover" />
                    ) : (
                      <span>{profile?.name?.[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <button
                    onClick={() => avatarRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-purple-600 hover:bg-purple-500 flex items-center justify-center shadow-lg transition-colors disabled:opacity-60"
                  >
                    <Camera size={13} />
                  </button>
                </div>

                <div>
                  <p className="text-sm text-zinc-300 font-medium">{profile?.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{profile?.email}</p>
                  <button
                    onClick={() => avatarRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="text-xs text-purple-400 hover:text-purple-300 mt-2 transition-colors disabled:opacity-50"
                  >
                    {uploadingAvatar ? 'Enviando...' : 'Trocar foto'}
                  </button>
                </div>

                <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>
            </Section>

            {/* ── Informações ────────────────────────────────────────── */}
            <Section title="Informações pessoais" description="Altere seu nome e email de acesso.">
              <form onSubmit={handleSaveProfile} className="space-y-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Nome</label>
                  <input className={inputCls} value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Email</label>
                  <input type="email" className={inputCls} value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-sm font-medium transition-colors"
                  >
                    {savingProfile ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </form>
            </Section>

            {/* ── Senha ──────────────────────────────────────────────── */}
            <Section
              title={profile?.hasPassword ? 'Alterar senha' : 'Definir senha'}
              description={
                profile?.hasPassword
                  ? 'Para alterar, informe sua senha atual.'
                  : 'Sua conta usa login pelo Google. Defina uma senha para também poder entrar por email.'
              }
            >
              <form onSubmit={handleSavePassword} className="space-y-3">
                {profile?.hasPassword && (
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1.5">Senha atual</label>
                    <input
                      type="password"
                      className={inputCls}
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Nova senha</label>
                  <input
                    type="password"
                    className={inputCls}
                    placeholder="Mínimo 8 caracteres"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Confirmar nova senha</label>
                  <input
                    type="password"
                    className={inputCls}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-sm font-medium transition-colors"
                  >
                    {savingPassword ? 'Salvando...' : profile?.hasPassword ? 'Alterar senha' : 'Definir senha'}
                  </button>
                </div>
              </form>
            </Section>

            {/* ── Zona de perigo ─────────────────────────────────────── */}
            <Section title="Sessão">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-300">Encerrar sessão</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Você será desconectado desta conta.</p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-sm text-zinc-300 transition-colors"
                >
                  Sair
                </button>
              </div>
            </Section>
          </>
        )}
      </main>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </>
  )
}
