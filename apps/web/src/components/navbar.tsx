'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { Search, Plus, LogOut, Settings } from 'lucide-react'

export function Navbar() {
  const { data: session } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">
        {/* Logo */}
        <Link href="/">
          <Image src="/logo_hype.png" alt="Hype" width={72} height={28} className="object-contain" />
        </Link>

        {/* Search */}
        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-sm text-zinc-500 max-w-xs cursor-pointer hover:border-zinc-600 transition-colors">
          <Search size={14} />
          <span>Pesquisar</span>
          <span className="ml-auto text-xs text-zinc-600">Ctrl K</span>
        </div>

        <div className="flex-1" />

        {session ? (
          <div className="flex items-center gap-3">
            <Link href="/submit"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-500 text-sm font-medium transition-colors">
              <Plus size={14} />
              Enviar jogo
            </Link>

            {(session.user as any)?.role === 'ADMIN' && (
              <Link href="/admin" className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
                Admin
              </Link>
            )}

            {/* Avatar + dropdown */}
            <div ref={menuRef} className="relative">
              <button onClick={() => setMenuOpen(o => !o)} className="focus:outline-none">
                {session.user?.image ? (
                  <Image src={session.user.image} alt={session.user.name ?? ''}
                    width={32} height={32} className="rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-300">
                    {session.user?.name?.[0]}
                  </div>
                )}
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-11 min-w-[140px] rounded-xl bg-zinc-800 border border-zinc-700 shadow-xl py-1 z-50">
                  <div className="px-3 py-2 border-b border-zinc-700">
                    <p className="text-xs font-medium text-zinc-200 truncate">{session.user?.name}</p>
                    <p className="text-xs text-zinc-500 truncate">{session.user?.email}</p>
                  </div>
                  <Link
                    href="/settings"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                  >
                    <Settings size={13} />
                    Configurações
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                  >
                    <LogOut size={13} />
                    Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <Link href="/login"
            className="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-sm text-zinc-300 transition-colors">
            Entrar
          </Link>
        )}
      </div>
    </header>
  )
}
