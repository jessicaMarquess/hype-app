import { serverFetch } from '@/lib/api'
import { GameCard } from '@/components/game-card'
import { Navbar } from '@/components/navbar'
import Image from 'next/image'
import Link from 'next/link'

interface Game {
  id:          string
  title:       string
  slug:        string
  description: string
  coverUrl:    string | null
  team:        { name: string; avatarUrl: string | null }
  categories:  { category: { name: string } }[]
  _count:      { votes: number }
}

interface SidebarGame {
  id:       string
  title:    string
  slug:     string
  coverUrl: string | null
}

function SidebarGameItem({ game }: { game: SidebarGame }) {
  return (
    <Link
      href={`/games/${game.slug}`}
      className="flex items-center gap-3 rounded-lg p-1.5 hover:bg-zinc-900 transition-colors group"
    >
      <div className="w-11 h-11 rounded-lg bg-zinc-800 flex-shrink-0 overflow-hidden relative">
        {game.coverUrl && (
          <Image src={game.coverUrl} alt={game.title} fill className="object-cover" />
        )}
      </div>
      <span className="text-sm text-zinc-300 font-medium line-clamp-1 group-hover:text-zinc-100 transition-colors">
        {game.title}
      </span>
    </Link>
  )
}

export const revalidate = 60

export default async function HomePage() {
  const [games, recent, topToday] = await Promise.all([
    serverFetch<Game[]>('/games'),
    serverFetch<SidebarGame[]>('/games/recent').catch(() => [] as SidebarGame[]),
    serverFetch<SidebarGame[]>('/games/top-today').catch(() => [] as SidebarGame[]),
  ])

  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8 flex gap-8">

        {/* Ranking list */}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold text-zinc-100 mb-6">
            Em alta essa semana!
          </h1>
          <div className="divide-y divide-zinc-800/60">
            {games.map((game, i) => (
              <GameCard key={game.id} game={game} rank={i + 1} />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 space-y-7 pt-1">

          {/* Game Jams */}
          <div>
            <h2 className="text-sm font-semibold text-zinc-100 mb-3">Game Jam's</h2>
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 h-28 flex items-center justify-center">
              <span className="text-sm text-zinc-600">Em breve</span>
            </div>
          </div>

          {/* Recently added */}
          <div>
            <h2 className="text-sm font-semibold text-zinc-100 mb-2">Adicionados recentemente</h2>
            <div className="space-y-1">
              {recent.length > 0
                ? recent.map(g => <SidebarGameItem key={g.id} game={g} />)
                : <p className="text-xs text-zinc-600 px-1.5">Nenhum jogo recente</p>
              }
            </div>
          </div>

          {/* Top today */}
          <div>
            <h2 className="text-sm font-semibold text-zinc-100 mb-2">Jogos mais votados hoje</h2>
            <div className="space-y-1">
              {topToday.length > 0
                ? topToday.map(g => <SidebarGameItem key={g.id} game={g} />)
                : <p className="text-xs text-zinc-600 px-1.5">Nenhum voto hoje</p>
              }
            </div>
          </div>

        </aside>
      </div>
    </>
  )
}
