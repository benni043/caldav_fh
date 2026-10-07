import { addDays, format, startOfWeek } from "date-fns";
import { moodleIds, taskLineIds } from "~/config/calendar";
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
		tasklineId: getTasklineId(parsed.title)?.id,
		moodleId: getMoodleId(parsed.title)?.id,
	};
};

export const useCalendarEvents = (weeks: Ref<Date[]>) => {
	const eventsByWeek = ref<Record<string, CalendarEvent[]>>({});
	const requested = new Set<string>();
	const pendingCount = ref(0);
	const error = ref<unknown>(null);

	const weekKey = (date: Date) =>
		format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");

	const fetchWeek = async (date: Date, refresh = false) => {
		const monday = startOfWeek(date, { weekStartsOn: 1 });
		const nextMonday = addDays(monday, 7);

		const data = await $fetch<BackendCalendarEvent[]>("/api/calendar", {
			query: {
				from: monday.toISOString(),
				to: nextMonday.toISOString(),
				...(refresh && { refresh: 1 }),
			},
		});

		eventsByWeek.value[weekKey(date)] = data.map(transformEvent);
	};

	const loadWeek = async (date: Date) => {
		const key = weekKey(date);

		if (requested.has(key)) {
			return;
		}

		requested.add(key);
		pendingCount.value++;

		try {
			await fetchWeek(date);
		} catch (err: unknown) {
			requested.delete(key);
			error.value = err;
		} finally {
			pendingCount.value--;
		}
	};

	// Reloads the visible weeks bypassing the server cache. Other weeks are
	// forgotten so they get loaded fresh when scrolled to
	const refresh = async () => {
		const visible = new Set(weeks.value.map(weekKey));

		for (const key of Object.keys(eventsByWeek.value)) {
			if (!visible.has(key)) {
				delete eventsByWeek.value[key];
			}
		}

		requested.clear();
		for (const key of visible) {
			requested.add(key);
		}

		await Promise.all(weeks.value.map((week) => fetchWeek(week, true)));
		error.value = null;
	};

	const loadWeeks = (value: Date[]) => {
		for (const week of value) {
			loadWeek(week);
		}
	};

	// Start loading after mount so the hydrated DOM matches the server render
	onMounted(() => {
		loadWeeks(weeks.value);
		watch(weeks, loadWeeks, { deep: true });
	});

	const getEventsForDay = (date: Date) => {
		const key = format(date, "yyyy-MM-dd");

		return (eventsByWeek.value[weekKey(date)] ?? []).filter(
			(event) => event.date === key,
		);
	};

	return {
		getEventsForDay,
		refresh,
		loading: computed(() => pendingCount.value > 0),
		error,
	};
};
