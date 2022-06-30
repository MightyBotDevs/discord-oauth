import { BitField } from './BitField';

export const UserFlagsBits = {
	STAFF: 1 << 0,
	PARTNER: 1 << 1,
	HYPESQUAD: 1 << 2,
	BUG_HUNTER_LEVEL_1: 1 << 3,
	HYPESQUAD_ONLINE_HOUSE_1: 1 << 6,
	HYPESQUAD_ONLINE_HOUSE_2: 1 << 7,
	HYPESQUAD_ONLINE_HOUSE_3: 1 << 8,
	PREMIUM_EARLY_SUPPORTER: 1 << 9,
	TEAM_PSEUDO_USER: 1 << 10,
	BUG_HUNTER_LEVEL_2: 1 << 14,
	VERIFIED_BOT: 1 << 16,
	VERIFIED_DEVELOPER: 1 << 17,
	CERTIFIED_MODERATOR: 1 << 18,
	BOT_HTTP_INTERACTIONS: 1 << 19,
};

export type UserFlagsTypes = keyof typeof UserFlagsBits;

export class UserFlags extends BitField {
	constructor(bits: number | bigint | number[] | bigint[]) {
		super(UserFlagsBits, bits);
	}

	has(value: keyof typeof UserFlagsBits): boolean {
		return super.has(value);
	}
}