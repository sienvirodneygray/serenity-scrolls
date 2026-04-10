import express from 'express';
import cors from 'cors';
import { GoogleGenAI, Type } from '@google/genai';

// Initialize the Vertex AI ADK interface natively utilizing application default credentials in Cloud Run
// or explicit API keys based on the environment context.
const ai = new GoogleGenAI({ project: process.env.GOOGLE_CLOUD_PROJECT, location: process.env.VERTEX_AI_LOCATION || 'us-central1' });

const app = express();
app.use(express.json());
app.use(cors());

// Define Output Schema natively using the Vertex SDK for strict JSON Extraction
const EmailSequenceSchema = {
  type: Type.OBJECT,
  properties: {
    emails: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          sequence_order: { type: Type.INTEGER },
          subject: { type: Type.STRING },
          content: { type: Type.STRING, description: "Valid semantic HTML formatted specifically for email bodies without generic layout containers." }
        },
        required: ["sequence_order", "subject", "content"]
      }
    }
  },
  required: ["emails"]
};

app.post('/generate-funnel', async (req, res) => {
  try {
    const { purpose, target_age_group, link, feedback } = req.body;
    
    if (!purpose || !target_age_group) {
        return res.status(400).json({ error: "Missing required intent payload fields." });
    }

    // Step 1: Context definition 
    const systemInstruction = `
      You are an elite marketing copywriter representing Serenity Scrolls. 
      Your task is to generate a pristine 5-email funnel that guides users through Awareness -> Interest -> Desire -> Action.
      Target Demographic: ${target_age_group}.
      Core Purpose: ${purpose}.
      ${link ? `Mandatory Call to Action Link to embed: ${link}` : ''}
      ${feedback ? `Past Feedback to incorporate: ${feedback}` : ''}
      
      Requirements:
      - Strictly return exactly 5 emails in valid JSON format.
      - Enforce semantic HTML (<strong>, <p>, <ul>, <li>, <h2>).
      - Maintain a conversational yet persuasive tone optimized for the demographic.
    `;

    // Step 2 & 3: Delegate to Vertex Agent generation and strict Formatter/Validator logic
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Generate the 5-email funnel now based on the system instructions.",
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: EmailSequenceSchema,
      }
    });

    const parsedJsonPayload = JSON.parse(response.text);

    return res.status(200).json(parsedJsonPayload);

  } catch (error) {
    console.error("AI Generation Error:", error);
    res.status(500).json({ error: "Vertex AI processing failed." });
  }
});

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`Vertex AI Agent Engine booted on ${PORT}`);
});
