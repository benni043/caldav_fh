import { Buffer } from "buffer";
import ICAL from "ical.js";
import { calendarQuery, createDAVClient } from "tsdav";

interface CalendarResponse {
	href?: string;
}

export default defineEventHandler(async (event) => {
	try {
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

		const auth = Buffer.from(`${username}:${password}`).toString("base64");

		const client = await createDAVClient({
			serverUrl: url,
			credentials: {
				username,
				password,
			},
			authMethod: "Basic",
			defaultAccountType: "caldav",
		});

		const calendars = await client.fetchCalendars();

		if (!calendars.length) {
			return [];
		}

		const calendar = calendars[0]!;

		const formatCalDavDate = (date: Date) => {
			return date
				.toISOString()
				.replace(/[-:]/g, "")
				.replace(/\.\d{3}/, "");
		};

		const start = formatCalDavDate(fromDate);
		const end = formatCalDavDate(toDate);

		const result = await calendarQuery({
			url: calendar.url,

			props: {
				d: {
					prop: [{ d: "getetag" }, { c: "calendar-data" }],
				},
			},

			filters: {
				"c:comp-filter": {
					_attributes: {
						name: "VCALENDAR",
					},

					"c:comp-filter": {
						_attributes: {
							name: "VEVENT",
						},

						"c:time-range": {
							_attributes: {
								start,
								end,
							},
						},
					},
				},
			},

			headers: {
				Authorization: `Basic ${auth}`,
			},
		});

		const responses = result[0]?.raw?.multistatus?.response ?? [];

		const events = await Promise.all(
			responses.map(async (response: CalendarResponse) => {
				try {
					const href = response.href;

					if (!href) {
						return null;
					}

					const eventUrl = new URL(href, calendar.url).toString();

					const eventResponse = await fetch(eventUrl, {
						headers: {
							Authorization: `Basic ${auth}`,
						},
					});

					if (!eventResponse.ok) {
						console.error(
							"Event loading failed:",
							eventResponse.status,
							eventUrl,
						);

						return null;
					}

					const ics = await eventResponse.text();

					return parseICS(ics);
				} catch (error: unknown) {
					console.error("Error while loading event:", error);

					return null;
				}
			}),
		);

		return events.filter(
			(event): event is NonNullable<typeof event> => event !== null,
		);
	} catch (error: unknown) {
		console.error("CalDAV error:", error);

		if (isError(error)) {
			throw error;
		}

		throw createError({
			statusCode: 500,
			statusMessage: error instanceof Error ? error.message : "Unknown error",
		});
	}
});

function parseICS(ics: string) {
	const jcal = ICAL.parse(ics);

	const component = new ICAL.Component(jcal);

	const vevent = component.getFirstSubcomponent("vevent");

	if (!vevent) {
		return null;
	}

	const event = new ICAL.Event(vevent);

	return {
		uid: event.uid,
		summary: event.summary,
		description: event.description,
		location: event.location,
		start: event.startDate.toJSDate(),
		end: event.endDate.toJSDate(),
	};
}
