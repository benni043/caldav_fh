<script setup lang="ts">
	import type {
		CalendarConfig,
		CalendarEvent,
		CalendarSegment,
	} from "~/types/calendar";

	const props = defineProps<{
		date: Date;
		events: CalendarEvent[];
		config: CalendarConfig;
		segments: CalendarSegment[];
		getSegmentHeight: (segment: CalendarSegment) => number;
		getEventPosition: (
			start: string,
			end: string,
			segments: CalendarSegment[],
		) => Record<string, string>;
		splitEventBySegments: (
			event: CalendarEvent,
			segments: CalendarSegment[],
		) => CalendarEvent[];
		getTimePostion: (
			time: Date,
			segments: CalendarSegment[],
		) => Record<string, string>;
	}>();

	const selectedEvent = ref<CalendarEvent | null>(null);

	const modalOpen = computed({
		get: () => selectedEvent.value !== null,
		set: (open) => {
			if (!open) {
				selectedEvent.value = null;
			}
		},
	});

	const now = useNow();

	const isToday = computed(() => {
		return now.value.getDay() === props.date.getDay();
	});

	const displayEvents = computed(() =>
		props.events.flatMap((event) =>
			props.splitEventBySegments(event, props.segments),
		),
	);
</script>

<template>
	<div class="relative border-l border-neutral-700">
		<div
			v-for="segment in segments"
			:key="`${segment.type}-${segment.start}-${segment.end}`"
			class="relative border-b border-neutral-700"
			:class="{
				'bg-neutral-500/70': segment.type === 'break',
			}"
			:style="{
				height: `${getSegmentHeight(segment)}px`,
			}"
		/>

		<CalendarEvent
			v-for="event in displayEvents"
			:key="event.id"
			:event="event"
			:style="
				getEventPosition(
					event.start,
					event.end,
					segments,
				)
			"
			@click="selectedEvent = event"
		/>

		<ClientOnly>
			<div
				class="absolute w-full h-1 z-30"
				:class="{
          'bg-red-500/60': isToday,
          'bg-neutral-700/60': !isToday,
        }"
				:style="{
          ...getTimePostion(now, segments),
        }"
			/>
		</ClientOnly>

		<UModal
			v-model:open="modalOpen"
			:title="selectedEvent?.title"
			:ui="{
				overlay: 'transition-opacity duration-200',
				content: 'transition-all duration-200',
			}"
		>
			<template #body>
				<div v-if="selectedEvent?.room">
					<strong>Raum:</strong>
					{{ selectedEvent.room }}
				</div>

				<div v-if="selectedEvent?.teacher">
					<strong>Lehrer:</strong>
					{{ selectedEvent.teacher }}
				</div>
			</template>
		</UModal>
	</div>
</template>
