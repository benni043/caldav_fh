<script setup lang="ts">
	import { getISOWeek } from "date-fns";
	import { calendarConfig } from "~/config/calendar";
	import type { CalendarSegment } from "~/types/calendar";

	const {
		generateSegments,
		getSegmentHeight,
		getEventPosition,
		splitEventBySegments,
	} = useCalendar(calendarConfig);

	const { events, loading, error, fetchEvents } = useCalendarEvents();

	const segments = computed(() => {
		return generateSegments();
	});

	/**
	 * Gibt den Montag der Woche zurück.
	 *
	 * Samstag und Sonntag gehören bereits
	 * zur kommenden Woche.
	 */
	const getCurrentCalendarWeek = () => {
		const date = new Date();

		const day = date.getDay();

		if (day === 6) {
			date.setDate(date.getDate() + 2);
		} else if (day === 0) {
			date.setDate(date.getDate() + 1);
		} else {
			const mondayOffset = 1 - day;

			date.setDate(date.getDate() + mondayOffset);
		}

		date.setHours(0, 0, 0, 0);

		return date;
	};

	const currentWeek = ref(getCurrentCalendarWeek());

	const days = computed(() => {
		const result: Date[] = [];

		for (let i = 0; i < 5; i++) {
			const date = new Date(currentWeek.value);

			date.setDate(currentWeek.value.getDate() + i);

			result.push(date);
		}

		return result;
	});

	const dateKey = (date: Date) => {
		const year = date.getFullYear();

		const month = String(date.getMonth() + 1).padStart(2, "0");

		const day = String(date.getDate()).padStart(2, "0");

		return `${year}-${month}-${day}`;
	};

	const formatDay = (date: Date) => {
		return date.toLocaleDateString("de-AT", {
			weekday: "long",
		});
	};

	const formatDayShort = (date: Date) => {
		const value = date.toLocaleDateString("de-AT", {
			weekday: "short",
		});

		return value.endsWith(".") ? value : `${value}.`;
	};

	const formatDate = (date: Date) => {
		return date.toLocaleDateString("de-AT", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		});
	};

	const formatMonth = (date: Date) => {
		const value = date.toLocaleDateString("de-AT", {
			month: "short",
		});

		return value.endsWith(".") ? value : `${value}.`;
	};

	const calendarWeek = computed(() => {
		return getISOWeek(currentWeek.value);
	});

	const getEventsForDay = (date: Date) => {
		const key = dateKey(date);

		return events.value.filter((event) => event.date === key);
	};

	const previousWeek = () => {
		const date = new Date(currentWeek.value);

		date.setDate(date.getDate() - 7);

		currentWeek.value = date;
	};

	const nextWeek = () => {
		const date = new Date(currentWeek.value);

		date.setDate(date.getDate() + 7);

		currentWeek.value = date;
	};

	const calendarBody = ref<HTMLElement | null>(null);

	const timeColumn = ref<HTMLElement | null>(null);

	const dayWidth = ref(0);

	let resizeObserver: ResizeObserver | null = null;

	const isMobile = ref(false);

	const updateMobileState = () => {
		isMobile.value = window.innerWidth < 640;
	};

	const updateDayWidth = () => {
		if (!calendarBody.value || !timeColumn.value) {
			return;
		}

		const totalWidth = calendarBody.value.getBoundingClientRect().width;

		const timeWidth = timeColumn.value.getBoundingClientRect().width;

		const width = (totalWidth - timeWidth) / 5;

		if (width > 0) {
			dayWidth.value = width;
		}
	};

	const getResponsiveSegmentHeight = (segment: CalendarSegment) => {
		if (isMobile.value && segment.type === "lesson" && dayWidth.value > 0) {
			return dayWidth.value;
		}

		return getSegmentHeight(segment);
	};

	const getResponsiveEventPosition = (
		start: string,
		end: string,
		segments: CalendarSegment[],
	) => {
		return getEventPosition(start, end, segments, getResponsiveSegmentHeight);
	};

	onMounted(() => {
		updateMobileState();
		updateDayWidth();

		window.addEventListener("resize", updateMobileState);

		resizeObserver = new ResizeObserver(() => {
			updateDayWidth();
		});

		if (calendarBody.value) {
			resizeObserver.observe(calendarBody.value);
		}

		if (timeColumn.value) {
			resizeObserver.observe(timeColumn.value);
		}
	});

	onBeforeUnmount(() => {
		resizeObserver?.disconnect();

		window.removeEventListener("resize", updateMobileState);
	});

	watch(
		currentWeek,
		(week) => {
			fetchEvents(week);
		},
		{
			immediate: true,
		},
	);
</script>

<template>
	<div class="flex flex-col overflow-hidden rounded-xl bg-[#242829]">
		<div
			class="flex items-center justify-between border-b border-neutral-700 px-2 py-1.5 sm:px-3 sm:py-2"
		>
			<button
				type="button"
				class="rounded-md px-2 py-1 text-sm text-neutral-300 transition hover:bg-neutral-700 hover:text-white sm:px-3 sm:py-1.5"
				@click="previousWeek"
			>
				←
			</button>

			<div class="flex items-center gap-1.5 sm:gap-3">
				<span class="text-neutral-300 sm:block">
					Kalenderwoche:
					{{ calendarWeek }}
				</span>

				<span v-if="loading" class="hidden text-xs text-neutral-500 sm:block">
					Lade Kalender...
				</span>

				<span v-if="error" class="hidden text-xs text-red-400 sm:block">
					Kalender konnte nicht geladen werden.
				</span>
			</div>

			<button
				type="button"
				class="rounded-md px-2 py-1 text-sm text-neutral-300 transition hover:bg-neutral-700 hover:text-white sm:px-3 sm:py-1.5"
				@click="nextWeek"
			>
				→
			</button>
		</div>

		<div class="overflow-x-auto overflow-y-auto max-h-screen">
			<div class="min-w-0 sm:min-w-262.5">
				<div
					class="sticky top-0 z-30 bg-[#242829] grid grid-cols-[42px_repeat(5,minmax(0,1fr))] border-b border-neutral-700 sm:grid-cols-[70px_repeat(5,minmax(190px,1fr))]"
				>
					<div
						class="flex items-center justify-center border-neutral-700 font-medium text-neutral-400"
					>
						{{ formatMonth(currentWeek) }}
					</div>

					<div
						v-for="day in days"
						:key="dateKey(day)"
						class="border-l border-neutral-700 text-center py-1"
					>
						<div class="font-semibold text-white sm:hidden">
							{{ formatDayShort(day) }}
						</div>

						<div class="text-neutral-400 sm:hidden">
							{{ day.getDate() }}
						</div>

						<div class="hidden font-semibold capitalize text-white sm:block">
							{{ formatDay(day) }}
						</div>

						<div class="hidden text-sm text-neutral-400 sm:block">
							{{ formatDate(day) }}
						</div>
					</div>
				</div>

				<div
					ref="calendarBody"
					class="grid grid-cols-[42px_repeat(5,minmax(0,1fr))] sm:grid-cols-[70px_repeat(5,minmax(190px,1fr))]"
				>
					<div ref="timeColumn">
						<div
							v-for="segment in segments"
							:key="`${segment.type}-${segment.start}-${segment.end}`"
							class="border-b border-neutral-700 text-neutral-400"
							:class="{
                'bg-neutral-500/70':
                  segment.type === 'break',
              }"
							:style="{
                height: `${getResponsiveSegmentHeight(segment)}px`,
              }"
						>
							<template v-if="segment.type === 'lesson'">
								<div
									class="flex h-full flex-col items-center justify-between py-1 leading-none"
								>
									<span>
										{{ segment.start }}
									</span>

									<span>
										{{ segment.end }}
									</span>
								</div>
							</template>
						</div>
					</div>

					<CalendarDay
						v-for="day in days"
						:key="dateKey(day)"
						:date="day"
						:events="getEventsForDay(day)"
						:config="calendarConfig"
						:segments="segments"
						:get-segment-height="
              getResponsiveSegmentHeight
            "
						:get-event-position="
              getResponsiveEventPosition
            "
						:split-event-by-segments="
              splitEventBySegments
            "
					/>
				</div>
			</div>
		</div>
	</div>
</template>
