'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { UserRole } from '@prisma/client'

interface Brief {
  id: string
  title: string
  slug: string
  description: string | null
  targetRoles: UserRole[]
  createdAt: string
  updatedAt: string
}

export default function Dashboard() {
  const { data: session } = useSession()
  const [briefs, setBriefs] = useState<Brief[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchBriefs()
  }, [])

  const fetchBriefs = async () => {
    try {
      const response = await fetch('/api/briefs')
      const data = await response.json()

      if (response.ok) {
        setBriefs(data.briefs)
      } else {
        setError(data.error || 'Failed to fetch briefs')
      }
    } catch {
      setError('An error occurred while fetching briefs')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case 'BUYER':
        return 'Property Buyer'
      case 'ACCOUNTANT':
        return 'Accountant'
      case 'LAWYER':
        return 'Lawyer'
      case 'EXISTING_PROPERTY_OWNER':
        return 'Existing Property Owner'
      default:
        return role
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/2 sm:w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white p-4 sm:p-6 rounded-lg border">
                <div className="h-5 sm:h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          Legal Briefs for Thai Property Market
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm sm:text-base">
          Welcome back, {session?.user.name || session?.user.email}! 
          Here are the legal briefs available for your role: {getRoleDisplayName(session?.user.role as UserRole)}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded mb-6 text-sm">
          {error}
        </div>
      )}

      {briefs.length === 0 && !loading && !error ? (
        <div className="text-center py-8 sm:py-12">
          <div className="text-gray-500 dark:text-gray-400">
            <svg className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No briefs available</h3>
            <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              There are currently no legal briefs available for your role.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {briefs.map((brief) => (
            <Link
              key={brief.id}
              href={`/dashboard/briefs/${brief.slug}`}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md transition-all duration-200 p-4 sm:p-6 block"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {brief.title}
                  </h3>
                  {brief.description && (
                    <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3">
                      {brief.description}
                    </p>
                  )}
                  <div className="space-y-2 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400 block">
                      Updated {formatDate(brief.updatedAt)}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {brief.targetRoles.map((role) => (
                        <span
                          key={role}
                          className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                        >
                          {getRoleDisplayName(role)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
} 