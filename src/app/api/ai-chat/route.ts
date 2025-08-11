import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route'
import { getRelevantKnowledge } from '@/lib/knowledge-base'
import { supabaseDb } from '@/lib/supabase'
import type { Session } from 'next-auth'
import axios from 'axios'

// Removed unused interface

// CustomGPT.ai API configuration
const CUSTOMGPT_API_URL = process.env.CUSTOMGPT_API_URL || 'https://app.customgpt.ai/api/v1'
const CUSTOMGPT_API_KEY = process.env.CUSTOMGPT_API_KEY
const CUSTOMGPT_PROJECT_ID = process.env.CUSTOMGPT_PROJECT_ID
const CUSTOMGPT_SESSION_ID = process.env.CUSTOMGPT_SESSION_ID

// Function to get the active AI prompt for a user's role
async function getActivePromptForRole(userRole: string): Promise<string | null> {
  try {
    console.log('AI ASSISTANT: Fetching active prompt for role:', userRole)
    
    // Use the same conditional logic as the AI prompts API
    const useSupabaseApi = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_SUPABASE_URL
    
    if (useSupabaseApi) {
      console.log('AI ASSISTANT: Using Supabase API')
      const prompts = await supabaseDb.getAIPrompts(userRole, true) // role-specific, active only
      const activePrompt = prompts.length > 0 ? prompts[0] : null
      
      if (activePrompt) {
        console.log('AI ASSISTANT: Found active prompt:', {
          id: activePrompt.id,
          title: activePrompt.title,
          version: activePrompt.version
        })
        return activePrompt.systemPrompt
      } else {
        console.warn('AI ASSISTANT: No active prompt found for role:', userRole)
        return null
      }
    } else {
      console.log('AI ASSISTANT: Using Prisma')
      const { prisma } = await import('@/lib/prisma')
      const activePrompt = await prisma.aIPrompt.findFirst({
        where: {
          role: userRole as 'BUYER' | 'ACCOUNTANT' | 'LAWYER' | 'EXISTING_PROPERTY_OWNER' | 'PROFESSOR',
          isActive: true
        }
      })

      if (activePrompt) {
        console.log('AI ASSISTANT: Found active prompt:', {
          id: activePrompt.id,
          title: activePrompt.title,
          version: activePrompt.version
        })
        return activePrompt.systemPrompt
      } else {
        console.warn('AI ASSISTANT: No active prompt found for role:', userRole)
        return null
      }
    }
  } catch (error) {
    console.error('AI ASSISTANT: Error fetching prompt for role:', userRole, error)
    return null
  }
}

// Fallback system prompt if no database prompt is found
const FALLBACK_SYSTEM_PROMPT = `You are a legal expert assistant specializing in Thai property law. You help users understand legal concepts related to property transactions, ownership, taxes, and regulations in Thailand.

Your role: Provide general legal information and guidance about Thai property law.

{RELEVANT_KNOWLEDGE_PLACEHOLDER}

FORMATTING REQUIREMENTS:
- Use clear markdown formatting with headings, bullet points, and emphasis
- Structure responses with headers (## Main Topic)
- Use bullet points for lists and requirements
- **Bold** important terms and concepts
- Use numbered lists for step-by-step processes
- Include relevant emojis for visual appeal (🏠 🏛️ 💰 📋 ⚖️ 🛡️)
- Keep paragraphs concise and scannable

CONTENT GUIDELINES:
1. Always provide accurate, helpful information about Thai property law
2. Use the relevant knowledge provided above when answering questions
3. Our **bespoke trust ownership model** is a key offering - explain its benefits when relevant
4. Structure complex topics with clear sections and subsections
5. Emphasize that your responses are for general information only
6. Always recommend consulting with a qualified Thai lawyer for specific legal advice
7. Be clear about limitations for foreign ownership of property in Thailand
8. Explain legal concepts in accessible language with practical examples
9. Reference relevant Thai laws and regulations when applicable
10. End responses with a clear summary or next steps when appropriate`

export async function POST(request: NextRequest) {
  try {
    console.log('AI ASSISTANT: Starting POST request')
    
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!CUSTOMGPT_API_KEY || !CUSTOMGPT_PROJECT_ID) {
      console.log('AI ASSISTANT: Missing CustomGPT.ai configuration')
      return NextResponse.json(
        { error: 'CustomGPT.ai API configuration missing' },
        { status: 500 }
      )
    }

    const { message, conversationHistory, sessionId, uploadedText } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Save user input to Supabase
    try {
      console.log('[AI LOGGING] Attempting to save chat log:', {
        userId: (session.user as any).id,
        inputText: message,
        sessionId,
        metadata: {
          role: (session.user as any).role,
          conversationHistory
        }
      })
      const logResult = await supabaseDb.saveAIChatLog({
        userId: (session.user as any).id,
        inputText: message,
        sessionId,
        metadata: {
          role: (session.user as any).role,
          conversationHistory
        }
      })
      console.log('[AI LOGGING] Chat log saved successfully:', logResult)
    } catch (logError) {
      console.error('[AI LOGGING] Failed to log AI chat input:', logError)
      // For debugging: return error in response (remove in production)
      return NextResponse.json(
        { error: 'Failed to log AI chat input', details: logError instanceof Error ? logError.message : logError },
        { status: 500 }
      )
    }

    console.log('=== AI ASSISTANT DEBUG ===')
    console.log('User query:', message)
    console.log('User role:', (session.user as any).role)

    // Get relevant knowledge from our knowledge base with error handling
    let relevantKnowledge = ''
    try {
      console.log('AI ASSISTANT: Fetching relevant knowledge...')
      relevantKnowledge = await getRelevantKnowledge(message, (session.user as any).role)
      console.log('AI ASSISTANT: Knowledge retrieval result:', {
        hasKnowledge: !!relevantKnowledge,
        knowledgeLength: relevantKnowledge.length,
        knowledgePreview: relevantKnowledge.substring(0, 200) + '...'
      })
      
      if (relevantKnowledge) {
        console.log('AI ASSISTANT: Using knowledge context in AI response')
      } else {
        console.log('AI ASSISTANT: No relevant knowledge found - using general AI response')
      }
    } catch (error) {
      console.error('AI ASSISTANT: Error fetching relevant knowledge (continuing without it):', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      })
      // Continue without knowledge base context - AI can still provide general responses
    }

    // Get dynamic system prompt based on user's role
    let systemPromptTemplate = await getActivePromptForRole((session.user as any).role)
    if (!systemPromptTemplate) {
      console.warn('AI ASSISTANT: Using fallback system prompt')
      systemPromptTemplate = FALLBACK_SYSTEM_PROMPT
    }

    // Replace the knowledge placeholder with actual relevant knowledge
    const systemPromptContent = systemPromptTemplate.replace(
      '{RELEVANT_KNOWLEDGE_PLACEHOLDER}',
      relevantKnowledge ? `RELEVANT KNOWLEDGE TO REFERENCE:\n${relevantKnowledge}\n` : ''
    )

    // Prepare the message for CustomGPT.ai
    let enhancedMessage = message
    
    // If uploadedText is present, add comparison instruction
    if (uploadedText) {
      const btfSummary = `Better-than-Freehold (BtF) is a proprietary property ownership structure designed to offer foreign investors security, legal clarity, and compliance with Thai law. It typically involves a trust or layered entity structure to maximize rights and minimize risks for non-Thai buyers.`
      enhancedMessage = `${message}\n\nCompare the following property ownership method (from the uploaded file) with the Better-than-Freehold (BtF) structure. Present the comparison as a markdown table with columns for 'Feature', 'BtF', and 'Uploaded Method'.\n\nUploaded Method Description:\n${uploadedText}\n\nBtF Description:\n${btfSummary}`
    }

    // Add system context to the message
    const contextualizedMessage = `System Context: ${systemPromptContent}\n\nUser Question: ${enhancedMessage}`

    console.log('AI ASSISTANT: Calling CustomGPT.ai with contextualized message')
    console.log('AI ASSISTANT: Environment variables check:', {
      hasApiKey: !!CUSTOMGPT_API_KEY,
      hasProjectId: !!CUSTOMGPT_PROJECT_ID,
      hasApiUrl: !!CUSTOMGPT_API_URL,
      apiKeyLength: CUSTOMGPT_API_KEY?.length || 0,
      projectId: CUSTOMGPT_PROJECT_ID
    })

    // Call CustomGPT.ai API using the correct endpoints
    console.log('AI ASSISTANT: CustomGPT.ai API call details:', {
      messageLength: contextualizedMessage.length,
      sessionId: sessionId || CUSTOMGPT_SESSION_ID || `session_${(session.user as any).id}_${Date.now()}`
    })

        // First, create a conversation
        const conversationResponse = await axios.post(`https://app.customgpt.ai/api/v1/projects/${CUSTOMGPT_PROJECT_ID}/conversations`, {
          name: `Session ${sessionId}`
        }, {
          headers: {
            'Authorization': `Bearer ${CUSTOMGPT_API_KEY}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 30000
        })

        console.log('AI ASSISTANT: Conversation created:', conversationResponse.data)
        const conversationSessionId = conversationResponse.data.data.session_id

        // Then send the message to the conversation
        const customGptResponse = await axios.post(`https://app.customgpt.ai/api/v1/projects/${CUSTOMGPT_PROJECT_ID}/conversations/${conversationSessionId}/messages`, {
          response_source: 'default',
          prompt: contextualizedMessage
        }, {
          headers: {
            'Authorization': `Bearer ${CUSTOMGPT_API_KEY}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Legal-Briefs-Thailand/1.0'
          },
          timeout: 30000 // 30 second timeout
        })
    
    console.log('AI ASSISTANT: Axios request completed, status:', customGptResponse.status)

    // Axios automatically throws on non-2xx status codes, so if we get here, it was successful
    const customGptData = customGptResponse.data
    const aiResponse = customGptData.data?.openai_response || customGptData.data?.message || customGptData.message || 'No response from CustomGPT.ai'

    console.log('AI ASSISTANT: CustomGPT.ai response generated successfully:', {
      responseLength: aiResponse.length,
      usedKnowledge: !!relevantKnowledge,
      promptSource: systemPromptTemplate === FALLBACK_SYSTEM_PROMPT ? 'fallback' : 'database'
    })

    return NextResponse.json({
      response: aiResponse,
      usage: customGptData.usage || {},
      debug: {
        knowledgeUsed: !!relevantKnowledge,
        knowledgeLength: relevantKnowledge.length,
        userRole: (session.user as any).role,
        promptSource: systemPromptTemplate === FALLBACK_SYSTEM_PROMPT ? 'fallback' : 'database',
        customGptSessionId: sessionId || CUSTOMGPT_SESSION_ID
      }
    })

  } catch (error) {
    console.error('AI ASSISTANT: Chat error with full details:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    })
    

    
    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { error: 'Invalid API key configuration' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 