import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Load variables securely from environment
const serenityUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serenityKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const senderUrl = process.env.NEXT_PUBLIC_SENDER_SUPABASE_URL || '';
const senderKey = process.env.SENDER_SUPABASE_SERVICE_ROLE_KEY || '';
const webhookSecret = process.env.SENDER_WEBHOOK_SECRET || '';

// Map Sienvi Sender status -> Serenity status
function mapSenderStatusToSerenity(status: string) {
  const s = (status || '').toLowerCase();
  if (s.includes('draft')) return 'draft';
  if (s.includes('pause')) return 'paused';
  if (s.includes('complete')) return 'completed';
  if (s.includes('schedule') || s.includes('sent') || s.includes('send')) return 'active';
  return 'draft';
}

// Map Sienvi Sender type -> Serenity campaign_type
function mapSenderTypeToSerenity(type: string) {
  if (type === 'AI Sequence') return 'ai_funnel';
  return 'manual';
}

/**
 * Webhook handler to synchronize email campaign modifications from Sienvi Sender Test.
 * Bypasses RLS to write updates idempotently to ensure zero sync loops.
 * 
 * @param {Request} req HTTP Request payload
 * @returns {Promise<NextResponse>} HTTP Response
 */
export async function POST(req: Request) {
  try {
    const headerSecret = req.headers.get('x-webhook-secret');
    if (!webhookSecret || headerSecret !== webhookSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { event, campaignId } = await req.json();
    if (!campaignId) {
      return NextResponse.json({ error: 'Missing campaignId' }, { status: 400 });
    }

    console.log(`[Webhook Serenity] Received event ${event} for campaign ${campaignId}`);

    const serenityClient = createClient(serenityUrl, serenityKey);

    if (event === 'DELETE') {
      const { error: delErr } = await serenityClient
        .from('email_campaigns')
        .delete()
        .eq('id', campaignId);
      
      if (delErr) {
        console.error('[Webhook Serenity] Error deleting campaign:', delErr);
        return NextResponse.json({ error: delErr.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: 'Campaign deleted' });
    }

    // Fetch the campaign details from Sienvi Sender Test
    const senderClient = createClient(senderUrl, senderKey);
    const { data: senderCamp, error: fetchErr } = await senderClient
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (fetchErr || !senderCamp) {
      console.error('[Webhook Serenity] Error fetching campaign from sender:', fetchErr);
      return NextResponse.json({ error: fetchErr?.message || 'Campaign not found in sender' }, { status: 404 });
    }

    const mappedName = senderCamp.title;
    const mappedStatus = mapSenderStatusToSerenity(senderCamp.status);
    const mappedType = mapSenderTypeToSerenity(senderCamp.type);
    const emails = senderCamp.sequence_data?.emails || [];

    // Check if campaign already exists locally
    const { data: existing, error: findErr } = await serenityClient
      .from('email_campaigns')
      .select('*, email_templates(*)')
      .eq('id', campaignId)
      .maybeSingle();

    if (findErr) {
      console.error('[Webhook Serenity] Error checking local campaign:', findErr);
      return NextResponse.json({ error: findErr.message }, { status: 500 });
    }

    if (existing) {
      // Compare status/name/type
      const statusChanged = existing.status !== mappedStatus;
      const nameChanged = existing.name !== mappedName;
      const typeChanged = existing.campaign_type !== mappedType;

      let templatesChanged = existing.email_templates.length !== emails.length;
      if (!templatesChanged) {
        const sortedTemplates = [...existing.email_templates].sort((a, b) => a.sequence_order - b.sequence_order);
        for (let i = 0; i < emails.length; i++) {
          const sEmail = emails[i];
          const sTmpl = sortedTemplates[i];
          if (sEmail.subject !== sTmpl.subject || (sEmail.body || sEmail.html || '') !== sTmpl.content_html) {
            templatesChanged = true;
            break;
          }
        }
      }

      // If nothing changed, return success early to prevent triggering updates loop
      if (!statusChanged && !nameChanged && !typeChanged && !templatesChanged) {
        console.log(`[Webhook Serenity] Campaign ${campaignId} is already in sync. Skipping.`);
        return NextResponse.json({ success: true, message: 'Already in sync' });
      }

      // Perform updates
      if (statusChanged || nameChanged || typeChanged) {
        const { error: updErr } = await serenityClient
          .from('email_campaigns')
          .update({
            name: mappedName,
            status: mappedStatus,
            campaign_type: mappedType,
            updated_at: new Date().toISOString()
          })
          .eq('id', campaignId);
        
        if (updErr) throw updErr;
      }

      if (templatesChanged) {
        await serenityClient.from('email_templates').delete().eq('campaign_id', campaignId);
        if (emails.length > 0) {
          const templatesToInsert = emails.map((email: any, idx: number) => ({
            campaign_id: campaignId,
            sequence_order: idx + 1,
            subject: email.subject || 'No Subject',
            content_html: email.body || email.html || '',
            created_at: senderCamp.created_at
          }));
          const { error: insertTemplatesErr } = await serenityClient
            .from('email_templates')
            .insert(templatesToInsert);
          if (insertTemplatesErr) throw insertTemplatesErr;
        }
      }

      console.log(`[Webhook Serenity] Campaign ${campaignId} updated successfully.`);
      return NextResponse.json({ success: true, message: 'Campaign updated' });
    } else {
      // Insert new campaign
      const { error: insErr } = await serenityClient
        .from('email_campaigns')
        .insert({
          id: campaignId,
          name: mappedName,
          status: mappedStatus,
          campaign_type: mappedType,
          created_at: senderCamp.created_at
        });

      if (insErr) throw insErr;

      // Insert templates
      if (emails.length > 0) {
        const templatesToInsert = emails.map((email: any, idx: number) => ({
          campaign_id: campaignId,
          sequence_order: idx + 1,
          subject: email.subject || 'No Subject',
          content_html: email.body || email.html || '',
          created_at: senderCamp.created_at
        }));
        const { error: insertTemplatesErr } = await serenityClient
          .from('email_templates')
          .insert(templatesToInsert);
        if (insertTemplatesErr) throw insertTemplatesErr;
      }

      console.log(`[Webhook Serenity] Campaign ${campaignId} created successfully.`);
      return NextResponse.json({ success: true, message: 'Campaign created' });
    }
  } catch (err: any) {
    console.error('[Webhook Serenity] Fatal webhook handler error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
