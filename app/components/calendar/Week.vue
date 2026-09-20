<script setup lang="ts">
	import { addDays, getISOWeek, subDays } from "date-fns";
	import { calendarConfig } from "~/config/calendar";
	import type { CalendarSegment } from "~/types/calendar";

	const {
		generateSegments,
		getSegmentHeight,
		getEventPosition,
		getTimePosition,
		splitEventBySegments,
	} = useCalendar(calendarConfig);

	// FIX: Es gibt nur noch EINEN Scroll-Container (scrollerEl). Die Kopfzeile scrollt
	// dadurch nativ mit dem Inhalt mit, ohne JS-Synchronisierung (die hinterherhinkte).
	const scrollerEl = ref<HTMLElement | null>(null);
	const timeColumn = ref<HTMLElement | null>(null);

	// Breite einer Woche in px (= sichtbare Breite ohne Zeitspalte)
	const weekWidth = ref(0);
	const dayWidth = computed(() => weekWidth.value / 5);

	const weekStyle = computed(() =>
		weekWidth.value > 0 ? { width: `${weekWidth.value}px` } : undefined,
	);

	const isMobile = ref(false);

	let resizeObserver: ResizeObserver | null = null;

	const updateMobileState = () => {
		isMobile.value = window.innerWidth < 640;
	};

	const updateWeekWidth = () => {
		const scroller = scrollerEl.value;
		const time = timeColumn.value;

		if (!scroller || !time) {
			return;
		}

		const available = scroller.clientWidth - time.getBoundingClientRect().width;

		if (available > 0) {
			weekWidth.value = available;
		}
	};

	// Abstand zwischen zwei Wochen im Scroller (tatsächliche Breite inkl. min-width am Desktop)
	function getWeekStep() {
		const el = scrollerEl.value;
		const time = timeColumn.value;

		if (!el || !time) {
			return 0;
		}

		return (el.scrollWidth - time.offsetWidth) / 3;
	}

	function centerScroll(behavior: ScrollBehavior) {
		const el = scrollerEl.value;
		const step = getWeekStep();

		if (el && step > 0) {
			el.scrollTo({ left: step, behavior });
		}
	}

	async function handleSettled() {
		const el = scrollerEl.value;
		const step = getWeekStep();

		if (!el || step <= 0) return;

		const index = Math.round(el.scrollLeft / step);
		if (index === 1) return;

		index === 0 ? goToPreviousWeek() : goToNextWeek();

		// FIX: nextTick statt requestAnimationFrame -> neu zentrieren, bevor der Browser zeichnet
		await nextTick();
		centerScroll("instant");
	}

	// Breite geändert (Initialisierung, Resize, Drehen) -> wieder auf die mittlere Woche springen
	watch(weekWidth, async () => {
		await nextTick();
		centerScroll("instant");
	});

	const getCurrentCalendarWeek = (): Date => {
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

	const goToPreviousWeek = () => {
		currentWeek.value = subDays(currentWeek.value, 7);
	};

	const goToNextWeek = () => {
		currentWeek.value = addDays(currentWeek.value, 7);
	};

	const currentAndNeighboringWeeks = computed((): [Date, Date, Date] => {
		let current = currentWeek.value;

		const previousWeek = subDays(current, 7);
		const nextWeek = addDays(current, 7);

		return [previousWeek, current, nextWeek];
	});

	const { events, loading, error } = useCalendarEvents(
		currentAndNeighboringWeeks,
	);

	const segments = computed(() => {
		return generateSegments();
	});

	const daySeries = computed(() => {
		const result: Date[][] = [];

		for (let week of currentAndNeighboringWeeks.value) {
			const newDaySeries = [];
			for (let i = 0; i < 5; i++) {
				const date = addDays(week, i);
				newDaySeries.push(date);
			}
			result.push(newDaySeries);
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

	const getResponsiveTimePosition = (
		time: Date,
		segments: CalendarSegment[],
	) => {
		return getTimePosition(time, segments, getResponsiveSegmentHeight);
	};

	onMounted(() => {
		updateMobileState();
		updateWeekWidth();

		window.addEventListener("resize", updateMobileState);
		scrollerEl.value?.addEventListener("scrollend", handleSettled);

		resizeObserver = new ResizeObserver(() => {
			updateWeekWidth();
		});

		if (scrollerEl.value) {
			resizeObserver.observe(scrollerEl.value);
		}
	});

	onBeforeUnmount(() => {
		resizeObserver?.disconnect();

		window.removeEventListener("resize", updateMobileState);
		scrollerEl.value?.removeEventListener("scrollend", handleSettled);
	});
</script>

<template>
	<div class="flex flex-col overflow-hidden bg-neutral-800 h-dvh">
		<div
			class="flex shrink-0 items-center justify-between border-b border-neutral-700 px-2 py-1.5 sm:px-3 sm:py-2"
		>
			<button
				type="button"
				class="rounded-md px-2 py-1 text-sm text-neutral-300 transition hover:bg-neutral-700 hover:text-white sm:px-3 sm:py-1.5"
				@click="goToPreviousWeek()"
			>
				←
			</button>

			<div class="flex items-center gap-1.5 sm:gap-3">
				<span v-if="!error" class="text-neutral-300 sm:block">
					Kalenderwoche:
					{{ calendarWeek }}
				</span>

				<span v-if="loading" class="text-xs text-neutral-500 sm:block">
					...
				</span>

				<span v-if="error && !loading" class="text-xs text-red-500 sm:block">
					Kalender konnte nicht geladen werden.
				</span>
			</div>

			<button
				type="button"
				class="rounded-md px-2 py-1 text-sm text-neutral-300 transition hover:bg-neutral-700 hover:text-white sm:px-3 sm:py-1.5"
				@click="goToNextWeek()"
			>
				→
			</button>
		</div>

		<!--
      FIX: EIN Scroll-Container für beide Achsen.
      - --time-w: Breite der Zeitspalte (an einer Stelle definiert)
      - snap-x + scroll-pl: Wochen rasten direkt rechts neben der Zeitspalte ein
    -->
		<div
			ref="scrollerEl"
			class="flex-1 min-h-0 overflow-auto snap-x snap-mandatory overscroll-x-contain scroll-pl-[var(--time-w)] [--time-w:52px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
		>
			<!-- w-max min-w-full: Zeile ist so breit wie alle Wochen, damit sticky left funktioniert -->
			<div class="flex w-max min-w-full">
				<!-- Zeitspalte: bleibt beim seitlichen Wischen links stehen -->
				<div
					ref="timeColumn"
					class="sticky left-0 z-20 w-[var(--time-w)] shrink-0 bg-neutral-800"
				>
					<div
						class="sticky top-0 z-10 flex justify-center bg-neutral-800 border-b border-neutral-700 h-[58px] shadow-[0_-4px_0_0_var(--color-neutral-800)]"
					>
						<div
							class="flex items-center justify-center border-neutral-700 font-medium text-neutral-400"
						>
							{{ formatMonth(currentWeek) }}
						</div>
					</div>
					<div
						v-for="segment in segments"
						:key="`${segment.type}-${segment.start}-${segment.end}`"
						class="border-b border-neutral-700 text-neutral-400"
						:class="{
              'bg-neutral-500/70': segment.type === 'break',
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

				<!--
          Jede Woche bringt ihre eigene Kopfzeile mit -> Kopfzeile und Inhalt
          sind im selben Scroll-Container und bewegen sich immer exakt gleich.
          isolate: z-Indizes aus CalendarDay bleiben innerhalb der Woche und
          können weder Kopfzeile noch Zeitspalte überdecken.
          :key = Index (NICHT das Datum): Die drei Wochen-Elemente müssen an ihrer
          Position bleiben. Würde Vue sie nach einem Wochenwechsel verschieben,
          rastet der Browser auf das verschobene Element zurück und springt.
        -->
				<div
					v-for="(week, weekIndex) in daySeries"
					:key="weekIndex"
					class="isolate shrink-0 snap-start w-[calc(100vw-var(--time-w))] sm:min-w-[998px] bg-neutral-800 border-b border-neutral-700"
					:style="weekStyle"
				>
					<div
						class="sticky top-0 z-10 grid grid-flow-col auto-cols-fr sm:auto-cols-[minmax(190px,1fr)] bg-neutral-800 shadow-[0_-4px_0_0_var(--color-neutral-800)]"
					>
						<div
							v-for="day in week"
							:key="dateKey(day)"
							class="border-l border-b border-neutral-700 text-center py-1 h-[58px] bg-neutral-800"
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
						class="grid grid-flow-col auto-cols-fr sm:auto-cols-[minmax(190px,1fr)]"
					>
						<CalendarDay
							v-for="day in week"
							:key="dateKey(day)"
							:date="day"
							:events="getEventsForDay(day)"
							:config="calendarConfig"
							:segments="segments"
							:get-segment-height="getResponsiveSegmentHeight"
							:get-event-position="getResponsiveEventPosition"
							:split-event-by-segments="splitEventBySegments"
							:get-time-position="getResponsiveTimePosition"
						/>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
