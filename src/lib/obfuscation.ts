// 難読化用ユーティリティ関数群
export function xorshift32(seed: number)
{
	let x = seed >>> 0;	// force to uint32 (like C++ static_cast<uint32_t>)
	return () =>
	{
		x ^= x << 13; x >>>= 0;
		x ^= x >>> 17; x >>>= 0;
		x ^= x << 5;  x >>>= 0;
		return x >>> 0;
	};
}

export function buildPermutation(n: number, seed: number): number[]
{
	const rnd = xorshift32(seed);
	const a = Array.from({ length: n }, (_, i) => i);

	// Fisher–Yates シャッフル
	for (let i = n - 1; i > 0; i--)
	{
		const j = rnd() % (i + 1);
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

export function inversePermutation(p: number[]): number[] {
	const inv = Array(p.length);
	for (let i = 0; i < p.length; i++) inv[p[i]] = i;
	return inv;
}


// 任意：フレーズからシードを作る簡易ハッシュ（FNV-1a）
export function fnv1a32(s: string): number
{
	let h = 0x811c9dc5 >>> 0;
	for (let i = 0; i < s.length; i++)
	{
		h ^= s.charCodeAt(i);
		h = Math.imul(h, 0x01000193) >>> 0;
	}

	return h >>> 0;
}

export function restoreShuffledToken( shuffledToken: string ,seedWord: string ):string
{
	const seed		= fnv1a32( seedWord );
	const p			= buildPermutation(shuffledToken.length, seed);
	const inv		= inversePermutation(p);
	const buffer	= new Array<string>(shuffledToken.length);
	for( let i = 0; i < inv.length; i++ )
	{
		buffer[i] = shuffledToken[inv[i]];
	}
	
	return buffer.join('');
}