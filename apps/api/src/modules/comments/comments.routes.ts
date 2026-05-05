import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '@hype/database'
import { authenticate, JWTPayload } from '../../lib/auth'

const createCommentSchema = z.object({
  gameId:   z.string().uuid(),
  body:     z.string().min(1).max(2000),
  parentId: z.string().uuid().optional(),
})

export async function commentsRoutes(app: FastifyInstance) {
  // ── GET /comments?gameId=xxx ───────────────────────────────────────────
  app.get('/', async (req, reply) => {
    const { gameId } = req.query as { gameId?: string }
    if (!gameId) return reply.status(400).send({ error: 'gameId is required' })

    const comments = await prisma.comment.findMany({
      where:   { gameId, parentId: null },
      orderBy: { createdAt: 'desc' },
      include: {
        user:    { select: { id: true, name: true, avatarUrl: true } },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        },
      },
    })

    return reply.send(comments)
  })

  // ── POST /comments ────────────────────────────────────────────────────
  app.post('/', { preHandler: [authenticate] }, async (req, reply) => {
    const body = createCommentSchema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    const user = req.user as JWTPayload
    const comment = await prisma.comment.create({
      data: { ...body.data, userId: user.id },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    })

    return reply.status(201).send(comment)
  })

  // ── DELETE /comments/:id ──────────────────────────────────────────────
  app.delete('/:id', { preHandler: [authenticate] }, async (req, reply) => {
    const user = req.user as JWTPayload
    const { id } = req.params as { id: string }

    const comment = await prisma.comment.findUnique({ where: { id } })
    if (!comment) return reply.status(404).send({ error: 'Not found' })
    if (comment.userId !== user.id && user.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Forbidden' })
    }

    await prisma.comment.delete({ where: { id } })
    return reply.send({ success: true })
  })
}
