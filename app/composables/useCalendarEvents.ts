import { addDays, startOfWeek } from "date-fns";
import { moodleIds, taskLineIds } from "~/config/calendar.ts";
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

const getTasklineId = (lesson: string) => {
	return taskLineIds.find((value) => value.lesson === lesson);
};

const getMoodleId = (lesson: string) => {
	return moodleIds.find((value) => value.lesson === lesson);
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
		tasklineId: getTasklineId(parsed.title)!.id,
		mooddleId: getMoodleId(parsed.title)!.id,
	};
};

export const useCalendarEvents = (currentWeek: Ref<Date>) => {
	const url = "url";

	const username = "username";
	const password = "password";

	const monday = computed(() =>
		startOfWeek(currentWeek.value, {
			weekStartsOn: 1,
		}),
	);

	const nextMonday = computed(() => addDays(monday.value, 7));

	const { data, pending, error, refresh } = useAsyncData(
		"calendar-events",
		() =>
			$fetch<BackendCalendarEvent[]>("/api/calendar", {
				query: {
					url,
					from: monday.value.toISOString(),
					to: nextMonday.value.toISOString(),
				},

				headers: {
					Authorization: `Basic ${btoa(`${username}:${password}`)}`,
				},
			}),
		{
			watch: [monday],
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
