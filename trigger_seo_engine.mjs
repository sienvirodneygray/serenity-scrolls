import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ytaporbcmtlidafbssyc.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0YXBvcmJjbXRsaWRhZmJzc3ljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjcyMDg4OSwiZXhwIjoyMDg4Mjk2ODg5fQ.GIJ8uc2yTknv4-XSyN-box0YJYfwfHNRcJtjKhEJF7w";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function seedAndTrigger() {
  console.log("Checking if seo_config has data...");
  const { data: configs, error: fetchErr } = await supabase.from("seo_config").select("*");
  if (fetchErr) {
    console.error("Error fetching seo_config:", fetchErr);
    return;
  }

  const defaultValues = {
    site_name: "Serenity Scrolls",
    publish_enabled: true,
    schedule_days: ["monday", "wednesday", "friday"],
    publish_time: "09:00:00",
    niche_summary: "Scripture scrolls, prayer journals, and family boundary building curricula.",
    audience_personas: "Christian families, Christian parents, people facing anxiety, ministry leaders.",
    cta_preference: "Redirect to Courage Covenant LMS or invite to sign up for newsletter.",
    brand_voice: {
      tone: "encouraging, thoughtful, biblically sound, calming",
      prohibited_words: ["drop-ship", "print-on-demand", "cheap novelties"]
    }
  };

  if (configs.length === 0) {
    console.log("No config found. Seeding default seo_config row...");
    const { data: inserted, error: insertErr } = await supabase.from("seo_config").insert([defaultValues]).select();
    if (insertErr) {
      console.error("Error seeding config:", insertErr);
      return;
    }
    console.log("Successfully seeded default config:", inserted);
  } else {
    const existing = configs[0];
    if (!existing.niche_summary) {
      console.log("Updating existing config with niche and brand voice parameters...");
      const { data: updated, error: updateErr } = await supabase
        .from("seo_config")
        .update(defaultValues)
        .eq("id", existing.id)
        .select();

      if (updateErr) {
        console.error("Error updating config:", updateErr);
        return;
      }
      console.log("Updated config details:", updated);
    } else {
      console.log("seo_config already fully configured.");
    }
  }

  // Check topic clusters
  console.log("Checking topic_clusters...");
  const { data: clusters } = await supabase.from("topic_clusters").select("*");
  if (clusters.length === 0) {
    console.log("Seeding initial topic clusters...");
    await supabase.from("topic_clusters").insert([
      {
        name: "Scripture Scrolls for Anxiety",
        description: "Focus on how physical scripture displays serve as tools for emotional grounding and biblical meditation.",
        goals: "Increase rankings for 'bible scrolls for anxiety' and 'scripture tools for peace'",
      },
      {
        name: "Biblical Parenting & Boundaries",
        description: "Cover parental roles, escalations, child boundary exits, and forgiveness according to the Courage Covenant framework.",
        goals: "Promote the Courage Covenant digital curriculum and print journals",
      }
    ]);
    console.log("Seeded initial clusters.");
  } else {
    console.log(`Found ${clusters.length} existing clusters.`);
  }

  // Check topic backlog
  console.log("Checking topic_backlog...");
  const { data: backlog } = await supabase.from("topic_backlog").select("*");
  if (backlog.length === 0) {
    console.log("Seeding initial backlog items...");
    const { data: existingClusters } = await supabase.from("topic_clusters").select("id, name");
    const anxietyCluster = existingClusters.find(c => c.name.includes("Anxiety"))?.id;
    const parentingCluster = existingClusters.find(c => c.name.includes("Parenting"))?.id;

    await supabase.from("topic_backlog").insert([
      {
        topic: "How to use Scripture Scrolls for anxiety and daily reflection",
        cluster_id: anxietyCluster,
        priority: 4,
        format_type: "how-to",
        primary_keyword: "bible scrolls for anxiety"
      },
      {
        topic: "Biblical Forgiveness vs Parental Boundaries: Raising secure children",
        cluster_id: parentingCluster,
        priority: 5,
        format_type: "problem-solution",
        primary_keyword: "biblical boundaries parenting"
      }
    ]);
    console.log("Seeded backlog queue.");
  } else {
    console.log(`Found ${backlog.length} backlog items.`);
  }

  console.log("\nTriggering seo-engine-scheduler to test endpoint response...");
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/seo-engine-scheduler`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ action: "check-schedule" })
    });
    const status = res.status;
    const text = await res.text();
    console.log(`HTTP Status: ${status}`);
    console.log("Response payload:", text);
  } catch (err) {
    console.error("Failed to invoke seo-engine-scheduler:", err);
  }
}

seedAndTrigger();
