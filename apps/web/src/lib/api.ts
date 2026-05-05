import axios from 'axios'
import { getSession } from 'next-auth/react'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
})

// Attach JWT on every client-side request
api.interceptors.request.use(async (config) => {
  const session = await getSession()
  if (session?.apiToken) {
    config.headers.Authorization = `Bearer ${session.apiToken}`
  }
  return config
})

// Server-side fetch helper (uses auth() from next-auth)
export async function serverFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { auth } = await import('@/auth')
  const session  = await auth()

  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.apiToken ? { Authorization: `Bearer ${session.apiToken}` } : {}),
      ...init?.headers,
    },
  })

  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}
