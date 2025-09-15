import { prisma } from "./prisma"

/**
 * Generate a unique username based on the user's name or email
 * @param name - The user's display name
 * @param email - The user's email address
 * @returns A unique username
 */
export async function generateUniqueUsername(name?: string | null, email?: string): Promise<string> {
  // Extract base username from name or email
  let baseUsername = ""
  
  if (name) {
    // Clean the name: remove special characters, convert to lowercase, replace spaces with underscores
    baseUsername = name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 20) // Limit length
  } else if (email) {
    // Extract username from email (part before @)
    baseUsername = email
      .split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '') // Remove special characters
      .substring(0, 20) // Limit length
  } else {
    // Fallback to a random username
    baseUsername = `user_${Math.random().toString(36).substring(2, 8)}`
  }

  // Ensure minimum length
  if (baseUsername.length < 3) {
    baseUsername = `user_${baseUsername}`
  }

  // Check if username is available
  let username = baseUsername
  let counter = 1
  
  while (true) {
    const existingUser = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: 'insensitive'
        }
      },
      select: { id: true }
    })

    if (!existingUser) {
      break
    }

    // Username exists, try with a number suffix
    username = `${baseUsername}${counter}`
    counter++
    
    // Prevent infinite loop (safety measure)
    if (counter > 9999) {
      username = `${baseUsername}_${Date.now()}`
      break
    }
  }

  return username
}

/**
 * Check if a username is available
 * @param username - The username to check
 * @returns Promise<boolean> - True if available, false if taken
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const existingUser = await prisma.user.findFirst({
    where: {
      username: {
        equals: username,
        mode: 'insensitive'
      }
    },
    select: { id: true }
  })

  return !existingUser
}
