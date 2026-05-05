# Hype 🎮

Plataforma de ranking e descoberta de jogos indie, onde times de desenvolvedores publicam seus jogos e a comunidade vota nos favoritos.

## Stack

| Camada     | Tecnologia                          |
|------------|-------------------------------------|
| Frontend   | Next.js 15, Tailwind CSS, shadcn/ui |
| Auth       | Next-Auth v5 + Google OAuth         |
| API        | Fastify 5, Zod                      |
| ORM        | Prisma + PostgreSQL                 |
| Cache      | Redis (ioredis)                     |
| Storage    | Cloudflare R2                       |
| Monorepo   | npm workspaces                      |

## Estrutura

```
hype/
├── apps/
│   ├── api/          # Fastify API
│   └── web/          # Next.js frontend
├── packages/
│   └── database/     # Prisma schema + client
├── docker-compose.yml
└── .env.example
```

## Setup local

### 1. Clone e instale dependências

```bash
git clone <repo>
cd hype
cp .env.example .env
npm install
```

### 2. Configure as variáveis de ambiente

Edite `.env` com suas credenciais do Google OAuth e R2.

### 3. Suba o banco e Redis com Docker

```bash
docker compose up -d
```

### 4. Rode as migrations e seed

```bash
npm run db:generate
npx prisma db push --schema packages/database/prisma/schema.prisma
npm run db:seed
```

> No WSL2, use `prisma db push` no lugar de `db:migrate` para evitar timeout no advisory lock do Postgres.

### 5. Rode em desenvolvimento

```bash
npm run dev
```

- Frontend: http://localhost:3000  
- API: http://localhost:3001  
- Prisma Studio: `npm run db:studio`

## Scripts úteis

```bash
npm run dev            # Roda web + api em paralelo
npm run dev:api        # Só a API
npm run dev:web        # Só o frontend
npm run db:migrate     # Aplica migrations
npm run db:studio      # Abre Prisma Studio
npm run db:seed        # Popula categorias e admin
npm run build          # Build completo
```

## Fluxo de aprovação de jogos

1. Dev preenche o formulário em `/submit`
2. Jogo entra como `PENDING` no banco
3. Admin acessa `/admin` e aprova ou rejeita
4. Jogo aprovado aparece no ranking público

## Google OAuth

1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Crie um projeto e habilite a API "Google+ API"
3. Em "Credenciais", crie um OAuth 2.0 Client ID
4. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
5. Copie Client ID e Secret para o `.env`
# hype-app
