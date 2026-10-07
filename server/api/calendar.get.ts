import { getCalendarEvents } from "#server/services/calendar.services.ts";

const cacheName = "calendar-events";

const getCacheKey = (from: number, to: number) => `${from}-${to}`;

const getCachedCalendarEvents = defineCachedFunction(
	(from: number, to: number) =>
		getCalendarEvents({ from: new Date(from), to: new Date(to) }),
	{
		name: cacheName,
		getKey: getCacheKey,
		maxAge: 60 * 15,
		swr: true,
	},
);

export default defineEventHandler(async (event) => {
	const query = getQuery(event);

	const from = query.from as string;
	const to = query.to as string;

	if (!from || !to) {
		throw createError({
			statusCode: 400,
			statusMessage: "From and to must be specified",
		});
	}

	const fromTime = new Date(from).getTime();
	const toTime = new Date(to).getTime();

	if (Number.isNaN(fromTime) || Number.isNaN(toTime)) {
		throw createError({
			statusCode: 400,
			statusMessage: "From or to is invalid",
		});
	}

	if (fromTime >= toTime) {
		throw createError({
			statusCode: 400,
			statusMessage: "From must be before to",
		});
	}

	// Dropping the entry makes the cached function fetch fresh data and store it,
	// instead of serving the stale value (swr) while revalidating in the background
	if (query.refresh) {
		await useStorage("cache").removeItem(
			`nitro:functions:${cacheName}:${getCacheKey(fromTime, toTime)}.json`,
		);
	}

	try {
		return await getCachedCalendarEvents(fromTime, toTime);
	} catch (error: unknown) {
		console.error("CalDAV error:", error);

		throw createError({
			statusCode: 500,
			statusMessage: error instanceof Error ? error.message : "Unknown error",
		});
	}
});
