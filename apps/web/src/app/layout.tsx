import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { SessionProvider } from 'next-auth/react'
import { QueryProvider } from '@/components/providers/query-provider'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title:       'Hype — Descubra os melhores jogos indie',
  description: 'Plataforma de ranking e descoberta de jogos independentes.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${geist.className} bg-zinc-950 text-zinc-100 antialiased`}>
        <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
          <QueryProvider>
            {children}
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
