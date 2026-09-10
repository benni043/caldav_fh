<script setup lang="ts">
	import { calendarConfig } from "~/config/calendar";

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

	const currentWeek = ref(new Date("2026-09-14"));

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

	const formatDate = (date: Date) => {
		return date.toLocaleDateString("de-AT", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		});
	};

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

	const today = () => {
		const date = new Date();

		const day = date.getDay();

		const mondayOffset = day === 0 ? -6 : 1 - day;

		date.setDate(date.getDate() + mondayOffset);

		currentWeek.value = date;
	};

	watch(
		currentWeek,
		(week) => {
			fetchEvents(week);
		},
		{ immediate: true },
	);
</script>

<template>
	<div
		class="flex flex-col overflow-hidden rounded-xl border border-neutral-700 bg-[#242829]"
	>
		<div
			class="flex items-center justify-between border-b border-neutral-700 px-3 py-2"
		>
			<button
				type="button"
				class="rounded-md px-3 py-1.5 text-sm text-neutral-300 transition hover:bg-neutral-700 hover:text-white"
				@click="previousWeek"
			>
				←
			</button>

			<div class="flex items-center gap-3">
				<button
					type="button"
					class="rounded-md px-3 py-1.5 text-sm text-neutral-300 transition hover:bg-neutral-700 hover:text-white"
					@click="today"
				>
					Heute
				</button>

				<span v-if="loading" class="text-xs text-neutral-500">
					Lade Kalender...
				</span>

				<span v-if="error" class="text-xs text-red-400">
					Kalender konnte nicht geladen werden.
				</span>
			</div>

			<button
				type="button"
				class="rounded-md px-3 py-1.5 text-sm text-neutral-300 transition hover:bg-neutral-700 hover:text-white"
				@click="nextWeek"
			>
				→
			</button>
		</div>

		<!-- Kalender -->
		<div class="overflow-x-auto">
			<div class="min-w-262.5">
				<!-- Header -->
				<div
					class="grid grid-cols-[70px_repeat(5,minmax(190px,1fr))] border-b border-neutral-700"
				>
					<div />

					<div
						v-for="day in days"
						:key="dateKey(day)"
						class="border-l border-neutral-700 px-3 py-3 text-center"
					>
						<div class="font-semibold capitalize text-white">
							{{ formatDay(day) }}
						</div>

						<div class="text-sm text-neutral-400">
							{{ formatDate(day) }}
						</div>
					</div>
				</div>

				<div class="grid grid-cols-[70px_repeat(5,minmax(190px,1fr))]">
					<div>
						<div
							v-for="segment in segments"
							:key="`${segment.type}-${segment.start}-${segment.end}`"
							class="flex items-center justify-end border-b border-neutral-700 pr-2 text-right text-xs text-neutral-400"
							:class="{
                'bg-neutral-500/70':
                  segment.type === 'break',
              }"
							:style="{
                height: `${getSegmentHeight(segment)}px`,
              }"
						>
							<template v-if="segment.type === 'lesson'">
								<div class="leading-tight">
									<div>
										{{ segment.start }}
									</div>

									<div>
										{{ segment.end }}
									</div>
								</div>
							</template>

							<template v-else>
								<div class="text-[10px] text-neutral-300">
									{{ segment.start }}
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
						:get-segment-height="getSegmentHeight"
						:get-event-position="getEventPosition"
						:split-event-by-segments="splitEventBySegments"
					/>
				</div>
			</div>
		</div>
	</div>
</template>
