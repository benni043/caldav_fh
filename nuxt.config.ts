export default defineNuxtConfig({
	modules: ["@nuxt/ui", "@nuxtjs/i18n"],

	app: {
		head: {
			link: [{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
		},
	},

	// Every page lives under /de or /en; "/" redirects to the language saved in
	// the settings cookie (server/middleware/language-redirect.ts), not the browser's
	i18n: {
		strategy: "prefix",
		defaultLocale: "de",
		locales: [
			{ code: "de", language: "de-AT", name: "Deutsch", file: "de.json" },
			{ code: "en", language: "en-GB", name: "English", file: "en.json" },
		],
		detectBrowserLanguage: false,
	},

	devtools: {
		enabled: true,
	},

	css: ["~/assets/css/main.css"],

	// The calendar is dark-only, so Nuxt UI components (e.g. the settings modal) match it
	colorMode: {
		preference: "dark",
		fallback: "dark",
	},

	compatibilityDate: "2026-06-30",
});
