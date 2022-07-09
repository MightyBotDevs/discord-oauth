export class BitField {
	map: Record<string, number | bigint>;
	bits: bigint;
	constructor(map: Record<string, number | bigint>, bits: number | bigint | number[] | bigint[]) {
		this.map = map;
		if (Array.isArray(bits)) {
			// @ts-expect-error
			bits = bits.reduce((acc, val) => acc | BigInt(val), 0n);
		}
		// @ts-expect-error
		this.bits = BigInt(bits || 0n);
	}

	resolve(value: string) {
		if (!this.map[value]) throw new Error(`${value} is not a valid bitfield value`);
		return BigInt(this.map[value]);
	}

	has(value: string) {
		const bits = this.resolve(value);
		return (this.bits & bits) !== 0n;
	}

	toArray() {
		return Object.keys(this.map).filter(key => this.has(key));
	}

	add(value: string | number | bigint) {
		if (typeof value === 'string') value = this.resolve(value);
		this.bits |= BigInt(value);
	}
}