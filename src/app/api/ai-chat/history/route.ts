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
    const userId = session.user.id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 400 });
    }
    // Optionally, support sessionId in the future
    const history = await supabaseDb.getAIChatHistory({ userId, limit: 50 });
    // Map to frontend format
    const mapped = (history as unknown[]).map((msg, idx) => {
      const m = msg as {
        input_text: string;
        timestamp: string;
        metadata?: unknown;
      };
      // If even index, user; odd index, assistant (simple alternation)
      const role = idx % 2 === 0 ? 'user' : 'assistant';
      return {
        role,
        content: m.input_text,
        timestamp: m.timestamp,
      };
    });
    return NextResponse.json({ history: mapped });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 });
  }
} 