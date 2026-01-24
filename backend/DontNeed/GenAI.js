import {GoogleGenerativeAI} from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.key;
const client = new GoogleGenerativeAI(apiKey);
const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });

// System instructions in correct format
const systemInstruction = {
  role: "system",
  parts: [{
    text: "Return ONLY a single JSON array of objects, each in this format: {\"job\": \"...\", \"company\": \"...\", \"status\": \"...\"}. " +
    "Do NOT include markdown, code blocks, or any extra text. " +
    "Statuses: applied, Technical assessment, interviewing, offered, rejected, other, UnSure. " +
    "LOGIC: " +
    "1. For 'job': Extract the specific title (e.g., 'Software Engineer'). If no title is found, use '[Company Name] Role'. Never use generic terms like 'Application'. " +
    "2. If a coding platform (CodeSignal, HackerRank, etc.) or 'coding challenge' is named, use 'Technical assessment'. " +
    "3. If 'Round [Number]', 'Live', or 'Video/Digital Interview' is mentioned without a coding platform, use 'interviewing'. " +
    "4. If text says 'move forward with other candidates' or 'not moving forward', use 'rejected'. " +
    "Include location/ID in 'job' if available. " +
    "If multiple emails, analyze each email and return an array of objects in the same format. " +
    "If only one email, still return an array with one object."
  }]
};
// Function to chat with the GenAI model and save history
// Pass in username of signed-in user
async function chatWithAI(prompt) {
  try {
    const chat = model.startChat({
      systemInstruction: systemInstruction,
    });

    const result = await chat.sendMessage("Place this email: " +prompt);
    const reply = result.response.text(); 
    //console.log("Received reply from GenAI:", reply);

    return reply;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}


// Function to compact an email for AI prompts (reduces token usage)
function compactEmail(email) {
  // email should be an object with properties: subject, from, to, date, body
  const { subject, from, to, date, body } = email;

  // Extract key metadata
  const metadata = `Subject: ${subject || 'No subject'}\nFrom: ${from || 'Unknown'}\nTo: ${to || 'Unknown'}\nDate: ${date || 'Unknown'}`;

  // Summarize body: take first 200 characters or until a period, whichever is shorter
  let bodySummary = body || '';
  if (bodySummary.length > 200) {
    bodySummary = bodySummary.substring(0, 200) + '...';
  }
  // Try to cut at sentence end
  const lastPeriod = bodySummary.lastIndexOf('.');
  if (lastPeriod > 100) {
    bodySummary = bodySummary.substring(0, lastPeriod + 1);
  }

  return `${metadata}\nBody: ${bodySummary}`;
}


// const compactPrompt = compactEmail({
//   subject: "Job Application Follow-up",
//   from: "recruiter@company.com",
//   to: "you@email.com",
//   date: "2023-10-01",
//   body: "Dear Candidate, Thank you for your application. We are interested in scheduling an interview..."
// });
// Then pass compactPrompt to chatWithAI





export { chatWithAI, compactEmail };