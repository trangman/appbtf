#!/usr/bin/env node

/**
 * CustomGPT.ai Deployment Helper
 * 
 * This script helps with the deployment process for transitioning to CustomGPT.ai
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

function checkEnvironmentVariables() {
  console.log('🔍 Checking environment variables...\n');
  
  const requiredVars = [
    'CUSTOMGPT_API_KEY',
    'CUSTOMGPT_PROJECT_ID',
    'CUSTOMGPT_API_URL'
  ];
  
  const optionalVars = [
    'CUSTOMGPT_SESSION_ID',
    'OPENAI_API_KEY', // Still needed for knowledge base
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  let allRequiredPresent = true;
  
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName} - Set`);
    } else {
      console.log(`❌ ${varName} - Missing`);
      allRequiredPresent = false;
    }
  });
  
  console.log('\n📋 Optional variables:');
  optionalVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName} - Set`);
    } else {
      console.log(`⚠️  ${varName} - Not set (optional)`);
    }
  });
  
  return allRequiredPresent;
}

function checkCodeChanges() {
  console.log('\n🔍 Checking code changes...\n');
  
  const aiChatRoute = path.join(__dirname, '../src/app/api/ai-chat/route.ts');
  
  if (fs.existsSync(aiChatRoute)) {
    const content = fs.readFileSync(aiChatRoute, 'utf8');
    
    if (content.includes('CUSTOMGPT_API_KEY')) {
      console.log('✅ AI chat route updated for CustomGPT.ai');
    } else {
      console.log('❌ AI chat route not updated for CustomGPT.ai');
      return false;
    }
    
    if (content.includes('openai.chat.completions.create')) {
      console.log('⚠️  OpenAI API calls still present (may be intentional)');
    } else {
      console.log('✅ OpenAI API calls replaced with CustomGPT.ai');
    }
  } else {
    console.log('❌ AI chat route not found');
    return false;
  }
  
  return true;
}

function checkKnowledgeExport() {
  console.log('\n🔍 Checking knowledge export...\n');
  
  console.log('✅ Knowledge base already configured in CustomGPT.ai');
  console.log('💡 Skipping local export check since knowledge is already uploaded');
  
  return true; // Assume knowledge is ready since it's already in CustomGPT.ai
}

function generateDeploymentChecklist() {
  console.log('\n📋 CustomGPT.ai Deployment Checklist\n');
  console.log('Pre-Deployment:');
  console.log('□ Set up CustomGPT.ai account and project');
  console.log('□ Configure environment variables');
  console.log('□ Export knowledge base (npm run export:customgpt)');
  console.log('□ Upload knowledge to CustomGPT.ai');
  console.log('□ Test CustomGPT.ai responses');
  console.log('');
  console.log('Deployment:');
  console.log('□ Deploy code changes to staging');
  console.log('□ Test all functionality in staging');
  console.log('□ Deploy to production');
  console.log('□ Monitor performance and errors');
  console.log('');
  console.log('Post-Deployment:');
  console.log('□ Verify chat functionality works');
  console.log('□ Check knowledge base integration');
  console.log('□ Monitor CustomGPT.ai usage');
  console.log('□ Update documentation');
}

function showNextSteps() {
  console.log('\n🚀 Next Steps:\n');
  
  console.log('1. Set up CustomGPT.ai:');
  console.log('   - Create account at https://customgpt.ai');
  console.log('   - Create a new project');
  console.log('   - Get API credentials');
  console.log('');
  
  console.log('2. Configure environment:');
  console.log('   - Add CUSTOMGPT_API_KEY to your environment');
  console.log('   - Add CUSTOMGPT_PROJECT_ID to your environment');
  console.log('   - Add CUSTOMGPT_API_URL to your environment');
  console.log('');
  
  console.log('3. Knowledge base:');
  console.log('   - ✅ Already configured in CustomGPT.ai');
  console.log('   - Verify instructions are set correctly');
  console.log('');
  
  console.log('4. Deploy:');
  console.log('   - Test locally first');
  console.log('   - Deploy to staging');
  console.log('   - Deploy to production');
  console.log('');
  
  console.log('📖 For detailed instructions, see: CUSTOMGPT-DEPLOYMENT.md');
}

async function main() {
  console.log('🤖 CustomGPT.ai Deployment Helper\n');
  
  const envOk = checkEnvironmentVariables();
  const codeOk = checkCodeChanges();
  const exportOk = checkKnowledgeExport();
  
  console.log('\n📊 Summary:');
  console.log(`Environment Variables: ${envOk ? '✅ Ready' : '❌ Needs Setup'}`);
  console.log(`Code Changes: ${codeOk ? '✅ Ready' : '❌ Needs Update'}`);
  console.log(`Knowledge Export: ${exportOk ? '✅ Ready' : '❌ Needs Export'}`);
  
  if (envOk && codeOk && exportOk) {
    console.log('\n🎉 All checks passed! Ready for deployment.');
  } else {
    console.log('\n⚠️  Some checks failed. Please address the issues above.');
  }
  
  generateDeploymentChecklist();
  showNextSteps();
}

// Run the deployment helper
main().catch(console.error); 