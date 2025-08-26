import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, otp, token, registrationData } = await request.json()

    if (!phoneNumber || !otp || !token || !registrationData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // In production, you would:
    // 1. Validate the verification token from the database
    // 2. Verify the OTP against the stored value
    // 3. Check if the OTP hasn't expired
    
    // For development, we'll accept any 6-digit OTP
    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { error: 'Invalid OTP format' },
        { status: 400 }
      )
    }

    const { email, name, role } = registrationData

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 409 }
      )
    }

    // Generate a random password for now (user will set it later or use OAuth)
    const tempPassword = Math.random().toString(36).slice(-12)
    const hashedPassword = await hash(tempPassword, 12)

    // Create the user
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        role,
        phoneNumber,
        hashedPassword,
        emailVerified: new Date(), // Mark as verified since they completed the flow
      }
    })

    console.log('=== USER CREATED ===')
    console.log(`User ID: ${user.id}`)
    console.log(`Email: ${user.email}`)
    console.log(`Name: ${user.name}`)
    console.log(`Role: ${user.role}`)
    console.log(`Phone: ${user.phoneNumber}`)
    console.log(`Temp Password: ${tempPassword}`)
    console.log('==================')

    return NextResponse.json({ 
      message: 'Registration completed successfully',
      userId: user.id
    })

  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    )
  }
}
