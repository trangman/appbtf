'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { PlusIcon, DocumentTextIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

interface Brief {
  id: string
  title: string
  slug: string
  description?: string
  content: string
  targetRoles: string[]
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

const USER_ROLES = [
  { value: 'BUYER', label: 'Buyer' },
  { value: 'ACCOUNTANT', label: 'Accountant' },
  { value: 'LAWYER', label: 'Lawyer' },
  { value: 'EXISTING_PROPERTY_OWNER', label: 'Existing Property Owner' },
  { value: 'PROFESSOR', label: 'Professor (Test)' }
]

export default function BriefsAdminPage() {
  const { data: session } = useSession()
  const [briefs, setBriefs] = useState<Brief[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingBrief, setEditingBrief] = useState<Brief | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    content: '',
    targetRoles: [] as string[],
    isPublished: false
  })

  // Check if user is admin
  const user = session?.user as { isAdmin?: boolean; email?: string }
  const isAdmin = user?.isAdmin || false

  useEffect(() => {
    if (session && isAdmin) {
      loadAllBriefs()
    }
  }, [session, isAdmin])

  const loadAllBriefs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/briefs-admin')
      if (response.ok) {
        const data = await response.json()
        setBriefs(data.briefs || [])
      } else {
        console.error('Failed to load briefs')
      }
    } catch (error) {
      console.error('Error loading briefs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const isEditing = !!editingBrief
      const url = isEditing ? `/api/briefs-admin/${editingBrief.id}` : '/api/briefs'
      const method = isEditing ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        alert(isEditing ? 'Brief updated successfully!' : 'Brief created successfully!')
        setFormData({ title: '', slug: '', description: '', content: '', targetRoles: [], isPublished: false })
        setShowAddForm(false)
        setEditingBrief(null)
        loadAllBriefs()
      } else {
        const error = await response.json()
        alert(`${isEditing ? 'Update' : 'Creation'} failed: ${error.error}`)
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('An error occurred while submitting the form')
    }
  }

  const handleEdit = (brief: Brief) => {
    setEditingBrief(brief)
    setFormData({
      title: brief.title,
      slug: brief.slug,
      description: brief.description || '',
      content: brief.content,
      targetRoles: brief.targetRoles,
      isPublished: brief.isPublished
    })
    setShowAddForm(true)
  }

  const handleCancel = () => {
    setFormData({ title: '', slug: '', description: '', content: '', targetRoles: [], isPublished: false })
    setShowAddForm(false)
    setEditingBrief(null)
  }

  const handleDelete = async (brief: Brief) => {
    if (!confirm(`Are you sure you want to delete "${brief.title}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/briefs-admin/${brief.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('Brief deleted successfully!')
        loadAllBriefs()
      } else {
        const error = await response.json()
        alert(`Delete failed: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting brief:', error)
      alert('An error occurred while deleting the brief')
    }
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: generateSlug(title)
    }))
  }

  const handleRoleToggle = (role: string) => {
    setFormData(prev => ({
      ...prev,
      targetRoles: prev.targetRoles.includes(role)
        ? prev.targetRoles.filter(r => r !== role)
        : [...prev.targetRoles, role]
    }))
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Please sign in to access this page.</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            You need admin privileges to manage briefs.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Brief Management
              </h1>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                Create and manage legal briefs for different user roles
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Add Brief
              </button>
            </div>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                {editingBrief ? 'Edit Brief' : 'Add New Brief'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Brief title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Slug *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      placeholder="url-friendly-slug"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      URL identifier (auto-generated from title)
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Brief description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Content * (MDX format)
                  </label>
                  <textarea
                    required
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    rows={10}
                    className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
                    placeholder="# Brief Title&#10;&#10;Brief content in MDX format..."
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Support for Markdown and React components (MDX format)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Target Roles * (select at least one)
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {USER_ROLES.map((role) => (
                      <div key={role.value} className="flex items-center">
                        <input
                          type="checkbox"
                          id={role.value}
                          checked={formData.targetRoles.includes(role.value)}
                          onChange={() => handleRoleToggle(role.value)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor={role.value} className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                          {role.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublished"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                    Published (visible to users)
                  </label>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formData.targetRoles.length === 0}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingBrief ? 'Update Brief' : 'Create Brief'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Briefs List */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
              All Briefs ({briefs.length})
            </h3>
            
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading briefs...</p>
              </div>
            ) : briefs.length === 0 ? (
              <div className="text-center py-8">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No briefs</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Get started by creating your first brief.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Target Roles
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {briefs.map((brief) => (
                      <tr key={brief.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {brief.title}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              /{brief.slug}
                            </div>
                            {brief.description && (
                              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate max-w-xs">
                                {brief.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            brief.isPublished 
                              ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                          }`}>
                            {brief.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {brief.targetRoles.map(role => 
                              USER_ROLES.find(r => r.value === role)?.label || role
                            ).join(', ')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(brief.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => window.open(`/dashboard/briefs/${brief.slug}`, '_blank')}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-blue-400 dark:hover:text-blue-300"
                              title="View Brief"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(brief)}
                              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                              title="Edit Brief"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(brief)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              title="Delete Brief"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 