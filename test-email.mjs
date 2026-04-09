import fs from 'fs';

const apiKey = "re_VYkadkXm_Pz5kCJQJVMcwL32UyoRBpGAb";

async function send() {
  const approvedHtml = fs.readFileSync('preview-access-approved.html', 'utf8');
  const expiryHtml = fs.readFileSync('preview-expiry-notice.html', 'utf8');
  const reminderHtml = fs.readFileSync('preview-trial-reminder.html', 'utf8');

  console.log("Sending all 3 emails with working links...");

  const emails = [
    {
      from: "Serenity Scrolls <noreply@serenityscrolls.faith>",
      to: ["ivllnv.000@gmail.com"],
      subject: "Your Serenity Scrolls Access Has Been Approved! ✨",
      html: approvedHtml
    },
    {
      from: "Serenity Scrolls <noreply@serenityscrolls.faith>",
      to: ["ivllnv.000@gmail.com"],
      subject: "Your Serenity Scrolls Access Has Ended 📜",
      html: expiryHtml
    },
    {
      from: "Serenity Scrolls <noreply@serenityscrolls.faith>",
      to: ["ivllnv.000@gmail.com"],
      subject: "Your Serenity Scrolls Access Ends in 5 Days 📜",
      html: reminderHtml
    }
  ];

  for (const body of emails) {
    try {
      let r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      console.log(`Sent ${body.subject}: `, await r.json());
    } catch(e) { console.error(e) }
  }
}
send();
