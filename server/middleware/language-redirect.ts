// "/" has no language, so send it to the one saved in the settings cookie (German by default)
export default defineEventHandler((event) => {
	if (event.path !== "/") {
		return;
	}

	let language = "de";

	try {
		const settings = JSON.parse(getCookie(event, "settings") ?? "{}");

		if (settings.language === "en") {
			language = "en";
		}
	} catch {
		// Broken cookie: fall back to German
	}

	return sendRedirect(event, `/${language}`, 302);
});
