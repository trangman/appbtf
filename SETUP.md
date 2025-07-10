# Legal Briefs App Setup

## Prerequisites
- Node.js (v18 or later)
- Laragon with PostgreSQL running on port 5432

## Database Setup

1. **Start Laragon** and ensure PostgreSQL is running (should be available on port 5432)

2. Create a `.env` file in the root directory with the following content:

```env
# Database (Laragon PostgreSQL on port 5432)
DATABASE_URL="postgresql://postgres:@localhost:5432/legal_briefs?schema=public"

# NextAuth.js
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
NEXTAUTH_URL="http://localhost:3000"

# Optional: Add OpenAI API key for AI assistant (can be added later)
# OPENAI_API_KEY="your-openai-api-key-here"
```

**Note**: Laragon typically runs PostgreSQL without a password by default. If you have set a password for the postgres user, update the connection string to: `postgresql://postgres:your_password@localhost:5432/legal_briefs?schema=public`

3. **Create the database** using Laragon's database management:
   - Open Laragon
   - Click "Database" → "PostgreSQL" → "pgAdmin" (or use HeidiSQL)
   - Create a new database named `legal_briefs`

   **Or via command line/terminal**:
   ```sql
   CREATE DATABASE legal_briefs;
   ```

4. Run the database migration:
```bash
npx prisma migrate dev --name init
```

5. Generate the Prisma client:
```bash
npx prisma generate
```

6. Seed the database with sample content:
```bash
npm run db:seed
```

## Running the App

```bash
npm run dev
```

The app will be available at http://localhost:3000

## Demo Usage

1. **Registration**: Visit http://localhost:3000 and you'll be redirected to the sign-in page
2. **Create Account**: Click "Register here" to create a new account with role selection
3. **Role Selection**: Choose from:
   - Property Buyer
   - Accountant  
   - Lawyer
   - Existing Property Owner
4. **Browse Content**: Different roles will see different legal briefs based on relevance

## Features

- **Authentication**: Email/password authentication with role selection
- **Role-based Content**: Content filtering based on user role (Buyer, Accountant, Lawyer, Existing Property Owner)
- **Legal Briefs**: Comprehensive legal briefs in markdown format covering Thai property law
- **AI Assistant**: Placeholder for expert legal questions (ready for OpenAI integration)
- **Contact Form**: Submit inquiries and questions
- **Profile Management**: Update user information and role

## Sample Content

The database includes 5 sample legal briefs covering:
- Property purchase process for foreign buyers
- Tax implications of property investment
- Condominium juristic person obligations  
- Due diligence checklist for lawyers
- Property management and rental optimization

Each brief is targeted to specific roles and demonstrates the role-based content filtering system.

## Production Considerations

For production deployment, consider the following:

### ActiveCampaign Integration
- Implement ActiveCampaign API integration to sync user roles and authentication
- Replace manual role selection with automated role assignment from AC contacts
- Set up webhook endpoints to receive contact updates from ActiveCampaign

### AI Assistant Enhancement  
- Add OpenAI API integration for real legal guidance
- Implement conversation history and context management
- Add legal disclaimer and terms of service

### Security Enhancements
- Implement rate limiting for API endpoints
- Add CSRF protection
- Set up proper SSL certificates
- Implement proper session management
- Add input validation and sanitization

### Content Management
- Add admin interface for managing legal briefs
- Implement MDX rendering for rich content formatting
- Add versioning for legal brief updates
- Consider content approval workflows

### Monitoring and Analytics
- Add error tracking (e.g., Sentry)
- Implement user analytics
- Set up performance monitoring
- Add logging for security events

### Database and Infrastructure
- Set up production PostgreSQL database
- Implement database backups
- Configure environment variables securely
- Set up CI/CD pipeline
- Consider CDN for static assets 