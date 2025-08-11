'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

interface AIPrompt {
  id: string
  role: string
  title: string
  systemPrompt: string
  description?: string
  version: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy?: string
}

export default function AIPromptsAdminPage() {
  const { data: session, status } = useSession()
  const [prompts, setPrompts] = useState<AIPrompt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingPrompt, setEditingPrompt] = useState<AIPrompt | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    role: 'BUYER',
    title: '',
    systemPrompt: '',
    description: '',
    version: '1.0',
    isActive: true
  })

  useEffect(() => {
    if (session?.user && (session.user as { isAdmin: boolean }).isAdmin) {
      fetchPrompts()
    }
  }, [session])

  // Check admin access
  if (status === 'loading') {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  if (!session?.user || !(session.user as { isAdmin: boolean }).isAdmin) {
    redirect('/dashboard')
  }

  const fetchPrompts = async () => {
    try {
      const response = await fetch('/api/ai-prompts')
      if (response.ok) {
        const data = await response.json()
        setPrompts(data.prompts)
      } else {
        setError('Failed to fetch prompts')
      }
    } catch (error) {
      setError('Error loading prompts')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingPrompt ? '/api/ai-prompts' : '/api/ai-prompts'
      const method = editingPrompt ? 'PUT' : 'POST'
      const payload = editingPrompt 
        ? { ...formData, id: editingPrompt.id }
        : formData

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        await fetchPrompts()
        resetForm()
        setError('')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to save prompt')
      }
    } catch (error) {
      setError('Error saving prompt')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (prompt: AIPrompt) => {
    setEditingPrompt(prompt)
    setFormData({
      role: prompt.role,
      title: prompt.title,
      systemPrompt: prompt.systemPrompt,
      description: prompt.description || '',
      version: prompt.version,
      isActive: prompt.isActive
    })
    setIsCreating(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return

    try {
      const response = await fetch(`/api/ai-prompts?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchPrompts()
        setError('')
      } else {
        setError('Failed to delete prompt')
      }
    } catch (error) {
      setError('Error deleting prompt')
    }
  }

  const resetForm = () => {
    setFormData({
      role: 'BUYER',
      title: '',
      systemPrompt: '',
      description: '',
      version: '1.0',
      isActive: true
    })
    setEditingPrompt(null)
    setIsCreating(false)
  }

  const roleLabels: Record<string, string> = {
    'BUYER': 'Property Buyer',
    'LAWYER': 'Legal Professional', 
    'ACCOUNTANT': 'Accountant/Tax Professional',
    'EXISTING_PROPERTY_OWNER': 'Existing Property Owner',
    'PROFESSOR': 'Professor (Test)'
  }

  const roleColors: Record<string, string> = {
    'BUYER': 'bg-blue-100 text-blue-800',
    'LAWYER': 'bg-purple-100 text-purple-800',
    'ACCOUNTANT': 'bg-green-100 text-green-800',
    'EXISTING_PROPERTY_OWNER': 'bg-orange-100 text-orange-800',
    'PROFESSOR': 'bg-pink-100 text-pink-800'
  }

  if (loading && prompts.length === 0) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Prompts Management</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Manage role-based system prompts for the AI assistant
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="mb-6">
        <button
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
        >
          Create New Prompt
        </button>
      </div>

      {/* Create/Edit Form */}
      {isCreating && (
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            {editingPrompt ? 'Edit Prompt' : 'Create New Prompt'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  User Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                >
                  <option value="BUYER">Property Buyer</option>
                  <option value="LAWYER">Legal Professional</option>
                  <option value="ACCOUNTANT">Accountant/Tax Professional</option>
                  <option value="EXISTING_PROPERTY_OWNER">Existing Property Owner</option>
                  <option value="PROFESSOR">Professor (Test)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Version
                </label>
                <input
                  type="text"
                  value={formData.version}
                  onChange={(e) => setFormData({...formData, version: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Active (only one per role)
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                System Prompt
              </label>
              <div className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Use <code>{'{RELEVANT_KNOWLEDGE_PLACEHOLDER}'}</code> where you want relevant knowledge to be inserted
              </div>
              <textarea
                value={formData.systemPrompt}
                onChange={(e) => setFormData({...formData, systemPrompt: e.target.value})}
                rows={15}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-sm"
                required
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-md font-medium"
              >
                {loading ? 'Saving...' : (editingPrompt ? 'Update Prompt' : 'Create Prompt')}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Prompts List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Current Prompts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Role & Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Version
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {prompts.map((prompt) => (
                <tr key={prompt.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {prompt.title}
                      </div>
                      <div className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${roleColors[prompt.role]}`}>
                        {roleLabels[prompt.role]}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      prompt.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {prompt.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {prompt.version}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {new Date(prompt.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(prompt)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(prompt.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
} 