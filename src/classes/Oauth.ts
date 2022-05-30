import { RESTPostOAuth2AccessTokenResult, OAuth2Scopes } from 'discord-api-types/v10';
import { DiscordAPIError, DiscordErrorData, OAuthErrorData } from '@discordjs/rest';
import { sign } from 'jsonwebtoken';
import { fetch } from 'undici';

export class Oauth {
	clientSecret: string;
	clientId: string;
	APIURL: string;
	scopes: string[];
	redirectUri: string;

	constructor(id: string, secret: string) {
		this.scopes = [];
		this.clientId = id;
		this.redirectUri = '';
		this.clientSecret = secret;
		this.APIURL = 'https://discord.com/api/v10';
	}

	setRedirectUri(uri: string): string {
		return this.redirectUri = uri;
	}

	setScopes(scopes: OAuth2Scopes[]): string[] {
		return this.scopes = (scopes as OAuth2Scopes[]).filter(scope => Object.values(OAuth2Scopes).includes(scope));
	}

	getAuthorizationURL(): string {
		return `${this.APIURL}/oauth2/authorize?client_id=${this.clientId}&scope=${this.scopes.join('%20')}&response_type=code&redirect_uri=${this.redirectUri}`;
	}

	async getAccess(key) {
		// eslint-disable-next-line no-async-promise-executor
		return new Promise(async (resolve, reject) => {
			if(typeof key !== 'string') return reject('Invalid authorization code');

			try {

				const body = {
					client_id: this.clientId,
					client_secret: this.clientSecret,
					grant_type: 'authorization_code',
					redirect_uri: this.redirectUri,
					code: key,
					scope: this.scopes.join(' '),
				};

				const res = await fetch(`${this.APIURL}/oauth2/token`, {
					method: 'POST',
					body: new URLSearchParams(body),
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
					},
				});

				const json = (await res.json() as (DiscordErrorData & OAuthErrorData) | RESTPostOAuth2AccessTokenResult);

				if(!res.ok) {
					// @ts-ignore
					return reject(new DiscordAPIError(json, json?.code, res.status, 'POST', `${this.APIURL}/oauth2/token`, { files: undefined, body }));
				}

				return resolve(sign(json, this.clientSecret));
			}
			catch(e) {
				console.log(e);
				reject(e);
			}
		});
	}
}