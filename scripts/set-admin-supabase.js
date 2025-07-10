const { createClient } = require('@supabase/supabase-js')

// Load environment variables manually since dotenv might not be available
const supabaseUrl = 'https://rlehtnridixfhwksnyou.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZWh0bnJpZGl4Zmh3a3NueW91Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjExNzQwNCwiZXhwIjoyMDY3NjkzNDA0fQ.M20LcBxzjFKZwc8-uUVNDeNZDYHTk4SeflqxFNIPXWc'

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setUserAsAdmin(email) {
  try {
    console.log(`Looking for user with email: ${email}`)
    
    // Find user by email
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (findError && findError.code !== 'PGRST116') {
      throw findError
    }

    if (!user) {
      console.log(`User with email ${email} not found`)
      return
    }

    console.log(`Found user:`, {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isAdmin: user.isAdmin
    })

    // Update user to be admin
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ 
        isAdmin: true,
        updatedAt: new Date().toISOString()
      })
      .eq('email', email)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    console.log(`Successfully set ${email} as admin`)
    console.log(`Updated user details:`, {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      isAdmin: updatedUser.isAdmin
    })
  } catch (error) {
    console.error('Error setting user as admin:', error)
  }
}

// Get email from command line argument
const email = process.argv[2]

if (!email) {
  console.log('Usage: node scripts/set-admin-supabase.js <email>')
  process.exit(1)
}

setUserAsAdmin(email) 