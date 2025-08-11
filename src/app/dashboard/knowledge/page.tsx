'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { CORE_KNOWLEDGE } from '@/lib/knowledge-base'
import { PlusIcon, TrashIcon, PencilIcon, DocumentArrowUpIcon, DocumentIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

interface KnowledgeItem {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  documentType?: 'PDF' | 'TEXT' | 'MANUAL'
  fileName?: string
  fileSize?: number
}

export default function KnowledgePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    tags: ''
  })
  const [uploadData, setUploadData] = useState({
    category: 'legal-document',
    tags: '',
    strategy: 'hybrid'
  })

  // Check if user is admin
  useEffect(() => {
    if (status === 'loading') return // Still loading
    
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    
    const user = session?.user as { isAdmin?: boolean }
    if (!user || !user.isAdmin) {
      router.push('/dashboard')
      return
    }
  }, [session, status, router])

  useEffect(() => {
    if (session?.user) {
      loadKnowledgeItems()
    }
  }, [session])

  const loadKnowledgeItems = async () => {
    setLoading(true)
    try {
      // Load uploaded documents
      const response = await fetch('/api/knowledge')
      if (response.ok) {
        const data = await response.json()
        setKnowledgeItems(data.documents)
      } else {
        setKnowledgeItems([])
      }
    } catch (error) {
      console.error('Error loading knowledge items:', error)
      // Fallback to core knowledge only
      const coreItems = Object.entries(CORE_KNOWLEDGE).map(([key, value]) => ({
        id: key,
        title: value.title,
        content: value.content,
        category: value.category,
        tags: value.tags,
        documentType: 'MANUAL' as const
      }))
      setKnowledgeItems(coreItems)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadKnowledgeItems()
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/knowledge?search=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const data = await response.json()
        setKnowledgeItems(data.documents)
      }
    } catch (error) {
      console.error('Error searching knowledge:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.FormEvent) => {
    event.preventDefault()
    
    const fileInput = document.getElementById('pdf-file') as HTMLInputElement
    const file = fileInput?.files?.[0]
    
    if (!file) {
      alert('Please select a PDF or DOCX file')
      return
    }

    const isPDF = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const isDocx = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx');
    if (!isPDF && !isDocx) {
      alert('Only PDF and DOCX files are supported');
      return;
    }

    setUploadProgress(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('category', uploadData.category)
      formData.append('tags', uploadData.tags)
      formData.append('strategy', uploadData.strategy)

      const response = await fetch('/api/knowledge/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        alert(`PDF processed successfully! Created ${result.count} knowledge entries.`)
        setShowUploadForm(false)
        setUploadData({ category: 'legal-document', tags: '', strategy: 'hybrid' })
        loadKnowledgeItems()
      } else {
        // Handle both JSON and non-JSON error responses
        let errorMessage = `Upload failed (${response.status})`
        
        // Clone the response so we can try multiple parsing methods
        const responseClone = response.clone()
        
        try {
          const error = await responseClone.json()
          errorMessage = `Upload failed: ${error.error}`
        } catch {
          // If JSON parsing fails, try to get text response from original
          try {
            const textResponse = await response.text()
            errorMessage = `Upload failed: ${textResponse.substring(0, 200)}` // Limit text length
            console.log('Server error response:', textResponse)
          } catch {
            errorMessage = `Upload failed: Server error (${response.status})`
          }
        }
        alert(errorMessage)
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setUploadProgress(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      if (editingItem) {
        // Update existing item
        const response = await fetch(`/api/knowledge?id=${editingItem.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: formData.title,
            content: formData.content,
            category: formData.category,
            tags: formData.tags.split(',').map(tag => tag.trim())
          })
        })

        if (response.ok) {
          alert('Knowledge item updated successfully!')
          setFormData({ title: '', content: '', category: '', tags: '' })
          setShowAddForm(false)
          setEditingItem(null)
          loadKnowledgeItems()
        } else {
          let errorMessage = `Update failed (${response.status})`
          const responseClone = response.clone()
          try {
            const error = await responseClone.json()
            errorMessage = `Update failed: ${error.error}`
          } catch {
            try {
              const textResponse = await response.text()
              errorMessage = `Update failed: ${textResponse.substring(0, 200)}`
              console.log('Server error response:', textResponse)
            } catch {
              errorMessage = `Update failed: Server error (${response.status})`
            }
          }
          alert(errorMessage)
        }
      } else {
        // Add new item to database using the new manual entry API
        const response = await fetch('/api/knowledge/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: formData.title,
            content: formData.content,
            category: formData.category,
            tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
          })
        })

        if (response.ok) {
          alert('Knowledge item created successfully!')
          setFormData({ title: '', content: '', category: '', tags: '' })
          setShowAddForm(false)
          loadKnowledgeItems()
        } else {
          let errorMessage = `Creation failed (${response.status})`
          const responseClone = response.clone()
          try {
            const error = await responseClone.json()
            errorMessage = `Creation failed: ${error.error}`
          } catch {
            try {
              const textResponse = await response.text()
              errorMessage = `Creation failed: ${textResponse.substring(0, 200)}`
              console.log('Server error response:', textResponse)
            } catch {
              errorMessage = `Creation failed: Server error (${response.status})`
            }
          }
          alert(errorMessage)
        }
      }
    } catch (error) {
      console.error('Error saving knowledge item:', error)
      alert('Failed to save knowledge item. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (item: KnowledgeItem) => {
    // Only allow editing of text/manual items, not PDFs
    if (item.documentType === 'PDF') {
      alert('PDF documents cannot be edited. You can only delete and re-upload them.')
      return
    }

    setEditingItem(item)
    setFormData({
      title: item.title,
      content: item.content,
      category: item.category,
      tags: item.tags.join(', ')
    })
    setShowAddForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this knowledge item?')) {
      try {
        const response = await fetch(`/api/knowledge?id=${id}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          setKnowledgeItems(items => items.filter(item => item.id !== id))
        } else {
          alert('Failed to delete item')
        }
      } catch (error) {
        console.error('Error deleting item:', error)
        alert('Failed to delete item')
      }
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getDocumentIcon = (documentType?: string) => {
    switch (documentType) {
      case 'PDF':
        return <DocumentIcon className="w-5 h-5 text-red-500" />
      case 'TEXT':
        return <DocumentIcon className="w-5 h-5 text-blue-500" />
      default:
        return <DocumentIcon className="w-5 h-5 text-gray-500" />
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Knowledge Base Management</h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">Manage content for the AI assistant</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setShowUploadForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <DocumentArrowUpIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Upload PDF or DOCX</span>
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Add Knowledge</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search knowledge base..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button
            onClick={handleSearch}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Search
          </button>
          <button
            onClick={() => {
              setSearchQuery('')
              loadKnowledgeItems()
            }}
            className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg"
          >
            Clear
          </button>
        </div>
      </div>

      {/* PDF Upload Form */}
      {showUploadForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Upload PDF or Word Document
          </h2>
          <form onSubmit={handleFileUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                PDF or Word File (.pdf, .docx)
              </label>
              <input
                id="pdf-file"
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Maximum file size: 10MB. Supported formats: PDF (.pdf) and Microsoft Word (.docx)
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                value={uploadData.category}
                onChange={(e) => setUploadData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="legal-document">Legal Document</option>
                <option value="foreign-ownership">Foreign Ownership</option>
                <option value="trust-ownership">Trust Ownership</option>
                <option value="tax-obligations">Tax Obligations</option>
                <option value="procedures">Legal Procedures</option>
                <option value="property-management">Property Management</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={uploadData.tags}
                onChange={(e) => setUploadData(prev => ({ ...prev, tags: e.target.value }))}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., property-law, contracts, legal-forms"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Processing Strategy
              </label>
              <select
                value={uploadData.strategy}
                onChange={(e) => setUploadData(prev => ({ ...prev, strategy: e.target.value }))}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="hybrid">Hybrid (Summary + Sections) - Recommended</option>
                <option value="chunk">Chunk Only (Detailed sections)</option>
                <option value="summarize">Summary Only (Overview)</option>
                <option value="section">Section-based (Structured documents)</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Hybrid creates both a summary and detailed sections. Uses conservative token limits for reliable processing.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="submit"
                disabled={uploadProgress}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm sm:text-base"
              >
                {uploadProgress ? 'Processing...' : 'Upload File'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUploadForm(false)
                  setUploadData({ category: 'legal-document', tags: '', strategy: 'hybrid' })
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Manual Add Form */}
      {(showAddForm || editingItem) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            {editingItem ? 'Edit Knowledge Item' : 'Add New Knowledge Item'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., trust-ownership, taxation, procedures"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., foreign-ownership, legal-requirements, documentation"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Content
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={10}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter detailed content that the AI assistant can reference..."
                required
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm sm:text-base"
              >
                {editingItem ? 'Update' : 'Add'} Knowledge
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false)
                  setEditingItem(null)
                  setFormData({ title: '', content: '', category: '', tags: '' })
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Loading knowledge base...</p>
        </div>
      )}



      {/* Knowledge Items Grid */}
      {!loading && (
        <div className="grid gap-4">
          {knowledgeItems.map((item) => (
            <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {getDocumentIcon(item.documentType)}
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                      {item.title}
                    </h3>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      Category: {item.category}
                    </span>
                    {item.fileName && (
                      <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        • {item.fileName} {item.fileSize && `(${formatFileSize(item.fileSize)})`}
                      </span>
                    )}
                    {item.documentType === 'PDF' && (
                      <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs px-2 py-1 rounded w-fit">
                        PDF
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0 ml-2">
                  <button
                    onClick={() => handleEdit(item)}
                    disabled={item.documentType === 'PDF'}
                    className={`p-2 rounded-lg transition-colors ${
                      item.documentType === 'PDF'
                        ? 'text-gray-400 cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700' 
                        : 'text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900'
                    }`}
                    title={
                      item.documentType === 'PDF' 
                        ? 'PDF documents cannot be edited' 
                        : 'Edit knowledge item'
                    }
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900'
                    }`}
                    title="Delete knowledge item"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="mb-3">
                <div className="flex flex-wrap gap-1">
                  {item.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                <p className="line-clamp-2 sm:line-clamp-3">
                  {item.content.substring(0, 200)}...
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && knowledgeItems.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
            No knowledge items found. {searchQuery ? 'Try a different search term.' : 'Upload a PDF or add manual content to get started.'}
          </p>
        </div>
      )}
    </div>
  )
} 