'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession, signIn } from 'next-auth/react'
import Image from 'next/image'
import { api } from '@/lib/api'
import { Send } from 'lucide-react'

interface Comment {
  id:        string
  body:      string
  createdAt: string
  user:      { id: string; name: string; avatarUrl: string | null }
  replies:   Comment[]
}

function CommentItem({ comment, gameId }: { comment: Comment; gameId: string }) {
  const [replying, setReplying] = useState(false)
  const [body,     setBody]     = useState('')
  const { data: session }       = useSession()
  const queryClient             = useQueryClient()

  const replyMutation = useMutation({
    mutationFn: () => api.post('/comments', { gameId, body, parentId: comment.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', gameId] })
      setBody(''); setReplying(false)
    },
  })

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-zinc-700 flex-shrink-0 overflow-hidden">
          {comment.user.avatarUrl && (
            <Image src={comment.user.avatarUrl} alt={comment.user.name} width={32} height={32} />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-sm font-medium text-zinc-200">{comment.user.name}</span>
            <span className="text-xs text-zinc-600">
              {new Date(comment.createdAt).toLocaleDateString('pt-BR')}
            </span>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">{comment.body}</p>
          <button onClick={() => setReplying(r => !r)}
            className="text-xs text-zinc-500 hover:text-zinc-300 mt-1 transition-colors">
            Responder
          </button>
        </div>
      </div>

      {/* Replies */}
      {comment.replies.length > 0 && (
        <div className="ml-11 space-y-3 border-l border-zinc-800 pl-4">
          {comment.replies.map(r => (
            <div key={r.id} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-zinc-700 flex-shrink-0 overflow-hidden">
                {r.user.avatarUrl && (
                  <Image src={r.user.avatarUrl} alt={r.user.name} width={24} height={24} />
                )}
              </div>
              <div>
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-xs font-medium text-zinc-200">{r.user.name}</span>
                  <span className="text-xs text-zinc-600">
                    {new Date(r.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <p className="text-sm text-zinc-400">{r.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply input */}
      {replying && session && (
        <div className="ml-11 flex gap-2">
          <input
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Escreva uma resposta..."
            className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={() => replyMutation.mutate()}
            disabled={!body.trim() || replyMutation.isPending}
            className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 transition-colors">
            <Send size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

export function CommentsSection({ gameId }: { gameId: string }) {
  const { data: session } = useSession()
  const queryClient       = useQueryClient()
  const [body, setBody]   = useState('')

  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: ['comments', gameId],
    queryFn:  () => api.get(`/comments?gameId=${gameId}`).then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: () => api.post('/comments', { gameId, body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', gameId] })
      setBody('')
    },
  })

  return (
    <section className="space-y-6">
      <h2 className="text-sm font-semibold text-zinc-400">
        Avaliações {comments.length > 0 && <span className="text-zinc-600">{comments.length}</span>}
      </h2>

      {/* New comment */}
      <div className="flex gap-3">
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          onClick={() => { if (!session) signIn('google') }}
          placeholder="Quer fazer uma pergunta ou deixar um comentário?"
          rows={3}
          className="flex-1 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-purple-500 resize-none transition-colors"
        />
        {session && (
          <button
            onClick={() => createMutation.mutate()}
            disabled={!body.trim() || createMutation.isPending}
            className="self-end px-4 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 transition-colors">
            <Send size={16} />
          </button>
        )}
      </div>

      {/* Comment list */}
      {isLoading ? (
        <p className="text-sm text-zinc-600">Carregando...</p>
      ) : (
        <div className="space-y-6">
          {comments.map(c => (
            <CommentItem key={c.id} comment={c} gameId={gameId} />
          ))}
        </div>
      )}
    </section>
  )
}
