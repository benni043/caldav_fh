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
	}>();

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
        'bg-neutral-500/70':
          segment.type === 'break',
      }"
			:style="{
        height: `${getSegmentHeight(segment)}px`,
      }"
		>
			<div
				v-if="segment.type === 'break'"
				class="flex h-full items-center justify-center"
			>
				<span v-if="segment.label" class="text-xs font-medium text-neutral-300">
					{{ segment.label }}
				</span>
			</div>
		</div>

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
		/>
	</div>
</template>
