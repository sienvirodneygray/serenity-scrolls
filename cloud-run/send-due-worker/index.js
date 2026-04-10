import express from 'express';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const app = express();
app.use(express.json());

// Main trigger endpoint called by Google Cloud Scheduler via HTTP
app.post('/process-due', async (req, res) => {
  try {
    // 1. Fetch pending schedules whose time has passed
    const { data: schedules, error: scheduleError } = await supabase
      .from('campaign_schedules')
      .select(`
        id, campaign_id, email_template_id, status,
        email_campaigns ( status, name ),
        email_templates ( subject, content_html )
      `)
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString());

    if (scheduleError) throw scheduleError;

    let totalSent = 0;

    // Process each generic valid schedule
    for (const schedule of schedules) {
      if (schedule.email_campaigns.status !== 'active') continue;

      // Update schedule to processing
      await supabase
        .from('campaign_schedules')
        .update({ status: 'processing', updated_at: new Date().toISOString() })
        .eq('id', schedule.id);

      // Fetch targets map for campaign (intersection of groups and individuals)
      // Note: for production, this should dispatch to a queue rather than in-memory for scale
      const { data: customers } = await supabase
        .from('campaign_target_customers')
        .select('customers ( id, email, first_name )')
        .eq('campaign_id', schedule.campaign_id);

      // Suppressions check could happen here
      const sendPool = customers?.map(c => c.customers) || [];

      for (const customer of sendPool) {
        if (!customer) continue;

        try {
          const { data: emailResponse, error: mailError } = await resend.emails.send({
            from: process.env.EMAIL_FROM_FALLBACK || 'marketing@serenityscrolls.com',
            to: customer.email,
            subject: schedule.email_templates.subject,
            html: schedule.email_templates.content_html,
            headers: {
              'X-Entity-Ref': schedule.id
            }
          });

          if (!mailError) {
             // Record the send success
             await supabase.from('email_sends').insert({
               campaign_id: schedule.campaign_id,
               template_id: schedule.email_template_id,
               customer_id: customer.id,
               schedule_id: schedule.id,
               status: 'delivered',
               provider_id: emailResponse.id,
               sent_at: new Date().toISOString()
             });
             totalSent++;
          }
        } catch (err) {
          console.error(`Failed sending to ${customer.email}:`, err);
        }
      }

      // Mark cycle completed
      await supabase
        .from('campaign_schedules')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', schedule.id);
    }

    res.status(200).json({ success: true, processed_schedules: schedules.length, total_sent: totalSent });
  } catch (error) {
    console.error('Run failed:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Send Due Worker listening on port ${PORT}`);
});
