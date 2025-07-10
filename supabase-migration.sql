-- Supabase Migration Script for Legal Briefs App
-- Run this in Supabase SQL Editor to set up your production database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for user roles
CREATE TYPE "UserRole" AS ENUM ('BUYER', 'ACCOUNTANT', 'LAWYER', 'EXISTING_PROPERTY_OWNER');

-- Create users table
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create briefs table
CREATE TABLE "Brief" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL UNIQUE,
    "content" TEXT NOT NULL,
    "description" TEXT,
    "targetRoles" "UserRole"[],
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create contact submissions table
CREATE TABLE "ContactSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "Brief_slug_idx" ON "Brief"("slug");
CREATE INDEX "Brief_isPublished_idx" ON "Brief"("isPublished");
CREATE INDEX "ContactSubmission_createdAt_idx" ON "ContactSubmission"("createdAt");

-- Insert sample legal briefs
INSERT INTO "Brief" ("id", "title", "slug", "content", "description", "targetRoles", "isPublished") VALUES 
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
  'brief-tax-obligations',
  'Thai Property Tax Guide for Accountants',
  'thai-property-tax-guide',
  '# Thai Property Tax Obligations: Comprehensive Guide for Tax Professionals

## Overview

Understanding Thai property tax obligations is crucial for both foreign and domestic property owners. This guide provides detailed information on transfer taxes, ongoing property taxes, and tax planning strategies for property investments in Thailand.

## Transfer Taxes and Fees

### Specific Business Tax (SBT)
- **Rate**: 3.3% of appraised value or declared value (whichever is higher)
- **Applicability**: Properties sold within 5 years of acquisition
- **Exemptions**: Owner-occupied residential properties (certain conditions apply)

### Transfer Fee
- **Rate**: 2% of appraised value or declared value (whichever is higher)
- **Paid by**: Generally split between buyer and seller
- **Calculation**: Based on Land Department appraised value

### Stamp Duty
- **Rate**: 0.5% of appraised value or declared value (whichever is higher)
- **Alternative**: Paid instead of SBT when property held for more than 5 years
- **Documentation**: Required for all property transfers

### Withholding Tax
- **Individual Sellers**: Progressive rates from 5% to 35%
- **Corporate Sellers**: 1% for companies
- **Calculation**: Based on appraised value or declared price
- **Credits**: Can be offset against annual income tax

## Ongoing Property Taxes

### House and Land Tax
- **Residential Rate**: 0.02% to 0.1% of appraised value annually
- **Commercial Rate**: 0.3% to 0.7% of appraised value annually
- **Assessment**: Based on local authority valuations
- **Payment**: Annual payment to local municipality

### Local Development Tax
- **Rate**: Varies by municipality (typically 0.3% to 0.7%)
- **Purpose**: Infrastructure and local development projects
- **Assessment**: Based on property value and location

## Income Tax Considerations

### Rental Income
- **Tax Rate**: Progressive rates from 5% to 35% for individuals
- **Corporate Rate**: 20% standard corporate tax rate
- **Deductions**: Maintenance, repairs, depreciation, and management fees
- **Withholding**: 5% withholding tax on rental payments to non-residents

### Capital Gains
- **Treatment**: Considered ordinary income for tax purposes
- **Rates**: Progressive individual rates or corporate rates apply
- **Exemptions**: Primary residence exemptions (specific conditions)
- **Foreign Owners**: Subject to withholding tax on sale proceeds

## Depreciation and Deductions

### Allowable Depreciation
- **Buildings**: 5% per year (20-year useful life)
- **Improvements**: Various rates depending on type
- **Land**: Not depreciable
- **Requirements**: Must be income-producing property

### Deductible Expenses
- **Property Management**: Management fees and professional services
- **Maintenance**: Ordinary repairs and maintenance costs
- **Insurance**: Property and liability insurance premiums
- **Interest**: Mortgage interest and financing costs
- **Legal and Professional**: Legal fees, accounting, and consultation costs

## Tax Planning Strategies

### Timing Considerations
- **Hold Period**: Consider 5-year SBT exemption threshold
- **Year-end Planning**: Timing of sales for optimal tax treatment
- **Rental Timing**: Strategic timing of rental income recognition

### Entity Structure Optimization
- **Company vs. Individual**: Evaluate optimal ownership structure
- **Multiple Entities**: Consider separate entities for different properties
- **International Structure**: Cross-border tax planning for foreign investors

### Expense Optimization
- **Depreciation Planning**: Maximize allowable depreciation deductions
- **Expense Timing**: Strategic timing of deductible expenses
- **Documentation**: Maintain detailed records for all deductions

## Compliance Requirements

### Filing Obligations
- **Annual Returns**: Required for all income-generating properties
- **Withholding Reports**: Monthly reports for rental withholding
- **Transfer Notifications**: Notify authorities of property transfers

### Documentation Requirements
- **Income Records**: Detailed rental income documentation
- **Expense Receipts**: Support for all claimed deductions
- **Depreciation Records**: Asset registers and depreciation calculations
- **Foreign Exchange**: Documentation for foreign currency transactions

### Audit Considerations
- **Record Keeping**: Maintain records for minimum 5 years
- **Supporting Documents**: Original receipts and contracts required
- **Professional Representation**: Consider professional representation for audits

## International Tax Treaties

### Double Taxation Avoidance
- **Treaty Benefits**: Reduced withholding rates for treaty countries
- **Residence Certification**: Required documentation for treaty benefits
- **Tie-breaker Rules**: Determination of tax residence for individuals and entities

### Transfer Pricing
- **Related Party Transactions**: Arm''s length principle applies
- **Documentation**: Transfer pricing documentation requirements
- **Penalties**: Significant penalties for non-compliance

## Recent Tax Changes and Updates

### Property Tax Reform
- **New Assessment Methods**: Updated property valuation methods
- **Rate Changes**: Recent adjustments to tax rates
- **Compliance Updates**: New filing and reporting requirements

## Recommendations for Tax Professionals

1. **Regular Review**: Conduct annual tax planning reviews for property owners
2. **Documentation Systems**: Implement robust record-keeping systems
3. **Professional Development**: Stay current with tax law changes
4. **Client Education**: Educate clients on ongoing compliance obligations
5. **Cross-border Coordination**: Coordinate with international tax advisors

## Conclusion

Thai property taxation involves multiple taxes and complex compliance requirements. Professional tax advice is essential for optimal tax planning and compliance. Regular review and planning can result in significant tax savings while ensuring full compliance with Thai tax obligations.

This guide provides general information only. Specific tax advice should be obtained from qualified Thai tax professionals.',
  'Detailed tax guide covering transfer taxes, ongoing obligations, and planning strategies for property investments in Thailand.',
  ARRAY['ACCOUNTANT']::"UserRole"[],
  true
),
(
  'brief-legal-procedures',
  'Property Transaction Procedures for Legal Professionals',
  'property-transaction-procedures',
  '# Thai Property Transaction Procedures: Legal Professional Guide

## Introduction

This comprehensive guide outlines the legal procedures and requirements for property transactions in Thailand, designed specifically for legal professionals handling real estate matters for clients, both domestic and foreign.

## Pre-Transaction Legal Analysis

### Client Qualification and Documentation
- **Foreign Buyer Verification**: Confirm passport, visa status, and legal capacity
- **Source of Funds**: Document legitimate source and currency exchange compliance
- **Ownership Structure Analysis**: Determine optimal legal structure for the transaction
- **Tax Residence Status**: Establish tax obligations and treaty benefits

### Property Legal Due Diligence
- **Title Investigation**: Comprehensive title search and verification
- **Encumbrance Analysis**: Review of mortgages, liens, and other encumbrances
- **Zoning and Land Use**: Verification of permitted uses and development rights
- **Environmental Assessment**: Review environmental restrictions and compliance

## Documentation Requirements

### For Foreign Purchasers
- **Passport and Visa**: Valid passport and appropriate visa documentation
- **Foreign Exchange Transaction Form (FETF)**: For transactions over 50,000 USD
- **Bank Certificates**: Confirming foreign currency transfer
- **Tax Clearance**: Home country tax compliance documentation
- **Power of Attorney**: If using authorized representatives

### For Property Transfer
- **Title Deed (Chanote)**: Original title documentation
- **House Registration (Tabien Baan)**: Property address registration
- **Building Permits**: All construction and renovation permits
- **Survey Documents**: Property boundary and survey certifications
- **Tax Payment Receipts**: Current property tax payment confirmation

## Legal Structure Options

### Direct Individual Ownership
- **Condominium Units**: Foreign quota compliance verification
- **Leasehold Rights**: Long-term lease documentation and registration
- **Usufruct Agreements**: Lifetime use rights documentation

### Corporate Structure Ownership
- **Company Formation**: Thai limited company establishment
- **Shareholding Structure**: 51% Thai, 49% foreign ownership compliance
- **Board Resolutions**: Authorization for property acquisition
- **Business Registration**: Legitimate business purpose documentation

### Trust and Nominee Structures
- **Legal Compliance**: Ensure compliance with anti-nominee regulations
- **Documentation**: Comprehensive trust or nominee agreements
- **Risk Assessment**: Full disclosure of legal risks to clients

## Transaction Execution Process

### Letter of Intent (LOI)
- **Terms Negotiation**: Price, conditions, and timeline agreement
- **Due Diligence Period**: Specified timeframe for legal and technical review
- **Deposit Terms**: Escrow arrangements and refund conditions
- **Legal Contingencies**: Professional legal review requirements

### Purchase Agreement Drafting
- **Comprehensive Terms**: All material terms and conditions
- **Contingency Clauses**: Financing, inspection, and approval contingencies
- **Default Provisions**: Clear remedies for breach of contract
- **Closing Procedures**: Detailed closing and transfer procedures

### Closing and Transfer
- **Final Documentation**: Preparation of all transfer documents
- **Tax Payments**: Calculation and payment of all transfer taxes
- **Registration Process**: Land Department registration procedures
- **Post-Closing**: Delivery of documents and completion certificates

## Regulatory Compliance

### Foreign Business Act Compliance
- **Land Ownership Restrictions**: Verification of compliance with foreign ownership limits
- **Business License Requirements**: Assessment of required business licenses
- **Reporting Obligations**: Ongoing reporting and compliance requirements

### Anti-Money Laundering (AML)
- **Customer Due Diligence**: Enhanced KYC procedures for high-value transactions
- **Source of Funds Verification**: Documentation of legitimate fund sources
- **Suspicious Transaction Reporting**: Obligation to report suspicious activities
- **Record Keeping**: Maintenance of transaction records for required periods

### Exchange Control Regulations
- **Foreign Exchange Compliance**: Bank of Thailand reporting requirements
- **Documentation Requirements**: Proper foreign exchange documentation
- **Repatriation Rights**: Ensuring ability to repatriate funds upon sale

## Risk Management and Professional Liability

### Legal Risk Assessment
- **Title Risk**: Comprehensive title insurance analysis
- **Regulatory Risk**: Assessment of regulatory compliance risks
- **Market Risk**: Disclosure of market and economic risks
- **Liquidity Risk**: Assessment of exit strategy viability

### Professional Liability Protection
- **Malpractice Insurance**: Adequate professional liability coverage
- **Documentation Standards**: Comprehensive file documentation
- **Client Communication**: Clear written communication of all risks and procedures
- **Continuing Education**: Stay current with legal developments and best practices

## Common Legal Issues and Pitfalls

### Title Defects
- **Boundary Disputes**: Resolution of property boundary issues
- **Undisclosed Encumbrances**: Discovery and resolution of hidden liens
- **Chain of Title**: Gaps or defects in ownership history
- **Forged Documents**: Detection and handling of fraudulent documentation

### Regulatory Non-Compliance
- **Foreign Ownership Violations**: Exceed permitted foreign ownership percentages
- **Zoning Violations**: Non-compliant property use or development
- **Tax Non-Compliance**: Unpaid taxes or penalties
- **Permit Violations**: Construction without proper permits

### Contract Disputes
- **Breach of Contract**: Handling of contractual breaches and remedies
- **Interpretation Issues**: Resolution of contractual ambiguities
- **Performance Disputes**: Non-performance of contractual obligations
- **Termination Rights**: Proper exercise of contract termination rights

## Best Practices for Legal Professionals

### Client Management
- **Clear Engagement Letters**: Comprehensive scope of representation
- **Regular Communication**: Frequent client updates and consultation
- **Expectation Management**: Clear explanation of processes and timelines
- **Cultural Sensitivity**: Understanding of cultural differences and expectations

### Transaction Management
- **Project Management**: Systematic approach to transaction management
- **Deadline Monitoring**: Careful tracking of all critical deadlines
- **Document Control**: Secure and organized document management systems
- **Quality Control**: Multiple review processes for all documentation

### Professional Development
- **Continuing Legal Education**: Regular updates on law changes
- **Professional Networks**: Maintain relationships with other professionals
- **Technology Integration**: Use of legal technology for efficiency
- **Market Knowledge**: Stay informed about real estate market trends

## Conclusion

Thai property transactions require careful legal analysis, comprehensive due diligence, and strict compliance with applicable laws and regulations. Legal professionals must maintain high standards of professional competence and client service while ensuring full regulatory compliance.

This guide provides general procedural information. Specific legal advice should be obtained for individual transactions and circumstances.',
  'Comprehensive procedural guide for legal professionals handling Thai property transactions, covering due diligence, compliance, and risk management.',
  ARRAY['LAWYER']::"UserRole"[],
  true
),
(
  'brief-property-management',
  'Property Management Guide for Existing Owners',
  'property-management-guide',
  '# Property Management in Thailand: A Guide for Existing Property Owners

## Introduction

As a property owner in Thailand, effective management of your real estate assets is crucial for maintaining value, ensuring compliance, and maximizing returns. This comprehensive guide addresses the key aspects of property management for existing property owners.

## Legal Compliance for Property Owners

### Ongoing Tax Obligations
- **Annual Property Tax**: House and land tax payment requirements
- **Rental Income Tax**: Income tax obligations for rental properties
- **Corporate Taxes**: For properties held through corporate structures
- **Value Added Tax**: VAT obligations for commercial properties

### Regulatory Compliance
- **Building Permits**: Ongoing compliance with building regulations
- **Safety Standards**: Fire safety and building safety requirements
- **Environmental Compliance**: Adherence to environmental regulations
- **Insurance Requirements**: Mandatory and recommended insurance coverage

### Foreign Ownership Compliance
- **Reporting Obligations**: Annual reporting for foreign-owned properties
- **Corporate Compliance**: For properties held through Thai companies
- **Lease Renewals**: Proper procedures for lease extensions
- **Ownership Transfer Rights**: Understanding transfer restrictions and procedures

## Property Maintenance and Improvement

### Preventive Maintenance
- **Regular Inspections**: Scheduled property condition assessments
- **Maintenance Schedules**: Systematic approach to property upkeep
- **Vendor Management**: Selection and management of maintenance contractors
- **Documentation**: Maintenance records and warranty management

### Capital Improvements
- **Planning and Permits**: Required approvals for significant improvements
- **Value Enhancement**: Strategic improvements to increase property value
- **Tax Implications**: Depreciation and tax treatment of improvements
- **Financing Options**: Funding sources for major renovations

### Emergency Procedures
- **Emergency Contacts**: Comprehensive emergency contact lists
- **Insurance Claims**: Procedures for filing and managing insurance claims
- **Temporary Repairs**: Authorization procedures for emergency repairs
- **Tenant Communication**: Emergency communication protocols

## Rental Property Management

### Tenant Selection and Screening
- **Application Process**: Comprehensive tenant application procedures
- **Background Checks**: Credit and reference verification
- **Legal Requirements**: Anti-discrimination compliance
- **Documentation**: Proper tenant file documentation

### Lease Administration
- **Lease Agreements**: Comprehensive lease documentation
- **Rent Collection**: Systematic rent collection procedures
- **Lease Renewals**: Renewal negotiation and documentation
- **Tenant Relations**: Ongoing tenant communication and support

### Legal Issues and Disputes
- **Eviction Procedures**: Legal procedures for tenant eviction
- **Dispute Resolution**: Mediation and arbitration options
- **Court Proceedings**: Litigation procedures and representation
- **Legal Compliance**: Landlord-tenant law compliance

## Financial Management

### Income Optimization
- **Market Rent Analysis**: Regular market rent reviews
- **Lease Negotiation**: Strategic lease term negotiations
- **Ancillary Income**: Additional revenue opportunities
- **Expense Management**: Cost control and optimization strategies

### Tax Planning and Compliance
- **Income Tax Planning**: Strategies for minimizing income tax liability
- **Deduction Optimization**: Maximizing allowable deductions
- **Depreciation Planning**: Optimal depreciation strategies
- **Professional Tax Advice**: Regular consultation with tax professionals

### Financial Reporting
- **Monthly Statements**: Regular financial performance reporting
- **Annual Budgets**: Comprehensive annual budget preparation
- **Capital Planning**: Long-term capital expenditure planning
- **Performance Analysis**: Regular financial performance analysis

## Property Disposal and Exit Strategies

### Sale Preparation
- **Market Analysis**: Comprehensive market valuation
- **Property Preparation**: Improvements to maximize sale value
- **Marketing Strategy**: Professional marketing and promotion
- **Legal Preparation**: Title clearance and documentation preparation

### Tax Implications of Sale
- **Capital Gains**: Tax treatment of property sale proceeds
- **Withholding Tax**: Obligations for foreign sellers
- **Tax Planning**: Strategies for minimizing tax liability
- **Professional Advice**: Tax and legal consultation for sales

### Transfer Procedures
- **Due Diligence**: Buyer qualification and financial verification
- **Contract Negotiation**: Sale agreement terms and conditions
- **Closing Process**: Transfer procedures and documentation
- **Post-Sale Obligations**: Ongoing obligations after sale completion

## Risk Management

### Insurance Coverage
- **Property Insurance**: Comprehensive property damage coverage
- **Liability Insurance**: Protection against third-party claims
- **Business Interruption**: Coverage for rental income loss
- **Umbrella Coverage**: Additional liability protection

### Legal Risk Management
- **Professional Liability**: Legal representation and advice
- **Contract Review**: Regular review and update of all contracts
- **Compliance Monitoring**: Ongoing regulatory compliance monitoring
- **Documentation**: Comprehensive record keeping and documentation

### Market Risk Management
- **Diversification**: Portfolio diversification strategies
- **Market Monitoring**: Regular market analysis and monitoring
- **Exit Planning**: Contingency planning for market downturns
- **Professional Advice**: Regular consultation with real estate professionals

## Technology and Innovation

### Property Management Software
- **Accounting Systems**: Comprehensive financial management systems
- **Tenant Management**: Tenant communication and service request systems
- **Maintenance Management**: Work order and maintenance tracking systems
- **Reporting Systems**: Automated reporting and analytics

### Smart Home Technology
- **Security Systems**: Advanced security and monitoring systems
- **Energy Management**: Smart energy management and efficiency systems
- **Tenant Amenities**: Technology amenities for tenant satisfaction
- **Remote Management**: Systems for remote property monitoring and management

## Professional Service Providers

### Legal and Tax Professionals
- **Legal Counsel**: Qualified Thai legal representation
- **Tax Advisors**: Professional tax planning and compliance
- **Accountants**: Comprehensive accounting and financial services
- **Regulatory Consultants**: Compliance and regulatory advice

### Property Management Services
- **Full-Service Management**: Comprehensive property management services
- **Specialized Services**: Leasing, maintenance, and financial services
- **Vendor Networks**: Access to qualified contractors and service providers
- **Technology Services**: Property management technology and systems

## Conclusion

Effective property management requires ongoing attention to legal compliance, financial management, and property maintenance. Property owners should maintain strong relationships with qualified professional service providers and stay informed about market trends and regulatory changes.

Regular review and updating of property management strategies ensures optimal performance and value preservation of real estate investments in Thailand.',
  'Comprehensive property management guide covering legal compliance, maintenance, financial management, and exit strategies for existing property owners.',
  ARRAY['EXISTING_PROPERTY_OWNER']::"UserRole"[],
  true
),
(
  'brief-trust-ownership-model',
  'Bespoke Trust Property Ownership Model Overview',
  'bespoke-trust-ownership-model',
  '# Bespoke Trust Property Ownership Model: Secure Foreign Property Investment

## Executive Summary

Our proprietary trust ownership model provides foreign investors with a secure, legally compliant, and professionally managed structure for property ownership in Thailand. This innovative approach addresses the challenges of foreign property ownership while maximizing protection and investment returns.

## Model Overview

### Core Structure
Our bespoke trust model utilizes a sophisticated legal framework that combines:
- **Qualified Thai Trust Entity**: Professional trust management by licensed Thai entities
- **Beneficial Ownership Rights**: Foreign investors retain beneficial ownership and control
- **Legal Compliance**: Full compliance with Thai foreign investment regulations
- **Professional Management**: Expert oversight and governance throughout the investment period

### Key Advantages
- **Enhanced Security**: Multiple layers of legal protection beyond traditional structures
- **Regulatory Compliance**: Designed to fully comply with Thai property and foreign investment laws
- **Professional Oversight**: Continuous professional management and monitoring
- **Exit Flexibility**: Clear and efficient exit strategies and transfer mechanisms
- **Transparency**: Regular reporting and transparent governance processes

## Legal Framework and Compliance

### Thai Legal Foundation
- **Civil and Commercial Code Compliance**: Structured under Thai Civil and Commercial Code provisions
- **Foreign Business Act Compliance**: Full compliance with foreign ownership restrictions
- **Trust Law Application**: Utilization of Thai trust law principles and protections
- **Regular Legal Reviews**: Ongoing legal review and compliance updates

### Regulatory Oversight
- **Licensed Trustees**: All trustees are licensed and regulated Thai entities
- **Compliance Monitoring**: Regular compliance audits and regulatory reporting
- **Legal Updates**: Continuous monitoring of legal and regulatory changes
- **Professional Standards**: Adherence to international trust management standards

## Trust Structure Components

### Trustee Entity
- **Professional Trustees**: Licensed Thai trust companies with proven track records
- **Financial Strength**: Trustees with strong financial backing and insurance coverage
- **Experience**: Extensive experience in property trust management
- **Regulatory Standing**: Full regulatory compliance and good standing

### Beneficial Rights
- **Use and Enjoyment**: Full rights to use and enjoy the property
- **Income Rights**: Rights to all rental income and property appreciation
- **Control Rights**: Significant input on major property decisions
- **Transfer Rights**: Ability to transfer beneficial interests subject to trust terms

### Governance Structure
- **Advisory Committee**: Foreign beneficiary representation in governance
- **Investment Committee**: Professional oversight of investment decisions
- **Audit Committee**: Independent audit and oversight functions
- **Compliance Officer**: Dedicated compliance monitoring and reporting

## Investment Protection Mechanisms

### Legal Protections
- **Multiple Legal Layers**: Comprehensive legal protection through multiple mechanisms
- **Insurance Coverage**: Professional liability and property insurance coverage
- **Escrow Protections**: Secure handling of all investment funds
- **Documentation**: Comprehensive legal documentation and record keeping

### Financial Safeguards
- **Segregated Accounts**: All trust assets held in segregated accounts
- **Independent Audits**: Regular independent financial audits
- **Transparent Reporting**: Detailed financial reporting and transparency
- **Professional Management**: Expert financial management and oversight

### Operational Protections
- **Professional Property Management**: Expert property management services
- **Maintenance Standards**: High standards for property maintenance and improvement
- **Insurance Coverage**: Comprehensive property and liability insurance
- **Emergency Procedures**: Established procedures for emergency situations

## Trust Administration

### Setup Process
1. **Initial Consultation**: Comprehensive consultation and needs assessment
2. **Structure Design**: Customized trust structure design for specific requirements
3. **Legal Documentation**: Preparation of comprehensive trust documentation
4. **Property Acquisition**: Professional management of property acquisition process
5. **Trust Establishment**: Formal establishment of trust structure and governance

### Ongoing Management
- **Regular Reporting**: Monthly financial and operational reporting
- **Property Management**: Professional property management and maintenance
- **Compliance Monitoring**: Ongoing compliance and regulatory monitoring
- **Investment Oversight**: Professional oversight of investment performance
- **Beneficiary Services**: Comprehensive beneficiary support and communication

### Exit Strategies
- **Sale Procedures**: Efficient procedures for property sale and proceeds distribution
- **Transfer Mechanisms**: Ability to transfer beneficial interests to third parties
- **Succession Planning**: Estate planning and succession mechanisms
- **Liquidation Options**: Options for trust liquidation and asset distribution

## Comparative Advantages

### Versus Direct Ownership
- **Legal Compliance**: Full compliance with foreign ownership restrictions
- **Professional Management**: Expert management versus self-management challenges
- **Risk Mitigation**: Reduced legal and operational risks
- **Exit Flexibility**: More flexible exit options and procedures

### Versus Company Structures
- **Reduced Compliance**: Lower ongoing compliance burden than company structures
- **Cost Efficiency**: More cost-effective than maintaining Thai company structures
- **Simplified Management**: Simplified management compared to corporate requirements
- **Enhanced Protection**: Better protection than typical nominee arrangements

### Versus Leasehold Arrangements
- **Longer Term Security**: Greater long-term security than lease arrangements
- **Value Appreciation**: Full participation in property value appreciation
- **Control Rights**: Greater control over property use and management
- **Transfer Flexibility**: More flexible transfer and succession options

## Investment Considerations

### Suitability Assessment
- **Investment Objectives**: Alignment with long-term investment objectives
- **Risk Tolerance**: Appropriate for moderate to conservative risk tolerance
- **Investment Horizon**: Suitable for medium to long-term investment horizons
- **Professional Advice**: Requires professional legal and tax advice

### Cost Structure
- **Setup Costs**: Initial trust establishment and legal fees
- **Ongoing Fees**: Annual trust management and administration fees
- **Property Costs**: Standard property acquisition and ownership costs
- **Professional Fees**: Legal, tax, and professional advisory fees

### Due Diligence Requirements
- **Legal Review**: Comprehensive legal review of trust documentation
- **Financial Analysis**: Analysis of cost structure and fee arrangements
- **Professional References**: Verification of trustee credentials and performance
- **Risk Assessment**: Comprehensive risk assessment and mitigation analysis

## Implementation Process

### Phase 1: Consultation and Design
- **Needs Assessment**: Comprehensive assessment of investor requirements
- **Structure Design**: Custom design of optimal trust structure
- **Legal Review**: Legal review and optimization of structure
- **Documentation Preparation**: Preparation of all required legal documentation

### Phase 2: Establishment and Implementation
- **Trust Formation**: Formal establishment of trust structure
- **Property Acquisition**: Professional management of property acquisition
- **Governance Implementation**: Establishment of governance and oversight mechanisms
- **Initial Reporting**: Commencement of regular reporting and communication

### Phase 3: Ongoing Management
- **Operational Management**: Day-to-day property and trust management
- **Performance Monitoring**: Regular monitoring and performance reporting
- **Compliance Management**: Ongoing compliance and regulatory management
- **Beneficiary Services**: Comprehensive ongoing beneficiary support

## Professional Team

### Legal Professionals
- **Senior Thai Lawyers**: Experienced Thai legal professionals specializing in property law
- **International Lawyers**: International legal expertise for cross-border matters
- **Regulatory Specialists**: Specialists in Thai regulatory and compliance matters
- **Trust Lawyers**: Specialized expertise in trust law and administration

### Financial Professionals
- **Trust Managers**: Licensed and experienced trust management professionals
- **Accountants**: Qualified Thai accountants for financial management and reporting
- **Tax Advisors**: Specialized tax advice for optimal tax planning
- **Investment Advisors**: Professional investment advice and portfolio management

### Property Professionals
- **Property Managers**: Experienced property management professionals
- **Real Estate Professionals**: Licensed real estate professionals for transactions
- **Facility Management**: Professional facility management and maintenance services
- **Insurance Specialists**: Comprehensive insurance coverage and risk management

## Conclusion

Our bespoke trust property ownership model represents the most sophisticated and secure approach to foreign property investment in Thailand. Through professional management, comprehensive legal protection, and transparent governance, investors can achieve their property investment objectives while maintaining full regulatory compliance and optimal risk management.

For detailed information about implementing this ownership structure for your specific investment requirements, please contact our professional team for a confidential consultation.',
  'Comprehensive overview of our proprietary trust ownership model designed specifically for secure foreign property investment in Thailand.',
  ARRAY['BUYER', 'LAWYER']::"UserRole"[],
  true
);

-- Function to update timestamps automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW."updatedAt" = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_brief_updated_at BEFORE UPDATE ON "Brief" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Migration complete message
SELECT 'Database migration completed successfully! You can now connect your app to this Supabase database.' as status; 