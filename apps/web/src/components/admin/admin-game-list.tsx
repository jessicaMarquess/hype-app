'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Check, X, ExternalLink, RotateCcw } from 'lucide-react'

interface Game {
  id:          string
  title:       string
  description: string
  slug:        string
  coverUrl:    string | null
  status:      string
  team:        { name: string }
  categories:  { category: { name: string } }[]
  _count:      { votes: number }
  createdAt:   string
}

type Tab = 'PENDING' | 'PUBLISHED' | 'REJECTED'

const tabLabel: Record<Tab, string> = {
  PENDING:   'Pendentes',
  PUBLISHED: 'Publicados',
  REJECTED:  'Rejeitados',
}

export function AdminGameList({ initialGames }: { initialGames: Game[] }) {
  const [tab,     setTab]     = useState<Tab>('PENDING')
  const [games,   setGames]   = useState<Record<Tab, Game[]>>({
    PENDING:   initialGames,
    PUBLISHED: [],
    REJECTED:  [],
  })
  const [loadedTabs, setLoadedTabs] = useState<Set<Tab>>(new Set(['PENDING']))
  const [loading,    setLoading]    = useState<string | null>(null)

  async function loadTab(t: Tab) {
    if (loadedTabs.has(t)) { setTab(t); return }
    setTab(t)
    try {
      const { data } = await api.get(`/admin/games?status=${t}`)
      setGames(g => ({ ...g, [t]: data }))
      setLoadedTabs(s => new Set([...s, t]))
    } catch (err) {
      console.error(err)
    }
  }

  async function review(gameId: string, status: 'PUBLISHED' | 'REJECTED' | 'PENDING') {
    setLoading(gameId)
    try {
      await api.patch(`/admin/games/${gameId}/review`, { status })
      setGames(g => {
        const updated = { ...g }
        const game = Object.values(g).flat().find(x => x.id === gameId)
        if (!game) return g
        const fromTab = game.status as Tab
        updated[fromTab] = updated[fromTab].filter(x => x.id !== gameId)
        if (loadedTabs.has(status as Tab)) {
          updated[status as Tab] = [{ ...game, status }, ...updated[status as Tab]]
        }
        return updated
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(null)
    }
  }

  const current = games[tab]

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit">
        {(['PENDING', 'PUBLISHED', 'REJECTED'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => loadTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-zinc-700 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tabLabel[t]}
            {t === 'PENDING' && games.PENDING.length > 0 && (
              <span className="ml-1.5 text-xs text-amber-400">{games.PENDING.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {current.length === 0 ? (
        <div className="py-12 text-center text-zinc-600 text-sm">
          Nenhum jogo {tabLabel[tab].toLowerCase()}.
        </div>
      ) : (
        <div className="space-y-3">
          {current.map(game => (
            <div key={game.id}
              className="flex gap-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800">

              {/* Cover */}
              <div className="w-16 h-20 rounded-lg bg-zinc-800 flex-shrink-0 overflow-hidden relative">
                {game.coverUrl && (
                  <Image src={game.coverUrl} alt={game.title} fill className="object-cover" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-medium text-zinc-200 truncate">{game.title}</p>
                  <Link href={`/games/${game.slug}`} target="_blank"
                    className="text-zinc-600 hover:text-zinc-400 transition-colors flex-shrink-0">
                    <ExternalLink size={13} />
                  </Link>
                </div>
                <p className="text-xs text-zinc-500 mb-1">{game.team.name}</p>
                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-2">
                  {game.description}
                </p>
                <div className="flex items-center gap-3 text-xs text-zinc-600">
                  <span>Enviado em {new Date(game.createdAt).toLocaleDateString('pt-BR')}</span>
                  {game.categories.length > 0 && (
                    <span>{game.categories.map(c => c.category.name).join(', ')}</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 flex-shrink-0 justify-center">
                {tab !== 'PUBLISHED' && (
                  <button
                    onClick={() => review(game.id, 'PUBLISHED')}
                    disabled={loading === game.id}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-teal-900/40 hover:bg-teal-900/70 text-teal-400 text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    <Check size={13} /> Publicar
                  </button>
                )}
                {tab !== 'REJECTED' && (
                  <button
                    onClick={() => review(game.id, 'REJECTED')}
                    disabled={loading === game.id}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-900/20 hover:bg-red-900/40 text-red-400 text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    <X size={13} /> Rejeitar
                  </button>
                )}
                {tab !== 'PENDING' && (
                  <button
                    onClick={() => review(game.id, 'PENDING')}
                    disabled={loading === game.id}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    <RotateCcw size={13} /> Pendente
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
