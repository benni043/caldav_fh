export type Language = "de" | "en";

export interface Settings {
	language: Language;
	colorfulToday: boolean;
}

export const defaultSettings: Settings = {
	language: "de",
	colorfulToday: true,
};

// Stored in a cookie so the server render already matches the saved settings
export function useSettings() {
	const settings = useCookie<Settings>("settings", {
		default: () => ({ ...defaultSettings }),
		maxAge: 60 * 60 * 24 * 365,
		sameSite: "lax",
	});

	// Cookies saved before a setting existed get its default filled in
	if (Object.keys(defaultSettings).some((key) => !(key in settings.value))) {
		settings.value = { ...defaultSettings, ...settings.value };
	}

	return settings;
}
