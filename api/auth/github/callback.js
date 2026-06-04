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

  // Decap/Sveltia popup OAuth handshake (must match the CMS exactly):
  //   1. The popup announces readiness by posting "authorizing:github" to
  //      the opener with targetOrigin "*".
  //   2. The CMS replies (echoing "authorizing:github") to the popup. That
  //      reply's `origin` is the CMS's own origin.
  //   3. The popup posts the token back to THAT origin (e.origin) — never
  //      our own origin. The CMS only accepts a message whose origin equals
  //      its configured `base_url` origin, so replying to e.origin is what
  //      makes the handoff land. (See admin/config.yml `base_url`, which
  //      must be the same host the popup ends up on — i.e. the www host.)
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Auth handoff</title></head>
<body>
  <p>Signing in… you can close this window if it doesn't close automatically.</p>
  <script>
    (function () {
      var payload = ${JSON.stringify(payload)};
      function receiveMessage(e) {
        if (e.data !== "authorizing:github" || !window.opener) return;
        window.opener.postMessage(payload, e.origin);
        window.removeEventListener("message", receiveMessage, false);
      }
      window.addEventListener("message", receiveMessage, false);
      // Kick off the handshake; the CMS replies, revealing its origin.
      if (window.opener) {
        window.opener.postMessage("authorizing:github", "*");
      }
    })();
  </script>
</body></html>`);
}
