import { Oauth } from '@classes/Oauth';
import { Permissions } from '@bitfields/Permissions';
import { CDNOptions } from '../types/CDNOptions';
import { OAuthGuild } from '../types/OAuthGuild';
import { Snowflake } from 'discord-api-types/globals';

/**
 * Guild class
 *
 * @param {Client} client - Client instance
 * @param {OAuthGuild} data - Guild data
 * @class
 * @property {Client} #client - Client instance
 * @property {Snowflake} id - Guild ID
 * @property {string} name - Guild name
 * @property {string} icon - Guild icon
 * @property {string} owner - Is Guild owner?
 * @property {string[]} features - Guild features
 * @property {string[]} permissions - User permissions
 */
export class Guild {
	#client: Oauth;
	id: Snowflake;
	name: string;
	icon: string;
	owner: boolean;
	features: string[];
	permissions: string[];
	constructor(client: Oauth, data: OAuthGuild) {
		this.#client = client;
		this.id = data.id;
		this.name = data.name;
		this.icon = data.icon;
		this.owner = data.owner;
		this.features = data.features;
		this.permissions = new Permissions(Number(data.permissions)).toArray();
	}

	/**
	 * Get the icon URL of the guild
	 * @returns {string}
	 * @param {CDNOptions} options - Options for the link
	 */
	iconURL(options?: CDNOptions): string {
		return `https://cdn.discordapp.com/icons/${this.id}/${this.icon}.${options?.format || 'png'}?size=${options?.size || 512}`;
	}
}