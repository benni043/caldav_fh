import { addDays, startOfWeek } from "date-fns";
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

export const useCalendarEvents = () => {
	const events = ref<CalendarEvent[]>([]);

	const loading = ref(false);
	const error = ref<unknown>(null);

	const fetchEvents = async (week: Date) => {
		loading.value = true;
		error.value = null;

		try {
			const url = "url";

			const username = "username";
			const password = "password";

			const monday = startOfWeek(week, {
				weekStartsOn: 1,
			});

			const nextMonday = addDays(monday, 7);

			const response = await $fetch<BackendCalendarEvent[]>("/api/calendar", {
				query: {
					url,
					from: monday.toISOString(),
					to: nextMonday.toISOString(),
				},

				headers: {
					Authorization: `Basic ${btoa(`${username}:${password}`)}`,
				},
			});

			events.value = response.map(transformEvent);
		} catch (err) {
			error.value = err;
			events.value = [];
		} finally {
			loading.value = false;
		}
	};

	return {
		events,
		loading,
		error,
		fetchEvents,
	};
};
