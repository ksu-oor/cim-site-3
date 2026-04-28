// GitHub OAuth — token exchange + postMessage handoff.
//
// GitHub redirects here with a one-time auth code after the user consents.
// We exchange the code for an access token via GitHub's POST endpoint
// (this MUST happen server-side because it requires the client_secret
// which can never ship in browser JS), then post the token back to the
// Sveltia admin window via the popup-handoff pattern.
//
// Env vars required:
//   GITHUB_OAUTH_CLIENT_ID
//   GITHUB_OAUTH_CLIENT_SECRET (encrypted in Vercel env)

export default async function handler(req, res) {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    res.status(500).send(
      "OAuth not configured. Set GITHUB_OAUTH_CLIENT_ID and GITHUB_OAUTH_CLIENT_SECRET in Vercel env."
    );
    return;
  }

  const { code } = req.query;
  if (!code) {
    res.status(400).send("Missing authorization code.");
    return;
  }

  let payload;
  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });
    const data = await tokenRes.json();

    if (data.error) {
      payload = `authorization:github:error:${JSON.stringify({ error: data.error_description || data.error })}`;
    } else if (!data.access_token) {
      payload = `authorization:github:error:${JSON.stringify({ error: "no token returned" })}`;
    } else {
      payload = `authorization:github:success:${JSON.stringify({ token: data.access_token, provider: "github" })}`;
    }
  } catch (err) {
    payload = `authorization:github:error:${JSON.stringify({ error: String(err) })}`;
  }

  // Sveltia (and Decap) listen for a `postMessage` from the popup and pull
  // the token out. The opener also sends a message first to trigger the
  // handshake (some browsers require the postMessage to be in response to
  // a user-driven event, which the parent's "authorizing:github" message
  // counts as).
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Auth handoff</title></head>
<body>
  <p>Signing in… you can close this window if it doesn't close automatically.</p>
  <script>
    (function () {
      var payload = ${JSON.stringify(payload)};
      function send() {
        if (window.opener) {
          window.opener.postMessage(payload, window.location.origin);
        }
      }
      window.addEventListener("message", send, { once: false });
      // Also send unprompted in case the parent's listener was set up first.
      send();
    })();
  </script>
</body></html>`);
}
