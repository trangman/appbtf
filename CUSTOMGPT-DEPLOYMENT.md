# CustomGPT.ai Deployment Guide

This guide explains how to replace your existing "Professor" AI assistant with a CustomGPT.ai chatbot while maintaining all current functionality.

## Overview

Your current AI assistant has these key features that we'll preserve:
- ✅ Role-based responses (BUYER, LAWYER, ACCOUNTANT, etc.)
- ✅ Knowledge base integration (semantic search)
- ✅ File upload capability (PDF, DOCX, TXT)
- ✅ Chat history storage
- ✅ Dynamic system prompts
- ✅ Admin interface for prompt management

## Step 1: Set Up CustomGPT.ai

### 1.1 Create CustomGPT.ai Account
1. Go to [CustomGPT.ai](https://customgpt.ai)
2. Sign up for an account
3. Choose a plan that fits your needs

### 1.2 Create Your CustomGPT Project
1. Create a new project in CustomGPT.ai
2. Configure your chatbot with:
   - **Name**: "The Professor - Thai Property Law Expert"
   - **Description**: "AI assistant specializing in Thai property law and Better-than-Freehold structures"
   - **Instructions**: Use the system prompt from your existing AI prompts

### 1.3 Get API Credentials
1. Go to your CustomGPT.ai dashboard
2. Navigate to API settings
3. Copy your:
   - **API Key**
   - **Project ID**
   - **API URL** (usually `https://api.customgpt.ai/v1`)

## Step 2: Environment Configuration

### 2.1 Update Environment Variables

Add these environment variables to your deployment platform (Netlify, Vercel, etc.):

```bash
# CustomGPT.ai Configuration
CUSTOMGPT_API_KEY=your_customgpt_api_key_here
CUSTOMGPT_PROJECT_ID=your_project_id_here
CUSTOMGPT_API_URL=https://api.customgpt.ai/v1
CUSTOMGPT_SESSION_ID=optional_session_id_for_consistency

# Keep existing variables
OPENAI_API_KEY=your_openai_key_for_knowledge_base
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
# ... other existing variables
```

### 2.2 Local Development Setup

For local development, add these to your `.env.local` file:

```bash
CUSTOMGPT_API_KEY=your_customgpt_api_key_here
CUSTOMGPT_PROJECT_ID=your_project_id_here
CUSTOMGPT_API_URL=https://api.customgpt.ai/v1
```

## Step 3: Code Changes

### 3.1 AI Chat Route (Already Updated)

The main AI chat route (`src/app/api/ai-chat/route.ts`) has been updated to:
- Replace OpenAI API calls with CustomGPT.ai API
- Maintain role-based prompt system
- Preserve knowledge base integration
- Keep file upload functionality
- Maintain chat logging

### 3.2 Frontend Changes (None Required)

The frontend (`src/app/dashboard/ai-assistant/page.tsx`) remains unchanged because:
- The API interface stays the same
- Response format is compatible
- All existing features continue to work

## Step 4: CustomGPT.ai Training

### 4.1 Knowledge Base (Already Set Up)

✅ **Your knowledge base is already configured in CustomGPT.ai**

If you need to add additional knowledge later:
- Export briefs from your database
- Export uploaded documents from your knowledge base
- Upload these to CustomGPT.ai as needed

### 4.2 Configure Instructions

Use your existing system prompts as CustomGPT.ai instructions:

```markdown
You are a legal expert assistant specializing in Thai property law. You help users understand legal concepts related to property transactions, ownership, taxes, and regulations in Thailand.

Your role: Provide general legal information and guidance about Thai property law.

FORMATTING REQUIREMENTS:
- Use clear markdown formatting with headings, bullet points, and emphasis
- Structure responses with headers (## Main Topic)
- Use bullet points for lists and requirements
- **Bold** important terms and concepts
- Use numbered lists for step-by-step processes
- Include relevant emojis for visual appeal (🏠 🏛️ 💰 📋 ⚖️ 🛡️)
- Keep paragraphs concise and scannable

CONTENT GUIDELINES:
1. Always provide accurate, helpful information about Thai property law
2. Our **bespoke trust ownership model** is a key offering - explain its benefits when relevant
3. Structure complex topics with clear sections and subsections
4. Emphasize that your responses are for general information only
5. Always recommend consulting with a qualified Thai lawyer for specific legal advice
6. Be clear about limitations for foreign ownership of property in Thailand
7. Explain legal concepts in accessible language with practical examples
8. Reference relevant Thai laws and regulations when applicable
9. End responses with a clear summary or next steps when appropriate
```

## Step 5: Testing

### 5.1 Local Testing
```bash
npm run dev
```

Test the AI assistant with:
- Different user roles
- File uploads
- Knowledge base queries
- Chat history

### 5.2 Production Testing
1. Deploy to your staging environment
2. Test all functionality
3. Verify CustomGPT.ai responses
4. Check error handling

## Step 6: Deployment

### 6.1 Netlify Deployment
Your existing `netlify.toml` configuration remains the same. Deploy using:

```bash
# If using Netlify CLI
netlify deploy --prod

# Or push to your connected Git repository
git push origin main
```

### 6.2 Environment Variables
Ensure all CustomGPT.ai environment variables are set in your Netlify dashboard:
- Go to Site settings > Environment variables
- Add all required variables
- Redeploy if needed

## Step 7: Monitoring & Maintenance

### 7.1 CustomGPT.ai Analytics
- Monitor usage in CustomGPT.ai dashboard
- Track conversation quality
- Review user feedback

### 7.2 Application Monitoring
- Monitor API response times
- Check error rates
- Review chat logs

### 7.3 Knowledge Base Updates
- Regularly update CustomGPT.ai with new documents
- Retrain the model as needed
- Update system prompts through your admin interface

## Benefits of CustomGPT.ai Integration

### ✅ Advantages
1. **No OpenAI API costs** for chat responses
2. **Better knowledge base integration** (native to CustomGPT.ai)
3. **Easier training and updates** through web interface
4. **Built-in conversation memory**
5. **Advanced analytics and insights**
6. **Custom branding and styling**

### ⚠️ Considerations
1. **CustomGPT.ai API costs** (check pricing)
2. **Dependency on CustomGPT.ai service**
3. **Different API response format** (handled in code)
4. **Training time** for optimal responses

## Troubleshooting

### Common Issues

1. **API Key Errors**
   - Verify `CUSTOMGPT_API_KEY` is correct
   - Check API key permissions in CustomGPT.ai dashboard

2. **Project ID Errors**
   - Ensure `CUSTOMGPT_PROJECT_ID` matches your project
   - Verify project is active and accessible

3. **Response Format Issues**
   - Check CustomGPT.ai response structure
   - Verify error handling in the API route

4. **Knowledge Base Not Working**
   - Ensure documents are uploaded to CustomGPT.ai
   - Check document processing status
   - Verify instructions include knowledge base references

### Support Resources
- [CustomGPT.ai Documentation](https://docs.customgpt.ai)
- [CustomGPT.ai API Reference](https://docs.customgpt.ai/api)
- Your existing application logs and monitoring

## Migration Checklist

- [ ] Set up CustomGPT.ai account and project
- [ ] Configure environment variables
- [ ] Update code (already done)
- [x] Upload knowledge base to CustomGPT.ai ✅ **COMPLETED**
- [ ] Test locally
- [ ] Deploy to staging
- [ ] Test in staging environment
- [ ] Deploy to production
- [ ] Monitor performance
- [ ] Update documentation

## Rollback Plan

If you need to rollback to the original OpenAI implementation:

1. **Code Rollback**: Revert `src/app/api/ai-chat/route.ts` to the original version
2. **Environment Variables**: Remove CustomGPT.ai variables, ensure OpenAI key is set
3. **Deploy**: Push the rollback changes
4. **Test**: Verify OpenAI integration works

The frontend will continue to work without changes since the API interface remains the same. 