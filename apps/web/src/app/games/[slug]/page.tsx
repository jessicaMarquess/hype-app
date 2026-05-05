import { serverFetch } from '@/lib/api'
import { Navbar } from '@/components/navbar'
import { CommentsSection } from '@/components/comments-section'
import { ScreenshotCarousel } from '@/components/screenshot-carousel'
import { GameVoteButton } from '@/components/game-vote-button'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  BadgeCheck, Share2,
  Instagram, Facebook, Twitter,
  Gamepad2, Smartphone, Monitor, ShoppingBag,
} from 'lucide-react'

interface Platform   { id: string; platform: string; url: string }
interface Social     { id: string; network: string;  url: string }
interface Category   { category: { id: string; name: string; slug: string } }
interface Screenshot { id: string; url: string; sortOrder: number }
interface Member     { user: { id: string; name: string; avatarUrl: string | null }; role: string }

interface Game {
  id:          string
  title:       string
  slug:        string
  description: string
  coverUrl:    string | null
  bannerUrl:   string | null
  launched:    boolean
  rank:        number
  team:        { id: string; name: string; avatarUrl: string | null; members: Member[] }
  platforms:   Platform[]
  socials:     Social[]
  categories:  Category[]
  screenshots: Screenshot[]
  _count:      { votes: number; comments: number }
}

const platformIcon: Record<string, React.ReactNode> = {
  STEAM:          <Gamepad2 size={13} />,
  GOOGLE_PLAY:    <Smartphone size={13} />,
  APP_STORE:      <ShoppingBag size={13} />,
  NINTENDO_ESHOP: <Monitor size={13} />,
}
const platformLabel: Record<string, string> = {
  STEAM:          'Steam',
  GOOGLE_PLAY:    'Google Play',
  APP_STORE:      'App Store',
  NINTENDO_ESHOP: 'Nintendo e-Shop',
}

const socialIcon: Record<string, React.ReactNode> = {
  INSTAGRAM: <Instagram size={14} />,
  FACEBOOK:  <Facebook size={14} />,
  X:         <Twitter size={14} />,
}

const categoryColor: Record<string, string> = {
  acao:       'bg-rose-900/50 text-rose-300 border border-rose-800',
  aventura:   'bg-amber-900/50 text-amber-300 border border-amber-800',
  casual:     'bg-stone-800 text-stone-300 border border-stone-700',
  indie:      'bg-violet-900/50 text-violet-300 border border-violet-800',
  puzzle:     'bg-blue-900/50 text-blue-300 border border-blue-800',
  rpg:        'bg-emerald-900/50 text-emerald-300 border border-emerald-800',
  terror:     'bg-red-900/60 text-red-300 border border-red-800',
  estrategia: 'bg-cyan-900/50 text-cyan-300 border border-cyan-800',
}

export default async function GamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  let game: Game
  try {
    game = await serverFetch<Game>(`/games/${slug}`)
  } catch {
    notFound()
  }

  const hasBanner = !!game.bannerUrl

  return (
    <>
      <Navbar />

      {/* ── Hero / Cover ────────────────────────────────────────────────── */}
      {hasBanner ? (
        <div className="relative h-64 overflow-hidden bg-zinc-900">
          <Image
            src={game.bannerUrl!}
            alt=""
            fill
            className="object-cover opacity-50 scale-105 blur-sm"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />
          {game.coverUrl && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10">
              <Image
                src={game.coverUrl}
                alt={game.title}
                width={148}
                height={185}
                className="rounded-xl shadow-2xl object-cover"
                priority
              />
            </div>
          )}
        </div>
      ) : (
        <div className="flex justify-center pt-10">
          {game.coverUrl && (
            <Image
              src={game.coverUrl}
              alt={game.title}
              width={148}
              height={185}
              className="rounded-xl shadow-2xl object-cover"
              priority
            />
          )}
        </div>
      )}

      {/* ── Title + vote row ────────────────────────────────────────────── */}
      <div className={`text-center px-4 ${hasBanner ? 'mt-28' : 'mt-5'} mb-8`}>
        <h1 className="text-2xl font-bold text-zinc-100 inline-flex items-center gap-2">
          {game.title}
          {game.launched && <BadgeCheck size={20} className="text-purple-400 flex-shrink-0" />}
        </h1>

        <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
          <span className="text-2xl font-bold text-zinc-400">
            <span className="text-base font-normal">#</span>{game.rank}
          </span>

          {/* Stacked member avatars */}
          <div className="flex items-center">
            {game.team.members.slice(0, 4).map((m, i) => (
              <div
                key={m.user.id}
                className="w-7 h-7 rounded-full border-2 border-zinc-950 overflow-hidden bg-zinc-700 flex-shrink-0"
                style={{ marginLeft: i === 0 ? 0 : -8 }}
              >
                {m.user.avatarUrl
                  ? <Image src={m.user.avatarUrl} alt={m.user.name} width={28} height={28} className="object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-xs text-zinc-400">{m.user.name[0]}</div>
                }
              </div>
            ))}
          </div>

          <span className="text-sm text-zinc-400 font-medium">
            +{game._count.votes.toLocaleString('pt-BR')}
          </span>

          <GameVoteButton gameId={game.id} initialVotes={game._count.votes} />

          <button className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors">
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 pb-16 grid grid-cols-3 gap-8">

        {/* Left 2/3 */}
        <div className="col-span-2 space-y-8">
          <p className="text-zinc-300 leading-relaxed">{game.description}</p>

          {game.screenshots.length > 0 && (
            <ScreenshotCarousel screenshots={game.screenshots} />
          )}

          {/* Team */}
          <div>
            <h2 className="text-sm font-semibold text-zinc-400 mb-3">
              Time de desenvolvimento{' '}
              <span className="text-zinc-600">{game.team.members.length}</span>
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {game.team.members.map(m => (
                <div key={m.user.id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-zinc-800 flex-shrink-0 overflow-hidden relative">
                    {m.user.avatarUrl
                      ? <Image src={m.user.avatarUrl} alt={m.user.name} fill className="object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-sm text-zinc-500">{m.user.name[0]}</div>
                    }
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{m.user.name}</p>
                    <p className="text-xs text-zinc-500 capitalize">{m.role.toLowerCase()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <CommentsSection gameId={game.id} />
        </div>

        {/* Right sidebar 1/3 */}
        <aside className="space-y-7">

          {/* Rank */}
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
              Posição no ranking
            </p>
            <p className="text-5xl font-bold text-zinc-100">
              <span className="text-2xl text-zinc-500 font-normal">#</span>{game.rank}
            </p>
          </div>

          {/* Platforms */}
          {game.platforms.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">
                Disponível em
              </p>
              <div className="grid grid-cols-2 gap-2">
                {game.platforms.map(p => (
                  <a
                    key={p.id}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs text-zinc-300 transition-colors"
                  >
                    {platformIcon[p.platform]}
                    <span className="truncate">{platformLabel[p.platform] ?? p.platform}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Socials */}
          {game.socials.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">
                Redes sociais
              </p>
              <div className="space-y-2">
                {game.socials.map(s => (
                  <a
                    key={s.id}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    {socialIcon[s.network]}
                    <span className="capitalize">
                      {s.network.charAt(0) + s.network.slice(1).toLowerCase()}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Categories */}
          {game.categories.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">
                Categorias
              </p>
              <div className="flex flex-wrap gap-2">
                {game.categories.map(c => (
                  <span
                    key={c.category.id}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      categoryColor[c.category.slug] ?? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                    }`}
                  >
                    {c.category.name}
                  </span>
                ))}
              </div>
            </div>
          )}

        </aside>
      </main>
    </>
  )
}
