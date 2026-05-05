import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { authenticate } from '../../lib/auth'

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const presignSchema = z.object({
  filename:    z.string(),
  contentType: z.string().regex(/^image\//),
  folder:      z.enum(['covers', 'banners', 'screenshots', 'avatars']),
})

export async function uploadRoutes(app: FastifyInstance) {
  // Returns a presigned URL — frontend uploads directly to R2
  app.post('/presign', { preHandler: [authenticate] }, async (req, reply) => {
    const body = presignSchema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    const { filename, contentType, folder } = body.data
    const ext = filename.split('.').pop()
    const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const command = new PutObjectCommand({
      Bucket:      process.env.R2_BUCKET_NAME!,
      Key:         key,
      ContentType: contentType,
    })

    const url       = await getSignedUrl(r2, command, { expiresIn: 300 })
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`

    return reply.send({ uploadUrl: url, publicUrl })
  })
}
