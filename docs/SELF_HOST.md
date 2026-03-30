# Self-Hosting Guide

## Prerequisites

- Node.js 20+
- Supabase project (cloud or self-hosted)
- Anthropic API key
- Google Perspective API key (optional but recommended)

## Environment Variables

```bash
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
PERSPECTIVE_API_KEY=AIza...        # Optional
CONTENT_STANDARDS=international    # Options: international | uae | eu | us
```

## Database Setup

1. Create a Supabase project
2. Apply the migration: `supabase db push`
3. Enable email auth in Supabase dashboard

## UAE School Deployment Guide

When deploying in UAE schools:

1. Set `CONTENT_STANDARDS=uae` in environment variables
2. Notify your ISP that the platform serves educational content to children
3. Register with TDRA when technical standards are published (expected before Jan 2027)
4. Designate a local compliance officer
5. The `/api/compliance/traffic-report` endpoint is available for ISP/TDRA audit

### ISP Notification Template

```
To: [ISP Name]
Subject: Educational Platform Deployment Notification

We are deploying Gyaan Vriksh (gyaan-vriksh.app), an educational AI
exploration platform, in [School Name]. The platform:
- Serves students aged 10-17
- Uses standard HTTPS (port 443)
- Contains no gambling, adult, or prohibited content
- Complies with UAE Federal Decree-Law No. 26/2025

Traffic report API: GET /api/compliance/traffic-report
```

## Data Retention

Self-hosting schools assume responsibility for data retention compliance. See [Data Retention Policy](/privacy/retention) for the platform's default schedule.

## Security

Self-hosting organizations must:
- Designate a Security Coordinator (see SECURITY.md)
- Conduct annual risk assessments
- Maintain TLS 1.3 for all connections
- Review Supabase RLS policies after any schema changes
