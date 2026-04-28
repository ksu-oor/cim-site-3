// GitHub OAuth — initial redirect.
//
// Sveltia CMS opens this URL in a popup. We redirect the browser to
// github.com's OAuth consent screen with our client ID and a callback
// URL. After the user consents, GitHub redirects back to our callback
// (api/auth/github/callback) with a one-time auth code.
//
// Env vars required (set in Vercel project settings):
//   GITHUB_OAUTH_CLIENT_ID — from github.com/organizations/ksu-oor/settings/applications
//   SITE_URL — e.g. https://cim-site-3.vercel.app

export default function handler(req, res) {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const siteUrl = process.env.SITE_URL;

  if (!clientId || !siteUrl) {
    res.status(500).send(
      "OAuth not configured. Set GITHUB_OAUTH_CLIENT_ID and SITE_URL in Vercel env."
    );
    return;
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${siteUrl}/api/auth/github/callback`,
    // 'repo' scope lets the editor commit content changes; 'user' lets
    // Sveltia show the editor's name and avatar in the UI.
    scope: "repo,user",
    state: req.query.state || "",
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
}
