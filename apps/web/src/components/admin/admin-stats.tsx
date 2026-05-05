interface Stats {
  totalGames:   number
  pendingGames: number
  totalUsers:   number
  totalVotes:   number
}

export function AdminStats({ stats }: { stats: Stats }) {
  const items = [
    { label: 'Total de jogos',    value: stats.totalGames,   color: 'text-purple-400' },
    { label: 'Pendentes',         value: stats.pendingGames, color: 'text-amber-400'  },
    { label: 'Usuários',          value: stats.totalUsers,   color: 'text-teal-400'   },
    { label: 'Votos totais',      value: stats.totalVotes,   color: 'text-blue-400'   },
  ]

  return (
    <div className="grid grid-cols-4 gap-4">
      {items.map(item => (
        <div key={item.label} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
          <p className="text-xs text-zinc-500 mb-1">{item.label}</p>
          <p className={`text-2xl font-bold tabular-nums ${item.color}`}>
            {item.value.toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  )
}
