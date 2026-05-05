import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '@hype/database'
import { requireAdmin } from '../../lib/auth'
import { redisClient } from '../../lib/redis'

const reviewSchema = z.object({
  status: z.enum(['PUBLISHED', 'REJECTED', 'PENDING']),
  reason: z.string().optional(),
})

export async function adminRoutes(app: FastifyInstance) {
  // All admin routes require ADMIN role
  app.addHook('preHandler', requireAdmin)

  // ── GET /admin/games?status=PENDING ───────────────────────────────────
  app.get('/games', async (req, reply) => {
    const { status = 'PENDING' } = req.query as { status?: string }

    const games = await prisma.game.findMany({
      where:   { status: status as any },
      orderBy: { createdAt: 'desc' },
      include: {
        team:       { select: { id: true, name: true } },
        categories: { include: { category: true } },
        _count:     { select: { votes: true } },
      },
    })

    return reply.send(games)
  })

  // ── PATCH /admin/games/:id/review ─────────────────────────────────────
  app.patch('/games/:id/review', async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = reviewSchema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    const game = await prisma.game.update({
      where: { id },
      data:  { status: body.data.status },
    })

    // Bust ranking cache when a new game is published
    if (body.data.status === 'PUBLISHED') {
      await redisClient.del('ranking:weekly')
    }

    return reply.send(game)
  })

  // ── GET /admin/stats ──────────────────────────────────────────────────
  app.get('/stats', async (_req, reply) => {
    const [totalGames, pendingGames, totalUsers, totalVotes] = await Promise.all([
      prisma.game.count(),
      prisma.game.count({ where: { status: 'PENDING' } }),
      prisma.user.count(),
      prisma.vote.count(),
    ])

    return reply.send({ totalGames, pendingGames, totalUsers, totalVotes })
  })
}
