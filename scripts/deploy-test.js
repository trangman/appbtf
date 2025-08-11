import { execSync } from 'child_process';

console.log('🚀 Deploying to production to test CustomGPT.ai integration...\n');

try {
  // Check if we're in the right directory
  console.log('📁 Current directory:', process.cwd());
  
  // Build the project
  console.log('🔨 Building project...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Deploy to Netlify
  console.log('🌐 Deploying to Netlify...');
  execSync('npx netlify deploy --prod', { stdio: 'inherit' });
  
  console.log('\n✅ Deployment complete!');
  console.log('🔗 Test the AI assistant on the production site');
  console.log('💡 If it works on production but not locally, it confirms a network/firewall issue');
  
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
} 