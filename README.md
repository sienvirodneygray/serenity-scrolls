# Serenity Scrolls Servant - Email Campaign & Admin System

This project is the admin dashboard and background campaign runner for Serenity Scrolls Servant.

## Tech Stack
- **Frontend**: Next.js 16 (App Router), React, Tailwind CSS, shadcn/ui
- **Backend / Auth**: Supabase Edge Functions, PostgreSQL, GoTrue
- **Worker**: Google Cloud Run & Cloud Scheduler
- **Email Delivery**: Resend

## Environment Variables
Create a `.env.local` file with the following placeholders filled out. DO NOT COMMIT `.env.local` to the repository.

```env
NEXT_PUBLIC_SUPABASE_PROJECT_ID="your_supabase_project_id"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="your_supabase_anon_key"
NEXT_PUBLIC_SUPABASE_URL="https://your_supabase_project_id.supabase.co"
NEXT_PUBLIC_AMAZON_PREORDER_URL="https://www.amazon.com/dp/B0GGV8FQCM"
RESEND_API_KEY="re_..."

# Amazon SP-API Credentials
AMAZON_SPAPI_CLIENT_ID="..."
AMAZON_SPAPI_CLIENT_SECRET="..."
AMAZON_SPAPI_REFRESH_TOKEN="..."
AMAZON_SELLER_ID="..."
```

## Production Deployment Runbook

### 1. Supabase Edge Functions
Deploy all Supabase functions to your project:
```bash
supabase functions deploy generate-funnel
supabase functions deploy send-access-approval
supabase functions deploy send-expiry-notice
supabase functions deploy send-trial-reminder
supabase functions deploy send-order-notification
```

Set Supabase secrets (do not store `OPENAI_API_KEY` or `SUPABASE_SERVICE_ROLE_KEY` in local env files):
```bash
supabase secrets set RESEND_API_KEY="re_..."
supabase secrets set SITE_URL="https://serenityscrolls.faith"
supabase secrets set OPENAI_API_KEY="sk-..."
supabase secrets set OPENAI_ASSISTANT_ID="asst_..."
```

### 2. Google Cloud Run Worker (Campaign Sender)
The worker securely checks due schedules every 5 minutes and sends emails via Resend.

Deploy to Cloud Run (ensuring it is not publicly accessible):
```bash
gcloud run deploy serenity-send-due-worker \
  --source ./cloud-run/send-due-worker \
  --region us-central1 \
  --no-allow-unauthenticated \
  --set-env-vars="RESEND_API_KEY=re_...,SUPABASE_URL=https://your-project.supabase.co,SUPABASE_SERVICE_ROLE_KEY=ey..."
```

Set up Cloud Scheduler to securely trigger the endpoint every 5 minutes:
```bash
gcloud scheduler jobs create http serenity-send-due-worker-every-5-min \
  --schedule="*/5 * * * *" \
  --uri="https://YOUR_CLOUD_RUN_URL/process-due" \
  --http-method=POST \
  --location=us-central1 \
  --oidc-service-account-email="YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com"
```

### 3. Firebase App Hosting (Frontend)
The Next.js frontend is configured for Firebase App Hosting. It automatically reads `apphosting.yaml` and deploys on git push. Ensure your GitHub repo is connected in the Firebase Console.

## Troubleshooting

- **Schedules aren't sending**: Check the Google Cloud Run Logs for `serenity-send-due-worker`. Ensure the service account has `roles/run.invoker` permission.
- **Worker fails on startup**: Make sure you included all three environment variables (`RESEND_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) during deployment.
- **Admin access denied**: The middleware checks the `user_roles` table. Ensure your user ID has an `admin` record in the `user_roles` table in Supabase.
- **Emails land in spam**: Ensure your Resend domain is verified with SPF, DKIM, and DMARC for `noreply@serenityscrolls.faith`.
