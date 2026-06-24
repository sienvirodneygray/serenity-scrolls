import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const firstEq = trimmed.indexOf('=');
    if (firstEq === -1) return;
    const key = trimmed.substring(0, firstEq).trim();
    let val = trimmed.substring(firstEq + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.substring(1, val.length - 1);
    } else if (val.startsWith("'") && val.endsWith("'")) {
      val = val.substring(1, val.length - 1);
    }
    env[key] = val;
  });
  return env;
}

// Load configurations
const envSerenity = parseEnv('.env.local');
const envSender = parseEnv('../sienvi-sender-test/.env.local');

const serenityUrl = envSerenity.NEXT_PUBLIC_SUPABASE_URL;
const serenityKey = envSerenity.SUPABASE_SERVICE_ROLE_KEY;

const senderUrl = envSender.NEXT_PUBLIC_SUPABASE_URL;
const senderKey = envSender.SUPABASE_SERVICE_ROLE_KEY;

if (!serenityUrl || !serenityKey || !senderUrl || !senderKey) {
  console.error('Error: Database URLs or Service role keys are missing in environment files!');
  process.exit(1);
}

const serenity = createClient(serenityUrl, serenityKey);
const sender = createClient(senderUrl, senderKey);

// Serenity Scrolls client ID in Sender DB
const SERENITY_CLIENT_ID = '7db97d49-12c4-404e-a2be-70f5c0e35afd';

// Map Sienvi Sender status -> Serenity status
function mapSenderStatusToSerenity(status) {
  const s = (status || '').toLowerCase();
  if (s.includes('draft')) return 'draft';
  if (s.includes('pause')) return 'paused';
  if (s.includes('complete')) return 'completed';
  if (s.includes('schedule') || s.includes('sent') || s.includes('send')) return 'active';
  return 'draft';
}

// Map Serenity status -> Sienvi Sender status
function mapSerenityStatusToSender(status) {
  const s = (status || '').toLowerCase();
  if (s === 'draft') return 'Draft';
  if (s === 'paused') return 'Paused';
  if (s === 'completed') return 'Completed';
  if (s === 'sending') return 'Sending';
  if (s === 'active') return 'Scheduled';
  return 'Draft';
}

// Map Sienvi Sender type -> Serenity campaign_type
function mapSenderTypeToSerenity(type) {
  if (type === 'AI Sequence') return 'ai_funnel';
  return 'manual';
}

// Map Serenity campaign_type -> Sienvi Sender type
function mapSerenityTypeToSender(type) {
  if (type === 'ai_funnel') return 'AI Sequence';
  return 'Newsletter';
}

async function syncCampaigns() {
  console.log('--- STARTING BI-DIRECTIONAL CAMPAIGN SYNC ---');

  // 1. Fetch campaigns from both systems
  const { data: serenityCampaigns, error: scErr } = await serenity
    .from('email_campaigns')
    .select('*, email_templates(*)');
  
  if (scErr) {
    console.error('Error fetching Serenity campaigns:', scErr);
    process.exit(1);
  }

  const { data: senderCampaigns, error: sErr } = await sender
    .from('campaigns')
    .select('*')
    .eq('client_id', SERENITY_CLIENT_ID);

  if (sErr) {
    console.error('Error fetching Sender campaigns:', sErr);
    process.exit(1);
  }

  console.log(`Fetched ${serenityCampaigns.length} campaigns from Serenity Scrolls.`);
  console.log(`Fetched ${senderCampaigns.length} campaigns from Sienvi Sender Test (under client Serenity Scrolls).`);

  const serenityMap = new Map(serenityCampaigns.map(c => [c.id, c]));
  const senderMap = new Map(senderCampaigns.map(c => [c.id, c]));

  let syncedToSerenityCount = 0;
  let syncedToSenderCount = 0;

  // 2. Sync from Sienvi Sender to Serenity Scrolls
  for (const senderCamp of senderCampaigns) {
    const serenityCamp = serenityMap.get(senderCamp.id);

    if (!serenityCamp) {
      // Campaign exists in Sender but not in Serenity -> Create in Serenity
      console.log(`[Sync -> Serenity] Campaign "${senderCamp.title}" (${senderCamp.id}) is missing. Recreating...`);
      
      const mappedStatus = mapSenderStatusToSerenity(senderCamp.status);
      const mappedType = mapSenderTypeToSerenity(senderCamp.type);

      const { data: newSerenityCamp, error: insertCampErr } = await serenity
        .from('email_campaigns')
        .insert({
          id: senderCamp.id,
          name: senderCamp.title,
          status: mappedStatus,
          campaign_type: mappedType,
          created_at: senderCamp.created_at
        })
        .select()
        .single();

      if (insertCampErr) {
        console.error(`Failed to insert campaign ${senderCamp.id} into Serenity Scrolls:`, insertCampErr);
        continue;
      }

      // Sync templates
      const emails = senderCamp.sequence_data?.emails || [];
      if (emails.length > 0) {
        const templatesToInsert = emails.map((email, idx) => ({
          campaign_id: senderCamp.id,
          sequence_order: idx + 1,
          subject: email.subject || 'No Subject',
          content_html: email.body || email.html || '',
          created_at: senderCamp.created_at
        }));

        const { error: insertTemplatesErr } = await serenity
          .from('email_templates')
          .insert(templatesToInsert);

        if (insertTemplatesErr) {
          console.error(`Failed to insert templates for campaign ${senderCamp.id}:`, insertTemplatesErr);
        }
      }

      syncedToSerenityCount++;
    } else {
      // Campaign exists in both -> Check if update is needed (compare title/status/templates)
      const mappedStatus = mapSenderStatusToSerenity(senderCamp.status);
      const mappedType = mapSenderTypeToSerenity(senderCamp.type);
      
      const statusMismatched = serenityCamp.status !== mappedStatus;
      const nameMismatched = serenityCamp.name !== senderCamp.title;
      
      // Check templates mismatch
      const senderEmails = senderCamp.sequence_data?.emails || [];
      const serenityTemplates = serenityCamp.email_templates || [];
      let templatesMismatched = senderEmails.length !== serenityTemplates.length;
      
      if (!templatesMismatched) {
        // Compare subject and content order
        const sortedSerenityTemplates = [...serenityTemplates].sort((a, b) => a.sequence_order - b.sequence_order);
        for (let i = 0; i < senderEmails.length; i++) {
          const sEmail = senderEmails[i];
          const sTmpl = sortedSerenityTemplates[i];
          if (sEmail.subject !== sTmpl.subject || (sEmail.body || sEmail.html || '') !== sTmpl.content_html) {
            templatesMismatched = true;
            break;
          }
        }
      }

      if (statusMismatched || nameMismatched || templatesMismatched) {
        console.log(`[Sync -> Serenity] Campaign "${senderCamp.title}" (${senderCamp.id}) has updates. Syncing...`);
        
        const { error: updateCampErr } = await serenity
          .from('email_campaigns')
          .update({
            name: senderCamp.title,
            status: mappedStatus,
            campaign_type: mappedType,
            updated_at: new Date().toISOString()
          })
          .eq('id', senderCamp.id);

        if (updateCampErr) {
          console.error(`Failed to update campaign ${senderCamp.id} in Serenity Scrolls:`, updateCampErr);
          continue;
        }

        // Recreate templates if they changed
        if (templatesMismatched) {
          // Delete old templates
          await serenity.from('email_templates').delete().eq('campaign_id', senderCamp.id);
          
          // Insert new ones
          const emails = senderCamp.sequence_data?.emails || [];
          if (emails.length > 0) {
            const templatesToInsert = emails.map((email, idx) => ({
              campaign_id: senderCamp.id,
              sequence_order: idx + 1,
              subject: email.subject || 'No Subject',
              content_html: email.body || email.html || '',
              created_at: senderCamp.created_at
            }));

            const { error: insertTemplatesErr } = await serenity
              .from('email_templates')
              .insert(templatesToInsert);

            if (insertTemplatesErr) {
              console.error(`Failed to re-insert templates for campaign ${senderCamp.id}:`, insertTemplatesErr);
            }
          }
        }
        syncedToSerenityCount++;
      }
    }
  }

  // 3. Sync from Serenity Scrolls to Sienvi Sender
  for (const serenityCamp of serenityCampaigns) {
    const senderCamp = senderMap.get(serenityCamp.id);

    if (!senderCamp) {
      // Campaign exists in Serenity but not in Sender -> Create in Sender
      console.log(`[Sync -> Sender] Campaign "${serenityCamp.name}" (${serenityCamp.id}) is missing. Recreating...`);

      const mappedStatus = mapSerenityStatusToSender(serenityCamp.status);
      const mappedType = mapSerenityTypeToSender(serenityCamp.campaign_type);
      
      const templates = serenityCamp.email_templates || [];
      const sortedTemplates = [...templates].sort((a, b) => a.sequence_order - b.sequence_order);

      const sequence_data = {
        emails: sortedTemplates.map(t => ({
          subject: t.subject,
          previewText: '',
          body: t.content_html,
          attachments: []
        })),
        schedules: sortedTemplates.map(t => null),
        resendIds: [],
        recipients: [],
        is_testing: false
      };

      const { error: insertCampErr } = await sender
        .from('campaigns')
        .insert({
          id: serenityCamp.id,
          client_id: SERENITY_CLIENT_ID,
          title: serenityCamp.name,
          status: mappedStatus,
          type: mappedType,
          created_at: serenityCamp.created_at,
          sequence_data: sequence_data
        });

      if (insertCampErr) {
        console.error(`Failed to insert campaign ${serenityCamp.id} into Sienvi Sender:`, insertCampErr);
        continue;
      }

      syncedToSenderCount++;
    } else {
      // Campaign exists in both -> Check if update is needed
      const mappedStatus = mapSerenityStatusToSender(serenityCamp.status);
      const mappedType = mapSerenityTypeToSender(serenityCamp.campaign_type);

      const statusMismatched = senderCamp.status !== mappedStatus;
      const titleMismatched = senderCamp.title !== serenityCamp.name;

      const senderEmails = senderCamp.sequence_data?.emails || [];
      const serenityTemplates = serenityCamp.email_templates || [];
      let templatesMismatched = senderEmails.length !== serenityTemplates.length;

      if (!templatesMismatched) {
        const sortedSerenityTemplates = [...serenityTemplates].sort((a, b) => a.sequence_order - b.sequence_order);
        for (let i = 0; i < senderEmails.length; i++) {
          const sEmail = senderEmails[i];
          const sTmpl = sortedSerenityTemplates[i];
          if (sEmail.subject !== sTmpl.subject || (sEmail.body || sEmail.html || '') !== sTmpl.content_html) {
            templatesMismatched = true;
            break;
          }
        }
      }

      if (statusMismatched || titleMismatched || templatesMismatched) {
        console.log(`[Sync -> Sender] Campaign "${serenityCamp.name}" (${serenityCamp.id}) has updates. Syncing...`);
        
        const sortedTemplates = [...serenityTemplates].sort((a, b) => a.sequence_order - b.sequence_order);
        const sequence_data = {
          ...senderCamp.sequence_data,
          emails: sortedTemplates.map(t => ({
            subject: t.subject,
            previewText: '',
            body: t.content_html,
            attachments: []
          }))
        };

        const { error: updateCampErr } = await sender
          .from('campaigns')
          .update({
            title: serenityCamp.name,
            status: mappedStatus,
            type: mappedType,
            sequence_data: sequence_data
          })
          .eq('id', serenityCamp.id);

        if (updateCampErr) {
          console.error(`Failed to update campaign ${serenityCamp.id} in Sienvi Sender:`, updateCampErr);
          continue;
        }

        syncedToSenderCount++;
      }
    }
  }

  console.log('--- SYNC COMPLETED SUCCESSFULLY ---');
  console.log(`Campaigns synced/updated to Serenity Scrolls: ${syncedToSerenityCount}`);
  console.log(`Campaigns synced/updated to Sienvi Sender: ${syncedToSenderCount}`);
}

syncCampaigns().catch(console.error);
