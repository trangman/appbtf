'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserRole } from '@prisma/client'
import LogoHeader from '@/components/LogoHeader'

// Force dynamic rendering to avoid static generation issues with sessionStorage
export const dynamic = 'force-dynamic'

const roleOptions = [
  { value: UserRole.BUYER, label: 'Property Buyer' },
  { value: UserRole.ACCOUNTANT, label: 'Accountant' },
  { value: UserRole.LAWYER, label: 'Lawyer' },
  { value: UserRole.EXISTING_PROPERTY_OWNER, label: 'Existing Property Owner' },
  { value: UserRole.PROFESSOR, label: 'Professor (Test)' },
]

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: '' as UserRole | '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate role selection
    if (!formData.role) {
      setError('Please select your role')
      setLoading(false)
      return
    }

    try {
      // Store form data in session storage for the verification flow
      sessionStorage.setItem('registrationData', JSON.stringify(formData))
      
      // Redirect to email verification page
      router.push('/auth/verify-email')
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
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
            <h1 className="text-white text-2xl font-semibold mb-4">
              Learn More about the Better Than Freehold property ownership structure
            </h1>
            <p className="text-slate-300 text-sm">
              Discover the future of property ownership with our innovative approach
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-white text-sm font-medium mb-2">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-white text-sm font-medium mb-2">
                Email Address <span className="text-red-400">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-white text-sm font-medium mb-2">
                Your Role <span className="text-red-400">*</span>
              </label>
              <select
                id="role"
                name="role"
                required
                className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="" className="text-slate-400">Select your role</option>
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value} className="text-white">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-800 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
            >
              {loading ? 'Processing...' : 'Sign Up for Free Presentation'}
            </button>

            {/* Footer Text */}
            <p className="text-center text-slate-400 text-xs">
              Secure • No spam • Unsubscribe anytime
            </p>
          </form>
        </div>
      </div>
    </div>
  )
} 