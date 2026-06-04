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

  // Allowlist of origins the token may be handed off to. SECURITY: the token
  // must ONLY ever be postMessage'd to one of OUR OWN origins — never to
  // whatever origin happens to send the handshake. Otherwise a malicious page
  // could open this callback as a popup (becoming window.opener), trigger the
  // handshake, and exfiltrate the victim's GitHub access token to its own
  // origin. We derive the allowlist from SITE_URL and accept both the apex and
  // www hosts (the apex 301-redirects to www, where the CMS/opener lives). If
  // SITE_URL is missing/malformed the allowlist is empty and NO token is sent
  // (fail closed).
  let allowedOrigins = [];
  try {
    const u = new URL((process.env.SITE_URL || "").trim());
    const bareHost = u.host.replace(/^www\./, "");
    allowedOrigins = [`${u.protocol}//${bareHost}`, `${u.protocol}//www.${bareHost}`];
  } catch (_) {
    allowedOrigins = [];
  }

  // Decap/Sveltia popup OAuth handshake:
  //   1. The popup announces readiness by posting "authorizing:github" to the
  //      opener (only to our allowed origins).
  //   2. The CMS replies (echoing "authorizing:github"). We verify that reply
  //      came from window.opener AND from an allowed origin.
  //   3. Only then do we post the token, and only back to that verified origin.
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Auth handoff</title></head>
<body>
  <p>Signing in… you can close this window if it doesn't close automatically.</p>
  <script>
    (function () {
      var payload = ${JSON.stringify(payload)};
      var allowedOrigins = ${JSON.stringify(allowedOrigins)};
      function receiveMessage(e) {
        // Only accept the handshake reply from our own opener, from an
        // allowlisted origin. This is what prevents token exfiltration.
        if (e.source !== window.opener) return;
        if (allowedOrigins.indexOf(e.origin) === -1) return;
        if (e.data !== "authorizing:github") return;
        window.opener.postMessage(payload, e.origin);
        window.removeEventListener("message", receiveMessage, false);
      }
      window.addEventListener("message", receiveMessage, false);
      // Kick off the handshake — announce only to our allowed origins (a post
      // to a non-matching opener origin is silently dropped by the browser).
      if (window.opener) {
        allowedOrigins.forEach(function (o) {
          window.opener.postMessage("authorizing:github", o);
        });
      }
    })();
  </script>
</body></html>`);
}
