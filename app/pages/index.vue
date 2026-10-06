<script setup lang="ts">
	import { addWeeks, getISOWeek } from "date-fns";
	import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
	import { calendarConfig } from "~/config/calendar";

	const {
		generateSegments,
		getSegmentHeight,
		getCurrentCalendarWeek,
		formatDay,
		formatDayShort,
		formatDate,
		formatMonth,
		dateKey,
	} = useCalendar(calendarConfig);

	const getWeekWindow = (center: Date) => [
		addWeeks(center, -1),
		center,
		addWeeks(center, 1),
	];

	const weeks = ref<Date[]>(getWeekWindow(getCurrentCalendarWeek()));

	const { getEventsForDay, loading, error } = useCalendarEvents(weeks);

	const segments = computed(() => {
		return generateSegments();
	});

	const getDays = (week: Date) => {
		const result: Date[] = [];

		for (let i = 0; i < 5; i++) {
			const date = new Date(week);

			date.setDate(week.getDate() + i);

			result.push(date);
		}

		return result;
	};

	const sliderRef = ref<HTMLElement | null>(null);

	let verticalScroll = 0;

	function handleVerticalScroll(event: Event) {
		verticalScroll = (event.target as HTMLElement).scrollTop;
	}

	const syncVerticalScroll = () => {
		for (const el of sliderRef.value?.querySelectorAll<HTMLElement>(
			"[data-week]",
		) ?? []) {
			if (el.scrollTop !== verticalScroll) {
				el.scrollTop = verticalScroll;
			}
		}
	};

	let supportsScrollEnd = false;
	let scrollEndTimer: ReturnType<typeof setTimeout> | undefined;
	let syncedThisScroll = false;

	onMounted(() => {
		supportsScrollEnd = "onscrollend" in window;

		if (sliderRef.value) {
			sliderRef.value.scrollLeft = sliderRef.value.clientWidth;
		}
	});

	onBeforeUnmount(() => {
		clearTimeout(scrollEndTimer);
	});

	function handleScroll() {
		if (!syncedThisScroll) {
			syncVerticalScroll();
			syncedThisScroll = true;
		}

		if (!supportsScrollEnd) {
			clearTimeout(scrollEndTimer);
			scrollEndTimer = setTimeout(handleScrollEnd, 150);
		}
	}

	async function handleScrollEnd() {
		syncedThisScroll = false;

		const el = sliderRef.value;

		if (!el) {
			return;
		}

		const index = Math.round(el.scrollLeft / el.clientWidth);
		const center = weeks.value[index];

		if (index === 1 || !center) {
			return;
		}

		weeks.value = getWeekWindow(center);

		await nextTick();
		el.scrollLeft = el.clientWidth;
		syncVerticalScroll();
	}

	const scrollWeeks = (direction: 1 | -1) => {
		const el = sliderRef.value;

		el?.scrollBy({ left: direction * el.clientWidth, behavior: "smooth" });
	};
</script>

<template>
	<div class="flex flex-col w-screen h-screen overflow-hidden">
		<header
			class="hidden md:flex h-[60px] w-full bg-neutral-800 border-b border-neutral-700 text-white items-center px-4 z-10 shrink-0"
		>
			<span>Top Bar</span>

			<span v-if="loading" class="ml-auto text-sm">Lade Kalender...</span>

			<span v-else-if="error" class="ml-auto text-sm">
				Kalender konnte nicht geladen werden.
			</span>

			<div
				class="hidden md:flex items-center gap-1"
				:class="{ 'ml-auto': !loading && !error, 'ml-4': loading || error }"
			>
				<button
					type="button"
					aria-label="Vorherige Woche"
					class="flex rounded-md p-1.5 transition hover:cursor-pointer hover:bg-neutral-700"
					@click="scrollWeeks(-1)"
				>
					<UIcon name="i-lucide-chevron-left" class="size-5" />
				</button>

				<button
					type="button"
					aria-label="Nächste Woche"
					class="flex rounded-md p-1.5 transition hover:cursor-pointer hover:bg-neutral-700"
					@click="scrollWeeks(1)"
				>
					<UIcon name="i-lucide-chevron-right" class="size-5" />
				</button>
			</div>
		</header>

		<main
			ref="sliderRef"
			class="flex flex-1 min-h-0 overflow-x-auto overflow-y-hidden overscroll-x-none snap-x snap-mandatory scrollbar-none"
			@scroll="handleScroll"
			@scrollend="handleScrollEnd"
		>
			<section
				v-for="week in weeks"
				:key="dateKey(week)"
				data-week
				class="w-full h-full shrink-0 snap-start snap-always overflow-y-auto overflow-x-hidden overscroll-y-none scrollbar-none text-center"
				@scroll="handleVerticalScroll"
			>
				<div
					class="sticky top-0 z-30 h-[60px] bg-neutral-800 grid grid-cols-[60px_repeat(5,minmax(0,1fr))] border-b border-neutral-700"
				>
					<div
						class="border-r border-neutral-700 flex flex-col items-center justify-center"
					>
						<div class="text-white">KW {{ getISOWeek(week) }}</div>
						<div class="text-neutral-400">
							{{ formatMonth(week) }}
						</div>
					</div>

					<div
						v-for="day in getDays(week)"
						:key="dateKey(day)"
						class="border-neutral-700 border-r flex flex-col justify-center"
					>
						<div class="text-white sm:hidden">
							{{ formatDayShort(day) }}
						</div>

						<div class="text-neutral-400 sm:hidden">
							{{ day.getDate() }}
						</div>

						<div class="hidden capitalize text-white sm:block">
							{{ formatDay(day) }}
						</div>

						<div class="hidden text-sm text-neutral-400 sm:block">
							{{ formatDate(day) }}
						</div>
					</div>
				</div>

				<div class="grid grid-cols-[60px_repeat(5,minmax(0,1fr))]">
					<div>
						<div
							v-for="segment in segments"
							:key="`${segment.type}-${segment.start}-${segment.end}`"
							class="border-b border-r border-neutral-700 text-neutral-400"
							:class="{
								'bg-neutral-500': segment.type === 'break',
							}"
							:style="{
								height: `${getSegmentHeight(segment)}px`,
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
						v-for="day in getDays(week)"
						:key="dateKey(day)"
						:date="day"
						:events="getEventsForDay(day)"
						:segments="segments"
					/>
				</div>
			</section>
		</main>
	</div>
</template>
