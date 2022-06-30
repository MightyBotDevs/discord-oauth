import { UserFlags } from '@bitfields/UserFlags';

export class User {
	_id: string;
	_username: string;
	_locale: string;
	_isMFAEnabled: string;
	_discriminator:number;
	_emailId: string | null;
	_emailVerified: boolean;
	_avatarHash: string | null;
	_bannerHash: string | null;
	_bannerColor: string;
	_userFlags: string[];
	_premiumType: string;
	_bot: boolean;
	constructor({
		id,
		username,
		locale,
		mfa_enabled,
		flags = 0,
		avatar = null,
		banner = null,
		banner_color,
		discriminator,
		email = undefined,
		verified = undefined,
		premium_type = 0,
		bot = false,
	}) {
		this._id = id;
		this._username = username;
		this._locale = locale;
		this._isMFAEnabled = mfa_enabled;
		this._discriminator = discriminator;
		this._emailId = email;
		this._emailVerified = verified;
		this._avatarHash = avatar;
		this._bannerHash = banner;
		this._bannerColor = banner_color;
		this._premiumType = premium_type === 0 ? 'None' : premium_type === 1 ? 'Nitro Classic' : 'Nitro';
		this._bot = bot;
		this._userFlags = new UserFlags(flags).toArray();
	}

	/**
	 * The username of the user.
	 * @returns {string}
	 */
	get username() {
		return this._username;
	}

	/**
	 * The user's unique discord ID.
	 * @returns {string}
	 */
	get id() {
		return this._id;
	}

	/**
	 * The user's preferred locale.
	 * @returns {string}
	 */
	get locale() {
		return this._locale;
	}

	/**
	 * Whether the user has enabled MFA or not.
	 * @returns {boolean}
	 */
	get isMFAEnabled() {
		return this._isMFAEnabled;
	}

	/**
	 * The 4-digit discriminator of the user.
	 * @returns {string}
	 */
	get discriminator() {
		return this._discriminator;
	}

	/**
	 * The user's E-Mail ID.
	 * @returns {string}
	 */
	get email() {
		return this._emailId;
	}

	/**
	 * Whether the user has verified their E-Mail ID.
	 * @returns {boolean}
	 */
	get isVerified() {
		return this._emailVerified;
	}

	/**
	 * The hashed data of the user's avatar image.
	 * @returns {string|null}
	 */
	get avatarHash() {
		return this._avatarHash;
	}

	/**
	 * The hashed data of the user's banner image.
	 * @returns {string|null}
	 */
	get bannerHash() {
		return this._bannerHash;
	}

	/**
	 * Returns the color of the banner.
	 * @returns {string}
	 */
	get bannerColor() {
		return this._bannerColor;
	}

	/**
	 * The user's flags displayed on their profile.
	 * @returns {string[]}
	 */
	get userFlags() {
		return this._userFlags;
	}

	/**
	 * The type of nitro subscription the user has.
	 * @returns {string}
	 */
	get premiumType() {
		return this._premiumType;
	}

	/**
	 * Whether the authorized user is a bot or not.
	 * @returns {boolean}
	 */
	get bot() {
		return this._bot;
	}

	/**
	 * The UNIX timestamp of the time when the user's account was created.
	 * @returns {number}
	 */
	get createdTimestamp() {
		return parseInt((BigInt('0b' + parseInt(this._id).toString(2)) >> 22n).toString()) + 1420070400000;
	}

	/**
	 * A Date object representing the time when the user's account was created.
	 * @returns {Date}
	 */
	get createdAt() {
		return new Date(this.createdTimestamp);
	}

	/**
	 * The user's discord tag, the username and discriminator joined by a '#'.
	 * @returns {string}
	 */
	get tag() {
		return `${this._username}#${this._discriminator}`;
	}

	/**
	 * Returns the user's avatar's URl of desired size.
	 *
	 * @param {number} size The size of the desired image (in pixels).
	 * @returns {string} The generated url to the user's avatar image.
	 *
	 * @example let myFavAvatar = myFavUser.avatarUrl(); // Gets a normal 512x512px avatar.
	 * @example let myFavAvatar = myFavUser.avatarUrl(1024); // Gets a 1024x1024px avatar.
	 */
	avatarUrl(size = 512) {
		return `https://cdn.discordapp.com/${this.avatarHash ? '' : 'embed/'}avatars/${
			this.avatarHash ? `${this.id}/${this.avatarHash}` : this.discriminator % 5
		}.${this.avatarHash ? (this.avatarHash.startsWith('a_') ? 'gif' : 'png') : 'png'}?size=${size}`;
	}

	/**
	 * Returns the user's banner's URl of desired size.
	 *
	 * @param {number} size The size of the desired image (in pixels).
	 * @returns {string} The generated url to the user's banner image.
	 *
	 * @example let myFavAvatar = myFavUser.bannerUrl(); // Gets a normal 512x512px avatar.
	 * @example let myFavAvatar = myFavUser.bannerUrl(1024); // Gets a 1024x1024px avatar.
	 */
	bannerUrl(size = 512) {
		return this.bannerHash
			? `https://cdn.discordapp.com/banners/${this.id}/${this.bannerHash}.${
				this.bannerHash ? (this.bannerHash.startsWith('a_') ? 'gif' : 'png') : 'png'
			}?size=${size}`
			: null;
	}

	/**
	 * Converts the user into a JSON object.
	 * @returns {{userFlags: string[], avatarUrl: string, bannerURL: (string|null), bot: boolean, createdTimestamp: number, emailId: string, locale: string, premiumType: string, discriminator: string, emailVerified: boolean, createdAt: Date, avatarHash: (string|null), bannerHash: (string|null), bannerColor: string, isMFAEnabled: boolean, id: string, tag: string, username: string}}
	 */
	toJSON() {
		const {
			id,
			username,
			discriminator,
			tag,
			email,
			isVerified,
			createdAt,
			createdTimestamp,
			locale,
			isMFAEnabled,
			bot,
			avatarHash,
			bannerHash,
			bannerColor,
			premiumType,
			userFlags,
		} = this;
		const avatarUrl = this.avatarUrl();
		const bannerUrl = this.bannerUrl();
		return {
			id,
			username,
			discriminator,
			tag,
			email,
			isVerified,
			createdAt,
			createdTimestamp,
			locale,
			isMFAEnabled,
			bot,
			avatarHash,
			avatarUrl,
			bannerHash,
			bannerColor,
			bannerUrl,
			premiumType,
			userFlags,
		};
	}
}