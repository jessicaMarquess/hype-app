import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '@hype/database'
import { redisClient } from '../../lib/redis'
import { authenticate, JWTPayload } from '../../lib/auth'

const voteSchema = z.object({ gameId: z.string().uuid() })

export async function votesRoutes(app: FastifyInstance) {
  // ── POST /votes — cast a vote ──────────────────────────────────────────
  app.post('/', {
    preHandler: [authenticate],
    config: {
      rateLimit: { max: 10, timeWindow: '1 minute' },
    },
  }, async (req, reply) => {
    const body = voteSchema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    const user = req.user as JWTPayload
    const { gameId } = body.data

    // Anti-fraud: check redis before hitting DB
    const key = `vote:${user.id}:${gameId}`
    const alreadyVoted = await redisClient.get(key)
    if (alreadyVoted) return reply.status(409).send({ error: 'Already voted' })

    try {
      await prisma.vote.create({ data: { userId: user.id, gameId } })
    } catch {
      return reply.status(409).send({ error: 'Already voted' })
    }

    // Cache the vote for 24h and bust ranking cache
    await redisClient.setex(key, 86400, '1')
    await redisClient.del('ranking:weekly')

    return reply.status(201).send({ success: true })
  })

  // ── DELETE /votes/:gameId — remove vote ────────────────────────────────
  app.delete('/:gameId', { preHandler: [authenticate] }, async (req, reply) => {
    const user = req.user as JWTPayload
    const { gameId } = req.params as { gameId: string }

    await prisma.vote.deleteMany({ where: { userId: user.id, gameId } })
    await redisClient.del(`vote:${user.id}:${gameId}`)
    await redisClient.del('ranking:weekly')

    return reply.send({ success: true })
  })
}
