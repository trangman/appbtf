import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.join(__dirname, '../.env.local');
console.log('Loading environment from:', envPath);
dotenv.config({ path: envPath });

const CUSTOMGPT_API_URL = process.env.CUSTOMGPT_API_URL || 'https://api.customgpt.ai/v1';
const CUSTOMGPT_API_KEY = process.env.CUSTOMGPT_API_KEY;
const CUSTOMGPT_PROJECT_ID = process.env.CUSTOMGPT_PROJECT_ID;

console.log('🔍 Testing CustomGPT.ai API connectivity...\n');

console.log('Environment variables:');
console.log(`- API URL: ${CUSTOMGPT_API_URL}`);
console.log(`- API Key: ${CUSTOMGPT_API_KEY ? '✅ Present' : '❌ Missing'}`);
console.log(`- Project ID: ${CUSTOMGPT_PROJECT_ID || '❌ Missing'}\n`);

if (!CUSTOMGPT_API_KEY || !CUSTOMGPT_PROJECT_ID) {
  console.log('❌ Missing required environment variables');
  process.exit(1);
}

async function testEndpoint(endpoint, description, body) {
  console.log(`\n🧪 Testing: ${description}`);
  console.log(`URL: ${endpoint}`);
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CUSTOMGPT_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Success! Response:', JSON.stringify(data, null, 2));
      return true;
    } else {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
      return false;
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
    return false;
  }
}

async function runTests() {
  const testMessage = "Hello, this is a test message.";
  
  // Test 1: Simple conversations endpoint
  await testEndpoint(
    `${CUSTOMGPT_API_URL}/conversations`,
    'Simple conversations endpoint',
    {
      message: testMessage,
      project_id: CUSTOMGPT_PROJECT_ID
    }
  );
  
  // Test 2: Project-specific conversations endpoint
  await testEndpoint(
    `${CUSTOMGPT_API_URL}/projects/${CUSTOMGPT_PROJECT_ID}/conversations`,
    'Project-specific conversations endpoint',
    {
      message: testMessage,
      project_id: CUSTOMGPT_PROJECT_ID
    }
  );
  
  // Test 3: With session ID
  await testEndpoint(
    `${CUSTOMGPT_API_URL}/conversations`,
    'With session ID',
    {
      message: testMessage,
      project_id: CUSTOMGPT_PROJECT_ID,
      session_id: `test_session_${Date.now()}`
    }
  );
  
  // Test 4: Check if project exists
  console.log('\n🧪 Testing: Project info endpoint');
  try {
    const response = await fetch(`${CUSTOMGPT_API_URL}/projects/${CUSTOMGPT_PROJECT_ID}`, {
      headers: {
        'Authorization': `Bearer ${CUSTOMGPT_API_KEY}`,
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Project info:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ Project not found:', errorText);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

runTests().catch(console.error); 