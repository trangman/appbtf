import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Create Supabase client for server-side operations (defensive initialization)
export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Helper function to ensure Supabase client is available
function ensureSupabaseClient() {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Check environment variables.')
  }
  return supabase
}

// Database operations using Supabase API
export const supabaseDb = {
  // User operations
  async findUserByEmail(email: string) {
    const client = ensureSupabaseClient()
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw error
    }
    
    return data
  },

  async createUser(userData: {
    email: string
    password: string
    name?: string
    role: string
    isAdmin?: boolean
  }) {
    const supabase = ensureSupabaseClient()
    const { data, error } = await supabase
      .from('users')
      .insert([{ ...userData, id: crypto.randomUUID(), createdAt: new Date(), updatedAt: new Date() }])
      .select()
      .single()
    if (error) throw new Error('Failed to create user: ' + error.message)
    return data
  },

  async updateUser(id: string, userData: {
    name?: string
    role?: string
    isAdmin?: boolean
    password?: string
  }) {
    const supabase = ensureSupabaseClient()
    const { data, error } = await supabase
      .from('users')
      .update({ ...userData, updatedAt: new Date() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error('Failed to update user: ' + error.message)
    return data
  },

  async deleteUser(id: string) {
    const supabase = ensureSupabaseClient()
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
    if (error) throw new Error('Failed to delete user: ' + error.message)
    return { success: true }
  },

  // Brief operations
  async getBriefs(userRole?: string) {
    const client = ensureSupabaseClient()
    let query = client
      .from('briefs')
      .select('*')
      .eq('isPublished', true)
      .order('createdAt', { ascending: false })

    if (userRole) {
      query = query.contains('targetRoles', [userRole])
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return data || []
  },

  async getBriefBySlug(slug: string) {
    const client = ensureSupabaseClient()
    const { data, error } = await client
      .from('briefs')
      .select('*')
      .eq('slug', slug)
      .eq('isPublished', true)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return data
  },

  // Knowledge document operations
  async getKnowledgeDocuments() {
    const client = ensureSupabaseClient()
    const { data, error } = await client
      .from('knowledge_documents')
      .select('*')
      .order('createdAt', { ascending: false })
      .limit(100)

    if (error) {
      throw error
    }

    return data || []
  },

  async createKnowledgeDocument(docData: {
    title: string;
    content: string;
    category: string;
    tags: string[];
    documentType: string;
    fileName?: string;
    fileSize?: number;
    embedding: number[];
    userId?: string;
  }) {
    const client = ensureSupabaseClient()
    const { data, error } = await client
      .from('knowledge_documents')
      .insert([{
        id: crypto.randomUUID(),
        title: docData.title,
        content: docData.content,
        category: docData.category,
        tags: docData.tags,
        documentType: docData.documentType,
        fileName: docData.fileName || null,
        fileSize: docData.fileSize || null,
        embedding: docData.embedding,
        userId: docData.userId || null,
        createdAt: new Date(),
        updatedAt: new Date()
      }])
      .select()
      .single()
    
    if (error) {
      throw error
    }
    
    return data
  },

  // Contact submission operations
  async createContactSubmission(submission: {
    name: string
    email: string
    subject?: string
    message: string
    userId?: string
  }) {
    const supabase = ensureSupabaseClient()
    
    const { data, error } = await supabase
      .from('contact_submissions')
      .insert([submission])
      .select()
      .single()

    if (error) {
      console.error('Error creating contact submission:', error)
      throw new Error(`Failed to create contact submission: ${error.message}`)
    }

    return data
  },

  // Brief operations
  async createBrief(briefData: {
    title: string
    slug: string
    description: string
    content: string
    targetRoles: string[]
    isPublished: boolean
  }) {
    const supabase = ensureSupabaseClient()
    
    const { data, error } = await supabase
      .from('briefs')
      .insert([briefData])
      .select()
      .single()

    if (error) {
      console.error('Error creating brief:', error)
      throw new Error(`Failed to create brief: ${error.message}`)
    }

    return data
  },

  async getAllBriefs() {
    const supabase = ensureSupabaseClient()
    
    const { data, error } = await supabase
      .from('briefs')
      .select('*')
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error fetching all briefs:', error)
      throw new Error(`Failed to fetch briefs: ${error.message}`)
    }

    return data || []
  },

  async updateBrief(id: string, briefData: {
    title: string
    slug: string
    description?: string
    content: string
    targetRoles: string[]
    isPublished: boolean
  }) {
    const supabase = ensureSupabaseClient()
    
    const { data, error } = await supabase
      .from('briefs')
      .update({
        ...briefData,
        description: briefData.description || null,
        updatedAt: new Date()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating brief:', error)
      throw new Error(`Failed to update brief: ${error.message}`)
    }

    return data
  },

  async deleteBrief(id: string) {
    const supabase = ensureSupabaseClient()
    
    const { error } = await supabase
      .from('briefs')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting brief:', error)
      throw new Error(`Failed to delete brief: ${error.message}`)
    }

    return { success: true }
  },

  async getBriefById(id: string) {
    const supabase = ensureSupabaseClient()
    
    const { data, error } = await supabase
      .from('briefs')
      .select('*')
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching brief by ID:', error)
      throw new Error(`Failed to fetch brief: ${error.message}`)
    }

    return data
  },

  // AI Prompts operations
  async getAIPrompts(role?: string, activeOnly?: boolean) {
    const supabase = ensureSupabaseClient()
    
    let query = supabase
      .from('ai_prompts')
      .select('*')
      .order('role', { ascending: true })
      .order('isActive', { ascending: false })
      .order('updatedAt', { ascending: false })

    if (role) {
      query = query.eq('role', role)
    }

    if (activeOnly) {
      query = query.eq('isActive', true)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching AI prompts:', error)
      throw new Error(`Failed to fetch AI prompts: ${error.message}`)
    }

    return data || []
  },

  async createAIPrompt(promptData: {
    role: string
    title: string
    systemPrompt: string
    description?: string
    version: string
    isActive: boolean
    createdBy?: string
  }) {
    const supabase = ensureSupabaseClient()
    
    // If setting this as active, deactivate other prompts for this role
    if (promptData.isActive) {
      await supabase
        .from('ai_prompts')
        .update({ isActive: false })
        .eq('role', promptData.role)
        .eq('isActive', true)
    }

    const { data, error } = await supabase
      .from('ai_prompts')
      .insert([{
        id: crypto.randomUUID(),
        role: promptData.role,
        title: promptData.title,
        systemPrompt: promptData.systemPrompt,
        description: promptData.description || null,
        version: promptData.version,
        isActive: promptData.isActive,
        createdBy: promptData.createdBy || null,
        createdAt: new Date(),
        updatedAt: new Date()
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating AI prompt:', error)
      throw new Error(`Failed to create AI prompt: ${error.message}`)
    }

    return data
  },

  async updateAIPrompt(id: string, promptData: {
    title?: string
    systemPrompt?: string
    description?: string
    version?: string
    isActive?: boolean
    createdBy?: string
  }) {
    const supabase = ensureSupabaseClient()
    
    // Get existing prompt to check role
    const { data: existingPrompt, error: fetchError } = await supabase
      .from('ai_prompts')
      .select('role')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('Error fetching existing AI prompt:', fetchError)
      throw new Error(`Failed to fetch existing AI prompt: ${fetchError.message}`)
    }

    // If setting this as active, deactivate other prompts for this role
    if (promptData.isActive && existingPrompt) {
      await supabase
        .from('ai_prompts')
        .update({ isActive: false })
        .eq('role', existingPrompt.role)
        .eq('isActive', true)
        .neq('id', id)
    }

    const { data, error } = await supabase
      .from('ai_prompts')
      .update({
        ...(promptData.title && { title: promptData.title }),
        ...(promptData.systemPrompt && { systemPrompt: promptData.systemPrompt }),
        ...(promptData.description !== undefined && { description: promptData.description }),
        ...(promptData.version && { version: promptData.version }),
        ...(promptData.isActive !== undefined && { isActive: promptData.isActive }),
        ...(promptData.createdBy && { createdBy: promptData.createdBy }),
        updatedAt: new Date()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating AI prompt:', error)
      throw new Error(`Failed to update AI prompt: ${error.message}`)
    }

    return data
  },

  async deleteAIPrompt(id: string) {
    const supabase = ensureSupabaseClient()
    
    const { error } = await supabase
      .from('ai_prompts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting AI prompt:', error)
      throw new Error(`Failed to delete AI prompt: ${error.message}`)
    }

    return { success: true }
  },

  async getAIPromptById(id: string) {
    const supabase = ensureSupabaseClient()
    
    const { data, error } = await supabase
      .from('ai_prompts')
      .select('*')
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching AI prompt by ID:', error)
      throw new Error(`Failed to fetch AI prompt: ${error.message}`)
    }

    return data
  },

  async getAllUsers() {
    const supabase = ensureSupabaseClient()
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('createdAt', { ascending: false })
    if (error) throw new Error('Failed to fetch users: ' + error.message)
    return data || []
  },

  // AI Chat Log operations
  async saveAIChatLog({ userId, inputText, sessionId, metadata }: {
    userId?: string;
    inputText: string;
    sessionId?: string;
    metadata?: Record<string, unknown>;
  }) {
    const client = ensureSupabaseClient();
    const { data, error } = await client
      .from('ai_chat_logs')
      .insert([
        {
          id: crypto.randomUUID(),
          user_id: userId || null,
          input_text: inputText,
          session_id: sessionId || null,
          metadata: metadata || null,
          timestamp: new Date(),
        },
      ])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Fetch chat history for a user (optionally by sessionId)
  async getAIChatHistory({ userId, sessionId, limit = 50 }: {
    userId: string;
    sessionId?: string;
    limit?: number;
  }) {
    const client = ensureSupabaseClient();
    let query = client
      .from('ai_chat_logs')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: true })
      .limit(limit);
    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async createManifestEntry(entry: {
    documentId: string,
    uploaderId?: string,
    source?: string,
    notes?: string,
  }) {
    const supabase = ensureSupabaseClient();
    const { data, error } = await supabase
      .from('manifest')
      .insert([{
        id: crypto.randomUUID(),
        documentId: entry.documentId,
        uploaderId: entry.uploaderId || null,
        source: entry.source || null,
        notes: entry.notes || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }])
      .select()
      .single();
    if (error) throw new Error('Failed to create manifest entry: ' + error.message);
    return data;
  }
} 