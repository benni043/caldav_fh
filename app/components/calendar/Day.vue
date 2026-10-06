<script setup lang="ts">
	import { calendarConfig } from "~/config/calendar";
	import type { CalendarEvent, CalendarSegment } from "~/types/calendar";

	const props = defineProps<{
		date: Date;
		events: CalendarEvent[];
		segments: CalendarSegment[];
	}>();

	const {
		getSegmentHeight,
		getEventPosition,
		getTimePosition,
		splitEventBySegments,
		timeToMinutes,
	} = useCalendar(calendarConfig);

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

	const isWithinHours = computed(() => {
		const minutes = now.value.getHours() * 60 + now.value.getMinutes();

		return (
			minutes >= timeToMinutes(calendarConfig.startTime) &&
			minutes < timeToMinutes(calendarConfig.endTime)
		);
	});

	const displayEvents = computed(() =>
		props.events.flatMap((event) =>
			splitEventBySegments(event, props.segments),
		),
	);
</script>

<template>
	<div class="relative border-r border-neutral-700">
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
			:style="getEventPosition(event.start, event.end, segments)"
			@click="selectedEvent = event"
		/>

		<ClientOnly>
			<div
				v-if="isWithinHours"
				class="absolute w-full h-1 z-25"
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
						v-if="selectedEvent?.tasklineId"
						:to="`https://taskline.tobinio.dev/?org=c9e4c18f-59d5-4645-a145-66bc5b5709f6&category=${selectedEvent?.tasklineId}`"
						external
						target="_blank"
						class="flex gap-0.5 items-center"
					>
						<UIcon name="i-lucide-external-link" class="size-5" />
						Taskline
					</NuxtLink>
					<NuxtLink
						v-if="selectedEvent?.moodleId"
						:to="`https://moodle.technikum-wien.at/course/view.php?id=${selectedEvent?.moodleId}`"
						external
						target="_blank"
						class="flex gap-0.5 items-center"
					>
						<UIcon name="i-lucide-external-link" class="size-5" />
						Moodle
					</NuxtLink>
				</div>
			</template>
		</UModal>
	</div>
</template>
