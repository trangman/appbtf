import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Current directory:', __dirname);
console.log('Parent directory:', path.dirname(__dirname));

// Try multiple paths
const possiblePaths = [
  path.join(__dirname, '../.env.local'),
  path.join(__dirname, '../.env'),
  '.env.local',
  '.env'
];

for (const envPath of possiblePaths) {
  console.log(`Trying to load: ${envPath}`);
  try {
    const result = dotenv.config({ path: envPath });
    if (result.parsed) {
      console.log(`✅ Successfully loaded: ${envPath}`);
      console.log('Environment variables found:', Object.keys(result.parsed));
      break;
    } else {
      console.log(`❌ Failed to load: ${envPath}`);
    }
  } catch (error) {
    console.log(`❌ Error loading ${envPath}:`, error.message);
  }
}

console.log('\nEnvironment variables:');
console.log('CUSTOMGPT_API_KEY:', process.env.CUSTOMGPT_API_KEY ? 'Present' : 'Missing');
console.log('CUSTOMGPT_PROJECT_ID:', process.env.CUSTOMGPT_PROJECT_ID || 'Missing');
console.log('CUSTOMGPT_API_URL:', process.env.CUSTOMGPT_API_URL || 'Missing'); 