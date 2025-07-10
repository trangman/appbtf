import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create Supabase client for server-side operations
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Database operations using Supabase API
export const supabaseDb = {
  // User operations
  async findUserByEmail(email: string) {
    const { data, error } = await supabase
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
  }) {
    const { data, error } = await supabase
      .from('users')
      .insert([{
        id: crypto.randomUUID(),
        email: userData.email,
        password: userData.password,
        name: userData.name,
        role: userData.role,
        isAdmin: false,
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

  async updateUser(userId: string, userData: {
    name?: string
    role?: string
  }) {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...userData,
        updatedAt: new Date()
      })
      .eq('id', userId)
      .select('id, name, email, role, updatedAt')
      .single()

    if (error) {
      throw error
    }

    return data
  },

  // Brief operations
  async getBriefs(userRole?: string) {
    let query = supabase
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
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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
    name: string;
    email: string;
    subject?: string;
    message: string;
    userId: string;
  }) {
    const { data, error } = await supabase
      .from('contact_submissions')
      .insert([{
        id: crypto.randomUUID(),
        name: submission.name,
        email: submission.email,
        subject: submission.subject || null,
        message: submission.message,
        userId: submission.userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }])
      .select()
      .single()
    
    if (error) {
      throw error
    }
    
    return data
  }
} 