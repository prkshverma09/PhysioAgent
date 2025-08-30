# Fit4Life Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Fit4Life physiotherapy application to various platforms. The application is built with Next.js and can be deployed to multiple environments.

## Prerequisites

Before deployment, ensure you have:

- Node.js 18+ installed
- Git repository access
- Supabase project created
- OpenAI API key
- Deployment platform account (Vercel, Netlify, etc.)

## Environment Setup

### 1. Environment Variables

Create a `.env.local` file in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Next.js Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 2. Supabase Setup

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and API keys

2. **Run Database Migrations**
   - Open your Supabase dashboard
   - Go to SQL Editor
   - Copy and paste the contents of `scripts/001_create_patient_tables.sql`
   - Execute the script

3. **Configure Authentication**
   - Go to Authentication > Settings
   - Configure your authentication providers (Email, Google, etc.)
   - Set up redirect URLs for your domain

### 3. OpenAI Setup

1. **Get API Key**
   - Visit [OpenAI Platform](https://platform.openai.com/)
   - Create an account or sign in
   - Generate an API key
   - Add billing information (required for GPT-4)

2. **Configure Usage Limits**
   - Set up usage alerts
   - Monitor API usage in dashboard

## Deployment Options

### Option 1: Vercel (Recommended)

Vercel is the recommended deployment platform for Next.js applications.

#### Step 1: Prepare Repository

```bash
# Ensure your code is committed
git add .
git commit -m "feat: prepare for deployment"
git push origin main
```

#### Step 2: Connect to Vercel

1. **Sign up/Login to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub account

2. **Import Project**
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Configure Environment Variables**
   - Go to Project Settings > Environment Variables
   - Add all variables from your `.env.local`
   - Set environment to "Production"

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy automatically

#### Step 3: Custom Domain (Optional)

1. **Add Domain**
   - Go to Project Settings > Domains
   - Add your custom domain
   - Configure DNS records as instructed

2. **Update Supabase Redirect URLs**
   - Add your production domain to Supabase auth settings

#### Vercel Configuration

Create a `vercel.json` file for custom configuration:

```json
{
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### Option 2: Netlify

Netlify is an alternative deployment platform with good Next.js support.

#### Step 1: Connect to Netlify

1. **Sign up/Login to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Sign up with GitHub account

2. **Import Project**
   - Click "New site from Git"
   - Connect your GitHub repository
   - Set build command: `pnpm build`
   - Set publish directory: `.next`

#### Step 2: Configure Environment

1. **Environment Variables**
   - Go to Site Settings > Environment Variables
   - Add all required environment variables

2. **Build Settings**
   - Build command: `pnpm build`
   - Publish directory: `.next`
   - Node version: `18`

#### Step 3: Deploy

- Netlify will automatically deploy on git push
- Monitor build logs for any issues

### Option 3: AWS (Advanced)

For enterprise deployments, AWS provides scalable infrastructure.

#### Step 1: Prepare Docker Image

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm install -g pnpm && pnpm build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### Step 2: Deploy to ECS

1. **Create ECR Repository**
   ```bash
   aws ecr create-repository --repository-name fit4life
   ```

2. **Build and Push Image**
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account.dkr.ecr.us-east-1.amazonaws.com
   docker build -t fit4life .
   docker tag fit4life:latest your-account.dkr.ecr.us-east-1.amazonaws.com/fit4life:latest
   docker push your-account.dkr.ecr.us-east-1.amazonaws.com/fit4life:latest
   ```

3. **Create ECS Service**
   - Use AWS Console or CloudFormation
   - Configure environment variables
   - Set up load balancer

### Option 4: Self-Hosted

For complete control over your deployment.

#### Step 1: Server Setup

1. **Provision Server**
   - Ubuntu 20.04+ recommended
   - Minimum 2GB RAM, 1 CPU
   - Install Node.js 18+

2. **Install Dependencies**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   npm install -g pnpm
   ```

#### Step 2: Application Deployment

1. **Clone Repository**
   ```bash
   git clone https://github.com/prkshverma09/PhysioAgent.git
   cd PhysioAgent
   ```

2. **Install and Build**
   ```bash
   pnpm install
   pnpm build
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

4. **Start Application**
   ```bash
   pnpm start
   ```

#### Step 3: Process Management

Use PM2 for process management:

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start npm --name "fit4life" -- start

# Save PM2 configuration
pm2 save
pm2 startup
```

## Post-Deployment Configuration

### 1. SSL Certificate

For production deployments, ensure SSL is configured:

- **Vercel/Netlify**: Automatic SSL
- **AWS**: Use AWS Certificate Manager
- **Self-hosted**: Use Let's Encrypt

### 2. Monitoring Setup

#### Application Monitoring

1. **Error Tracking**
   - Set up Sentry or similar
   - Configure error reporting

2. **Performance Monitoring**
   - Use Vercel Analytics (if on Vercel)
   - Set up Google Analytics
   - Monitor Core Web Vitals

#### Infrastructure Monitoring

1. **Server Metrics**
   - CPU, memory, disk usage
   - Network traffic
   - Application logs

2. **Database Monitoring**
   - Supabase dashboard metrics
   - Query performance
   - Connection pool status

### 3. Backup Strategy

1. **Database Backups**
   - Supabase provides automatic backups
   - Configure additional backup schedules if needed

2. **Application Backups**
   - Version control with Git
   - Environment variable backups
   - Configuration files

### 4. Security Hardening

1. **Environment Variables**
   - Never commit `.env` files
   - Use secure variable storage
   - Rotate keys regularly

2. **Access Control**
   - Implement proper authentication
   - Use role-based access control
   - Monitor access logs

3. **API Security**
   - Rate limiting
   - Input validation
   - CORS configuration

## Troubleshooting

### Common Issues

#### Build Failures

1. **Node Version**
   ```bash
   # Ensure correct Node.js version
   node --version  # Should be 18+
   ```

2. **Dependencies**
   ```bash
   # Clear cache and reinstall
   pnpm store prune
   pnpm install
   ```

3. **Environment Variables**
   - Verify all required variables are set
   - Check for typos in variable names
   - Ensure proper formatting

#### Runtime Errors

1. **Database Connection**
   - Verify Supabase URL and keys
   - Check network connectivity
   - Ensure database migrations are run

2. **OpenAI API**
   - Verify API key is valid
   - Check API usage limits
   - Monitor rate limiting

3. **Authentication Issues**
   - Verify redirect URLs in Supabase
   - Check CORS settings
   - Ensure proper session handling

### Debugging

#### Local Debugging

```bash
# Run in development mode
pnpm dev

# Check logs
tail -f logs/app.log
```

#### Production Debugging

1. **Vercel**
   - Check Function Logs in dashboard
   - Use Vercel CLI for local debugging

2. **Netlify**
   - Check deploy logs
   - Use Netlify CLI for debugging

3. **AWS**
   - Check CloudWatch logs
   - Use AWS CLI for debugging

## Performance Optimization

### 1. Build Optimization

```bash
# Analyze bundle size
pnpm build
# Check .next/analyze for bundle analysis
```

### 2. Runtime Optimization

1. **Image Optimization**
   - Use Next.js Image component
   - Optimize image formats
   - Implement lazy loading

2. **Code Splitting**
   - Use dynamic imports
   - Implement route-based splitting
   - Optimize third-party libraries

### 3. Database Optimization

1. **Query Optimization**
   - Use proper indexes
   - Optimize RLS policies
   - Monitor query performance

2. **Connection Pooling**
   - Configure connection limits
   - Monitor connection usage
   - Implement connection pooling

## Maintenance

### 1. Regular Updates

1. **Dependencies**
   ```bash
   # Update dependencies
   pnpm update
   # Check for security vulnerabilities
   pnpm audit
   ```

2. **Security Patches**
   - Monitor security advisories
   - Update vulnerable packages
   - Test updates in staging

### 2. Monitoring

1. **Health Checks**
   - Implement health check endpoints
   - Monitor application status
   - Set up alerts for downtime

2. **Performance Monitoring**
   - Track response times
   - Monitor error rates
   - Analyze user behavior

### 3. Backup Verification

1. **Database Backups**
   - Test backup restoration
   - Verify backup integrity
   - Document recovery procedures

2. **Application Backups**
   - Test deployment rollbacks
   - Verify configuration backups
   - Document recovery procedures

## Support

For deployment issues:

1. **Check Documentation**
   - Review this deployment guide
   - Check platform-specific documentation
   - Review error logs

2. **Community Support**
   - GitHub Issues
   - Stack Overflow
   - Platform support forums

3. **Professional Support**
   - Platform support plans
   - Consulting services
   - Managed hosting solutions

---

This deployment guide covers the essential steps for deploying Fit4Life to various platforms. For platform-specific questions, refer to the respective platform documentation.
