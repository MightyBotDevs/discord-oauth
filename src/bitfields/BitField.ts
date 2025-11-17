/**
 * Base class for bitfield management
 */
export class BitField {
	/** Mapping of flag names to their bit values */
	protected map: Record<string, number | bigint>;
	/** Current bitfield value */
	protected bits: bigint;

	/**
	 * Creates a new BitField instance
	 * @param map - Flag name to bit value mapping
	 * @param bits - Initial bitfield value(s)
	 */
	constructor(map: Record<string, number | bigint>, bits: number | bigint | number[] | bigint[] = 0n) {
		this.map = map;

		if (Array.isArray(bits)) {
			this.bits = (bits as (number | bigint)[]).reduce<bigint>((acc, val) => acc | BigInt(val), 0n);
		}
		else {
			this.bits = BigInt(bits);
		}
	}

	/**
	 * Resolves a flag name to its bit value
	 * @param value - Flag name to resolve
	 * @returns The bit value
	 * @throws Error if the flag name is invalid
	 */
	protected resolve(value: string): bigint {
		if (!this.map[value]) {
			throw new Error(`"${value}" is not a valid bitfield flag`);
		}
		return BigInt(this.map[value]);
	}

	/**
	 * Checks if the bitfield has a specific flag
	 * @param value - Flag name to check
	 * @returns Whether the flag is present
	 */
	has(value: string): boolean {
		const bits = this.resolve(value);
		return (this.bits & bits) !== 0n;
	}

	/**
	 * Converts the bitfield to an array of flag names
	 * @returns Array of flag names that are present
	 */
	toArray(): string[] {
		return Object.keys(this.map).filter(key => this.has(key));
	}

	/**
	 * Adds a flag to the bitfield
	 * @param value - Flag name or bit value to add
	 */
	add(value: string | number | bigint): void {
		if (typeof value === 'string') {
			value = this.resolve(value);
		}
		this.bits |= BigInt(value);
	}

	/**
	 * Removes a flag from the bitfield
	 * @param value - Flag name or bit value to remove
	 */
	remove(value: string | number | bigint): void {
		if (typeof value === 'string') {
			value = this.resolve(value);
		}
		this.bits &= ~BigInt(value);
	}

	/**
	 * Gets the raw bitfield value
	 * @returns The bitfield as a bigint
	 */
	valueOf(): bigint {
		return this.bits;
	}

	/**
	 * Converts the bitfield to a string representation
	 * @returns The bitfield as a string
	 */
	toString(): string {
		return this.bits.toString();
	}
}