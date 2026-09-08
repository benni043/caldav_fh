import { Buffer } from "buffer";
import { getCalendarEvents } from "#server/services/calendar.services.ts";

export default defineEventHandler(async (event) => {
	const authorization = getHeader(event, "authorization");

	if (!authorization?.startsWith("Basic ")) {
		throw createError({
			statusCode: 401,
			statusMessage: "Authorization header missing",
		});
	}

	const encoded = authorization.slice(6);
	const decoded = Buffer.from(encoded, "base64").toString("utf-8");
	const separator = decoded.indexOf(":");

	if (separator === -1) {
		throw createError({
			statusCode: 401,
			statusMessage: "Invalid authorization header",
		});
	}

	const username = decoded.slice(0, separator);
	const password = decoded.slice(separator + 1);

	const query = getQuery(event);

	const url = query.url as string;
	const from = query.from as string;
	const to = query.to as string;

	if (!url || !from || !to) {
		throw createError({
			statusCode: 400,
			statusMessage: "Url, from and to must be specified",
		});
	}

	const fromDate = new Date(from);
	const toDate = new Date(to);

	if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
		throw createError({
			statusCode: 400,
			statusMessage: "From or to is invalid",
		});
	}

	if (fromDate >= toDate) {
		throw createError({
			statusCode: 400,
			statusMessage: "From must be before to",
		});
	}

	try {
		return await getCalendarEvents({
			url,
			username,
			password,
			from: fromDate,
			to: toDate,
		});
	} catch (error: unknown) {
		console.error("CalDAV error:", error);

		throw createError({
			statusCode: 500,
			statusMessage: error instanceof Error ? error.message : "Unknown error",
		});
	}
});
