import { Snowflake } from 'discord-api-types/globals';
import { Oauth } from '@classes/Oauth';
import { Permissions } from '@bitfields/Permissions';
import { CDNOptions } from '../types/CDNOptions';
import { OAuthGuild } from '../types/OAuthGuild';

/**
 * Represents a partial Discord guild from OAuth2
 */
export class Guild {
	/** OAuth client instance */
	readonly #client: Oauth;

	/** Guild's unique ID */
	readonly id: Snowflake;
	/** Guild's name */
	readonly name: string;
	/** Guild's icon hash */
	readonly icon: string | null;
	/** Whether the user is the owner of the guild */
	readonly owner: boolean;
	/** Guild features */
	readonly features: string[];
	/** User's permissions in the guild as array of permission names */
	readonly permissions: string[];

	/**
	 * Creates a new Guild instance
	 * @param client - OAuth client instance
	 * @param data - Raw guild data from Discord API
	 */
	constructor(client: Oauth, data: OAuthGuild) {
		this.#client = client;
		this.id = data.id;
		this.name = data.name;
		this.icon = data.icon;
		this.owner = data.owner;
		this.features = data.features;
		this.permissions = new Permissions(data.permissions).toArray();
	}

	/**
	 * Gets the guild's icon URL
	 * @param options - CDN options for the URL
	 * @returns The icon URL or null if none exists
	 */
	iconURL(options?: CDNOptions): string | null {
		if (!this.icon) {
			return null;
		}
		const format = options?.format ?? 'png';
		const size = options?.size ?? 512;
		return `https://cdn.discordapp.com/icons/${this.id}/${this.icon}.${format}?size=${size}`;
	}

	/**
	 * Checks if the guild has a specific feature
	 * @param feature - The feature to check for
	 * @returns Whether the guild has the feature
	 */
	hasFeature(feature: string): boolean {
		return this.features.includes(feature.toUpperCase());
	}

	/**
	 * Checks if the user has a specific permission in the guild
	 * @param permission - The permission to check for
	 * @returns Whether the user has the permission
	 */
	hasPermission(permission: string): boolean {
		return this.permissions.includes(permission);
	}

	/**
	 * Converts the guild to a JSON object
	 * @returns Plain object representation
	 */
	toJSON(): Record<string, unknown> {
		return {
			id: this.id,
			name: this.name,
			icon: this.icon,
			owner: this.owner,
			features: this.features,
			permissions: this.permissions,
		};
	}

	/**
	 * String representation of the guild
	 * @returns The guild's name
	 */
	toString(): string {
		return this.name;
	}
}