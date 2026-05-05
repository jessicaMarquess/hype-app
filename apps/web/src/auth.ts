import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Google({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email:    { label: 'Email',  type: 'email'    },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email:    credentials.email,
            password: credentials.password,
          }),
        })
        if (!res.ok) return null
        const data = await res.json()
        return {
          id:       data.user.id,
          email:    data.user.email,
          name:     data.user.name,
          image:    data.user.avatarUrl ?? null,
          role:     data.user.role,
          apiToken: data.token,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user, profile }) {
      if (account?.type === 'credentials' && user) {
        token.apiToken = (user as any).apiToken
        token.role     = (user as any).role
        token.id       = user.id
      } else if (account?.provider === 'google' && profile) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/google/callback`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            googleId:  profile.sub,
            email:     profile.email,
            name:      profile.name,
            avatarUrl: profile.picture,
          }),
        })
        const data = await res.json()
        token.apiToken = data.token
        token.role     = data.user.role
        token.id       = data.user.id
      }
      return token
    },
    async session({ session, token }) {
      session.apiToken   = token.apiToken as string
      session.user.id    = token.id    as string
      session.user.role  = token.role  as string
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
})
