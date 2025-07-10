import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

const sampleBriefs = [
  {
    title: "Property Purchase Process for Foreign Buyers",
    slug: "property-purchase-process-foreign-buyers",
    description: "A comprehensive guide to purchasing property in Thailand as a foreign national, including legal requirements and restrictions.",
    content: `# Property Purchase Process for Foreign Buyers

## Overview
Foreign nationals face specific legal restrictions when purchasing property in Thailand. Understanding these limitations is crucial for a successful transaction.

## Key Restrictions
- **Land Ownership**: Foreign nationals cannot directly own land in Thailand
- **Condominium Ownership**: Foreigners can own up to 49% of units in a condominium project
- **Company Structure**: Some buyers use Thai companies to hold land (requires careful legal structuring)

## Required Documentation
1. Passport and valid visa
2. Foreign Exchange Transaction Form (FETF)
3. Bank confirmation of funds transfer
4. Due diligence reports

## Legal Process
1. **Initial Agreement**: Sign a reservation agreement
2. **Due Diligence**: Conduct title searches and property inspections
3. **Purchase Agreement**: Execute the formal sale and purchase agreement
4. **Transfer**: Complete the transfer at the Land Department

## Important Considerations
- Always use a qualified Thai lawyer
- Ensure all funds are transferred from abroad
- Verify the property's legal status
- Understand tax obligations

*This brief provides general guidance only. Consult with a qualified attorney for specific legal advice.*`,
    targetRoles: [UserRole.BUYER],
    isPublished: true,
  },
  {
    title: "Tax Implications of Property Investment",
    slug: "tax-implications-property-investment",
    description: "Understanding the tax obligations and opportunities for property investors in Thailand.",
    content: `# Tax Implications of Property Investment

## Property Transfer Taxes
When purchasing property in Thailand, buyers must pay several taxes:

### Specific Business Tax (SBT)
- 3.3% of registered value or appraised value (whichever is higher)
- Applies if property is sold within 5 years of purchase

### Transfer Fee
- 2% of registered value or appraised value (whichever is higher)
- Paid to the Land Department

### Stamp Duty
- 0.5% of registered value or appraised value (whichever is higher)
- Alternative to SBT if property held for more than 5 years

## Ongoing Tax Obligations

### Annual House and Land Tax
- 0.02% to 0.1% of appraised value for residential property
- Higher rates for commercial property

### Rental Income Tax
- Progressive rates from 5% to 35% for individuals
- Corporate rates apply for company-owned properties

## Tax Planning Strategies
1. **Timing of Sales**: Hold property for more than 5 years to avoid SBT
2. **Corporate Structure**: Consider tax efficiency of different ownership structures
3. **Depreciation**: Claim allowable depreciation on rental properties
4. **Double Taxation Treaties**: Utilize treaties to minimize tax burden

## Record Keeping
Maintain detailed records of:
- Purchase costs and improvements
- Rental income and expenses  
- Tax payments and filings

*Tax laws are subject to change. Consult with a qualified tax advisor for current regulations.*`,
    targetRoles: [UserRole.BUYER, UserRole.ACCOUNTANT, UserRole.EXISTING_PROPERTY_OWNER],
    isPublished: true,
  },
  {
    title: "Condominium Juristic Person Obligations",
    slug: "condominium-juristic-person-obligations",
    description: "Legal requirements and responsibilities for condominium juristic persons under Thai law.",
    content: `# Condominium Juristic Person Obligations

## Legal Framework
The Condominium Act B.E. 2522 establishes the legal framework for condominium ownership and management in Thailand.

## Formation Requirements
A juristic person must be established when:
- More than 4 condominium units are sold
- The developer transfers common areas to unit owners

## Mandatory Responsibilities

### Financial Management
- Establish and maintain a common fund
- Collect monthly maintenance fees
- Prepare annual budgets and financial statements
- Maintain reserve funds for major repairs

### Property Maintenance
- Maintain common areas and facilities
- Ensure building safety and security
- Coordinate repairs and improvements
- Manage utilities for common areas

### Administrative Duties
- Hold annual general meetings
- Maintain unit owner registry
- Enforce building regulations
- Issue certificates and documentation

## Committee Structure
- **Committee Members**: Elected by unit owners
- **Manager**: May be appointed to handle daily operations
- **Auditor**: Required for financial oversight

## Legal Compliance
- Register with the Land Department
- File annual reports
- Comply with building codes
- Maintain insurance coverage

## Common Legal Issues
1. **Non-payment of fees**: Procedures for collection and legal action
2. **Unauthorized modifications**: Enforcement of building regulations
3. **Meeting quorum**: Requirements for valid decision-making
4. **Foreign ownership limits**: Monitoring compliance with 49% rule

## Best Practices
- Establish clear by-laws and regulations
- Maintain transparent financial records
- Regular communication with unit owners
- Professional property management services

*This information is for general guidance. Specific legal advice should be obtained for complex situations.*`,
    targetRoles: [UserRole.LAWYER, UserRole.EXISTING_PROPERTY_OWNER],
    isPublished: true,
  },
  {
    title: "Due Diligence Checklist for Property Lawyers",
    slug: "due-diligence-checklist-property-lawyers",
    description: "Comprehensive checklist for legal practitioners conducting property due diligence in Thailand.",
    content: `# Due Diligence Checklist for Property Lawyers

## Title Investigation

### Land Title Deed (Chanote)
- [ ] Verify title deed authenticity
- [ ] Check for any encumbrances or mortgages
- [ ] Confirm accurate boundary descriptions
- [ ] Review survey plans and GPS coordinates

### Ownership History
- [ ] Trace ownership chain for at least 30 years
- [ ] Identify any gaps in ownership transfers
- [ ] Check for any disputed ownership claims
- [ ] Verify seller's legal capacity to sell

## Legal Compliance

### Zoning and Land Use
- [ ] Confirm current zoning classification
- [ ] Check permitted land uses
- [ ] Verify building permits and approvals
- [ ] Review environmental impact assessments

### Foreign Ownership Compliance
- [ ] Verify foreign ownership percentages (condominiums)
- [ ] Check company shareholding structures (if applicable)
- [ ] Confirm compliance with Foreign Business Act
- [ ] Review nominee arrangements (if any)

## Financial Verification

### Property Valuation
- [ ] Obtain independent valuation report
- [ ] Compare with recent comparable sales
- [ ] Review government appraised value
- [ ] Assess market trends and projections

### Tax and Fee Status
- [ ] Verify current tax payments
- [ ] Check outstanding utility bills
- [ ] Confirm maintenance fee status (condominiums)
- [ ] Review transfer fee calculations

## Physical Inspection

### Property Condition
- [ ] Conduct structural inspection
- [ ] Check electrical and plumbing systems
- [ ] Review building maintenance records
- [ ] Assess compliance with building codes

### Access and Utilities
- [ ] Confirm legal access rights
- [ ] Verify utility connections
- [ ] Check water and drainage systems
- [ ] Review parking and common area rights

## Documentation Review

### Contracts and Agreements
- [ ] Review purchase and sale agreement
- [ ] Check reservation agreements
- [ ] Examine any lease agreements
- [ ] Review management contracts

### Corporate Documents (if applicable)
- [ ] Company registration documents
- [ ] Shareholder agreements
- [ ] Board resolutions
- [ ] Audited financial statements

## Risk Assessment

### Legal Risks
- Ownership disputes
- Title defects
- Regulatory non-compliance
- Foreign ownership violations

### Commercial Risks
- Market volatility
- Rental yield projections
- Future development impacts
- Liquidity considerations

## Reporting
Prepare comprehensive due diligence report including:
- Executive summary of findings
- Risk assessment and recommendations
- Required remedial actions
- Completion conditions

*This checklist should be adapted based on specific transaction requirements and current legal developments.*`,
    targetRoles: [UserRole.LAWYER],
    isPublished: true,
  },
  {
    title: "Property Management and Rental Income Optimization",
    slug: "property-management-rental-income-optimization",
    description: "Strategies for maximizing rental returns and effective property management in Thailand.",
    content: `# Property Management and Rental Income Optimization

## Market Analysis and Positioning

### Understanding Your Market
- Research comparable rental properties in your area
- Analyze seasonal demand patterns
- Identify target tenant demographics
- Monitor local economic indicators

### Competitive Positioning
- Price competitively based on market research
- Highlight unique property features
- Consider furnished vs. unfurnished options
- Evaluate short-term vs. long-term rental strategies

## Property Preparation and Maintenance

### Initial Setup
- Professional cleaning and staging
- Quality photography for marketing
- Essential repairs and improvements
- Safety and security measures

### Ongoing Maintenance
- Regular property inspections
- Preventive maintenance schedules
- Quick response to tenant issues
- Annual property condition reviews

## Legal and Financial Management

### Rental Agreements
- Use comprehensive lease agreements
- Include clear terms and conditions
- Specify maintenance responsibilities
- Address payment terms and penalties

### Tax Optimization
- Claim allowable deductions:
  - Property management fees
  - Maintenance and repairs
  - Depreciation allowances
  - Insurance premiums
  - Professional fees

### Financial Records
- Maintain detailed income and expense records
- Track all rental payments
- Document all maintenance costs
- Prepare for annual tax filings

## Tenant Management

### Tenant Screening
- Credit and background checks
- Employment verification
- Previous landlord references
- Security deposit requirements

### Tenant Relations
- Clear communication channels
- Prompt response to maintenance requests
- Regular property condition updates
- Professional handling of disputes

## Technology and Marketing

### Online Presence
- List on popular rental platforms
- Maintain updated property photos
- Respond quickly to inquiries
- Use social media marketing

### Property Management Software
- Automate rent collection
- Track maintenance requests
- Generate financial reports
- Manage tenant communications

## Common Challenges and Solutions

### Vacancy Periods
- Plan for 5-10% vacancy rates
- Maintain property during vacancies
- Adjust pricing based on market conditions
- Consider seasonal rental strategies

### Maintenance Issues
- Build relationships with reliable contractors
- Maintain emergency repair fund
- Prioritize tenant safety issues
- Document all repairs and improvements

### Legal Compliance
- Stay updated on rental regulations
- Ensure proper insurance coverage
- Comply with tax obligations
- Handle deposits according to law

## Performance Monitoring

### Key Metrics
- Gross rental yield
- Net rental yield after expenses
- Occupancy rates
- Tenant turnover frequency
- Average rental duration

### Regular Reviews
- Monthly financial analysis
- Quarterly market assessments
- Annual strategy reviews
- Property value reassessments

*Success in property management requires dedication, market knowledge, and professional approach to tenant relations.*`,
    targetRoles: [UserRole.EXISTING_PROPERTY_OWNER, UserRole.ACCOUNTANT],
    isPublished: true,
  }
]

async function main() {
  console.log('Starting database seed...')

  // Create sample briefs
  for (const brief of sampleBriefs) {
    const existingBrief = await prisma.brief.findUnique({
      where: { slug: brief.slug }
    })

    if (!existingBrief) {
      await prisma.brief.create({
        data: brief
      })
      console.log(`Created brief: ${brief.title}`)
    } else {
      console.log(`Brief already exists: ${brief.title}`)
    }
  }

  console.log('Database seed completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 