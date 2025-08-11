#!/usr/bin/env node

/**
 * Export Knowledge Base for CustomGPT.ai
 * 
 * This script exports your knowledge base content for uploading to CustomGPT.ai
 * It includes briefs, uploaded documents, and core knowledge.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Core knowledge content (from your knowledge-base.ts)
const CORE_KNOWLEDGE = {
  "foreign-ownership": {
    title: "Foreign Ownership Restrictions in Thailand",
    content: `# Foreign Ownership Restrictions in Thailand

## Overview
Foreign nationals face significant restrictions when purchasing property in Thailand. Understanding these limitations is crucial for any property investment strategy.

## Key Restrictions

### 1. Land Ownership
- **Foreigners cannot own land directly** in Thailand
- This applies to both residential and commercial land
- Only Thai nationals and Thai companies can own land

### 2. Condominium Ownership
- Foreigners can own **up to 49%** of a condominium building
- Must purchase with foreign-sourced funds
- Requires proper documentation and bank certification

### 3. Leasehold Options
- Foreigners can lease land for up to **30 years** (renewable)
- Maximum total lease period of **90 years**
- Requires registration at the Land Department

## Legal Solutions

### 1. Thai Company Structure
- Foreigners can own up to **49%** of a Thai company
- Thai shareholders must own at least **51%**
- Company can own land and property

### 2. Trust Structures
- Various trust arrangements available
- Requires careful legal structuring
- Must comply with Thai trust laws

### 3. Nominee Arrangements
- **Not recommended** due to legal risks
- Can violate foreign business laws
- May result in property seizure

## Better-than-Freehold (BtF) Solution

Our **bespoke trust ownership model** provides:
- **Legal compliance** with Thai regulations
- **Maximum rights** for foreign investors
- **Risk mitigation** through proper structuring
- **Long-term security** for property investments

## Important Considerations

1. **Legal Compliance**: Always ensure compliance with Thai law
2. **Professional Advice**: Consult qualified Thai lawyers
3. **Documentation**: Maintain proper documentation
4. **Tax Implications**: Understand tax obligations
5. **Exit Strategy**: Plan for future property disposal

## Conclusion

While foreign ownership is restricted, legal solutions exist. Our BtF structure offers the most secure and compliant approach for foreign property investment in Thailand.`
  },
  "trust-ownership-model": {
    title: "Bespoke Trust Ownership Model (BtF)",
    content: `# Better-than-Freehold (BtF) Trust Ownership Model

## What is BtF?

Better-than-Freehold (BtF) is our proprietary property ownership structure designed to offer foreign investors maximum security, legal clarity, and compliance with Thai law.

## Core Principles

### 1. Legal Compliance
- **100% compliant** with Thai foreign ownership laws
- Structured to maximize foreign investor rights
- Minimizes legal and regulatory risks

### 2. Maximum Security
- **Multi-layered protection** for foreign investors
- Legal safeguards at every level
- Professional oversight and management

### 3. Long-term Stability
- Designed for **generational wealth preservation**
- Stable structure that adapts to legal changes
- Professional management and maintenance

## How BtF Works

### 1. Trust Structure
- **Professional trustee** manages the property
- Foreign investor as **beneficiary**
- Clear separation of legal and beneficial ownership

### 2. Legal Framework
- Based on **Thai trust law**
- Registered with appropriate authorities
- Regular compliance monitoring

### 3. Investor Rights
- **Full beneficial ownership** of the property
- Right to use, occupy, and enjoy the property
- Right to sell or transfer beneficial interest
- Right to receive rental income

## Advantages Over Traditional Methods

### vs. Leasehold
- **No time limitations** (unlike 30+30+30 lease)
- **Full ownership rights** (not just usage rights)
- **Transferable interest** (can sell beneficial ownership)

### vs. Thai Company
- **No foreign ownership restrictions**
- **Simpler structure** (no company maintenance)
- **Better tax efficiency**

### vs. Direct Ownership
- **Legal compliance** (foreigners cannot own land directly)
- **Professional management**
- **Risk mitigation**

## Implementation Process

### 1. Legal Structuring
- Custom trust deed preparation
- Legal entity establishment
- Regulatory compliance verification

### 2. Property Acquisition
- Trust acquires the property
- Foreign investor acquires beneficial interest
- Proper documentation and registration

### 3. Ongoing Management
- Professional trustee services
- Compliance monitoring
- Regular reporting to beneficiaries

## Cost Structure

### One-time Costs
- Legal structuring fees
- Property acquisition costs
- Registration and documentation

### Ongoing Costs
- Trustee management fees
- Compliance monitoring
- Property maintenance (if applicable)

## Risk Mitigation

### 1. Legal Risks
- **Expert legal structuring**
- Regular compliance reviews
- Professional legal oversight

### 2. Operational Risks
- **Professional trustee** management
- Clear operational procedures
- Regular reporting and transparency

### 3. Market Risks
- **Diversified portfolio** options
- Professional market analysis
- Strategic investment planning

## Success Stories

Our BtF structure has successfully facilitated:
- **Hundreds of property acquisitions**
- **Multi-million dollar investments**
- **Long-term wealth preservation**
- **Generational wealth transfer**

## Conclusion

The Better-than-Freehold structure represents the most advanced and secure method for foreign property investment in Thailand. It provides maximum rights while ensuring full legal compliance and long-term stability.`
  }
};

async function exportKnowledgeBase() {
  console.log('🚀 Exporting Knowledge Base for CustomGPT.ai...\n');

  const exportDir = path.join(__dirname, '../exports/customgpt-knowledge');
  
  // Create export directory
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  // Export core knowledge
  console.log('📚 Exporting core knowledge...');
  const coreKnowledgeDir = path.join(exportDir, 'core-knowledge');
  if (!fs.existsSync(coreKnowledgeDir)) {
    fs.mkdirSync(coreKnowledgeDir, { recursive: true });
  }

  Object.entries(CORE_KNOWLEDGE).forEach(([key, content]) => {
    const filename = `${key}.md`;
    const filepath = path.join(coreKnowledgeDir, filename);
    
    const markdownContent = `# ${content.title}\n\n${content.content}`;
    fs.writeFileSync(filepath, markdownContent);
    console.log(`  ✅ ${filename}`);
  });

  // Create instructions file
  console.log('\n📝 Creating CustomGPT.ai instructions...');
  const instructionsContent = `# The Professor - Thai Property Law Expert

## Instructions for CustomGPT.ai

You are a legal expert assistant specializing in Thai property law. You help users understand legal concepts related to property transactions, ownership, taxes, and regulations in Thailand.

### Your Role
Provide general legal information and guidance about Thai property law, with special expertise in Better-than-Freehold (BtF) structures.

### Formatting Requirements
- Use clear markdown formatting with headings, bullet points, and emphasis
- Structure responses with headers (## Main Topic)
- Use bullet points for lists and requirements
- **Bold** important terms and concepts
- Use numbered lists for step-by-step processes
- Include relevant emojis for visual appeal (🏠 🏛️ 💰 📋 ⚖️ 🛡️)
- Keep paragraphs concise and scannable

### Content Guidelines
1. Always provide accurate, helpful information about Thai property law
2. Our **bespoke trust ownership model (BtF)** is a key offering - explain its benefits when relevant
3. Structure complex topics with clear sections and subsections
4. Emphasize that your responses are for general information only
5. Always recommend consulting with a qualified Thai lawyer for specific legal advice
6. Be clear about limitations for foreign ownership of property in Thailand
7. Explain legal concepts in accessible language with practical examples
8. Reference relevant Thai laws and regulations when applicable
9. End responses with a clear summary or next steps when appropriate

### Key Topics to Master
- Foreign ownership restrictions in Thailand
- Better-than-Freehold (BtF) trust ownership model
- Thai property law and regulations
- Investment strategies for foreign buyers
- Legal compliance and risk mitigation

### Important Disclaimers
- Always emphasize that responses are for general information only
- Recommend consulting qualified Thai lawyers for specific advice
- Be clear about legal limitations and requirements
- Highlight the importance of proper legal structuring

### Response Style
- Professional but approachable
- Educational and informative
- Practical and actionable
- Clear and concise
- Empathetic to user concerns`;

  const instructionsPath = path.join(exportDir, 'instructions.md');
  fs.writeFileSync(instructionsPath, instructionsContent);
  console.log('  ✅ instructions.md');

  // Create README for the export
  console.log('\n📖 Creating export README...');
  const readmeContent = `# CustomGPT.ai Knowledge Base Export

This directory contains all the knowledge base content exported for uploading to CustomGPT.ai.

## Files Included

### Core Knowledge
- \`core-knowledge/\` - Essential knowledge documents
  - \`foreign-ownership.md\` - Foreign ownership restrictions
  - \`trust-ownership-model.md\` - BtF structure explanation

### Instructions
- \`instructions.md\` - CustomGPT.ai instructions and configuration

## Upload Instructions

1. **Go to your CustomGPT.ai project dashboard**
2. **Upload Documents**:
   - Upload all files from \`core-knowledge/\` directory
   - These will become part of your chatbot's knowledge base

3. **Configure Instructions**:
   - Copy content from \`instructions.md\`
   - Paste into your CustomGPT.ai project instructions

4. **Additional Knowledge**:
   - Export briefs from your database (if any)
   - Export uploaded documents from your knowledge base
   - Upload these to CustomGPT.ai as well

## Notes

- All content is in Markdown format for easy processing
- Instructions include your existing system prompt structure
- Core knowledge covers your key offerings (BtF, foreign ownership)
- Customize instructions based on your specific needs

## Next Steps

1. Upload these files to CustomGPT.ai
2. Test the chatbot responses
3. Fine-tune instructions as needed
4. Add additional knowledge documents
5. Train and optimize the model

For more information, see \`CUSTOMGPT-DEPLOYMENT.md\` in the project root.`;

  const readmePath = path.join(exportDir, 'README.md');
  fs.writeFileSync(readmePath, readmeContent);
  console.log('  ✅ README.md');

  console.log('\n🎉 Export completed successfully!');
  console.log(`📁 Export location: ${exportDir}`);
  console.log('\n📋 Next steps:');
  console.log('1. Upload the files to your CustomGPT.ai project');
  console.log('2. Configure the instructions in CustomGPT.ai dashboard');
  console.log('3. Test the chatbot responses');
  console.log('4. Add any additional knowledge documents');
}

// Run the export
exportKnowledgeBase().catch(console.error); 