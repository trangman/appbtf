'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { PaperAirplaneIcon, PlusIcon } from '@heroicons/react/24/outline'
import ThemeToggle from '@/components/ThemeToggle'

interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
  isAdmin?: boolean;
}

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isTyping?: boolean
}

interface Conversation {
  id: string
  title: string
  lastMessage: string
  timestamp: Date
  messageCount: number
  messages?: Message[] // Added to hold full conversation history
}

// Helper: Welcome message body (markdown)
const welcomeBody = `Hello! I'm here to assist you with all things related to property investment in Thailand, particularly through the **Better-than-Freehold™ (BtF) structure**.

My goal is to provide clear, reliable information on Thai property law, regulatory compliance, and secure investment practices.

## What I Can Help You With:

- **Understanding BtF Methodology:** Learn how our unique ownership model offers security and legal clarity.
- **Navigating Thai Property Law:** Get insights into key regulations, including the Foreign Business Act and the Condominium Act.
- **Compliance and Best Practices:** Stay informed about compliance requirements, including AMLA 2025, to ensure your investments are secure.
- **Tailored Support:** Whether you're a team member or an external client, I can provide the information you need in an accessible way.

Feel free to ask me anything related to property investment in Thailand, and let's make your investment journey a successful one!`;

export default function AIAssistantPage() {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: Date.now(),
      role: 'assistant',
      content: `<span style="display: flex; align-items: center;"><span>Welcome to The Professor - Your Thai Property Investment Expert!</span> <img src="/thai-flag.svg" alt="Thai Flag" style="display: inline; width: 1.5em; height: 1.5em; margin-left: 0.5em; vertical-align: middle;" /></span>\n\nHello! I'm here to assist you with all things related to property investment in Thailand, particularly through the **Better-than-Freehold™ (BtF) structure**.\n\nMy goal is to provide clear, reliable information on Thai property law, regulatory compliance, and secure investment practices.\n\n## What I Can Help You With:\n\n- **Understanding BtF Methodology:** Learn how our unique ownership model offers security and legal clarity.\n- **Navigating Thai Property Law:** Get insights into key regulations, including the Foreign Business Act and the Condominium Act.\n- **Compliance and Best Practices:** Stay informed about compliance requirements, including AMLA 2025, to ensure your investments are secure.\n- **Tailored Support:** Whether you're a team member or an external client, I can provide the information you need in an accessible way.\n\nFeel free to ask me anything related to property investment in Thailand, and let's make your investment journey a successful one!`,
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [typingMessageId, setTypingMessageId] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typewriterRef = useRef<NodeJS.Timeout | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Conversation history state
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string>('new')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loadingConversations, setLoadingConversations] = useState(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Typewriter effect function
  const typewriterEffect = (fullText: string, messageId: number) => {
    let currentIndex = 0
    const typeSpeed = 15 // milliseconds per character
    // Clear any existing typewriter
    if (typewriterRef.current) {
      clearInterval(typewriterRef.current)
    }
    setTypingMessageId(messageId)
    const typeInterval = setInterval(() => {
      currentIndex++
      const partialText = fullText.substring(0, currentIndex)
      setMessages(prev => prev.map(msg =>
        msg.id === messageId
          ? { ...msg, content: partialText, isTyping: true }
          : msg
      ))
      // Finished typing
      if (currentIndex >= fullText.length) {
        clearInterval(typeInterval)
        setTypingMessageId(null)
        setMessages(prev => prev.map(msg =>
          msg.id === messageId
            ? { ...msg, isTyping: false }
            : msg
        ))
        typewriterRef.current = null
      }
    }, typeSpeed)
    typewriterRef.current = typeInterval
  }

  // Cleanup typewriter on unmount
  useEffect(() => {
    return () => {
      if (typewriterRef.current) {
        clearInterval(typewriterRef.current)
      }
    }
  }, [])

  // Load conversations for the current user
  useEffect(() => {
    if (status === 'loading' || !session) return;

    const loadConversations = async () => {
      setLoadingConversations(true);
      try {
        const response = await fetch('/api/ai-chat/conversations');
        if (response.ok) {
          const data = await response.json();
          if (data.conversations && data.conversations.length > 0) {
            // Convert date strings back to Date objects
            const conversationsWithDates = data.conversations.map((conv: any) => ({
              ...conv,
              timestamp: new Date(conv.timestamp),
              messages: conv.messages?.map((msg: any) => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
              }))
            }));
            
            setConversations(conversationsWithDates);
            // Set the first conversation as current if no conversation is selected
            if (currentConversationId === 'new') {
              const firstConversation = conversationsWithDates[0];
              setCurrentConversationId(firstConversation.id);
              // Load the first conversation's messages
              if (firstConversation.messages) {
                setMessages(firstConversation.messages);
              }
            }
          }
        } else {
          console.error('Failed to load conversations:', response.status, response.statusText);
          // Don't throw error, just log it and continue with empty conversations
        }
      } catch (error) {
        console.error('Failed to load conversations:', error);
        // Don't throw the error, just log it and continue with empty conversations
      } finally {
        setLoadingConversations(false);
      }
    };

    loadConversations();
  }, [session, status]); // Removed currentConversationId from dependencies

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim() || loading || typingMessageId !== null) return

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setLoading(true)

    // Update conversation history with new message
    setConversations(prev => prev.map(conv => 
      conv.id === currentConversationId 
        ? { 
            ...conv, 
            lastMessage: inputMessage.substring(0, 50) + (inputMessage.length > 50 ? '...' : ''),
            timestamp: new Date(),
            messageCount: conv.messageCount + 1
          }
        : conv
    ))

    try {
      const formData = new FormData()
      formData.append('message', inputMessage)
      if (uploadedFile) {
        formData.append('file', uploadedFile)
      }

      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        const assistantMessage: Message = {
          id: Date.now() + 1,
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        }

        setMessages(prev => [...prev, assistantMessage])
        
        // Update conversation history with AI response
        setConversations(prev => prev.map(conv => 
          conv.id === currentConversationId 
            ? { 
                ...conv, 
                lastMessage: data.response.substring(0, 50) + (data.response.length > 50 ? '...' : ''),
                timestamp: new Date(),
                messageCount: conv.messageCount + 1
              }
            : conv
        ))

        // Start typewriter effect for the new message
        setTimeout(() => {
          typewriterEffect(data.response, assistantMessage.id)
        }, 100)

        setUploadedFile(null)
        setUploadError("")
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        const errorData = await response.json()
        const errorMessage: Message = {
          id: Date.now() + 1,
          role: 'assistant',
          content: `Sorry, I encountered an error: ${errorData.error || 'Unknown error'}`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
      if (allowedTypes.includes(file.type)) {
        setUploadedFile(file)
        setUploadError("")
      } else {
        setUploadError("Please upload a PDF, DOCX, or TXT file")
        e.target.value = ''
      }
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  }

  const formatConversationTime = (date: Date | string) => {
    // Ensure we have a Date object
    const dateObj = date instanceof Date ? date : new Date(date)
    const now = new Date()
    const diffInHours = (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return dateObj.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })
    } else {
      return dateObj.toLocaleDateString('en-US', { 
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    }
  }

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: (session?.user as SessionUser)?.name || 'New Conversation',
      lastMessage: 'New conversation',
      timestamp: new Date(),
      messageCount: 0
    }
    setConversations(prev => [newConversation, ...prev])
    setCurrentConversationId(newConversation.id)
    setMessages([{
      id: Date.now(),
      role: 'assistant',
      content: `<span style="display: flex; align-items: center;"><span>Welcome to The Professor - Your Thai Property Investment Expert!</span> <img src="/thai-flag.svg" alt="Thai Flag" style="display: inline; width: 1.5em; height: 1.5em; margin-left: 0.5em; vertical-align: middle;" /></span>\n\nHello! I'm here to assist you with all things related to property investment in Thailand, particularly through the **Better-than-Freehold™ (BtF) structure**.\n\nMy goal is to provide clear, reliable information on Thai property law, regulatory compliance, and secure investment practices.\n\n## What I Can Help You With:\n\n- **Understanding BtF Methodology:** Learn how our unique ownership model offers security and legal clarity.\n- **Navigating Thai Property Law:** Get insights into key regulations, including the Foreign Business Act and the Condominium Act.\n- **Compliance and Best Practices:** Stay informed about compliance requirements, including AMLA 2025, to ensure your investments are secure.\n- **Tailored Support:** Whether you're a team member or an external client, I can provide the information you need in an accessible way.\n\nFeel free to ask me anything related to property investment in Thailand, and let's make your investment journey a successful one!`,
      timestamp: new Date()
    }])
  }

  const selectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId)
    const selectedConversation = conversations.find(conv => conv.id === conversationId)
    
    if (selectedConversation && selectedConversation.messages) {
      // Load the conversation's messages
      setMessages(selectedConversation.messages)
    } else {
      // Show welcome message for conversations without messages
      setMessages([{
        id: Date.now(),
        role: 'assistant',
        content: `<span style="display: flex; align-items: center;"><span>Welcome to The Professor - Your Thai Property Investment Expert!</span> <img src="/thai-flag.svg" alt="Thai Flag" style="display: inline; width: 1.5em; height: 1.5em; margin-left: 0.5em; vertical-align: middle;" /></span>\n\nHello! I'm here to assist you with all things related to property investment in Thailand, particularly through the **Better-than-Freehold™ (BtF) structure**.\n\nMy goal is to provide clear, reliable information on Thai property law, regulatory compliance, and secure investment practices.\n\n## What I Can Help You With:\n\n- **Understanding BtF Methodology:** Learn how our unique ownership model offers security and legal clarity.\n- **Navigating Thai Property Law:** Get insights into key regulations, including the Foreign Business Act and the Condominium Act.\n- **Compliance and Best Practices:** Stay informed about compliance requirements, including AMLA 2025, to ensure your investments are secure.\n- **Tailored Support:** Whether you're a team member or an external client, I can provide the information you need in an accessible way.\n\nFeel free to ask me anything related to property investment in Thailand, and let's make your investment journey a successful one!`,
        timestamp: new Date()
      }])
    }
  }

  // Loading state
  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">Loading ...</div>;
  }

  if (!session) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">Please sign in to use the chat.</div>;
  }

  return (
    <div className="h-full lg:h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className={`w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col ${sidebarOpen ? 'block' : 'hidden'}`}>
        {/* Sidebar Header - All Users Dropdown */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <select className="text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1">
              <option>All Users</option>
            </select>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <button
            onClick={createNewConversation}
            className="w-full flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4 py-2 font-medium transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            <span>New conversation</span>
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {loadingConversations ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              Loading conversations...
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No conversations yet. Start a new one!
            </div>
          ) : (
            <div className="p-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => selectConversation(conversation.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    currentConversationId === conversation.id
                      ? 'bg-purple-100 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* User Avatar */}
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                      {(session?.user as SessionUser)?.name?.charAt(0) || 'U'}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {/* User Name and Time */}
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {(session?.user as SessionUser)?.name || 'User'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatConversationTime(conversation.timestamp)}
                        </span>
                      </div>
                      
                      {/* Message Preview */}
                      <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                        {conversation.lastMessage}
                      </p>
                    </div>
                    
                    {/* Three-dot menu for selected conversation */}
                    {currentConversationId === conversation.id && (
                      <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <button className="w-full flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Export all conversations
          </button>
          <button className="w-full flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Deploy on a website
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>Ask • The Professor</span>
                <img src="/thai-flag.svg" alt="Thai Flag" className="w-6 h-6" />
              </h1>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((message, index) => (
              <div
                key={`${message.id}-${message.timestamp.getTime()}-${index}`}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                    P
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                      li: ({ children }) => <li className="text-sm">{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      code: ({ children }) => <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm">{children}</code>,
                      pre: ({ children }) => <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto mb-2">{children}</pre>,
                      blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic mb-2">{children}</blockquote>,
                      table: ({ children }) => <div className="overflow-x-auto mb-3"><table className="min-w-full border border-gray-300 dark:border-gray-600">{children}</table></div>,
                      th: ({ children }) => <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-900 dark:text-white">{children}</th>,
                      td: ({ children }) => <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-xs text-gray-700 dark:text-gray-300">{children}</td>,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
                
                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                    {(session?.user as SessionUser)?.name?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                  P
                </div>
                <div className="bg-gray-200 dark:bg-gray-700 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                    <span className="text-gray-600 dark:text-gray-300">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.docx,.txt"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline"
              >
                {uploadedFile ? `📎 ${uploadedFile.name}` : '📎 Attach file (PDF, DOCX, TXT)'}
              </button>
              {uploadError && (
                <span className="text-xs text-red-600">{uploadError}</span>
              )}
            </div>
            <form onSubmit={handleSubmit} className="flex gap-2 sm:gap-3">
              <div className="flex-1">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask about Thai property law, foreign ownership, taxes, trust model..."
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none textarea-focus text-sm sm:text-base"
                  rows={2}
                  disabled={loading || typingMessageId !== null}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit(e)
                    }
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !inputMessage.trim() || typingMessageId !== null}
                className="px-3 py-2 sm:px-6 sm:py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 sm:gap-2 font-medium send-button text-sm sm:text-base"
              >
                <PaperAirplaneIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Press Enter to send, Shift+Enter for new line
                {typingMessageId && (
                  <span className="ml-2 text-purple-500 dark:text-purple-400">• AI is typing...</span>
                )}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Powered by CustomGPT.ai
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full lg:h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className={`w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col ${sidebarOpen ? 'block' : 'hidden'}`}>
        {/* Sidebar Header - All Users Dropdown */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <select className="text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1">
              <option>All Users</option>
            </select>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <button
            onClick={createNewConversation}
            className="w-full flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4 py-2 font-medium transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            <span>New conversation</span>
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {loadingConversations ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              Loading conversations...
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No conversations yet. Start a new one!
            </div>
          ) : (
            <div className="p-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => selectConversation(conversation.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    currentConversationId === conversation.id
                      ? 'bg-purple-100 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* User Avatar */}
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                      {(session?.user as SessionUser)?.name?.charAt(0) || 'U'}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {/* User Name and Time */}
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {(session?.user as SessionUser)?.name || 'User'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatConversationTime(conversation.timestamp)}
                        </span>
                      </div>
                      
                      {/* Message Preview */}
                      <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                        {conversation.lastMessage}
                      </p>
                    </div>
                    
                    {/* Three-dot menu for selected conversation */}
                    {currentConversationId === conversation.id && (
                      <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <button className="w-full flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Export all conversations
          </button>
          <button className="w-full flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Deploy on a website
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>Ask • The Professor</span>
                <img src="/thai-flag.svg" alt="Thai Flag" className="w-6 h-6" />
              </h1>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((message, index) => (
              <div
                key={`${message.id}-${message.timestamp.getTime()}-${index}`}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                    P
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                      li: ({ children }) => <li className="text-sm">{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      code: ({ children }) => <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm">{children}</code>,
                      pre: ({ children }) => <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto mb-2">{children}</pre>,
                      blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic mb-2">{children}</blockquote>,
                      table: ({ children }) => <div className="overflow-x-auto mb-3"><table className="min-w-full border border-gray-300 dark:border-gray-600">{children}</table></div>,
                      th: ({ children }) => <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-900 dark:text-white">{children}</th>,
                      td: ({ children }) => <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-xs text-gray-700 dark:text-gray-300">{children}</td>,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
                
                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                    {(session?.user as SessionUser)?.name?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                  P
                </div>
                <div className="bg-gray-200 dark:bg-gray-700 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                    <span className="text-gray-600 dark:text-gray-300">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.docx,.txt"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline"
              >
                {uploadedFile ? `📎 ${uploadedFile.name}` : '📎 Attach file (PDF, DOCX, TXT)'}
              </button>
              {uploadError && (
                <span className="text-xs text-red-600">{uploadError}</span>
              )}
            </div>
            <form onSubmit={handleSubmit} className="flex gap-2 sm:gap-3">
              <div className="flex-1">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask about Thai property law, foreign ownership, taxes, trust model..."
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none textarea-focus text-sm sm:text-base"
                  rows={2}
                  disabled={loading || typingMessageId !== null}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit(e)
                    }
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !inputMessage.trim() || typingMessageId !== null}
                className="px-3 py-2 sm:px-6 sm:py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 sm:gap-2 font-medium send-button text-sm sm:text-base"
              >
                <PaperAirplaneIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Press Enter to send, Shift+Enter for new line
                {typingMessageId && (
                  <span className="ml-2 text-purple-500 dark:text-purple-400">• AI is typing...</span>
                )}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Powered by CustomGPT.ai
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 