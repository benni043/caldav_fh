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

	const { getEventsForDay, refresh, loading, error } = useCalendarEvents(weeks);

	const now = useNow();

	const isToday = (day: Date) => dateKey(day) === dateKey(now.value);

	const settings = useSettings();

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

	const {
		pullDistance,
		progress,
		status: pullStatus,
		trigger: triggerRefresh,
	} = usePullToRefresh(sliderRef, refresh);

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

	// Matches the grid: 60px time column + 5 day columns, below Tailwind's sm
	const timeColumnWidth = 60;
	const mobileBreakpoint = 640;

	const mobileLessonHeight = useState<number | null>("mobileLessonHeight");

	const updateLessonHeight = () => {
		const width = sliderRef.value?.clientWidth ?? 0;

		mobileLessonHeight.value =
			width > 0 && width < mobileBreakpoint
				? (width - timeColumnWidth) / 5
				: null;
	};

	let resizeObserver: ResizeObserver | undefined;

	onMounted(() => {
		supportsScrollEnd = "onscrollend" in window;

		if (sliderRef.value) {
			sliderRef.value.scrollLeft = sliderRef.value.clientWidth;

			updateLessonHeight();
			resizeObserver = new ResizeObserver(updateLessonHeight);
			resizeObserver.observe(sliderRef.value);
		}
	});

	onBeforeUnmount(() => {
		resizeObserver?.disconnect();
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

	// Puts the current week next to the visible one and slides to it,
	// so it animates like a normal page change; handleScrollEnd recenters
	const scrollToToday = async () => {
		const el = sliderRef.value;
		const [, center] = weeks.value;
		const today = getCurrentCalendarWeek();

		if (!el || !center || dateKey(today) === dateKey(center)) {
			return;
		}

		const direction = today < center ? -1 : 1;

		weeks.value =
			direction === -1
				? [today, center, addWeeks(center, 1)]
				: [addWeeks(center, -1), center, today];

		await nextTick();
		scrollWeeks(direction);
	};
</script>

<template>
	<div class="flex flex-col w-screen h-dvh overflow-hidden">
		<header
			class="flex h-[60px] w-full bg-neutral-800 border-b border-neutral-700 text-white items-center pl-2 pr-4 z-10 shrink-0"
		>
			<button
				type="button"
				:aria-label="$t('goToToday')"
				class="font-semibold transition hover:cursor-pointer hover:text-neutral-300"
				@click="scrollToToday"
			>
				{{ $t("title") }}
			</button>

			<div class="hidden md:flex items-center gap-1 ml-6">
				<button
					type="button"
					:aria-label="$t('previousWeek')"
					class="flex rounded-md p-1.5 transition hover:cursor-pointer hover:bg-neutral-700"
					@click="scrollWeeks(-1)"
				>
					<UIcon name="i-lucide-chevron-left" class="size-5" />
				</button>

				<button
					type="button"
					:aria-label="$t('nextWeek')"
					class="flex rounded-md p-1.5 transition hover:cursor-pointer hover:bg-neutral-700"
					@click="scrollWeeks(1)"
				>
					<UIcon name="i-lucide-chevron-right" class="size-5" />
				</button>
			</div>

			<span v-if="loading" class="ml-auto text-sm">{{ $t("loading") }}</span>

			<span v-else-if="error" class="ml-auto text-sm">
				{{ $t("loadError") }}
			</span>

			<div
				class="flex items-center gap-1"
				:class="{ 'ml-auto': !loading && !error, 'ml-4': loading || error }"
			>
				<button
					type="button"
					:aria-label="$t('refresh')"
					class="hidden md:flex rounded-md p-1.5 transition hover:cursor-pointer hover:bg-neutral-700 disabled:opacity-50"
					:disabled="pullStatus === 'refreshing'"
					@click="triggerRefresh"
				>
					<UIcon
						name="i-lucide-refresh-cw"
						class="size-5"
						:class="{ 'animate-spin': pullStatus === 'refreshing' }"
					/>
				</button>

				<SettingsModal />
			</div>
		</header>

		<div class="relative flex flex-1 min-h-0">
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
							<div class="text-white">
								{{ $t("calendarWeek") }} {{ getISOWeek(week) }}
							</div>
							<div class="text-neutral-400">
								{{ formatMonth(week) }}
							</div>
						</div>

						<div
							v-for="day in getDays(week)"
							:key="dateKey(day)"
							class="border-neutral-700 border-r flex flex-col justify-center"
						>
							<div
								:class="
									isToday(day) && [
										'font-bold',
										settings.colorfulToday ? 'animate-rainbow' : 'text-white',
									]
								"
							>
								<div class="sm:hidden" :class="{ 'text-white': !isToday(day) }">
									{{ formatDayShort(day) }}
								</div>

								<div
									class="sm:hidden"
									:class="{ 'text-neutral-400': !isToday(day) }"
								>
									{{ day.getDate() }}
								</div>

								<div
									class="hidden capitalize sm:block"
									:class="{ 'text-white': !isToday(day) }"
								>
									{{ formatDay(day) }}
								</div>

								<div
									class="hidden text-sm sm:block"
									:class="{ 'text-neutral-400': !isToday(day) }"
								>
									{{ formatDate(day) }}
								</div>
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

			<div
				class="pointer-events-none absolute inset-x-0 top-[60px] z-40 flex justify-center"
				:class="{ 'transition-transform duration-200': pullStatus !== 'pulling' }"
				:style="{ transform: `translateY(${pullDistance - 48}px)` }"
				role="status"
				aria-live="polite"
			>
				<div
					v-if="pullStatus !== 'idle'"
					class="flex h-10 items-center gap-2 rounded-full border border-neutral-700 bg-neutral-800 px-2.5 text-sm text-white shadow-lg"
				>
					<UIcon
						v-if="pullStatus === 'pulling'"
						name="i-lucide-arrow-down"
						class="size-5 transition-transform"
						:class="progress >= 1 ? 'text-green-400' : 'text-neutral-400'"
						:style="{ transform: `rotate(${progress >= 1 ? 180 : 0}deg)` }"
					/>

					<UIcon
						v-else-if="pullStatus === 'refreshing'"
						name="i-lucide-refresh-cw"
						class="size-5 animate-spin"
					/>

					<template v-else-if="pullStatus === 'done'">
						<UIcon name="i-lucide-check" class="size-5 text-green-400" />
						<span class="pr-1">{{ $t("refreshed") }}</span>
					</template>

					<template v-else>
						<UIcon name="i-lucide-circle-alert" class="size-5 text-red-400" />
						<span class="pr-1">{{ $t("refreshFailed") }}</span>
					</template>
				</div>
			</div>
		</div>
	</div>
</template>
