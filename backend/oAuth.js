// const { OAuth2Client } = require('google-auth-library');
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

function redirectToAppWithLoginSuccess(res) {
  const url = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["email", "profile"]
  });

  console.log('Auth URL:', url);
  try {
    const u = new URL(url);
    console.log('client_id param:', u.searchParams.get('client_id') ? 'present' : 'MISSING');
    console.log('redirect_uri param:', u.searchParams.get('redirect_uri'));
  } catch (err) {
    console.log('Could not parse auth URL for debug:', err);
  }
  res.redirect(url);
}

async function googleAuthCallbackHandler(req, res) {
  const code = req.query.code;

  const { tokens } = await client.getToken(code);
  const idToken = tokens.id_token;

  // Verify the token
  const ticket = await client.verifyIdToken({
    idToken: idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  // Payload contains user info
  const user = {
    googleId: payload.sub,
    name: payload.name,
    email: payload.email,
    picture: payload.picture
  };
  req.session.user = user;            // store user on the server session
  // redirect to your React app - use a safe front-end route
  res.redirect('http://localhost:3000/?login=success'); //passing login success param
}

function authMeHandler(req, res) {
  if (req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
}

export{
  redirectToAppWithLoginSuccess,
  googleAuthCallbackHandler,
  authMeHandler
};