import { addDays, endOfDay, startOfDay } from "date-fns";
import type { BackendCalendarEvent, CalendarEvent } from "~/types/calendar";

const timeZone = "Europe/Vienna";

const getLocalDate = (value: string) => {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(new Date(value));
};

const getLocalTime = (value: string) => {
	return new Intl.DateTimeFormat("de-AT", {
		timeZone,
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).format(new Date(value));
};

const parseDescription = (description: string) => {
	const lines = description
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean);

	return {
		title: lines[0] ?? "",
		teacher: lines[1] ?? "",
		className: lines[2] ?? "",
		room: lines[3] ?? "",
	};
};

const getEventColor = (title: string) => {
	if (title.includes("KOKO")) {
		return "#FF31FF";
	}

	if (title.includes("PHY1")) {
		return "#31FFFF";
	}

	if (title.includes("PHY")) {
		return "#FFC53B";
	}

	if (title.includes("DIGSYS") || title.includes("ASTEC")) {
		return "#F5F5F5";
	}

	if (title.includes("MAES")) {
		return "#645EFF";
	}

	if (title.includes("ACDC")) {
		return "#FFFF08";
	}

	if (title.includes("ENG")) {
		return "#F50505";
	}

	return "#64748b";
};

const transformEvent = (event: BackendCalendarEvent): CalendarEvent => {
	const parsed = parseDescription(event.description);

	return {
		id: event.uid,

		date: getLocalDate(event.start),

		title: parsed.title || event.summary,
		teacher: parsed.teacher,
		className: parsed.className,

		room: parsed.room || event.location,

		start: getLocalTime(event.start),
		end: getLocalTime(event.end),

		color: getEventColor(parsed.title),
	};
};

export const useCalendarEvents = (weeks: Ref<[Date, Date, Date]>) => {
	const url = "url";
	const username = "username";
	const password = "password";

	const { data, pending, error, refresh } = useAsyncData(
		"calendar-events",
		async () => {
			const results = await Promise.all(
				weeks.value.map((monday) => {
					const from = startOfDay(monday);
					const to = endOfDay(addDays(from, 5));

					return $fetch<BackendCalendarEvent[]>("/api/calendar", {
						query: {
							url,
							from: from.toISOString(),
							to: to.toISOString(),
						},
						headers: {
							Authorization: `Basic ${btoa(`${username}:${password}`)}`,
						},
					});
				}),
			);

			return results.flat();
		},
		{
			watch: [weeks],
			default: () => [],
		},
	);

	const events = computed<CalendarEvent[]>(() =>
		data.value.map(transformEvent),
	);

	return {
		events,
		loading: pending,
		error,
		refresh,
	};
};
