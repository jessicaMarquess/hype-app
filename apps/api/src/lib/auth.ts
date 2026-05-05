import { FastifyRequest, FastifyReply } from 'fastify'

export interface JWTPayload {
  id:    string
  email: string
  role:  'USER' | 'ADMIN'
}

export async function authenticate(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify()
  } catch {
    reply.status(401).send({ error: 'Unauthorized' })
  }
}

export async function requireAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify()
    const user = req.user as JWTPayload
    if (user.role !== 'ADMIN') {
      reply.status(403).send({ error: 'Forbidden' })
    }
  } catch {
    reply.status(401).send({ error: 'Unauthorized' })
  }
}
