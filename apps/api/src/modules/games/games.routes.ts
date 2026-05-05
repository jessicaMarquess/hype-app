import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '@hype/database'
import { redisClient } from '../../lib/redis'
import { authenticate } from '../../lib/auth'

const RANKING_CACHE_TTL = 60 // seconds

const submitGameSchema = z.object({
  title:       z.string().min(2).max(100),
  description: z.string().min(10).max(2000),
  launchDate:  z.string().datetime().optional(),
  launched:    z.boolean().optional(),
  coverUrl:    z.string().url().optional(),
  bannerUrl:   z.string().url().optional(),
  teamId:      z.string().uuid(),
  platforms: z.array(z.object({
    platform: z.enum(['STEAM','GOOGLE_PLAY','APP_STORE','NINTENDO_ESHOP']),
    url:      z.string().url(),
  })).optional(),
  socials: z.array(z.object({
    network: z.enum(['INSTAGRAM','FACEBOOK','X']),
    url:     z.string().url(),
  })).optional(),
  categoryIds: z.array(z.string().uuid()).optional(),
})

export async function gamesRoutes(app: FastifyInstance) {
  // ── GET /games/categories ─────────────────────────────────────────────
  app.get('/categories', async (req, reply) => {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } })
    return reply.send(categories)
  })

  // ── GET /games — ranking (with Redis cache) ────────────────────────────
  app.get('/', async (req, reply) => {
    const cached = await redisClient.get('ranking:weekly')
    if (cached) return reply.send(JSON.parse(cached))

    const games = await prisma.game.findMany({
      where:   { status: 'PUBLISHED' },
      orderBy: { votes: { _count: 'desc' } },
      take:    20,
      include: {
        team:       { select: { id: true, name: true, avatarUrl: true } },
        categories: { include: { category: true } },
        _count:     { select: { votes: true } },
      },
    })

    await redisClient.setex('ranking:weekly', RANKING_CACHE_TTL, JSON.stringify(games))
    return reply.send(games)
  })

  // ── GET /games/recent ────────────────────────────────────────────────
  app.get('/recent', async (req, reply) => {
    const games = await prisma.game.findMany({
      where:   { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      take:    3,
      select:  { id: true, title: true, slug: true, coverUrl: true },
    })
    return reply.send(games)
  })

  // ── GET /games/top-today ──────────────────────────────────────────────
  app.get('/top-today', async (req, reply) => {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const topVotes = await prisma.vote.groupBy({
      by:      ['gameId'],
      where:   { createdAt: { gte: startOfDay } },
      _count:  { gameId: true },
      orderBy: { _count: { gameId: 'desc' } },
      take:    3,
    })

    if (topVotes.length === 0) {
      const games = await prisma.game.findMany({
        where:   { status: 'PUBLISHED' },
        orderBy: { votes: { _count: 'desc' } },
        take:    3,
        select:  { id: true, title: true, slug: true, coverUrl: true },
      })
      return reply.send(games)
    }

    const games = await prisma.game.findMany({
      where:  { id: { in: topVotes.map(v => v.gameId) }, status: 'PUBLISHED' },
      select: { id: true, title: true, slug: true, coverUrl: true },
    })

    const ordered = topVotes
      .map(v => games.find(g => g.id === v.gameId))
      .filter((g): g is NonNullable<typeof g> => g != null)

    return reply.send(ordered)
  })

  // ── GET /games/:slug ──────────────────────────────────────────────────
  app.get('/:slug', async (req, reply) => {
    const { slug } = req.params as { slug: string }

    const game = await prisma.game.findUnique({
      where:   { slug, status: 'PUBLISHED' },
      include: {
        team:        { include: { members: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } } } },
        platforms:   true,
        socials:     true,
        categories:  { include: { category: true } },
        screenshots: { orderBy: { sortOrder: 'asc' } },
        _count:      { select: { votes: true, comments: true } },
      },
    })

    if (!game) return reply.status(404).send({ error: 'Game not found' })

    const allByVotes = await prisma.game.findMany({
      where:   { status: 'PUBLISHED' },
      orderBy: { votes: { _count: 'desc' } },
      select:  { id: true },
    })
    const rank = allByVotes.findIndex(g => g.id === game.id) + 1

    return reply.send({ ...game, rank })
  })

  // ── POST /games — submit for review ──────────────────────────────────
  app.post('/', { preHandler: [authenticate] }, async (req, reply) => {
    const body = submitGameSchema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    const { title, description, launchDate, launched, coverUrl, bannerUrl,
            teamId, platforms, socials, categoryIds } = body.data

    const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    const game = await prisma.game.create({
      data: {
        title, description, slug, teamId,
        launchDate: launchDate ? new Date(launchDate) : undefined,
        launched:   launched ?? false,
        coverUrl, bannerUrl,
        status: 'PENDING',
        platforms:  { create: platforms ?? [] },
        socials:    { create: socials ?? [] },
        categories: { create: (categoryIds ?? []).map(id => ({ categoryId: id })) },
      },
    })

    return reply.status(201).send(game)
  })
}
