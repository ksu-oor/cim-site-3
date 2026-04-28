# CIM Site CMS — One-Time Setup Guide

This is the manual setup that has to happen **once** before the
`/admin/` page works. Follow these steps in order.

## 1. Register the GitHub OAuth App

GitHub OAuth Apps live under either a personal account or an
organization. Register under the **`ksu-oor` organization** so the app
survives staff turnover.

1. Sign in to GitHub as a `ksu-oor` org owner.
2. Visit <https://github.com/organizations/ksu-oor/settings/applications/new>.
3. Fill in the form:
   - **Application name:** `CIM Site CMS`
   - **Homepage URL:** `https://centerforinteractivemedia.com` (replace if you have a custom domain).
   - **Authorization callback URL:** `https://centerforinteractivemedia.com/api/auth/github/callback`
4. Click **Register application**.
5. On the resulting page:
   - **Copy the Client ID.** You'll paste it into Vercel.
   - Click **Generate a new client secret**, **copy it immediately** (it's
     only shown once), and paste it into Vercel.

## 2. Set Vercel Environment Variables

In the Vercel dashboard for the `cim-site-3` project:

1. Go to **Settings → Environment Variables**.
2. Add three variables, each scoped to **Production** and **Preview**:

   | Variable                    | Value                                   |
   |-----------------------------|-----------------------------------------|
   | `GITHUB_OAUTH_CLIENT_ID`    | Client ID from step 1                   |
   | `GITHUB_OAUTH_CLIENT_SECRET`| Client Secret from step 1 (mark as encrypted) |
   | `SITE_URL`                  | `https://centerforinteractivemedia.com` (or custom domain) |

3. Trigger a redeploy so the new env vars are picked up by the
   serverless functions (push any commit, or click **Redeploy** in the
   Deployments tab).

## 3. Add Editor Collaborators on GitHub

Sveltia uses GitHub repo collaborator status to decide who can edit.
There is no separate editor list — adding/removing collaborators in
GitHub directly controls admin access.

1. Visit <https://github.com/ksu-oor/cim-site-3/settings/access>.
2. Click **Add people** and invite each editor by GitHub username.
3. Set role to **Write** (sufficient to commit content changes).

Editors must have a GitHub account. If they don't, point them to
<https://github.com/signup>.

## 4. Test the Login

1. Visit `https://centerforinteractivemedia.com/admin/`.
2. Click **Sign in with GitHub**.
3. A popup opens GitHub's OAuth consent screen. Click **Authorize ksu-oor**.
4. Popup closes; the admin should now show the Sveltia editor with
   collections listed (Site Settings, Spotlight Carousels, Sponsors &
   Partners, Faculty).

If the popup gets stuck or returns an error:

- Check the browser console for a postMessage error.
- Verify the OAuth callback URL in step 1 matches your live `SITE_URL`
  exactly (a trailing slash mismatch is a common cause).
- Verify the env vars in Vercel are populated and the project has
  redeployed since they were set.

## 5. (Optional) Custom Domain

If you set up a custom domain (e.g., `cim.kennesaw.edu`):

1. Update `SITE_URL` in Vercel env to the new domain.
2. Update the OAuth callback URL on GitHub: visit the OAuth App page and
   change the "Authorization callback URL" to
   `https://<your-domain>/api/auth/github/callback`.
3. Update `admin/config.yml` `base_url:` line to the new domain
   (commit + push).

## What Editors Can Do

Once setup is complete, editors at `/admin/` can edit:

- **Site Settings** — institution, footer copy, contact email, footer clusters.
- **Homepage Hero** — eyebrow label, title, subtitle, description, CTA.
- **Launch Event** — both the homepage tile and the full event landing page (info rows, agenda, featured presentations, sponsors, organizations).
- **Spotlight Carousels** — three carousels (Research / Showcase / Touchpoint), each with variant slides:
  - Project list, stats grid, sponsor grid, partner grid, faculty bar, game card, feature, touchpoint.
- **Sponsors & Partners** — single source of truth for both spotlight grids. Add a new partner with either an existing CSS class or by uploading a logo image.
- **Faculty** — 49 members across 6 college sections; add/remove members or whole colleges; sidebar order is configurable.

The accessibility statement page (`accessibility.html`) is **not** in
the CMS — it's developer-edited because of its heavily-styled prose.
Updates require a small PR.

## What Happens When an Editor Saves

1. Editor clicks **Save** in Sveltia.
2. Sveltia uses the editor's GitHub OAuth token to PUT the updated JSON
   file via the GitHub Contents API. The commit is attributed to the
   editor's GitHub account.
3. Vercel detects the push to `main` and runs `npm run build` (Eleventy).
4. The new HTML deploys (~30 seconds total).

Each save is one commit, so `git log` is the editor audit trail.
