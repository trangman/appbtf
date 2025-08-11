import { supabase } from '../src/lib/supabase'
import { CORE_KNOWLEDGE } from '../src/lib/knowledge-base'

async function seedCoreKnowledge() {
  if (!supabase) throw new Error('Supabase client not initialized. Check environment variables.')
  for (const [key, value] of Object.entries(CORE_KNOWLEDGE)) {
    const { data, error } = await supabase
      .from('knowledge_documents')
      .insert([
        {
          id: key,
          title: value.title,
          content: value.content,
          category: value.category,
          tags: value.tags,
          documentType: 'MANUAL',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ])
    if (error) {
      console.error(`Failed to insert core knowledge (${key}):`, error)
    } else {
      console.log(`Inserted core knowledge (${key}):`, data)
    }
  }
  console.log('Core knowledge seeding complete.')
}

seedCoreKnowledge().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) }) 