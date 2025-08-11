import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { supabaseDb } from '@/lib/supabase';
import type { Session } from 'next-auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Safely extract user ID from session
    const userId = (session.user as any)?.id || (session.user as any)?.sub;
    if (!userId) {
      console.error('User ID not found in session:', session.user);
      return NextResponse.json({ error: 'User ID not found' }, { status: 400 });
    }

    // Get all chat logs for the user
    const chatLogs = await supabaseDb.getAIChatHistory({ userId, limit: 1000 });
    
    // Group by session_id
    const conversationsMap = new Map<string, any[]>();
    
    chatLogs.forEach((log: any) => {
      const sessionId = log.session_id || 'default';
      if (!conversationsMap.has(sessionId)) {
        conversationsMap.set(sessionId, []);
      }
      conversationsMap.get(sessionId)!.push(log);
    });

    // Convert to conversation format
    const conversations = Array.from(conversationsMap.entries()).map(([sessionId, logs]) => {
      // Sort logs by timestamp
      const sortedLogs = logs.sort((a: any, b: any) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      const lastLog = sortedLogs[sortedLogs.length - 1];
      
      return {
        id: sessionId,
        title: (session.user as any)?.name || 'Conversation',
        lastMessage: lastLog.input_text.substring(0, 50) + (lastLog.input_text.length > 50 ? '...' : ''),
        timestamp: new Date(lastLog.timestamp),
        messageCount: sortedLogs.length,
        messages: sortedLogs.map((log: any, index: number) => ({
          id: log.id,
          role: index % 2 === 0 ? 'user' : 'assistant',
          content: log.input_text,
          timestamp: new Date(log.timestamp)
        }))
      };
    });

    // Sort conversations by timestamp (newest first)
    conversations.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
} 