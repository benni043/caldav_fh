const toLinear = (c: number) =>
	c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const toSrgb = (c: number) =>
	c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;

function hexToOklch(hex: string): [number, number, number] | null {
	const m = hex.replace("#", "").match(/^([0-9a-f]{3}|[0-9a-f]{6})$/i);
	if (!m?.[1]) return null;
	let h = m[1];
	if (h.length === 3)
		h = h
			.split("")
			.map((c) => c + c)
			.join("");
	const [r, g, b] = [0, 2, 4].map((i) =>
		toLinear(parseInt(h.slice(i, i + 2), 16) / 255),
	);

	if (!r || !g || !b) return null;

	const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
	const mm = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
	const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

	const L = 0.2104542553 * l + 0.793617785 * mm - 0.0040720468 * s;
	const a = 1.9779984951 * l - 2.428592205 * mm + 0.4505937099 * s;
	const bb = 0.0259040371 * l + 0.7827717662 * mm - 0.808675766 * s;

	const C = Math.hypot(a, bb);
	const H = ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360;
	return [L, C, H];
}

function oklchToLinear(
	L: number,
	C: number,
	H: number,
): [number, number, number] {
	const hr = (H * Math.PI) / 180;
	const a = C * Math.cos(hr);
	const b = C * Math.sin(hr);

	const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
	const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
	const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;

	return [
		4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
		-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
		-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
	];
}

// Reduce chroma until the color fits in sRGB instead of hard-clipping channels
function fitToGamut(L: number, C: number, H: number): [number, number, number] {
	const fits = (c: number) =>
		oklchToLinear(L, c, H).every((v) => v >= -0.0001 && v <= 1.0001);
	if (fits(C)) return oklchToLinear(L, C, H);

	let lo = 0;
	let hi = C;
	for (let i = 0; i < 20; i++) {
		const mid = (lo + hi) / 2;
		if (fits(mid)) lo = mid;
		else hi = mid;
	}
	return oklchToLinear(L, lo, H);
}

export function darkenHex(hex: string, percent: number): string {
	const lch = hexToOklch(hex);
	if (!lch) return hex;

	const [L, C, H] = lch;
	const amount = percent / 100;

	// Proportional darkening (1.5 roughly matches the strength of the old HSL version)
	const newL = Math.max(0, L * (1 - amount * 1.5));

	// Slight chroma boost so darker shades don't look washed out
	const newC = C * (1 + amount * 0.25);

	// Shadow hue shift: yellow -> amber, cyan -> blue, red -> crimson.
	// Zero at ~150° (green) and ~330° (pink), strongest in between.
	const shift = Math.sin(((330 - H) * Math.PI) / 180) * percent * 0.4;
	const newH = (H + shift + 360) % 360;

	const rgb = fitToGamut(newL, newC, newH).map((v) =>
		Math.round(
			Math.min(1, Math.max(0, toSrgb(Math.min(1, Math.max(0, v))))) * 255,
		),
	);

	return `#${rgb.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
