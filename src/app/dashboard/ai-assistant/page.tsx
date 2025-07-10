'use client'

import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { UserIcon, CpuChipIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'assistant',
      content: `# Welcome to Your Thai Property Law Expert! 🏛️

I'm your AI legal assistant powered by OpenAI, specializing in **Thai property law** and your company's **bespoke trust ownership model**.

## How I Can Help:
- 🏠 **Property Purchase Guidance** - Foreign ownership rules and restrictions
- 💰 **Tax Obligations** - Transfer taxes, ongoing property taxes, and planning strategies  
- 📋 **Legal Requirements** - Documentation, due diligence, and compliance
- 🛡️ **Trust Ownership Model** - Our proprietary structure for secure foreign ownership
- ⚖️ **Legal Procedures** - Step-by-step guidance for property transactions

## Get Started:
Ask me anything about Thai property law, and I'll provide detailed, role-specific guidance based on your needs.

*Remember: This is general legal information. Always consult with a qualified Thai lawyer for specific legal advice.*`,
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim()) return

    const userMessage = {
      id: messages.length + 1,
      role: 'user' as const,
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const currentInput = inputMessage
    setInputMessage('')
    setLoading(true)

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          conversationHistory: messages
        }),
      })

      const data = await response.json()

      if (response.ok) {
        const assistantMessage = {
          id: messages.length + 2,
          role: 'assistant' as const,
          content: data.response,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        const errorMessage = {
          id: messages.length + 2,
          role: 'assistant' as const,
          content: `## ⚠️ Technical Difficulties

I apologize, but I'm experiencing technical difficulties: **${data.error || 'Unknown error'}**

Please try again later or contact support if the problem persists.`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      console.error('AI chat error:', error)
      const errorMessage = {
        id: messages.length + 2,
        role: 'assistant' as const,
        content: `## ⚠️ Connection Error

I apologize, but I'm experiencing technical difficulties. Please check your connection and try again.

If the problem persists, please contact support.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  }

  return (
    <div className="h-full lg:h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CpuChipIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span className="truncate">Ask the Expert</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm sm:text-base">
            AI-powered Thai property law guidance with access to our knowledge base
          </p>
        </div>
      </div>

      {/* Important Notice */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-2 sm:items-center">
            <svg className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5 sm:mt-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-200 leading-tight sm:leading-normal">
              <strong>Legal Disclaimer:</strong> This AI provides general information only. Always consult a qualified Thai lawyer for specific legal advice.
            </p>
          </div>
        </div>
      </div>

             {/* Messages Container */}
       <div className="flex-1 overflow-hidden">
         <div className="h-full overflow-y-auto px-3 py-4 sm:px-6 messages-container">
           <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
                                      {messages.map((message) => (
               <div
                 key={message.id}
                 className={`flex gap-3 sm:gap-4 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} message-enter`}
               >
                 {/* Avatar */}
                 <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                   message.role === 'user' 
                     ? 'bg-blue-600 text-white' 
                     : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                 }`}>
                   {message.role === 'user' ? (
                     <UserIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                   ) : (
                     <CpuChipIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                   )}
                 </div>

                 {/* Message Content */}
                 <div className={`flex-1 min-w-0 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                   <div className={`flex items-center gap-2 mb-1 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                     <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                       {message.role === 'user' ? 'You' : 'AI Legal Expert'}
                     </span>
                     <span className="text-xs text-gray-500 dark:text-gray-400">
                       {formatTime(message.timestamp)}
                     </span>
                   </div>
                   
                   <div className={`rounded-lg px-3 py-2 sm:px-4 sm:py-3 ${
                     message.role === 'user'
                       ? 'bg-blue-600 text-white ml-auto inline-block max-w-xs sm:max-w-md'
                       : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm'
                   }`}>
                                         {message.role === 'user' ? (
                       <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{message.content}</p>
                     ) : (
                      <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-headings:font-semibold prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({ children }) => <h1 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b border-gray-200">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-lg font-semibold text-gray-900 mb-2 mt-4">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-base font-semibold text-gray-900 mb-2 mt-3">{children}</h3>,
                            ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 my-3">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 my-3">{children}</ol>,
                            li: ({ children }) => <li className="text-gray-700 leading-relaxed">{children}</li>,
                            p: ({ children }) => <p className="text-gray-700 leading-relaxed mb-3">{children}</p>,
                            strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                            em: ({ children }) => <em className="italic text-gray-600">{children}</em>,
                            code: ({ children }) => <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-gray-800">{children}</code>,
                            blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-200 pl-4 py-2 bg-blue-50 my-3 italic text-gray-700">{children}</blockquote>,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center">
                  <CpuChipIcon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">AI Legal Expert</span>
                    <span className="text-xs text-gray-500">typing...</span>
                  </div>
                                     <div className="bg-white border border-gray-200 shadow-sm rounded-lg px-4 py-3">
                     <div className="typing-indicator">
                       <div className="typing-dot"></div>
                       <div className="typing-dot"></div>
                       <div className="typing-dot"></div>
                     </div>
                   </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

            {/* Input Area */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-3 py-3 sm:px-6 sm:py-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-2 sm:gap-3">
            <div className="flex-1">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about Thai property law, foreign ownership, taxes, trust model..."
                className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none textarea-focus text-sm sm:text-base"
                rows={2}
                disabled={loading}
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
              disabled={loading || !inputMessage.trim()}
              className="px-3 py-2 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 sm:gap-2 font-medium send-button text-sm sm:text-base"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center sm:text-left">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
} 