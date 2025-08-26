'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import LogoHeader from '@/components/LogoHeader'

// Force dynamic rendering to avoid static generation issues with sessionStorage
export const dynamic = 'force-dynamic'

export default function VerifyEmail() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [resent, setResent] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Get registration data from session storage
    const registrationData = sessionStorage.getItem('registrationData')
    if (registrationData) {
      const data = JSON.parse(registrationData)
      setEmail(data.email)
      
      // Send verification email
      sendVerificationEmail(data)
    } else {
      // Redirect to register if no data found
      router.push('/auth/register')
    }
  }, [router])

  const sendVerificationEmail = async (data: { email: string; name: string; role: string }) => {
    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        console.error('Failed to send verification email')
      }
    } catch (error) {
      console.error('Error sending verification email:', error)
    }
  }

  const handleResendEmail = async () => {
    setLoading(true)
    const registrationData = sessionStorage.getItem('registrationData')
    if (registrationData) {
      const data = JSON.parse(registrationData)
      await sendVerificationEmail(data)
      setResent(true)
      setTimeout(() => setResent(false), 3000)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-800 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-700 rounded-lg p-8 shadow-xl">
                    {/* Logo */}
          <LogoHeader />

          {/* Header */}
          <div className="text-center mb-8">
            <p className="text-slate-300 text-sm mb-4">Better Than Freehold</p>
            
            {/* Email Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            <h1 className="text-white text-2xl font-semibold mb-4">
              Check Your Email
            </h1>
            <p className="text-slate-300 text-sm mb-2">
              We've sent a verification link to:
            </p>
            <p className="text-white font-medium mb-6">
              {email}
            </p>
            <p className="text-slate-300 text-sm">
              Click the link in your email to verify your account and continue with the registration process.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            {/* Resend Email Button */}
            <button
              onClick={handleResendEmail}
              disabled={loading || resent}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-800 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
            >
              {loading ? 'Sending...' : resent ? 'Email Sent!' : 'Resend Email'}
            </button>

            {/* Back to Register */}
            <div className="text-center">
              <Link
                href="/auth/register"
                className="text-slate-300 hover:text-white text-sm underline"
              >
                Back to Registration
              </Link>
            </div>
          </div>

          {/* Footer Text */}
          <div className="mt-8 text-center">
            <p className="text-slate-400 text-xs">
              Didn't receive the email? Check your spam folder or contact support.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
