import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { serverFetch } from '@/lib/api'
import { Navbar } from '@/components/navbar'
import { AdminGameList } from '@/components/admin/admin-game-list'
import { AdminStats } from '@/components/admin/admin-stats'

export default async function AdminPage() {
  const session = await auth()
  if (!session || session.user?.role !== 'ADMIN') redirect('/')

  const [pendingGames, stats] = await Promise.all([
    serverFetch<any[]>('/admin/games?status=PENDING'),
    serverFetch<any>('/admin/stats'),
  ])

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Painel Admin</h1>
          <p className="text-sm text-zinc-500 mt-1">Gerencie os jogos enviados pela comunidade.</p>
        </div>

        <AdminStats stats={stats} />

        <div>
          <h2 className="text-sm font-semibold text-zinc-400 mb-4">
            Jogos pendentes
            <span className="ml-2 text-amber-400">{pendingGames.length}</span>
          </h2>
          <AdminGameList initialGames={pendingGames} />
        </div>
      </main>
    </>
  )
}
