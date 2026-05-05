'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Navbar } from '@/components/navbar'
import { api } from '@/lib/api'
import { Upload, Plus, ChevronDown, ImagePlus, X } from 'lucide-react'
import Image from 'next/image'

interface Team     { id: string; name: string; slug: string }
interface Category { id: string; name: string; slug: string }

const inputCls = 'w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition-colors'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-300 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

async function uploadToR2(file: File, folder: 'covers' | 'banners'): Promise<string> {
  const { data } = await api.post('/upload/presign', {
    filename:    file.name,
    contentType: file.type,
    folder,
  })
  await fetch(data.uploadUrl, {
    method:  'PUT',
    body:    file,
    headers: { 'Content-Type': file.type },
  })
  return data.publicUrl
}

function ImageUpload({
  label,
  folder,
  preview,
  onUpload,
  aspectClass = 'aspect-video',
}: {
  label:       string
  folder:      'covers' | 'banners'
  preview:     string
  onUpload:    (url: string) => void
  aspectClass?: string
}) {
  const inputRef   = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadToR2(file, folder)
      onUpload(url)
    } catch {
      alert('Erro ao fazer upload. Verifique as configurações do R2.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <Field label={label}>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className={`relative ${aspectClass} rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-900 hover:border-zinc-500 transition-colors cursor-pointer overflow-hidden flex items-center justify-center`}
      >
        {preview ? (
          <>
            <Image src={preview} alt={label} fill className="object-cover" />
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onUpload('') }}
              className="absolute top-2 right-2 p-1 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-zinc-600 pointer-events-none">
            {uploading
              ? <span className="text-xs">Enviando...</span>
              : <><ImagePlus size={24} /><span className="text-xs">Clique para enviar</span></>
            }
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </Field>
  )
}

export default function SubmitPage() {
  const { data: session } = useSession()
  const router = useRouter()

  const [teams,       setTeams]       = useState<Team[]>([])
  const [categories,  setCategories]  = useState<Category[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const [selectedTeamId,    setSelectedTeamId]    = useState('')
  const [creatingTeam,      setCreatingTeam]       = useState(false)
  const [newTeamName,       setNewTeamName]        = useState('')
  const [selectedCategories,setSelectedCategories] = useState<string[]>([])

  const [form, setForm] = useState({
    title:       '',
    description: '',
    launchDate:  '',
    launched:    false,
    coverUrl:    '',
    bannerUrl:   '',
  })

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    if (!session) return
    Promise.all([
      api.get('/teams/mine').then(r => r.data),
      api.get('/games/categories').then(r => r.data),
    ]).then(([t, c]) => {
      setTeams(t)
      setCategories(c)
      if (t.length > 0) setSelectedTeamId(t[0].id)
      else setCreatingTeam(true)
    }).finally(() => setLoadingData(false))
  }, [session?.user?.email])

  if (!session) {
    return (
      <>
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-16 text-center">
          <p className="text-zinc-400">Você precisa estar logado para enviar um jogo.</p>
        </main>
      </>
    )
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      let teamId = selectedTeamId
      if (creatingTeam) {
        if (!newTeamName.trim()) { setError('Digite o nome do time.'); setLoading(false); return }
        const res = await api.post('/teams', { name: newTeamName.trim() })
        teamId = res.data.id
      }
      await api.post('/games', {
        ...form,
        teamId,
        launchDate:  form.launchDate ? new Date(form.launchDate).toISOString() : undefined,
        categoryIds: selectedCategories,
      })
      router.push('/?submitted=1')
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'Erro ao enviar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-xl font-semibold text-zinc-100 mb-8">Enviar jogo para análise</h1>

        {loadingData ? (
          <p className="text-sm text-zinc-500">Carregando...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Time */}
            <Field label="Time de desenvolvimento *">
              {teams.length > 0 && !creatingTeam ? (
                <div className="space-y-2">
                  <div className="relative">
                    <select
                      value={selectedTeamId}
                      onChange={e => setSelectedTeamId(e.target.value)}
                      className={`${inputCls} appearance-none pr-8`}
                    >
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                  </div>
                  <button type="button" onClick={() => setCreatingTeam(true)}
                    className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                    <Plus size={12} /> Criar novo time
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <input required className={inputCls} placeholder="Nome do seu time ou empresa"
                    value={newTeamName} onChange={e => setNewTeamName(e.target.value)} />
                  {teams.length > 0 && (
                    <button type="button"
                      onClick={() => { setCreatingTeam(false); setSelectedTeamId(teams[0].id) }}
                      className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                      ← Usar time existente
                    </button>
                  )}
                </div>
              )}
            </Field>

            <Field label="Nome do jogo *">
              <input required className={inputCls} placeholder="Ex: Moonleap"
                value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </Field>

            <Field label="Descrição *">
              <textarea required rows={5} className={inputCls} placeholder="Descreva seu jogo..."
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </Field>

            {/* Imagens via upload */}
            <div className="grid grid-cols-2 gap-4">
              <ImageUpload
                label="Capa do jogo"
                folder="covers"
                preview={form.coverUrl}
                onUpload={url => setForm(f => ({ ...f, coverUrl: url }))}
                aspectClass="aspect-[3/4]"
              />
              <ImageUpload
                label="Banner"
                folder="banners"
                preview={form.bannerUrl}
                onUpload={url => setForm(f => ({ ...f, bannerUrl: url }))}
                aspectClass="aspect-video"
              />
            </div>

            <Field label="Data de lançamento">
              <input type="date" className={inputCls}
                value={form.launchDate} onChange={e => setForm(f => ({ ...f, launchDate: e.target.value }))} />
            </Field>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="launched" checked={form.launched}
                onChange={e => setForm(f => ({ ...f, launched: e.target.checked }))}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 accent-purple-500" />
              <label htmlFor="launched" className="text-sm text-zinc-300">Jogo já foi lançado</label>
            </div>

            <Field label="Categorias">
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button key={cat.id} type="button"
                    onClick={() => setSelectedCategories(s =>
                      s.includes(cat.id) ? s.filter(c => c !== cat.id) : [...s, cat.id]
                    )}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      selectedCategories.includes(cat.id)
                        ? 'bg-purple-600 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}>
                    {cat.name}
                  </button>
                ))}
              </div>
            </Field>

            {error && (
              <p className="text-sm text-red-400 bg-red-900/20 border border-red-800 px-4 py-3 rounded-lg">
                {error}
              </p>
            )}

            <div className="pt-2">
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-60 font-medium text-sm transition-colors flex items-center justify-center gap-2">
                <Upload size={16} />
                {loading ? 'Enviando...' : 'Enviar para análise'}
              </button>
              <p className="text-xs text-zinc-600 text-center mt-3">
                Seu jogo ficará como pendente até ser aprovado pela equipe do Hype.
              </p>
            </div>
          </form>
        )}
      </main>
    </>
  )
}
