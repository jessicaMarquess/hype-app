'use client'

import { useState } from 'react'
import { ThumbsUp } from 'lucide-react'
import { useSession, signIn } from 'next-auth/react'
import { api } from '@/lib/api'
import { clsx } from 'clsx'

interface VoteButtonProps {
  gameId:       string
  initialVotes: number
}

export function VoteButton({ gameId, initialVotes }: VoteButtonProps) {
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
        'flex items-center gap-2 mt-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
        voted
          ? 'bg-purple-600 text-white hover:bg-purple-700'
          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700',
        loading && 'opacity-60 cursor-not-allowed'
      )}>
      <ThumbsUp size={15} />
      <span className="tabular-nums">{votes.toLocaleString()}</span>
      <span>{voted ? 'Votado!' : 'Votar'}</span>
    </button>
  )
}
