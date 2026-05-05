# Hype

Plataforma de ranking e descoberta de jogos indie, onde times de desenvolvedores publicam seus jogos e a comunidade vota nos favoritos.

## Stack

| Camada   | Tecnologia                              |
|----------|-----------------------------------------|
| Frontend | Next.js 15, Tailwind CSS                |
| Auth     | NextAuth v5 — Google OAuth + email/senha|
| API      | Fastify 5, Zod                          |
| ORM      | Prisma + PostgreSQL                     |
| Cache    | Redis (ioredis)                         |
| Storage  | Cloudflare R2                           |
| Monorepo | npm workspaces                          |

## Estrutura

```
hype/
├── apps/
│   ├── api/          # Fastify 5 — REST API
│   └── web/          # Next.js 15 — Frontend
├── packages/
│   └── database/     # Prisma schema, client e seed
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

Edite `.env` com suas credenciais. Veja a seção de cada serviço abaixo.

### 3. Suba o banco e Redis com Docker

```bash
docker compose up -d
```

### 4. Inicialize o banco

```bash
npm run db:generate
npx prisma db push --schema packages/database/prisma/schema.prisma
npm run db:seed
```

> **WSL2:** use `prisma db push` em vez de `db:migrate` — o advisory lock do Postgres dá timeout no WSL2.

O seed cria:
- 7 categorias
- Usuário admin (`admin@hype.gg`) — defina a senha via Prisma Studio ou pelo script abaixo
- 5 jogos de exemplo com status `PUBLISHED`

**Definir senha do admin:**
```bash
cd packages/database
npx tsx src/set-admin-password.ts  # ajuste o script conforme necessário
```

Ou pelo Prisma Studio: `npm run db:studio`

### 5. Rode em desenvolvimento

```bash
npm run dev
```

| Serviço       | URL                        |
|---------------|----------------------------|
| Frontend      | http://localhost:3000       |
| API           | http://localhost:3001       |
| Prisma Studio | http://localhost:5555       |

## Scripts

```bash
npm run dev          # Web + API em paralelo
npm run dev:api      # Só a API
npm run dev:web      # Só o frontend
npm run db:generate  # Gera o Prisma Client
npm run db:studio    # Abre o Prisma Studio
npm run db:seed      # Popula o banco com dados iniciais
npm run build        # Build completo
```

## Variáveis de ambiente

### Banco de dados
```env
DATABASE_URL="postgresql://hype:hype@localhost:5432/hype"
```

### Redis
```env
REDIS_URL="redis://localhost:6379"
```

### API
```env
API_PORT=3001
JWT_SECRET="troque-em-producao"
JWT_EXPIRES_IN="7d"
```

### Next.js / NextAuth
```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="troque-em-producao"
```

### Google OAuth
1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Crie um projeto → **APIs e Serviços → Credenciais → Criar → ID do cliente OAuth**
3. Tipo: **Aplicativo da Web**
4. URI de redirecionamento autorizado: `http://localhost:3000/api/auth/callback/google`
5. Copie para o `.env`:
```env
GOOGLE_CLIENT_ID="seu-client-id"
GOOGLE_CLIENT_SECRET="seu-client-secret"
```

### Cloudflare R2
1. Crie um bucket em [dash.cloudflare.com](https://dash.cloudflare.com) → R2
2. Em **Settings → Public Development URL**, clique em **Enable**
3. Em **Manage R2 API Tokens**, crie um token com permissão **Object Read & Write**
4. Configure CORS no bucket (Settings → CORS Policy):
```json
[{ "AllowedOrigins": ["http://localhost:3000"], "AllowedMethods": ["GET","PUT","POST","DELETE","HEAD"], "AllowedHeaders": ["*"] }]
```
5. Copie para o `.env`:
```env
R2_ACCOUNT_ID="seu-account-id"
R2_ACCESS_KEY_ID="seu-access-key-id"
R2_SECRET_ACCESS_KEY="seu-secret-access-key"
R2_BUCKET_NAME="hype-storage"
R2_PUBLIC_URL="https://pub-xxx.r2.dev"
```

## Funcionalidades

- Ranking semanal de jogos indie com votos da comunidade
- Login com Google OAuth ou email/senha
- Cadastro e perfil de usuário (foto, nome, email, senha)
- Envio de jogos com capa, banner e screenshots via upload para R2
- Sistema de comentários e respostas
- Painel admin para aprovar ou rejeitar jogos pendentes

## Fluxo de aprovação

1. Dev preenche `/submit` — jogo entra como `PENDING`
2. Admin acessa `/admin` e revisa título, descrição e imagens
3. Admin aprova → jogo aparece no ranking público
4. Admin rejeita → jogo não é exibido (pode ser revisado depois)
