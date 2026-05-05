import { prisma } from './index'

async function main() {
  console.log('🌱 Seeding database...')

  // Categories
  const categories = await Promise.all([
    prisma.category.upsert({ where: { slug: 'acao' },     update: {}, create: { name: 'Ação',      slug: 'acao'     } }),
    prisma.category.upsert({ where: { slug: 'aventura' }, update: {}, create: { name: 'Aventura',  slug: 'aventura' } }),
    prisma.category.upsert({ where: { slug: 'indie' },    update: {}, create: { name: 'Indie',     slug: 'indie'    } }),
    prisma.category.upsert({ where: { slug: 'casual' },   update: {}, create: { name: 'Casual',    slug: 'casual'   } }),
    prisma.category.upsert({ where: { slug: 'rpg' },      update: {}, create: { name: 'RPG',       slug: 'rpg'      } }),
    prisma.category.upsert({ where: { slug: 'puzzle' },   update: {}, create: { name: 'Puzzle',    slug: 'puzzle'   } }),
    prisma.category.upsert({ where: { slug: 'plataforma'},update: {}, create: { name: 'Plataforma',slug: 'plataforma'} }),
  ])
  console.log(`✅ ${categories.length} categories created`)

  // Admin user
  const admin = await prisma.user.upsert({
    where:  { email: 'admin@hype.gg' },
    update: {},
    create: {
      name:  'Admin',
      email: 'admin@hype.gg',
      role:  'ADMIN',
    },
  })
  console.log(`✅ Admin user: ${admin.email}`)

  const [acao, aventura, indie, casual, puzzle] = categories

  // Sample teams + games
  const sampleGames = [
    {
      team:        { name: 'Moonleap Studio', slug: 'moonleap-studio' },
      title:       'Moonleap',
      slug:        'moonleap',
      description: 'Um jogo sobre um menino lua em sua jornada para recuperar estrelas cadentes. Troque o dia pela noite a cada salto e pegue todas as estrelas nesse curto e desafiante jogo de plataforma e quebra-cabeça! Uma mecânica inovadora com controles simples e acessíveis, ande e pule!',
      coverUrl:    'https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1305120/capsule_616x353.jpg',
      launched:    true,
      categories:  [indie, casual],
      votes:       1521,
    },
    {
      team:        { name: 'Pixel Forge', slug: 'pixel-forge' },
      title:       'Caverna dos Ecos',
      slug:        'caverna-dos-ecos',
      description: 'Explore cavernas procedurais cheias de segredos, armadilhas e criaturas misteriosas. Cada run é única. Colete relíquias, evolua suas habilidades e descubra o segredo das cavernas que nunca param de crescer.',
      coverUrl:    'https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1145360/capsule_616x353.jpg',
      launched:    true,
      categories:  [aventura, indie],
      votes:       987,
    },
    {
      team:        { name: 'Neon Dreams', slug: 'neon-dreams' },
      title:       'Pulsar Rush',
      slug:        'pulsar-rush',
      description: 'Corridas futuristas em pistas de néon com física baseada em gravidade. Desbloqueie naves, customize sua corrida e domine os rankings globais em mais de 40 pistas únicas.',
      coverUrl:    'https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1240440/capsule_616x353.jpg',
      launched:    false,
      categories:  [acao, casual],
      votes:       754,
    },
    {
      team:        { name: 'Folha Games', slug: 'folha-games' },
      title:       'Raízes',
      slug:        'raizes',
      description: 'Um RPG narrativo brasileiro sobre uma jovem que descobre poderes ancestrais em uma floresta encantada. Tome decisões que moldam o destino de toda uma aldeia.',
      coverUrl:    'https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1097150/capsule_616x353.jpg',
      launched:    true,
      categories:  [aventura],
      votes:       612,
    },
    {
      team:        { name: 'Binary Puzzle Co', slug: 'binary-puzzle' },
      title:       'Circuito Mental',
      slug:        'circuito-mental',
      description: 'Conecte os nós, resolva os circuitos. Um jogo de puzzle minimalista que desafia sua lógica com centenas de níveis de dificuldade crescente e uma trilha sonora lo-fi relaxante.',
      coverUrl:    'https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/736260/capsule_616x353.jpg',
      launched:    true,
      categories:  [puzzle, indie],
      votes:       441,
    },
  ]

  for (const g of sampleGames) {
    const team = await prisma.team.upsert({
      where:  { slug: g.team.slug },
      update: {},
      create: { name: g.team.name, slug: g.team.slug },
    })

    const memberUser = await prisma.user.upsert({
      where:  { email: `dev@${g.team.slug}.gg` },
      update: {},
      create: { name: `Dev ${g.team.name}`, email: `dev@${g.team.slug}.gg` },
    })

    await prisma.teamMember.upsert({
      where:  { teamId_userId: { teamId: team.id, userId: memberUser.id } },
      update: {},
      create: { teamId: team.id, userId: memberUser.id, role: 'OWNER' },
    })

    const game = await prisma.game.upsert({
      where:  { slug: g.slug },
      update: {},
      create: {
        title:       g.title,
        slug:        g.slug,
        description: g.description,
        coverUrl:    g.coverUrl,
        launched:    g.launched,
        status:      'PUBLISHED',
        teamId:      team.id,
        categories:  { create: g.categories.map(c => ({ categoryId: c.id })) },
      },
    })

    // Create votes via raw inserts using existing users
    const voters = await prisma.user.findMany({ take: 1 })
    if (voters.length > 0) {
      await prisma.vote.upsert({
        where:  { userId_gameId: { userId: voters[0].id, gameId: game.id } },
        update: {},
        create: { userId: voters[0].id, gameId: game.id },
      })
    }
  }

  console.log(`✅ ${sampleGames.length} sample games created`)
  console.log('🎉 Seed complete!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
