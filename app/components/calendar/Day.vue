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
		getTimePosition: (
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
		const today = now.value;
		const target = props.date;

		return (
			today.getFullYear() === target.getFullYear() &&
			today.getMonth() === target.getMonth() &&
			today.getDate() === target.getDate()
		);
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
				'bg-neutral-500': segment.type === 'break',
			}"
			:style="{
				height: `${getSegmentHeight(segment)}px`,
			}"
		/>

		<CalendarEntry
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
          'bg-red-700': isToday,
          'bg-neutral-700': !isToday,
        }"
				:style="{
          ...getTimePosition(now, segments),
        }"
			/>
		</ClientOnly>

		<UModal v-model:open="modalOpen" :title="selectedEvent?.title">
			<template #body>
				<div v-if="selectedEvent?.room">
					<strong>Raum:</strong>
					{{ selectedEvent.room }}
				</div>

				<div v-if="selectedEvent?.teacher">
					<strong>Lehrer:</strong>
					{{ selectedEvent.teacher }}
				</div>

				<div class="flex gap-2">
					<NuxtLink
						:to="`https://taskline.tobinio.dev/?org=c9e4c18f-59d5-4645-a145-66bc5b5709f6&category=${selectedEvent?.tasklineId}`"
						external
						target="_blank"
						class="flex gap-0.5 items-center"
					>
						<UIcon name="ci:external-link" class="size-5" />
						Taskline
					</NuxtLink>
					<NuxtLink
						:to="`https://moodle.technikum-wien.at/course/view.php?id=${selectedEvent?.mooddleId}`"
						external
						target="_blank"
						class="flex gap-0.5 items-center"
					>
						<UIcon name="ci:external-link" class="size-5" />
						Moodle
					</NuxtLink>
				</div>
			</template>
		</UModal>
	</div>
</template>
