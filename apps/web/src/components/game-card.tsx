import Link from 'next/link'
import Image from 'next/image'
import { ThumbsUp } from 'lucide-react'
import { clsx } from 'clsx'

interface GameCardProps {
  game: {
    slug:        string
    title:       string
    description: string
    coverUrl:    string | null
    team:        { name: string }
    categories:  { category: { name: string } }[]
    _count:      { votes: number }
  }
  rank: number
}

export function GameCard({ game, rank }: GameCardProps) {
  const isTop3 = rank <= 3

  return (
    <Link
      href={`/games/${game.slug}`}
      className="flex items-center gap-4 p-4 rounded-xl hover:bg-zinc-900/60 border border-transparent hover:border-zinc-800 transition-all group"
    >
      {/* Cover */}
      <div className="w-40 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800 relative">
        {game.coverUrl && (
          <Image
            src={game.coverUrl}
            alt={game.title}
            fill
            className="object-cover"
          />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h2 className="font-semibold text-zinc-100 truncate group-hover:text-white mb-1">
          {game.title}
        </h2>
        <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed">
          {game.description}
        </p>
      </div>

      {/* Votes + rank */}
      <div className="flex items-center gap-5 flex-shrink-0">
        <div className="flex items-center gap-1.5 text-zinc-500">
          <ThumbsUp size={14} />
          <span className="text-sm tabular-nums">{game._count.votes.toLocaleString('pt-BR')}</span>
        </div>
        <span className={clsx(
          'text-3xl font-bold tabular-nums w-14 text-right',
          isTop3 ? 'text-purple-400' : 'text-zinc-700'
        )}>
          #{rank}
        </span>
      </div>
    </Link>
  )
}
