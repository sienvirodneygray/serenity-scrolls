import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import crypto from 'crypto';

function getDeterministicUUID(seed) {
  const hash = crypto.createHash('sha256').update(seed).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

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

const serenityUrl = envSerenity.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serenityKey = envSerenity.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const senderUrl = envSender.NEXT_PUBLIC_SUPABASE_URL || envSerenity.NEXT_PUBLIC_SENDER_SUPABASE_URL || process.env.NEXT_PUBLIC_SENDER_SUPABASE_URL;
const senderKey = envSender.SUPABASE_SERVICE_ROLE_KEY || envSerenity.SENDER_SUPABASE_SERVICE_ROLE_KEY || process.env.SENDER_SUPABASE_SERVICE_ROLE_KEY;

if (!serenityUrl || !serenityKey || !senderUrl || !senderKey) {
  console.error('Error: Database URLs or Service role keys are missing in environment configuration!');
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

  console.log('--- CAMPAIGN SYNC COMPLETED ---');
  console.log(`Campaigns synced/updated to Serenity Scrolls: ${syncedToSerenityCount}`);
  console.log(`Campaigns synced/updated to Sienvi Sender: ${syncedToSenderCount}`);

  // 4. Sync Segments, Recipients, and Email Sends to local CRM metrics tables
  await syncCRMAndTrackingMetrics();
}

function mapSenderStatusToSendStatus(status) {
  const s = (status || '').toLowerCase();
  if (['queued', 'sent', 'delivered', 'bounced', 'complaint', 'failed'].includes(s)) {
    return s;
  }
  if (s === 'opened' || s === 'clicked') {
    return 'delivered';
  }
  if (s === 'complained') {
    return 'complaint';
  }
  return 'sent';
}

async function syncCRMAndTrackingMetrics() {
  console.log('--- STARTING CRM CONTACTS & METRICS SYNC ---');
  const batchSize = 500;
  const pageSize = 1000;

  // 1. Sync custom_segments -> customer_groups
  console.log('Syncing segments...');
  const { data: senderSegments, error: segErr } = await sender.from('custom_segments').select('*');
  if (segErr) {
    console.error('Error fetching segments:', segErr);
    return;
  }

  const groupsToUpsert = senderSegments.map(s => ({
    id: s.id,
    name: s.name,
    description: s.description || '',
    created_at: s.created_at,
    updated_at: new Date().toISOString()
  }));

  const { error: upsertGroupsErr } = await serenity.from('customer_groups').upsert(groupsToUpsert);
  if (upsertGroupsErr) {
    console.error('Error upserting customer groups:', upsertGroupsErr);
    return;
  }
  console.log(`Synced ${groupsToUpsert.length} customer groups.`);

  // Fetch updated groups from Serenity to map segments to group IDs
  const { data: serenityGroups } = await serenity.from('customer_groups').select('*');
  const groupByNameMap = new Map(serenityGroups.map(g => [g.name.toLowerCase().trim(), g]));

  // 2. Sync recipients -> customers
  console.log('Syncing recipients...');
  let allRecipients = [];
  let page = 0;
  
  while (true) {
    const { data: chunk, error: recErr } = await sender
      .from('recipients')
      .select('*')
      .eq('client_id', SERENITY_CLIENT_ID)
      .range(page * pageSize, (page + 1) * pageSize - 1);
    
    if (recErr) {
      console.error('Error fetching recipients:', recErr);
      return;
    }
    if (!chunk || chunk.length === 0) break;
    
    allRecipients.push(...chunk);
    page++;
  }

  console.log(`Total recipients fetched from Sender: ${allRecipients.length}`);

  // Deduplicate by email address, keeping the latest record
  const emailMap = new Map();
  for (const r of allRecipients) {
    if (!r.email) continue;
    const emailKey = r.email.toLowerCase().trim();
    const existing = emailMap.get(emailKey);
    if (!existing || new Date(r.created_at) > new Date(existing.created_at)) {
      emailMap.set(emailKey, r);
    }
  }

  const uniqueRecipients = Array.from(emailMap.values());
  console.log(`Unique recipients to sync: ${uniqueRecipients.length}`);

  // Prepare customers for upsert
  const customersToUpsert = uniqueRecipients.map(r => {
    const nameParts = (r.name || '').trim().split(/\s+/);
    const first_name = nameParts[0] || '';
    const last_name = nameParts.slice(1).join(' ') || '';
    return {
      id: r.id,
      email: r.email,
      first_name,
      last_name,
      created_at: r.created_at,
      updated_at: new Date().toISOString()
    };
  });

  // Upsert customers in batches
  for (let i = 0; i < customersToUpsert.length; i += batchSize) {
    const chunk = customersToUpsert.slice(i, i + batchSize);
    const { error: upsertCustErr } = await serenity.from('customers').upsert(chunk);
    if (upsertCustErr) {
      console.error(`Failed to upsert customers batch starting at ${i}:`, upsertCustErr);
      return;
    }
  }
  console.log('Successfully synced customers.');

  // 3. Sync customer group memberships
  console.log('Syncing group memberships...');
  const membershipsToInsert = [];
  for (const r of allRecipients) {
    if (!r.segment) continue;
    const segmentNames = r.segment.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    
    const emailKey = r.email.toLowerCase().trim();
    const uniqueRecipient = emailMap.get(emailKey);
    if (!uniqueRecipient) continue;

    for (const name of segmentNames) {
      const group = groupByNameMap.get(name);
      if (group) {
        membershipsToInsert.push({
          customer_id: uniqueRecipient.id,
          group_id: group.id
        });
      }
    }
  }

  // Deduplicate memberships
  const membershipSet = new Set();
  const uniqueMemberships = [];
  for (const m of membershipsToInsert) {
    const key = `${m.customer_id}-${m.group_id}`;
    if (!membershipSet.has(key)) {
      membershipSet.add(key);
      uniqueMemberships.push(m);
    }
  }

  console.log(`Recreating ${uniqueMemberships.length} memberships...`);
  const customerIds = uniqueRecipients.map(r => r.id);
  for (let i = 0; i < customerIds.length; i += batchSize) {
    const chunk = customerIds.slice(i, i + batchSize);
    await serenity.from('customer_group_memberships').delete().in('customer_id', chunk);
  }

  for (let i = 0; i < uniqueMemberships.length; i += batchSize) {
    const chunk = uniqueMemberships.slice(i, i + batchSize);
    const { error: insMemErr } = await serenity.from('customer_group_memberships').insert(chunk);
    if (insMemErr) {
      console.error(`Failed to insert memberships batch starting at ${i}:`, insMemErr);
      return;
    }
  }
  console.log('Successfully synced customer memberships.');

  // 4. Sync email_tracking -> email_sends
  console.log('Syncing email sends...');
  const { data: serenityCampaigns } = await serenity.from('email_campaigns').select('id');
  const campaignIds = serenityCampaigns.map(c => c.id);
  
  if (campaignIds.length === 0) {
    console.log('No campaigns found in Serenity. Skipping sends sync.');
    return;
  }

  // Map campaign_id to first template_id
  const { data: serenityTemplates } = await serenity
    .from('email_templates')
    .select('id, campaign_id, sequence_order');
  
  const campaignTemplateMap = new Map();
  for (const t of serenityTemplates || []) {
    if (!campaignTemplateMap.has(t.campaign_id)) {
      campaignTemplateMap.set(t.campaign_id, []);
    }
    campaignTemplateMap.get(t.campaign_id).push(t);
  }

  const firstTemplateByCampaign = new Map();
  for (const [campId, tmpls] of campaignTemplateMap.entries()) {
    tmpls.sort((a, b) => a.sequence_order - b.sequence_order);
    if (tmpls.length > 0) {
      firstTemplateByCampaign.set(campId, tmpls[0].id);
    }
  }

  let allTracking = [];
  let trackPage = 0;
  
  while (true) {
    const { data: chunk, error: trackErr } = await sender
      .from('email_tracking')
      .select('*')
      .in('campaign_id', campaignIds)
      .range(trackPage * pageSize, (trackPage + 1) * pageSize - 1);
    
    if (trackErr) {
      console.error('Error fetching email tracking:', trackErr);
      return;
    }
    if (!chunk || chunk.length === 0) break;
    
    allTracking.push(...chunk);
    trackPage++;
  }

  console.log(`Fetched ${allTracking.length} tracking logs from Sender.`);

  const customerIdByEmail = new Map(uniqueRecipients.map(r => [r.email.toLowerCase().trim(), r.id]));

  const sendsToUpsert = [];
  for (const t of allTracking) {
    const emailKey = t.recipient_email.toLowerCase().trim();
    const customerId = customerIdByEmail.get(emailKey) || null;
    const templateId = firstTemplateByCampaign.get(t.campaign_id) || null;
    
    if (!templateId) continue; // Skip if no template in local DB

    sendsToUpsert.push({
      id: t.id,
      campaign_id: t.campaign_id,
      customer_id: customerId,
      template_id: templateId,
      status: mapSenderStatusToSendStatus(t.status),
      provider_id: t.resend_id || null,
      sent_at: t.created_at,
      created_at: t.created_at
    });
  }

  for (let i = 0; i < sendsToUpsert.length; i += batchSize) {
    const chunk = sendsToUpsert.slice(i, i + batchSize);
    const { error: upsertSendsErr } = await serenity.from('email_sends').upsert(chunk);
    if (upsertSendsErr) {
      console.error(`Failed to upsert email sends batch starting at ${i}:`, upsertSendsErr);
      return;
    }
  }

  console.log(`Successfully synced ${sendsToUpsert.length} email sends.`);

  // 5. Sync campaign_schedules
  console.log('Syncing campaign schedules...');
  const schedulesToUpsert = [];
  const { data: senderCampsWithSchedules, error: campsSchedErr } = await sender
    .from('campaigns')
    .select('id, sequence_data')
    .eq('client_id', SERENITY_CLIENT_ID);
  
  if (campsSchedErr) {
    console.error('Error fetching campaigns for schedules sync:', campsSchedErr);
  } else {
    for (const c of senderCampsWithSchedules || []) {
      const templates = campaignTemplateMap.get(c.id) || [];
      templates.sort((a, b) => a.sequence_order - b.sequence_order);
      
      const schedules = c.sequence_data?.schedules || [];
      for (let i = 0; i < templates.length; i++) {
        const template = templates[i];
        const schedTime = schedules[i];
        if (!schedTime) continue;
        
        const scheduledDate = new Date(schedTime);
        if (isNaN(scheduledDate.getTime())) continue;
        
        const isFuture = scheduledDate.getTime() > Date.now();
        const status = isFuture ? 'pending' : 'completed';
        const deterministicId = getDeterministicUUID(`${c.id}-${template.id}-${schedTime}`);
        
        schedulesToUpsert.push({
          id: deterministicId,
          campaign_id: c.id,
          email_template_id: template.id,
          scheduled_at: scheduledDate.toISOString(),
          status: status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }
    
    for (let i = 0; i < schedulesToUpsert.length; i += batchSize) {
      const chunk = schedulesToUpsert.slice(i, i + batchSize);
      const { error: upsertSchedErr } = await serenity.from('campaign_schedules').upsert(chunk);
      if (upsertSchedErr) {
        console.error(`Failed to upsert campaign schedules batch starting at ${i}:`, upsertSchedErr);
        return;
      }
    }
    console.log(`Successfully synced ${schedulesToUpsert.length} campaign schedules.`);
  }

  console.log('--- CRM METRICS SYNC COMPLETED SUCCESSFULLY ---');
}

syncCampaigns().catch(console.error);
