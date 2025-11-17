import { Snowflake } from 'discord-api-types/globals';

/**
 * Represents a partial guild object returned from OAuth2
 */
export interface OAuthGuild {
	/** Guild ID */
	id: Snowflake;
	/** Guild name */
	name: string;
	/** Guild icon hash */
	icon: string | null;
	/** Whether the user is the owner of the guild */
	owner: boolean;
	/** Total permissions for the user in the guild (excludes overwrites) */
	permissions: string;
	/** Enabled guild features */
	features: string[];
}