import { prisma } from '@/lib/prisma'

const SAMPLE_TROPHIES = [
  // Registration trophies
  {
    name: 'Welcome Newcomer',
    description: 'Welcome to the forum! This trophy is awarded for registering an account.',
    criteria: JSON.stringify({ daysRegistered: 0 }),
    icon: '🎉',
    points: 5,
    category: 'registration',
    rarity: 'common'
  },
  {
    name: 'One Week Strong',
    description: 'You\'ve been with us for a whole week!',
    criteria: JSON.stringify({ daysRegistered: 7 }),
    icon: '📅',
    points: 10,
    category: 'registration',
    rarity: 'common'
  },
  {
    name: 'Monthly Member',
    description: 'A full month as a community member.',
    criteria: JSON.stringify({ daysRegistered: 30 }),
    icon: '🗓️',
    points: 25,
    category: 'registration',
    rarity: 'uncommon'
  },
  {
    name: 'Annual Achiever',
    description: 'One year of being part of our community!',
    criteria: JSON.stringify({ daysRegistered: 365 }),
    icon: '🎂',
    points: 100,
    category: 'registration',
    rarity: 'rare'
  },

  // Post count trophies
  {
    name: 'First Post',
    description: 'Made your very first post on the forum.',
    criteria: JSON.stringify({ postCount: 1 }),
    icon: '✍️',
    points: 5,
    category: 'posting',
    rarity: 'common'
  },
  {
    name: 'Getting Started',
    description: 'Made 10 posts. You\'re getting the hang of it!',
    criteria: JSON.stringify({ postCount: 10 }),
    icon: '📝',
    points: 15,
    category: 'posting',
    rarity: 'common'
  },
  {
    name: 'Active Contributor',
    description: 'Posted 50 times. You\'re an active member!',
    criteria: JSON.stringify({ postCount: 50 }),
    icon: '💬',
    points: 50,
    category: 'posting',
    rarity: 'uncommon'
  },
  {
    name: 'Prolific Poster',
    description: 'Wow! 100 posts and counting.',
    criteria: JSON.stringify({ postCount: 100 }),
    icon: '🗨️',
    points: 100,
    category: 'posting',
    rarity: 'uncommon'
  },
  {
    name: 'Post Master',
    description: 'An incredible 500 posts! You\'re a forum legend.',
    criteria: JSON.stringify({ postCount: 500 }),
    icon: '📚',
    points: 250,
    category: 'posting',
    rarity: 'rare'
  },
  {
    name: 'Ultimate Poster',
    description: 'Over 1000 posts! You\'re truly dedicated.',
    criteria: JSON.stringify({ postCount: 1000 }),
    icon: '🏆',
    points: 500,
    category: 'posting',
    rarity: 'epic'
  },

  // Thread creation trophies
  {
    name: 'Thread Starter',
    description: 'Started your first discussion thread.',
    criteria: JSON.stringify({ threadsCreated: 1 }),
    icon: '🚀',
    points: 10,
    category: 'threads',
    rarity: 'common'
  },
  {
    name: 'Discussion Leader',
    description: 'Started 10 discussion threads.',
    criteria: JSON.stringify({ threadsCreated: 10 }),
    icon: '👑',
    points: 30,
    category: 'threads',
    rarity: 'uncommon'
  },
  {
    name: 'Topic Creator',
    description: 'Created 25 topics for the community.',
    criteria: JSON.stringify({ threadsCreated: 25 }),
    icon: '🎯',
    points: 75,
    category: 'threads',
    rarity: 'rare'
  },

  // Reputation trophies
  {
    name: 'Trustworthy',
    description: 'Earned 10 reputation points from the community.',
    criteria: JSON.stringify({ reputationPoints: 10 }),
    icon: '⭐',
    points: 20,
    category: 'reputation',
    rarity: 'common'
  },
  {
    name: 'Well Respected',
    description: 'Earned 50 reputation points. Others value your contributions!',
    criteria: JSON.stringify({ reputationPoints: 50 }),
    icon: '🌟',
    points: 50,
    category: 'reputation',
    rarity: 'uncommon'
  },
  {
    name: 'Community Hero',
    description: 'Earned 100 reputation points. You\'re making a difference!',
    criteria: JSON.stringify({ reputationPoints: 100 }),
    icon: '🦸',
    points: 100,
    category: 'reputation',
    rarity: 'rare'
  },
  {
    name: 'Forum Legend',
    description: 'Earned 500 reputation points. Legendary status achieved!',
    criteria: JSON.stringify({ reputationPoints: 500 }),
    icon: '🏅',
    points: 250,
    category: 'reputation',
    rarity: 'epic'
  },

  // Trophy collector trophies
  {
    name: 'Collector',
    description: 'Earned your first 5 trophies.',
    criteria: JSON.stringify({ trophiesReceived: 5 }),
    icon: '🏺',
    points: 25,
    category: 'collection',
    rarity: 'uncommon'
  },
  {
    name: 'Trophy Hunter',
    description: 'Earned 10 trophies. You love achievements!',
    criteria: JSON.stringify({ trophiesReceived: 10 }),
    icon: '🎖️',
    points: 50,
    category: 'collection',
    rarity: 'rare'
  },
  {
    name: 'Achievement Master',
    description: 'Earned 20 trophies. A true completionist!',
    criteria: JSON.stringify({ trophiesReceived: 20 }),
    icon: '🏆',
    points: 100,
    category: 'collection',
    rarity: 'epic'
  },

  // Special trophies
  {
    name: 'Early Bird',
    description: 'One of the first 100 members to join the forum.',
    criteria: JSON.stringify({ specialCondition: 'early_member' }),
    icon: '🐦',
    points: 50,
    category: 'special',
    rarity: 'rare'
  },
  {
    name: 'Night Owl',
    description: 'Posted during late night hours (12 AM - 6 AM).',
    criteria: JSON.stringify({ specialCondition: 'night_poster' }),
    icon: '🦉',
    points: 15,
    category: 'special',
    rarity: 'uncommon'
  }
]

export async function seedTrophies() {
  console.log('🏆 Seeding trophies...')

  for (const trophy of SAMPLE_TROPHIES) {
    try {
      const existing = await prisma.trophy.findFirst({
        where: { name: trophy.name }
      })

      if (!existing) {
        await prisma.trophy.create({
          data: trophy
        })
        console.log(`✅ Created trophy: ${trophy.name}`)
      } else {
        console.log(`⏭️ Trophy already exists: ${trophy.name}`)
      }
    } catch (error) {
      console.error(`❌ Error creating trophy ${trophy.name}:`, error)
    }
  }

  const trophyCount = await prisma.trophy.count()
  console.log(`🏆 Trophy seeding complete. Total trophies: ${trophyCount}`)
}

// Function to award welcome trophy to new users
export async function awardWelcomeTrophy(userId: string) {
  try {
    const welcomeTrophy = await prisma.trophy.findFirst({
      where: { name: 'Welcome Newcomer' }
    })

    if (welcomeTrophy) {
      const existingAward = await prisma.userTrophy.findUnique({
        where: {
          userId_trophyId: {
            userId,
            trophyId: welcomeTrophy.id
          }
        }
      })

      if (!existingAward) {
        await prisma.userTrophy.create({
          data: {
            userId,
            trophyId: welcomeTrophy.id,
            earnedAt: new Date()
          }
        })
        console.log(`🎉 Awarded welcome trophy to user ${userId}`)
      }
    }
  } catch (error) {
    console.error('Error awarding welcome trophy:', error)
  }
}

// Main seeding function
export async function runTrophySeeder() {
  try {
    await seedTrophies()
  } catch (error) {
    console.error('Error running trophy seeder:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run seeder if called directly
if (require.main === module) {
  runTrophySeeder()
}