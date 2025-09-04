/** @format */

// main/googleAuth.js
import http from 'http';
import { URL } from 'url';
import { google } from 'googleapis';

const OAUTH_PORT = 51791; // nhớ add vào Authorized redirect URI: http://127.0.0.1:51791/
const REDIRECT_URI = `http://127.0.0.1:${OAUTH_PORT}/`;

class GoogleAuth {
	constructor({ clientId, clientSecret }) {
		this.oAuth2Client = new google.auth.OAuth2(
			clientId,
			clientSecret,
			REDIRECT_URI
		);
		this.tokens = null; // {access_token, refresh_token, ...}
	}

	getAuthUrl() {
		const scopes = ['https://www.googleapis.com/auth/drive.file'];
		return this.oAuth2Client.generateAuthUrl({
			access_type: 'offline',
			prompt: 'consent',
			scope: scopes,
		});
	}

	async startLocalServerWaitForCode() {
		return new Promise((resolve, reject) => {
			const server = http.createServer(async (req, res) => {
				try {
					const url = new URL(req.url, `http://127.0.0.1:${OAUTH_PORT}`);
					const code = url.searchParams.get('code');
					if (!code) {
						res.writeHead(400);
						res.end('Missing code');
						return;
					}
					const { tokens } = await this.oAuth2Client.getToken(code);
					this.oAuth2Client.setCredentials(tokens);
					this.tokens = tokens;

					res.statusCode = 200;
					res.setHeader('Content-Type', 'text/html');
					res.end(
						'<html><body><p>Login successful. You can close this window.</p></body></html>'
					);
					server.close();
					resolve(tokens);
				} catch (e) {
					reject(e);
				}
			});
			server.listen(OAUTH_PORT, '127.0.0.1');
		});
	}

	setTokens(tokens) {
		this.tokens = tokens;
		this.oAuth2Client.setCredentials(tokens);
	}

	getTokens() {
		return this.tokens;
	}

	getClient() {
		return this.oAuth2Client;
	}
}

export { GoogleAuth };
