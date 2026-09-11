// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	modules: ["@nuxt/ui"],

	devtools: {
		enabled: true,
	},

	css: ["~/assets/css/main.css"],

	routeRules: {
		"/": { prerender: true },
	},

	compatibilityDate: "2026-06-30",

	colorMode: {
		preference: "light",
		fallback: "light",
		classSuffix: "",
	},

	runtimeConfig: {
		public: {
			url: process.env.NUXT_URL,
			username: process.env.NUXT_USERNAME,
			password: process.env.NUXT_PASSWORD,
		},
	},
});
