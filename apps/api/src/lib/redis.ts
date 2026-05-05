import Redis from 'ioredis'

export const redisClient = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  lazyConnect: true,
})

redisClient.on('error', (err) => {
  console.error('[Redis] connection error:', err.message)
})
