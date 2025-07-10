'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { UserRole } from '@prisma/client'

const roleOptions = [
  { value: UserRole.BUYER, label: 'Property Buyer' },
  { value: UserRole.ACCOUNTANT, label: 'Accountant' },
  { value: UserRole.LAWYER, label: 'Lawyer' },
  { value: UserRole.EXISTING_PROPERTY_OWNER, label: 'Existing Property Owner' },
]

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    role: (session?.user as any)?.role || '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Update form data when session changes
  useEffect(() => {
    if (session?.user) {
      setFormData({
        name: session.user.name || '',
        email: session.user.email || '',
        role: (session.user as any)?.role || '',
      })
    }
  }, [session])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleEdit = () => {
    setIsEditing(true)
    setSuccess(false)
    setError('')
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFormData({
      name: session?.user?.name || '',
      email: session?.user?.email || '',
      role: (session?.user as any)?.role || '',
    })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          role: formData.role,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update profile')
      }

      const result = await response.json()
      console.log('Profile updated:', result)

      // Update session with new user data
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          name: formData.name,
          role: formData.role,
        }
      })

      setLoading(false)
      setIsEditing(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)

    } catch (err) {
      console.error('Profile update error:', err)
      setError(err instanceof Error ? err.message : 'Failed to update profile')
      setLoading(false)
    }
  }

  const getRoleDisplayName = (role: string) => {
    const roleOption = roleOptions.find(option => option.value === role)
    return roleOption ? roleOption.label : role
  }



  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">
          Manage your account information and preferences.
        </p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded mb-6 text-sm">
          Profile updated successfully!
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-4 sm:px-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <h2 className="text-base sm:text-lg font-medium text-gray-900">Account Information</h2>
            {!isEditing && (
              <button
                onClick={handleEdit}
                className="text-indigo-600 hover:text-indigo-500 text-sm font-medium text-left sm:text-right"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        <div className="px-4 py-4 sm:px-6">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  disabled
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 sm:text-sm"
                  value={formData.email}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Email cannot be changed. Contact support if you need to update your email.
                </p>
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={formData.role}
                  onChange={handleChange}
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-end gap-3 sm:space-x-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
                    ) : (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <dt className="text-xs sm:text-sm font-medium text-gray-500">Full Name</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {session?.user?.name || 'Not provided'}
                </dd>
              </div>

              <div>
                <dt className="text-xs sm:text-sm font-medium text-gray-500">Email Address</dt>
                <dd className="mt-1 text-sm text-gray-900 break-words">{session?.user?.email}</dd>
              </div>

              <div>
                <dt className="text-xs sm:text-sm font-medium text-gray-500">Role</dt>
                <dd className="mt-1">
                  <span className="inline-flex items-center px-2 py-1 sm:px-2.5 sm:py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {getRoleDisplayName((session?.user as any)?.role || '')}
                  </span>
                </dd>
              </div>

              <div>
                <dt className="text-xs sm:text-sm font-medium text-gray-500">Member Since</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  Recently joined
                </dd>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 