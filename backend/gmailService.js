import { google } from 'googleapis';

// 1. Initialize Gmail Client
// You need an authenticated OAuth2Client (from your oAuth.js file)
function getGmailClient(authClient) {
  return google.gmail({ version: 'v1', auth: authClient });
}

// 2. Function to list emails after a date
export async function getEmailsAfterDate(authClient, dateString) {
  // dateString example: "2024/01/01"
  const gmail = getGmailClient(authClient);
  
  try {
    // List messages
    // q parameter supports standard Gmail search queries
    const res = await gmail.users.messages.list({
      userId: 'me',
      q: `after:${dateString}`,
      maxResults: 20 // Limit for testing!
    });

    const messages = res.data.messages || [];
    console.log(`Found ${messages.length} messages.`);
    
    // 3. Process each message to get details
    const fullEmails = [];
    for (const msg of messages) {
      const emailData = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id
      });
      
      // Parse useful headers (Subject, From)
      const headers = emailData.data.payload.headers;
      const subject = headers.find(h => h.name === 'Subject')?.value;
      const from = headers.find(h => h.name === 'From')?.value;
      const snippet = emailData.data.snippet; // Short preview text

      fullEmails.push({
        id: msg.id,
        subject,
        from,
        snippet
      });
    }

    return fullEmails;

  } catch (error) {
    console.error('Error fetching emails:', error);
    throw error;
  }
}