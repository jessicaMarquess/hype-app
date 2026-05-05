import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '@hype/database'
import { authenticate } from '../../lib/auth'
import bcrypt from 'bcryptjs'

const googleCallbackSchema = z.object({
  googleId:  z.string(),
  email:     z.string().email(),
  name:      z.string(),
  avatarUrl: z.string().url().optional(),
})

const registerSchema = z.object({
  name:     z.string().min(2).max(80),
  email:    z.string().email(),
  password: z.string().min(8),
})

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string(),
})

export async function authRoutes(app: FastifyInstance) {
  // ── POST /auth/register ───────────────────────────────────────────────
  app.post('/register', async (req, reply) => {
    const body = registerSchema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    const { name, email, password } = body.data

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return reply.status(409).send({ error: 'Email já cadastrado.' })

    const hash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { name, email, password: hash, role: 'USER' },
    })

    const token = app.jwt.sign({ id: user.id, email: user.email, role: user.role })
    return reply.status(201).send({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl } })
  })

  // ── POST /auth/login ──────────────────────────────────────────────────
  app.post('/login', async (req, reply) => {
    const body = loginSchema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    const { email, password } = body.data

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.password) return reply.status(401).send({ error: 'Email ou senha incorretos.' })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return reply.status(401).send({ error: 'Email ou senha incorretos.' })

    const token = app.jwt.sign({ id: user.id, email: user.email, role: user.role })
    return reply.send({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl } })
  })

  // ── POST /auth/google/callback ────────────────────────────────────────
  app.post('/google/callback', async (req, reply) => {
    const body = googleCallbackSchema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    const { googleId, email, name, avatarUrl } = body.data

    const user = await prisma.user.upsert({
      where:  { googleId },
      update: { name, avatarUrl, email },
      create: { googleId, email, name, avatarUrl, role: 'USER' },
    })

    const token = app.jwt.sign({ id: user.id, email: user.email, role: user.role })
    return reply.send({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl } })
  })

  // ── GET /auth/me ──────────────────────────────────────────────────────
  app.get('/me', { preHandler: [authenticate] }, async (req, reply) => {
    const payload = req.user as { id: string }
    const user = await prisma.user.findUnique({
      where:  { id: payload.id },
      select: { id: true, name: true, email: true, role: true, avatarUrl: true, createdAt: true, password: true },
    })
    if (!user) return reply.status(404).send({ error: 'User not found' })
    const { password, ...rest } = user
    return reply.send({ ...rest, hasPassword: !!password })
  })

  // ── PATCH /auth/profile ───────────────────────────────────────────────
  app.patch('/profile', { preHandler: [authenticate] }, async (req, reply) => {
    const payload = req.user as { id: string }
    const schema = z.object({
      name:      z.string().min(2).max(80).optional(),
      email:     z.string().email().optional(),
      avatarUrl: z.string().url().optional().nullable(),
    })
    const body = schema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    if (body.data.email) {
      const existing = await prisma.user.findFirst({
        where: { email: body.data.email, id: { not: payload.id } },
      })
      if (existing) return reply.status(409).send({ error: 'Este email já está em uso.' })
    }

    const user = await prisma.user.update({
      where:  { id: payload.id },
      data:   body.data,
      select: { id: true, name: true, email: true, role: true, avatarUrl: true },
    })
    return reply.send(user)
  })

  // ── PATCH /auth/password ──────────────────────────────────────────────
  app.patch('/password', { preHandler: [authenticate] }, async (req, reply) => {
    const payload = req.user as { id: string }
    const schema = z.object({
      currentPassword: z.string().optional(),
      newPassword:     z.string().min(8),
    })
    const body = schema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    const user = await prisma.user.findUnique({ where: { id: payload.id } })
    if (!user) return reply.status(404).send({ error: 'Usuário não encontrado.' })

    if (user.password) {
      if (!body.data.currentPassword) return reply.status(400).send({ error: 'Informe a senha atual.' })
      const valid = await bcrypt.compare(body.data.currentPassword, user.password)
      if (!valid) return reply.status(401).send({ error: 'Senha atual incorreta.' })
    }

    const hash = await bcrypt.hash(body.data.newPassword, 10)
    await prisma.user.update({ where: { id: payload.id }, data: { password: hash } })
    return reply.send({ ok: true })
  })
}
