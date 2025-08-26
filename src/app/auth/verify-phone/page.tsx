'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import LogoHeader from '@/components/LogoHeader'

// Force dynamic rendering to avoid static generation issues with useSearchParams
export const dynamic = 'force-dynamic'

function VerifyPhoneContent() {
  const [formData, setFormData] = useState({
    countryCode: '+1',
    phoneNumber: '',
    otp: ''
  })
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check if we have a verification token from email
    const token = searchParams.get('token')
    if (!token) {
      router.push('/auth/register')
    }
  }, [router, searchParams])

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!formData.phoneNumber) {
      setError('Please enter your phone number')
      setLoading(false)
      return
    }

    try {
      // Here you would integrate with SMS service (Twilio, AWS SNS, etc.)
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: `${formData.countryCode}${formData.phoneNumber}`,
          token: searchParams.get('token')
        }),
      })

      if (response.ok) {
        setOtpSent(true)
        setStep('otp')
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to send OTP')
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!formData.otp || formData.otp.length !== 6) {
      setError('Please enter a valid 6-digit code')
      setLoading(false)
      return
    }

    try {
      const registrationData = sessionStorage.getItem('registrationData')
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: `${formData.countryCode}${formData.phoneNumber}`,
          otp: formData.otp,
          token: searchParams.get('token'),
          registrationData: registrationData ? JSON.parse(registrationData) : null
        }),
      })

      if (response.ok) {
        // Clear session storage
        sessionStorage.removeItem('registrationData')
        // Redirect to success page or dashboard
        router.push('/auth/signin?message=Registration completed successfully. Please sign in.')
      } else {
        const data = await response.json()
        setError(data.error || 'Invalid verification code')
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: `${formData.countryCode}${formData.phoneNumber}`,
          token: searchParams.get('token')
        }),
      })

      if (response.ok) {
        setError('')
        // Show success message briefly
        setOtpSent(true)
        setTimeout(() => setOtpSent(false), 3000)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to resend OTP')
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'phone') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-800 py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-slate-700 rounded-lg p-8 shadow-xl">
            {/* Logo */}
            <LogoHeader />

            {/* Header */}
            <div className="text-center mb-8">
              <p className="text-slate-300 text-sm mb-6">Better Than Freehold</p>
              
              {/* Phone Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              <h1 className="text-white text-2xl font-semibold mb-4">
                Verify Your Phone
              </h1>
              <p className="text-slate-300 text-sm">
                Enter your mobile number so we can send you a one-time password (OTP) to access your presentation.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSendOTP} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Country Code */}
              <div>
                <label htmlFor="countryCode" className="block text-white text-sm font-medium mb-2">
                  Country Code <span className="text-red-400">*</span>
                </label>
                <select
                  id="countryCode"
                  name="countryCode"
                  className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  value={formData.countryCode}
                  onChange={handlePhoneChange}
                >
                  <option value="+1">United States (+1)</option>
                  <option value="+44">United Kingdom (+44)</option>
                  <option value="+66">Thailand (+66)</option>
                  <option value="+61">Australia (+61)</option>
                  <option value="+33">France (+33)</option>
                  <option value="+49">Germany (+49)</option>
                  <option value="+81">Japan (+81)</option>
                  <option value="+86">China (+86)</option>
                </select>
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="phoneNumber" className="block text-white text-sm font-medium mb-2">
                  Phone Number <span className="text-red-400">*</span>
                </label>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  required
                  className="w-full px-4 py-3 bg-slate-600 border border-teal-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
                  placeholder="Enter your phone number"
                  value={formData.phoneNumber}
                  onChange={handlePhoneChange}
                />
              </div>

              {/* Send OTP Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-800 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>

              {/* Footer Text */}
              <p className="text-center text-slate-400 text-xs">
                We'll send a 6-digit code to verify your number
              </p>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // OTP Verification Step
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-800 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-700 rounded-lg p-8 shadow-xl">
          {/* Logo */}
          <LogoHeader />

          {/* Header */}
          <div className="text-center mb-8">
            <p className="text-slate-300 text-sm mb-6">Better Than Freehold</p>
            
            {/* Phone Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            <h1 className="text-white text-2xl font-semibold mb-4">
              Enter Verification Code
            </h1>
            <p className="text-slate-300 text-sm mb-2">
              We've sent a 6-digit code to:
            </p>
            <p className="text-white font-medium mb-4">
              {formData.countryCode} {formData.phoneNumber}
            </p>
            <p className="text-slate-300 text-sm">
              Enter the code below to complete verification.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {otpSent && (
              <div className="bg-teal-500/10 border border-teal-500/20 text-teal-400 px-4 py-3 rounded-lg text-sm">
                New code sent successfully!
              </div>
            )}

            {/* OTP Input */}
            <div>
              <label htmlFor="otp" className="block text-white text-sm font-medium mb-2">
                Verification Code <span className="text-red-400">*</span>
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                required
                maxLength={6}
                className="w-full px-4 py-3 bg-slate-600 border border-teal-500 rounded-lg text-white text-center text-2xl tracking-widest placeholder-slate-400 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
                placeholder="000000"
                value={formData.otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setFormData({ ...formData, otp: value })
                }}
              />
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={loading || formData.otp.length !== 6}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-800 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>

            {/* Resend Code */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={loading}
                className="text-slate-300 hover:text-white text-sm underline"
              >
                Didn't receive the code? Resend
              </button>
            </div>

            {/* Back Button */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="text-slate-300 hover:text-white text-sm underline"
              >
                Change phone number
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-800 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-700 rounded-lg p-8 shadow-xl">
          {/* Logo */}
          <LogoHeader />

          {/* Loading */}
          <div className="text-center">
            <p className="text-slate-300 text-sm mb-4">Better Than Freehold</p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
            <p className="text-white text-lg mt-4">Loading verification...</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyPhone() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerifyPhoneContent />
    </Suspense>
  )
}
