import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route'
import OpenAI from 'openai'
import { getRelevantKnowledge } from '@/lib/knowledge-base'
import type { Session } from 'next-auth'

interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const { message, conversationHistory } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Get relevant knowledge from our knowledge base with error handling
    let relevantKnowledge = ''
    try {
      relevantKnowledge = await getRelevantKnowledge(message, session.user.role)
    } catch (error) {
      console.error('Error fetching relevant knowledge (continuing without it):', error)
      // Continue without knowledge base context - AI can still provide general responses
    }

    // Build conversation context
    const systemMessage = {
      role: 'system' as const,
      content: `You are a legal expert assistant specializing in Thai property law. You help users understand legal concepts related to property transactions, ownership, taxes, and regulations in Thailand.

Your role: Provide general legal information and guidance about Thai property law.
User's role: ${session.user.role.replace('_', ' ')}

${relevantKnowledge ? `RELEVANT KNOWLEDGE TO REFERENCE:\n${relevantKnowledge}\n` : ''}

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
10. End responses with a clear summary or next steps when appropriate

Tailor your responses to be most relevant for someone in the role of: ${session.user.role.replace('_', ' ')}`
    }

    // Format conversation history
    const messages = [
      systemMessage,
      ...conversationHistory.map((msg: ConversationMessage) => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user' as const,
        content: message
      }
    ]

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    })

    const aiResponse = completion.choices[0]?.message?.content

    if (!aiResponse) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      response: aiResponse,
      usage: completion.usage
    })

  } catch (error) {
    console.error('AI chat error:', error)
    
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