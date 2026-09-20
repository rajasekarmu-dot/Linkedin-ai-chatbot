# LinkedIn Developer & API Setup Guide

This document provides complete instructions for configuring LinkedIn Developer access, OAuth credentials, permitted capabilities, and technical limitations of the LinkedIn API.

---

## 1. Creating the LinkedIn Developer Application
1. Log in to the [LinkedIn Developer Portal](https://www.linkedin.com/developers/).
2. Click **Create App**.
3. Enter your **App Name** (e.g., `De AI Lead Assistant`), associate your official LinkedIn Company Page, and upload a logo.
4. Accept the LinkedIn API Terms of Use and click **Create app**.

---

## 2. Environment Variables Configuration
Set the following variables in your server environment or [.env](file:///d:/Chatbot/linkedin-ai-chatbot/.env):

```env
# LinkedIn Client ID from Developer Portal Auth Tab
LINKEDIN_CLIENT_ID=864lm0b92it9nr

# LinkedIn Client Secret from Developer Portal Auth Tab
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# Configured OAuth Callback Redirect URI
LINKEDIN_REDIRECT_URI=http://localhost:3000/api/linkedin/callback
```

---

## 3. Configuring OAuth Redirect URIs
1. In your LinkedIn App Dashboard, navigate to the **Auth** tab.
2. Under **OAuth 2.0 settings**, find **Authorized redirect URLs for your app**.
3. Add your callback URL: `http://localhost:3000/api/linkedin/callback`
4. Note down the **Client ID** and **Client Secret** under **Application credentials**.

---

## 3. Required LinkedIn Permissions & Products
Add the following products under the **Products** tab of your app:
- **Share on LinkedIn** / **Community Management API**
- **Sign In with LinkedIn using OpenID Connect**

### Permission Scopes Matrix
| Scope Name | Description | Purpose in System |
|------------|-------------|-------------------|
| `r_liteprofile` / `openid` | Basic profile identification | Identify authorized coach account |
| `w_member_social` | Post on behalf of member | Publish post CTAs |
| `r_organization_social` | Read organization posts & metrics | Track post engagement & comment triggers |
| `w_organization_social` | Manage organization posts | Admin post publishing |

---

## 4. How to Obtain the Authorization Code
1. Navigate to `/api/linkedin/auth` in your web browser.
2. The server generates a cryptographically secure `state` parameter and redirects to LinkedIn's authorization server:
   ```
   https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&state={STATE}&scope=r_liteprofile%20w_member_social
   ```
3. Upon user approval, LinkedIn redirects back to `/api/linkedin/callback?code={AUTHORIZATION_CODE}&state={STATE}`.

---

## 5. How Access Tokens Are Stored
- The access token is exchanged server-side inside `/api/linkedin/callback.ts`.
- It is saved in secure server memory / encrypted database (`LINKEDIN_ACCESS_TOKEN`).
- **Security Rule**: Access tokens are **never** exposed to client-side JS or browser responses.

---

## 6. How to Test the LinkedIn API
Run the automated test suite:
```bash
npx vitest run tests/linkedin.test.ts
```
To test manually against live endpoints:
1. Set `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET` in `.env`.
2. Visit `http://localhost:3000/api/linkedin/auth`.
3. Verify successful OAuth completion and test `/api/linkedin/posts`.

---

## 7. Capabilities Requiring Official LinkedIn Approval
- **Organization Post & Comment Monitoring**: Access to `r_organization_social` and `rw_organization_admin` requires owner verification of the LinkedIn Company Page.
- **Community Management API**: Access to real-time webhook event notifications for post comments requires LinkedIn Partnership submission.

---

## 8. Capabilities NOT Available Through Official LinkedIn APIs
> [!CAUTION]
> Official LinkedIn APIs strictly restrict personal user account automation to prevent spam.

- **Automated DMs / InMail from Personal Profiles**: Official LinkedIn API does NOT allow automated messaging or reading DMs for personal profile accounts.
- **Auto-replying to Personal Profile Post Comments**: Automated comment scraping/replying on personal profile posts without Community Management Partner tier is not supported by LinkedIn APIs.
- **WhatsApp Direct CTA Recommendation**: To ensure 100% compliance and reliability, posts use direct WhatsApp CTA links (`wa.me/PHONE?text=...`) which immediately route interested prospects directly into WhatsApp without requiring restricted profile scraping.
