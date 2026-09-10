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
	}>();

	computed(() => {
		const year = props.date.getFullYear();
		const month = String(props.date.getMonth() + 1).padStart(2, "0");
		const day = String(props.date.getDate()).padStart(2, "0");

		return `${year}-${month}-${day}`;
	});
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
				<span class="text-xs font-medium text-neutral-300">
					{{ segment.label }}
				</span>
			</div>
		</div>

		<CalendarEvent
			v-for="event in events"
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
