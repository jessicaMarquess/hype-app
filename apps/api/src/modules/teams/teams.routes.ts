import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '@hype/database'
import { authenticate, JWTPayload } from '../../lib/auth'

const createTeamSchema = z.object({
  name:      z.string().min(2).max(80),
  bio:       z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
})

export async function teamsRoutes(app: FastifyInstance) {
  // ── GET /teams/mine ───────────────────────────────────────────────────
  app.get('/mine', { preHandler: [authenticate] }, async (req, reply) => {
    const user = req.user as JWTPayload
    const teams = await prisma.team.findMany({
      where:   { members: { some: { userId: user.id } } },
      include: { members: { where: { userId: user.id }, select: { role: true } } },
      orderBy: { createdAt: 'asc' },
    })
    return reply.send(teams)
  })

  app.post('/', { preHandler: [authenticate] }, async (req, reply) => {
    const body = createTeamSchema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    const user = req.user as JWTPayload
    const slug = body.data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    const team = await prisma.team.create({
      data: {
        ...body.data,
        slug,
        members: { create: { userId: user.id, role: 'OWNER' } },
      },
    })

    return reply.status(201).send(team)
  })

  app.get('/:slug', async (req, reply) => {
    const { slug } = req.params as { slug: string }
    const team = await prisma.team.findUnique({
      where:   { slug },
      include: {
        members: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
        games:   { where: { status: 'PUBLISHED' }, include: { _count: { select: { votes: true } } } },
      },
    })
    if (!team) return reply.status(404).send({ error: 'Team not found' })
    return reply.send(team)
  })
}
