'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronRight, ChevronLeft } from 'lucide-react'

interface Props {
  screenshots: { id: string; url: string }[]
}

export function ScreenshotCarousel({ screenshots }: Props) {
  const [page, setPage] = useState(0)

  if (!screenshots.length) return null

  const totalPages = Math.ceil(screenshots.length / 2)
  const visible    = screenshots.slice(page * 2, page * 2 + 2)

  return (
    <div className="space-y-3">
      <div className="relative flex gap-3">
        {visible.map(s => (
          <div key={s.id} className="flex-1 rounded-xl overflow-hidden bg-zinc-800 h-40 relative">
            <Image src={s.url} alt="screenshot" fill className="object-cover" />
          </div>
        ))}

        {page > 0 && (
          <button
            onClick={() => setPage(p => p - 1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-zinc-900/90 border border-zinc-700 hover:bg-zinc-800 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
        )}
        {page < totalPages - 1 && (
          <button
            onClick={() => setPage(p => p + 1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-zinc-900/90 border border-zinc-700 hover:bg-zinc-800 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-1.5">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${i === page ? 'bg-purple-400' : 'bg-zinc-700'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
