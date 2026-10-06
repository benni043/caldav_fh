import { calendarQuery, createDAVClient } from "tsdav";
import { formatCalDavDate, parseICS } from "#server/utils/parse.ts";

interface GetCalendarEventsOptions {
	from: Date;
	to: Date;
}

interface CalendarResponse {
	href?: string;
}

export async function getCalendarEvents({
	from,
	to,
}: GetCalendarEventsOptions) {
	const auth = Buffer.from(
		`${process.env.CIS_USER}:${process.env.CIS_PASSWORD}`,
	).toString("base64");

	const client = await createDAVClient({
		serverUrl: process.env.URL!,
		credentials: {
			username: process.env.CIS_USER,
			password: process.env.CIS_PASSWORD,
		},
		authMethod: "Basic",
		defaultAccountType: "caldav",
	});

	const calendars = await client.fetchCalendars();

	if (!calendars.length) return [];

	const calendar = calendars[0]!;

	const start = formatCalDavDate(from);
	const end = formatCalDavDate(to);

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

	const rawResponses = result[0]?.raw?.multistatus?.response;

	const responses = rawResponses
		? Array.isArray(rawResponses)
			? rawResponses
			: [rawResponses]
		: [];

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
}
