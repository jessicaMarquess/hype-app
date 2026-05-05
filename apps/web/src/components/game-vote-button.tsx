'use client'

import { useState } from 'react'
import { ThumbsUp } from 'lucide-react'
import { useSession, signIn } from 'next-auth/react'
import { api } from '@/lib/api'
import { clsx } from 'clsx'

interface Props {
  gameId:       string
  initialVotes: number
}

export function GameVoteButton({ gameId, initialVotes }: Props) {
  const { data: session } = useSession()
  const [votes,   setVotes]   = useState(initialVotes)
  const [voted,   setVoted]   = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleVote() {
    if (!session) { signIn('google'); return }
    if (loading) return
    setLoading(true)
    try {
      if (voted) {
        await api.delete(`/votes/${gameId}`)
        setVotes(v => v - 1)
        setVoted(false)
      } else {
        await api.post('/votes', { gameId })
        setVotes(v => v + 1)
        setVoted(true)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleVote}
      disabled={loading}
      className={clsx(
        'relative flex items-center gap-3 pl-6 pr-5 py-3 rounded-2xl overflow-hidden font-semibold transition-all shadow-md',
        voted
          ? 'bg-zinc-800 text-stone-100 hover:bg-zinc-700'
          : 'bg-stone-100 text-zinc-900 hover:bg-stone-200',
        loading && 'opacity-60 cursor-not-allowed'
      )}
    >
      {/* Faixa colorida da esquerda */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 flex flex-col">
        <div className="flex-1 bg-green-500" />
        <div className="flex-1 bg-amber-500" />
        <div className="flex-1 bg-red-500" />
      </div>

      <ThumbsUp
        size={20}
        className={clsx(
          'flex-shrink-0',
          voted ? 'fill-stone-100 stroke-none' : 'fill-zinc-900 stroke-none'
        )}
      />
      <span className="tabular-nums text-base">
        {votes.toLocaleString('pt-BR')}
      </span>
    </button>
  )
}
