'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { UserRole } from '@prisma/client'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Brief {
  id: string
  title: string
  slug: string
  description: string | null
  content: string
  targetRoles: UserRole[]
  createdAt: string
  updatedAt: string
}

export default function BriefDetailPage() {
  const params = useParams()
  const [brief, setBrief] = useState<Brief | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (params.slug) {
      fetchBrief(params.slug as string)
    }
  }, [params.slug])

  const fetchBrief = async (slug: string) => {
    try {
      const response = await fetch(`/api/briefs/${slug}`)
      const data = await response.json()

      if (response.ok) {
        setBrief(data.brief)
      } else if (response.status === 404) {
        setError('Brief not found or you do not have access to this content.')
      } else {
        setError(data.error || 'Failed to fetch brief')
      }
    } catch {
      setError('An error occurred while fetching the brief')
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
          <div className="h-6 sm:h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-6"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <div className="text-center py-8 sm:py-12">
          <div className="text-red-500 mb-4">
            <svg className="mx-auto h-10 w-10 sm:h-12 sm:w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">Error Loading Brief</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm sm:text-base">{error}</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            ← Back to Briefs
          </Link>
        </div>
      </div>
    )
  }

  if (!brief) {
    return null
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 mb-4"
        >
          ← Back to Legal Briefs
        </Link>
        
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4">
          {brief.targetRoles.map((role) => (
            <span
              key={role}
              className="inline-flex items-center px-2 py-1 sm:px-2.5 sm:py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            >
              {getRoleDisplayName(role)}
            </span>
          ))}
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
          {brief.title}
        </h1>
        
        {brief.description && (
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
            {brief.description}
          </p>
        )}

        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-4">
          Last updated: {formatDate(brief.updatedAt)}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="p-4 sm:p-6">
          <div className="prose prose-sm sm:prose-lg max-w-none prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-li:text-gray-700 dark:prose-li:text-gray-300 prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-em:text-gray-600 dark:prose-em:text-gray-400 prose-code:bg-gray-100 dark:prose-code:bg-gray-700 prose-code:text-gray-800 dark:prose-code:text-gray-200">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4 mt-6 pb-2 border-b border-gray-200 dark:border-gray-700">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2 mt-4">
                    {children}
                  </h3>
                ),
                h4: ({ children }) => (
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2 mt-3">
                    {children}
                  </h4>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc pl-6 space-y-2 my-4 text-gray-700 dark:text-gray-300">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-6 space-y-2 my-4 text-gray-700 dark:text-gray-300">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {children}
                  </li>
                ),
                p: ({ children }) => (
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                    {children}
                  </p>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-gray-900 dark:text-white">
                    {children}
                  </strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-gray-600 dark:text-gray-400">
                    {children}
                  </em>
                ),
                code: ({ children }) => (
                  <code className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-1.5 py-0.5 rounded text-sm font-mono">
                    {children}
                  </code>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-blue-200 dark:border-blue-600 pl-4 py-2 bg-blue-50 dark:bg-blue-900/20 my-4 italic text-gray-700 dark:text-gray-300">
                    {children}
                  </blockquote>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-4">
                    <table className="min-w-full border-collapse border border-gray-200 dark:border-gray-700">
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-gray-700 dark:text-gray-300">
                    {children}
                  </td>
                ),
                hr: () => (
                  <hr className="border-gray-200 dark:border-gray-700 my-6" />
                ),
              }}
            >
              {brief.content}
            </ReactMarkdown>
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mt-8 text-center">
        <Link
          href="/dashboard"
          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          ← Back to All Briefs
        </Link>
      </div>
    </div>
  )
} 