// const { OAuth2Client } = require('google-auth-library');
import { OAuth2Client } from 'google-auth-library';



// Helper to get client lazily (so env vars are loaded first)
function getClient() {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

// Minimal: just redirect to Google login
function redirectToGoogle(req, res) {
  const client = getClient();
  const url = client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'email', 
      'profile',
      'https://www.googleapis.com/auth/gmail.readonly' 
    ],
    prompt: 'consent',
  });
  res.redirect(url);
}

// Minimal: just handle callback and show token (for demo)
async function googleCallback(req, res) {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send('Missing code');
  }
  try {
    const client = getClient();
    const { tokens } = await client.getToken(code);
    
    // 1. Verify the ID token to get user profile
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    // 2. Store user in session
    req.session.tokens = tokens; // Save tokens to make API calls later
    req.session.user = {
      googleId: payload.sub,
      name: payload.name,
      email: payload.email,
      picture: payload.picture
    };

    // 3. Save tokens to session or database for later use
    req.session.tokens = tokens;

    // 4. Redirect back to frontend
    res.redirect('http://localhost:3000/?login=success');
  } catch (err) {
    console.error('OAuth Error:', err);
    res.status(500).send('OAuth error: ' + err.message);
  }
}



export { redirectToGoogle, googleCallback };

