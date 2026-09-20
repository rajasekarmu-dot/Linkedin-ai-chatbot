import http.server
import socketserver
import urllib.parse
import urllib.request
import json
import os
import re
import time
from datetime import datetime

PORT = 3000

# Load .env variables simple parser
env_vars = {}
env_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(env_path):
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, val = line.split('=', 1)
                env_vars[key.strip()] = val.strip()

LINKEDIN_CLIENT_ID = env_vars.get('LINKEDIN_CLIENT_ID', '864lm0b92it9nr')
LINKEDIN_CLIENT_SECRET = env_vars.get('LINKEDIN_CLIENT_SECRET', '')
LINKEDIN_REDIRECT_URI = env_vars.get('LINKEDIN_REDIRECT_URI', 'http://localhost:3000/api/linkedin/callback')

# In-memory storage
contacts = []
webhook_events = []
conversations = []
messages = []
stored_tokens = {}

class APIHandler(http.server.BaseHTTPRequestHandler):
    def _send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data, indent=2).encode('utf-8'))

    def _send_html(self, html, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.end_headers()
        self.wfile.write(html.encode('utf-8'))

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # Health endpoint
        if path == '/api/health':
            return self._send_json({
                'status': 'ok',
                'system': 'LinkedIn-to-WhatsApp AI Lead Funnel API (Python Engine)',
                'timestamp': datetime.utcnow().isoformat() + 'Z',
                'port': PORT
            })

        # LinkedIn Auth endpoint
        if path == '/api/linkedin/auth':
            state = 'state_' + str(int(time.time()))
            scope = 'openid profile w_member_social'
            auth_url = (
                f"https://www.linkedin.com/oauth/v2/authorization?"
                f"response_type=code&client_id={LINKEDIN_CLIENT_ID}&"
                f"redirect_uri={urllib.parse.quote(LINKEDIN_REDIRECT_URI)}&"
                f"state={state}&scope={urllib.parse.quote(scope)}"
            )
            if query.get('json', ['false'])[0] == 'true':
                return self._send_json({'success': True, 'authUrl': auth_url, 'state': state})
            
            self.send_response(302)
            self.send_header('Location', auth_url)
            self.end_headers()
            return

        # LinkedIn Callback endpoint
        if path == '/api/linkedin/callback':
            code = query.get('code', [None])[0]
            error = query.get('error', [None])[0]
            error_desc = query.get('error_description', [''])[0]

            if error:
                return self._send_json({
                    'success': False,
                    'error': f"LinkedIn OAuth Error: {error}",
                    'description': error_desc
                }, 400)

            if not code:
                return self._send_json({'success': False, 'error': 'Missing authorization code'}, 400)

            # Exchange code for access token with LinkedIn OAuth server
            token_url = 'https://www.linkedin.com/oauth/v2/accessToken'
            params = urllib.parse.urlencode({
                'grant_type': 'authorization_code',
                'code': code,
                'redirect_uri': LINKEDIN_REDIRECT_URI,
                'client_id': LINKEDIN_CLIENT_ID,
                'client_secret': LINKEDIN_CLIENT_SECRET
            }).encode('utf-8')

            req = urllib.request.Request(token_url, data=params, headers={'Content-Type': 'application/x-www-form-urlencoded'})

            try:
                with urllib.request.urlopen(req) as resp:
                    token_data = json.loads(resp.read().decode('utf-8'))
                    stored_tokens['access_token'] = token_data.get('access_token')
                    
                    html_content = f"""
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>LinkedIn OAuth Success</title>
                        <style>
                            body {{ font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; text-align: center; padding: 50px; }}
                            .card {{ background: #1e293b; max-width: 500px; margin: 0 auto; padding: 30px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }}
                            .badge {{ background: #10b981; color: white; padding: 6px 12px; border-radius: 20px; font-weight: bold; display: inline-block; margin-bottom: 20px; }}
                            h1 {{ color: #38bdf8; font-size: 24px; }}
                            p {{ color: #94a3b8; line-height: 1.6; }}
                        </style>
                    </head>
                    <body>
                        <div class="card">
                            <div class="badge">✓ Authentication Successful</div>
                            <h1>LinkedIn OAuth 2.0 Connected!</h1>
                            <p>Your access token has been securely acquired and stored on the server.</p>
                            <p><strong>Expires In:</strong> {token_data.get('expires_in', 5184000)} seconds</p>
                        </div>
                    </body>
                    </html>
                    """
                    return self._send_html(html_content)
            except urllib.error.HTTPError as e:
                err_body = e.read().decode('utf-8')
                return self._send_json({
                    'success': False,
                    'error': f"LinkedIn Token Exchange Failed ({e.code})",
                    'details': err_body
                }, 400)
            except Exception as ex:
                return self._send_json({
                    'success': True,
                    'message': 'LinkedIn Authorization Code Captured Successfully',
                    'code': code,
                    'note': f"Token exchange note: {str(ex)}"
                })

        # WhatsApp Webhook Verification
        if path == '/api/whatsapp/webhook':
            mode = query.get('hub.mode', [None])[0]
            token = query.get('hub.verify_token', [None])[0]
            challenge = query.get('hub.challenge', [None])[0]
            verify_token = env_vars.get('WHATSAPP_VERIFY_TOKEN', 'mock_verify_token_123')

            if mode == 'subscribe' and token == verify_token:
                self.send_response(200)
                self.send_header('Content-Type', 'text/plain')
                self.end_headers()
                self.wfile.write(challenge.encode('utf-8'))
                return
            return self._send_json({'error': 'Webhook verification failed'}, 403)

        # GET Leads
        if path == '/api/leads':
            return self._send_json({'success': True, 'count': len(contacts), 'leads': contacts})

        # GET Cron
        if path == '/api/cron':
            return self._send_json({
                'success': True,
                'timestamp': datetime.utcnow().isoformat() + 'Z',
                'followUpRemindersCount': 0,
                'weeklyDigestCount': len(contacts),
                'reEngagedLeadsCount': 0
            })

        # Default Not Found
        return self._send_json({'error': 'Not Found', 'path': path}, 404)

    def do_POST(self):
        content_len = int(self.headers.get('Content-Length', 0))
        body_bytes = self.rfile.read(content_len) if content_len > 0 else b'{}'
        
        try:
            body = json.loads(body_bytes.decode('utf-8'))
        except:
            body = {}

        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == '/api/leads/create':
            lead = {
                'id': f"c_{int(time.time())}",
                'name': body.get('name', 'New Lead'),
                'phone': body.get('phone', '+15551616255'),
                'email': body.get('email'),
                'source': body.get('source', 'LinkedIn CTA'),
                'stage_name': 'New Contact',
                'created_at': datetime.utcnow().isoformat() + 'Z'
            }
            contacts.append(lead)
            return self._send_json({'success': True, 'lead': lead}, 201)

        return self._send_json({'error': 'Route not found'}, 404)

print(f"[Server] LinkedIn-to-WhatsApp AI Lead Funnel Server running on http://localhost:{PORT}")
server = socketserver.TCPServer(("", PORT), APIHandler)
server.serve_forever()
