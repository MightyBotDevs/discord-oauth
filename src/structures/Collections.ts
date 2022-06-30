import { Oauth } from '@classes/Oauth';

export class Collection extends Map {
	client: Oauth;
	constructor(client, values) {
		super();
		for (const v of values || []) if (typeof v.id !== 'undefined') this.set(v.id, v);
		this.client = client;
	}
}

export class UserCollection extends Collection {
	constructor(...params) {
		// @ts-ignore
		super(...params);
	}

	async fetch(key, cache = true) {
		return new Promise((resolve, reject) => {
			if (this.has(key) && cache) {resolve(this.get(key));}
			else {
				this.client
					.getUser(key)
					.then(user => {
						this.set(key, user);
						resolve(user);
					})
					.catch(reject);
			}
		});
	}
}


export class GuildsCollection extends Collection {
	constructor(...params) {
		// @ts-ignore
		super(...params);
	}

	async fetch(key, cache = true) {
		return new Promise((resolve, reject) => {
			if (this.has(key) && cache) {resolve(this.get(key));}
			else {
				this.client
					.getGuilds(key)
					.then(guilds => {
						this.set(key, guilds);
						resolve(guilds);
					})
					.catch(reject);
			}
		});
	}
}