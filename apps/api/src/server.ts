import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import cookie from '@fastify/cookie'
import rateLimit from '@fastify/rate-limit'

import { redisClient } from './lib/redis'
import { authRoutes } from './modules/auth/auth.routes'
import { gamesRoutes } from './modules/games/games.routes'
import { votesRoutes } from './modules/votes/votes.routes'
import { commentsRoutes } from './modules/comments/comments.routes'
import { adminRoutes } from './modules/admin/admin.routes'
import { teamsRoutes } from './modules/teams/teams.routes'
import { uploadRoutes } from './modules/upload/upload.routes'

const app = Fastify({
  logger: {
    transport: process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  },
})

async function bootstrap() {
  // ── Plugins ──────────────────────────────────────────────────────────────
  await app.register(cors, {
    origin: process.env.NEXTAUTH_URL ?? 'http://localhost:3000',
    credentials: true,
  })

  await app.register(cookie)

  await app.register(jwt, {
    secret: process.env.JWT_SECRET!,
    sign: { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' },
  })

  await app.register(rateLimit, {
    global: false,
    redis: redisClient,
  })

  // ── Health check ─────────────────────────────────────────────────────────
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

  // ── Routes ────────────────────────────────────────────────────────────────
  await app.register(authRoutes,     { prefix: '/auth'     })
  await app.register(gamesRoutes,    { prefix: '/games'    })
  await app.register(votesRoutes,    { prefix: '/votes'    })
  await app.register(commentsRoutes, { prefix: '/comments' })
  await app.register(teamsRoutes,    { prefix: '/teams'    })
  await app.register(uploadRoutes,   { prefix: '/upload'   })
  await app.register(adminRoutes,    { prefix: '/admin'    })

  // ── Start ─────────────────────────────────────────────────────────────────
  const port = Number(process.env.API_PORT) || 3001
  await app.listen({ port, host: '0.0.0.0' })
  console.log(`🚀 API running on http://localhost:${port}`)
}

bootstrap().catch((err) => {
  console.error(err)
  process.exit(1)
})
