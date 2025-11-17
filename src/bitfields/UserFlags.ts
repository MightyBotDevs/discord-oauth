import { BitField } from './BitField';

/**
 * Bitfield values for Discord user flags
 */
export const UserFlagsBits = {
	STAFF: 1n << 0n,
	PARTNER: 1n << 1n,
	HYPESQUAD: 1n << 2n,
	BUG_HUNTER_LEVEL_1: 1n << 3n,
	HYPESQUAD_ONLINE_HOUSE_1: 1n << 6n,
	HYPESQUAD_ONLINE_HOUSE_2: 1n << 7n,
	HYPESQUAD_ONLINE_HOUSE_3: 1n << 8n,
	PREMIUM_EARLY_SUPPORTER: 1n << 9n,
	TEAM_PSEUDO_USER: 1n << 10n,
	BUG_HUNTER_LEVEL_2: 1n << 14n,
	VERIFIED_BOT: 1n << 16n,
	VERIFIED_DEVELOPER: 1n << 17n,
	CERTIFIED_MODERATOR: 1n << 18n,
	BOT_HTTP_INTERACTIONS: 1n << 19n,
	ACTIVE_DEVELOPER: 1n << 22n,
} as const;

export type UserFlagsType = keyof typeof UserFlagsBits;

/**
 * Manages Discord user flag bitfields
 */
export class UserFlags extends BitField {
	/**
	 * Creates a new UserFlags instance
	 * @param bits - Initial user flags value(s)
	 */
	constructor(bits: number | bigint | number[] | bigint[] = 0n) {
		super(UserFlagsBits, bits);
	}

	/**
	 * Checks if the user has a specific flag
	 * @param value - User flag to check
	 * @returns Whether the flag is present
	 */
	has(value: UserFlagsType): boolean {
		return super.has(value);
	}
}