export default defineNuxtConfig({
	modules: ["@nuxt/ui"],

	app: {
		head: {
			title: "Stundenplan",
			htmlAttrs: {
				lang: "de",
			},
			link: [{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
		},
	},

	devtools: {
		enabled: true,
	},

	css: ["~/assets/css/main.css"],

	compatibilityDate: "2026-06-30",
});
