const apiKey = "re_VYkadkXm_Pz5kCJQJVMcwL32UyoRBpGAb";
const fs = require('fs');

async function send() {
  const expiryHtml = fs.readFileSync('preview-expiry-notice.html', 'utf8');
  const reminderHtml = fs.readFileSync('preview-trial-reminder.html', 'utf8');

  const expiryBody = {
    from: "Serenity Scrolls <noreply@serenityscrolls.faith>",
    to: ["ivllnv.000@gmail.com"],
    subject: "Your Serenity Scrolls Access Has Ended 📜",
    html: expiryHtml
  };

  const reminderBody = {
    from: "Serenity Scrolls <noreply@serenityscrolls.faith>",
    to: ["ivllnv.000@gmail.com"],
    subject: "Your Serenity Scrolls Access Ends in 5 Days 📜",
    html: reminderHtml
  };

  console.log("Sending expiry...");
  try {
      let r1 = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(expiryBody)
      });
      console.log(await r1.json());
  } catch(e) { console.error(e) }

  console.log("Sending reminder...");
  try {
      let r2 = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(reminderBody)
      });
      console.log(await r2.json());
  } catch(e) { console.error(e) }
}
send();
