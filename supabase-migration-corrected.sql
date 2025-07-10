-- Corrected Supabase Migration Script for Legal Briefs App
-- This migration aligns with the Prisma schema
-- Run this in Supabase SQL Editor to set up your production database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create enum types
CREATE TYPE "UserRole" AS ENUM ('BUYER', 'ACCOUNTANT', 'LAWYER', 'EXISTING_PROPERTY_OWNER');
CREATE TYPE "DocumentType" AS ENUM ('PDF', 'TEXT', 'MANUAL');

-- Create users table (matches Prisma @@map("users"))
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create briefs table (matches Prisma @@map("briefs"))
CREATE TABLE "briefs" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "targetRoles" "UserRole"[] NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create knowledge_documents table (matches Prisma @@map("knowledge_documents"))
CREATE TABLE "knowledge_documents" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT[] NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "filePath" TEXT,
    "embedding" REAL[],
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create contact_submissions table (matches Prisma @@map("contact_submissions"))
CREATE TABLE "contact_submissions" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "briefs_slug_idx" ON "briefs"("slug");
CREATE INDEX "briefs_isPublished_idx" ON "briefs"("isPublished");
CREATE INDEX "briefs_targetRoles_idx" ON "briefs" USING GIN("targetRoles");
CREATE INDEX "knowledge_documents_category_idx" ON "knowledge_documents"("category");
CREATE INDEX "knowledge_documents_tags_idx" ON "knowledge_documents" USING GIN("tags");
CREATE INDEX "knowledge_documents_userId_idx" ON "knowledge_documents"("userId");
CREATE INDEX "contact_submissions_createdAt_idx" ON "contact_submissions"("createdAt");

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON "users" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_briefs_updated_at 
    BEFORE UPDATE ON "briefs" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_documents_updated_at 
    BEFORE UPDATE ON "knowledge_documents" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample legal briefs
INSERT INTO "briefs" ("id", "title", "slug", "content", "description", "targetRoles", "isPublished") VALUES 
(
  'brief-foreign-ownership',
  'Foreign Property Ownership Guide for Buyers',
  'foreign-property-ownership-guide',
  '# Foreign Property Ownership in Thailand: A Comprehensive Guide for International Buyers

## Executive Summary

Thailand presents unique opportunities for foreign property investment, but navigating the legal landscape requires careful planning and expert guidance. This comprehensive guide outlines the key restrictions, opportunities, and strategies for foreign nationals seeking to acquire property in Thailand.

## Legal Framework for Foreign Ownership

### Land Ownership Restrictions

Foreign nationals face strict limitations when it comes to land ownership in Thailand:

- **Direct Ownership**: Foreign individuals cannot directly own land in Thailand
- **Company Structure**: Foreign ownership in Thai limited companies holding land is capped at 49%
- **Nominee Arrangements**: Strictly regulated and potentially risky arrangements where Thai nationals hold land on behalf of foreigners

### Condominium Ownership Opportunities

Foreigners can own condominium units under specific conditions:

- **Ownership Limit**: Up to 49% of the total floor area in any condominium project can be foreign-owned
- **Foreign Exchange Requirements**: Funds must be transferred from abroad with proper documentation
- **Currency Documentation**: Foreign Exchange Transaction Form (FETF) required for transactions over 50,000 USD

### Alternative Ownership Structures

#### 1. Long-term Leases
- **Lease Period**: Initial terms up to 30 years with renewal options
- **Registration**: Must be registered with the Land Department for periods over 3 years
- **Renewal Rights**: Can include provisions for 30-year renewals

#### 2. Usufruct Rights
- **Duration**: Lifetime rights or up to 30 years
- **Scope**: Rights to use and derive income from the property
- **Inheritance**: Limited inheritance rights for foreign holders

#### 3. Company Ownership Structure
- **Thai Majority**: Requires 51% Thai ownership
- **Business Purpose**: Must demonstrate legitimate business activities
- **Compliance**: Regular reporting and compliance requirements

## Due Diligence Requirements

### Title Investigation
- **Title Deed Verification**: Confirm clear and marketable title
- **Encumbrance Check**: Verify no outstanding liens or mortgages
- **Boundary Survey**: Confirm property boundaries and access rights

### Legal Compliance
- **Zoning Verification**: Ensure intended use complies with local zoning
- **Building Permits**: Verify all construction has proper permits
- **Environmental Clearance**: Check for environmental restrictions or requirements

### Financial Verification
- **Source of Funds**: Document legitimate source of purchase funds
- **Currency Exchange**: Proper documentation for foreign currency transfers
- **Tax Obligations**: Understand transfer taxes and ongoing tax liabilities

## Risk Management Strategies

### Legal Protection Measures
- **Professional Legal Counsel**: Engage qualified Thai legal professionals
- **Insurance Coverage**: Consider title insurance and property insurance
- **Documentation Review**: Thorough review of all legal documents

### Financial Risk Mitigation
- **Escrow Services**: Use qualified escrow services for fund transfers
- **Currency Hedging**: Consider hedging strategies for currency risk
- **Exit Strategy Planning**: Plan for potential future sale or transfer

## Recommended Action Steps

1. **Initial Consultation**: Engage qualified Thai legal counsel
2. **Property Identification**: Work with licensed real estate professionals
3. **Due Diligence**: Conduct comprehensive property and legal review
4. **Structure Selection**: Choose optimal ownership structure for your situation
5. **Documentation Preparation**: Prepare all required legal and financial documents
6. **Transaction Execution**: Complete purchase through proper legal channels

## Important Disclaimers

This information is provided for general guidance only and should not be considered as legal advice. Thai property law is complex and subject to change. Always consult with qualified Thai legal professionals before making any property investment decisions.

For specific guidance on your property acquisition strategy, please contact our legal team for a personalized consultation.',
  'Complete guide for foreign nationals looking to purchase property in Thailand, covering legal restrictions, ownership structures, and due diligence requirements.',
  ARRAY['BUYER']::"UserRole"[],
  true
),
(
  'brief-tax-implications',
  'Tax Implications of Property Investment',
  'tax-implications-property-investment',
  '# Tax Implications of Property Investment in Thailand

## Overview for Property Investors

Understanding the tax implications of property investment in Thailand is crucial for both foreign and domestic investors. This guide covers the key tax considerations, obligations, and planning strategies.

## Transfer Taxes and Acquisition Costs

### Transfer Tax (Specific Business Tax)
- **Rate**: 3.3% of assessed value
- **Applicability**: Properties held for less than 5 years
- **Exemptions**: Owner-occupied homes may qualify for reduced rates

### Stamp Duty
- **Rate**: 0.5% of assessed value
- **When Applied**: Alternative to transfer tax for properties held over 5 years
- **Documentation**: Required for all property transfers

### Registration Fees
- **Land Office Fee**: 2% of assessed value
- **Processing**: Required for all property transfers
- **Documentation**: Title deed registration

## Ongoing Tax Obligations

### Property Tax
- **Residential**: 0.02% to 0.1% of assessed value annually
- **Commercial**: 0.3% to 0.7% of assessed value annually
- **Assessment**: Based on local government valuations

### Rental Income Tax
- **Individual Rates**: 5% to 35% progressive rates
- **Corporate Rates**: 20% flat rate
- **Withholding**: 5% withholding on rental payments to non-residents

### Capital Gains Treatment
- **Classification**: Treated as ordinary income
- **Rates**: Subject to normal income tax rates
- **Exemptions**: Limited exemptions for primary residences

## Tax Planning Strategies

### Holding Period Optimization
- **5-Year Rule**: Hold property for over 5 years to qualify for stamp duty instead of transfer tax
- **Timing**: Strategic timing of sales for optimal tax treatment

### Depreciation Benefits
- **Building Depreciation**: 5% per year for income-producing properties
- **Improvements**: Various depreciation rates for different improvements
- **Land**: Not depreciable

### Deductible Expenses
- **Maintenance**: Repairs and maintenance costs
- **Management**: Property management fees
- **Insurance**: Property insurance premiums
- **Interest**: Mortgage interest payments
- **Professional Fees**: Legal and accounting fees

## International Tax Considerations

### Double Taxation Treaties
- **Treaty Benefits**: Reduced withholding rates for treaty countries
- **Residence Determination**: Important for treaty eligibility
- **Documentation**: Required certificates of residence

### Foreign Tax Credits
- **Credit Availability**: For taxes paid in Thailand
- **Home Country**: Offset against home country tax obligations
- **Documentation**: Maintain Thai tax payment records

## Compliance Requirements

### Filing Obligations
- **Annual Returns**: Required for rental income
- **Quarterly Payments**: Estimated tax payments may be required
- **Withholding Reports**: Monthly withholding tax reports

### Record Keeping
- **Duration**: Maintain records for 5 years minimum
- **Documentation**: All income and expense records
- **Receipts**: Original receipts for all claimed deductions

## Common Tax Mistakes to Avoid

1. **Inadequate Record Keeping**: Poor documentation of expenses
2. **Missed Deductions**: Failing to claim legitimate expenses
3. **Timing Issues**: Poor timing of property sales
4. **Treaty Benefits**: Failing to claim available treaty benefits
5. **Withholding Tax**: Incorrect withholding tax calculations

## Professional Tax Planning

### When to Seek Professional Help
- **Complex Structures**: Multiple property ownership
- **International Issues**: Cross-border tax implications
- **Business Entities**: Corporate ownership structures
- **Large Transactions**: High-value property investments

### Choosing Tax Professionals
- **Qualifications**: Licensed Thai tax professionals
- **Experience**: Property tax specialization
- **International**: Cross-border tax expertise
- **References**: Proven track record with similar clients

## Conclusion

Property investment taxation in Thailand involves multiple taxes and complex compliance requirements. Proper tax planning can result in significant savings while ensuring full compliance with Thai tax laws.

This guide provides general information only. Specific tax advice should be obtained from qualified Thai tax professionals for your particular situation.',
  'Comprehensive overview of tax implications for property investors in Thailand, covering transfer taxes, ongoing obligations, and planning strategies.',
  ARRAY['BUYER', 'ACCOUNTANT']::"UserRole"[],
  true
),
(
  'brief-existing-owner-guide',
  'Property Management Guide for Existing Owners',
  'property-management-existing-owners',
  '# Property Management Guide for Existing Property Owners

## Introduction

This comprehensive guide is designed for existing property owners in Thailand who want to optimize their property management, understand their ongoing obligations, and maximize their investment returns.

## Legal Obligations for Property Owners

### Ongoing Compliance Requirements
- **Property Registration**: Maintain current property registration documents
- **Tax Obligations**: Meet all property tax filing and payment requirements
- **Insurance Requirements**: Maintain adequate property insurance coverage
- **Permits and Licenses**: Keep all permits and licenses current

### Property Maintenance Standards
- **Safety Compliance**: Ensure property meets safety standards
- **Building Codes**: Comply with local building and zoning codes
- **Environmental Regulations**: Meet environmental compliance requirements
- **Access Rights**: Maintain proper access rights and easements

## Property Management Options

### Self-Management
- **Direct Control**: Full control over property decisions
- **Cost Savings**: Avoid management fees
- **Time Investment**: Significant time commitment required
- **Local Knowledge**: Need local market knowledge

### Professional Management
- **Property Management Companies**: Full-service property management
- **Tenant Relations**: Professional tenant screening and relations
- **Maintenance Coordination**: Professional maintenance and repairs
- **Financial Management**: Rent collection and financial reporting

### Hybrid Approach
- **Selective Services**: Choose specific services to outsource
- **Cost Control**: Balance cost and control
- **Flexibility**: Adapt services to changing needs

## Rental Property Management

### Tenant Screening and Selection
- **Background Checks**: Verify tenant employment and references
- **Credit Assessment**: Evaluate tenant financial stability
- **Legal Compliance**: Ensure fair housing compliance
- **Documentation**: Maintain proper tenant documentation

### Lease Management
- **Lease Agreements**: Comprehensive lease documentation
- **Rent Collection**: Systematic rent collection procedures
- **Lease Renewals**: Strategic lease renewal negotiations
- **Termination Procedures**: Proper lease termination processes

### Maintenance and Repairs
- **Preventive Maintenance**: Regular maintenance schedules
- **Emergency Repairs**: 24/7 emergency response procedures
- **Vendor Management**: Reliable contractor relationships
- **Cost Control**: Maintenance budget management

## Financial Management

### Income Optimization
- **Market Rent Analysis**: Regular market rent reviews
- **Rent Increases**: Strategic rent increase timing
- **Vacancy Minimization**: Reduce vacancy periods
- **Additional Income**: Explore additional income sources

### Expense Management
- **Operating Expenses**: Control ongoing operating costs
- **Maintenance Costs**: Efficient maintenance cost management
- **Tax Optimization**: Maximize tax deductions
- **Insurance Coverage**: Optimal insurance coverage

### Financial Reporting
- **Monthly Reports**: Regular financial performance reports
- **Annual Summaries**: Comprehensive annual financial summaries
- **Tax Preparation**: Organized records for tax preparation
- **ROI Analysis**: Return on investment analysis

## Legal and Regulatory Compliance

### Property Tax Compliance
- **Annual Assessments**: Understand property tax assessments
- **Payment Schedules**: Meet all payment deadlines
- **Appeal Processes**: Property tax assessment appeals
- **Exemptions**: Identify available tax exemptions

### Zoning and Land Use
- **Zoning Compliance**: Ensure current use complies with zoning
- **Use Restrictions**: Understand property use limitations
- **Development Rights**: Evaluate development potential
- **Variance Procedures**: Zoning variance applications

### Environmental Compliance
- **Environmental Assessments**: Regular environmental reviews
- **Contamination Issues**: Address environmental contamination
- **Compliance Monitoring**: Ongoing environmental compliance
- **Remediation**: Environmental cleanup procedures

## Property Enhancement and Value Addition

### Strategic Improvements
- **Market Analysis**: Analyze improvement ROI potential
- **Tenant Preferences**: Understand tenant preferences
- **Cost-Benefit Analysis**: Evaluate improvement costs vs. benefits
- **Financing Options**: Consider improvement financing

### Renovation and Upgrades
- **Permit Requirements**: Obtain required renovation permits
- **Contractor Selection**: Choose qualified contractors
- **Project Management**: Effective renovation project management
- **Quality Control**: Ensure quality workmanship

### Technology Integration
- **Smart Home Features**: Consider smart home technology
- **Security Systems**: Modern security system installation
- **Energy Efficiency**: Energy-efficient improvements
- **Communication Systems**: Modern communication infrastructure

## Exit Strategy Planning

### Sale Preparation
- **Market Timing**: Optimal timing for property sale
- **Property Presentation**: Prepare property for sale
- **Professional Services**: Engage qualified professionals
- **Documentation**: Organize all property documentation

### Valuation and Pricing
- **Market Analysis**: Comprehensive market value analysis
- **Comparable Sales**: Analysis of comparable property sales
- **Professional Appraisal**: Consider professional appraisal services
- **Pricing Strategy**: Strategic pricing approach

### Transaction Management
- **Marketing Strategy**: Effective property marketing
- **Negotiation**: Professional negotiation representation
- **Due Diligence**: Facilitate buyer due diligence
- **Closing Process**: Smooth transaction closing

## Common Challenges and Solutions

### Tenant Issues
- **Problem Tenants**: Dealing with problematic tenants
- **Rent Collection**: Addressing rent collection issues
- **Property Damage**: Handling tenant-caused damage
- **Lease Violations**: Enforcing lease terms

### Maintenance Challenges
- **Emergency Repairs**: Managing emergency repair situations
- **Contractor Issues**: Dealing with unreliable contractors
- **Cost Overruns**: Managing maintenance cost overruns
- **Quality Issues**: Ensuring maintenance quality

### Market Conditions
- **Economic Downturns**: Managing during economic challenges
- **Market Volatility**: Adapting to market changes
- **Competition**: Competing with other properties
- **Regulatory Changes**: Adapting to regulatory changes

## Professional Resources

### Property Management Services
- **Full-Service Management**: Comprehensive property management
- **Specialized Services**: Specific property management services
- **Technology Platforms**: Property management software
- **Professional Associations**: Industry professional associations

### Legal and Financial Services
- **Legal Counsel**: Qualified property law attorneys
- **Tax Professionals**: Property tax specialists
- **Financial Advisors**: Investment and financial planning
- **Insurance Professionals**: Property insurance specialists

### Maintenance and Construction
- **General Contractors**: Reliable general contractors
- **Specialized Trades**: Electrical, plumbing, HVAC specialists
- **Landscaping**: Professional landscaping services
- **Security Services**: Property security services

## Conclusion

Successful property ownership requires ongoing attention to legal compliance, financial management, and strategic planning. Professional property management services can provide valuable support while allowing owners to focus on their core business activities.

This guide provides general information for property owners. Specific advice should be obtained from qualified professionals for your particular situation.',
  'Comprehensive property management guide for existing owners, covering legal obligations, management options, and optimization strategies.',
  ARRAY['EXISTING_PROPERTY_OWNER']::"UserRole"[],
  true
);

-- Insert sample admin user (password should be hashed in production)
INSERT INTO "users" ("id", "email", "password", "name", "role", "isAdmin") VALUES 
(
  'admin-user-001',
  'admin@legal-site.com',
  '$2a$12$placeholder.hash.here',
  'Admin User',
  'LAWYER',
  true
); 