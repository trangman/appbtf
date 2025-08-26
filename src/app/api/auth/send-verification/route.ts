import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// In production, you would use a proper email service like SendGrid, AWS SES, etc.
// For now, this is a placeholder that simulates sending an email

export async function POST(request: NextRequest) {
  try {
    const { email, name, role } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Generate a verification token
    const token = crypto.randomBytes(32).toString('hex')
    
    // In production, you would:
    // 1. Store the token with expiration in your database
    // 2. Send an email with the verification link
    
    // For development, we'll log the verification link
    const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/verify-phone?token=${token}`
    
    console.log('=== EMAIL VERIFICATION ===')
    console.log(`To: ${email}`)
    console.log(`Name: ${name}`)
    console.log(`Role: ${role}`)
    console.log(`Verification URL: ${verificationUrl}`)
    console.log('========================')

    // TODO: Replace with actual email sending logic
    // Example with SendGrid:
    /*
    const msg = {
      to: email,
      from: 'noreply@yourdomain.com',
      subject: 'Verify your Better Than Freehold account',
      html: `
        <h1>Welcome to Better Than Freehold</h1>
        <p>Hi ${name},</p>
        <p>Thank you for signing up! Please verify your email address by clicking the link below:</p>
        <a href="${verificationUrl}">Verify Email Address</a>
        <p>If you didn't create an account, you can safely ignore this email.</p>
      `,
    }
    await sgMail.send(msg)
    */

    return NextResponse.json({ 
      message: 'Verification email sent',
      // In development, return the token for testing
      ...(process.env.NODE_ENV === 'development' && { token, verificationUrl })
    })

  } catch (error) {
    console.error('Send verification error:', error)
    return NextResponse.json(
      { error: 'Failed to send verification email' },
      { status: 500 }
    )
  }
}
