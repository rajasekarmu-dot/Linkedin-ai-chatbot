# Production Environment Configuration

The following table lists all environment variables referenced within the codebase.

| VARIABLE | REQUIRED | PURPOSE | WHERE TO OBTAIN | SECRET? |
|----------|----------|---------|-----------------|---------|
| `LINKEDIN_CLIENT_ID` | Yes | Authenticate OAuth requests | LinkedIn Developer Portal | No |
| `LINKEDIN_CLIENT_SECRET` | Yes | Exchange OAuth codes for tokens | LinkedIn Developer Portal | **Yes** |
| `LINKEDIN_REDIRECT_URI` | Yes | Match authorized callback URLs | Self-defined (e.g. `https://.../api/linkedin/callback`) | No |
| `LINKEDIN_ORGANIZATION_ID` | Yes | Fetch organization posts / CTAs | LinkedIn Company Page URL | No |
| `LINKEDIN_ACCESS_TOKEN` | Optional | Pre-seed a token (mostly for mocks) | Extracted after OAuth / Mock | **Yes** |
| `WHATSAPP_ACCESS_TOKEN` | Yes | Send outbound WhatsApp messages | Meta Developer Portal | **Yes** |
| `WHATSAPP_PHONE_NUMBER_ID` | Yes | Identify sender phone number | Meta Developer Portal | No |
| `WHATSAPP_VERIFY_TOKEN` | Yes | Authorize inbound webhook setups | Meta Developer Portal | **Yes** |
| `WHATSAPP_APP_SECRET` | Yes | Validate X-Hub-Signature webhooks | Meta Developer Portal | **Yes** |
| `SUPABASE_URL` | Yes | Postgres API endpoint | Supabase Project Settings | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Bypass RLS for admin tasks | Supabase API Settings | **Yes** |
| `AI_API_KEY` | Yes | Authenticate OpenAI (or compat) API | OpenAI / LLM Provider Portal | **Yes** |
| `AI_MODEL` | No | Override default `gpt-4o-mini` model | LLM Provider | No |
| `AI_API_BASE_URL` | No | Override default OpenAI base URL | LLM Provider | No |
| `ADMIN_API_KEY` | Yes | Authenticate backend Admin Draft UI | Generate securely via UUID/crypto | **Yes** |
| `PORT` | No | Define Express listening port | Hosting Provider | No |
| `NODE_ENV` | Yes | Toggles dev/test/production logic | Hosting Provider (`production`) | No |

*(Note: Calendar integrations such as Google Calendar or Calendly are currently completely mocked/not implemented, hence there are no corresponding environment variables in the codebase).*
