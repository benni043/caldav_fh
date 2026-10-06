import { getCalendarEvents } from "#server/services/calendar.services.ts";

export default defineCachedEventHandler(
	async (event) => {
		const query = getQuery(event);

		const from = query.from as string;
		const to = query.to as string;

		if (!from || !to) {
			throw createError({
				statusCode: 400,
				statusMessage: "From and to must be specified",
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
			return await getCalendarEvents({ from: fromDate, to: toDate });
		} catch (error: unknown) {
			console.error("CalDAV error:", error);

			throw createError({
				statusCode: 500,
				statusMessage: error instanceof Error ? error.message : "Unknown error",
			});
		}
	},
	{ maxAge: 60 * 15, swr: true },
);
