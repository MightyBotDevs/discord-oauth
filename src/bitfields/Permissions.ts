import { BitField } from './BitField';

/**
 * Bitfield values for Discord permissions
 */
export const PermissionFlagsBits = {
	CREATE_INSTANT_INVITE: 1n << 0n,
	KICK_MEMBERS: 1n << 1n,
	BAN_MEMBERS: 1n << 2n,
	ADMINISTRATOR: 1n << 3n,
	MANAGE_CHANNELS: 1n << 4n,
	MANAGE_GUILD: 1n << 5n,
	ADD_REACTIONS: 1n << 6n,
	VIEW_AUDIT_LOG: 1n << 7n,
	PRIORITY_SPEAKER: 1n << 8n,
	STREAM: 1n << 9n,
	VIEW_CHANNEL: 1n << 10n,
	SEND_MESSAGES: 1n << 11n,
	SEND_TTS_MESSAGES: 1n << 12n,
	MANAGE_MESSAGES: 1n << 13n,
	EMBED_LINKS: 1n << 14n,
	ATTACH_FILES: 1n << 15n,
	READ_MESSAGE_HISTORY: 1n << 16n,
	MENTION_EVERYONE: 1n << 17n,
	USE_EXTERNAL_EMOJIS: 1n << 18n,
	VIEW_GUILD_INSIGHTS: 1n << 19n,
	CONNECT: 1n << 20n,
	SPEAK: 1n << 21n,
	MUTE_MEMBERS: 1n << 22n,
	DEAFEN_MEMBERS: 1n << 23n,
	MOVE_MEMBERS: 1n << 24n,
	USE_VAD: 1n << 25n,
	CHANGE_NICKNAME: 1n << 26n,
	MANAGE_NICKNAMES: 1n << 27n,
	MANAGE_ROLES: 1n << 28n,
	MANAGE_WEBHOOKS: 1n << 29n,
	MANAGE_EMOJIS_AND_STICKERS: 1n << 30n,
	USE_APPLICATION_COMMANDS: 1n << 31n,
	REQUEST_TO_SPEAK: 1n << 32n,
	MANAGE_EVENTS: 1n << 33n,
	MANAGE_THREADS: 1n << 34n,
	CREATE_PUBLIC_THREADS: 1n << 35n,
	CREATE_PRIVATE_THREADS: 1n << 36n,
	USE_EXTERNAL_STICKERS: 1n << 37n,
	SEND_MESSAGES_IN_THREADS: 1n << 38n,
	USE_EMBEDDED_ACTIVITIES: 1n << 39n,
	MODERATE_MEMBERS: 1n << 40n,
	VIEW_CREATOR_MONETIZATION_ANALYTICS: 1n << 41n,
	USE_SOUNDBOARD: 1n << 42n,
	USE_EXTERNAL_SOUNDS: 1n << 45n,
	SEND_VOICE_MESSAGES: 1n << 46n,
} as const;

export type PermissionType = keyof typeof PermissionFlagsBits;

/**
 * Manages Discord permission bitfields
 */
export class Permissions extends BitField {
	/**
	 * Creates a new Permissions instance
	 * @param bits - Initial permission value(s)
	 */
	constructor(bits: number | bigint | string | number[] | bigint[] = 0n) {
		// Handle string permissions (from API)
		if (typeof bits === 'string') {
			bits = BigInt(bits);
		}
		super(PermissionFlagsBits, bits);
	}

	/**
	 * Checks if the permissions include a specific flag
	 * Automatically returns true if ADMINISTRATOR is present
	 * @param value - Permission flag to check
	 * @returns Whether the permission is present
	 */
	has(value: PermissionType): boolean {
		if (super.has('ADMINISTRATOR')) {
			return true;
		}
		return super.has(value);
	}

	/**
	 * Checks if any of the provided permissions are present
	 * @param values - Permission flags to check
	 * @returns Whether any permission is present
	 */
	any(...values: PermissionType[]): boolean {
		return values.some(value => this.has(value));
	}

	/**
	 * Checks if all of the provided permissions are present
	 * @param values - Permission flags to check
	 * @returns Whether all permissions are present
	 */
	all(...values: PermissionType[]): boolean {
		return values.every(value => this.has(value));
	}
}