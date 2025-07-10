import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function setUserAsAdmin(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      console.log(`User with email ${email} not found`)
      return
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: { isAdmin: true }
    })

    console.log(`Successfully set ${email} as admin`)
    console.log(`User details:`, {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      isAdmin: updatedUser.isAdmin
    })
  } catch (error) {
    console.error('Error setting user as admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Get email from command line argument
const email = process.argv[2]

if (!email) {
  console.log('Usage: npx ts-node scripts/set-admin.ts <email>')
  process.exit(1)
}

setUserAsAdmin(email) 