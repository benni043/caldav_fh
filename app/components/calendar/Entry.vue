<script setup lang="ts">
	import type { CalendarEvent as CalendarEventType } from "~/types/calendar";

	defineProps<{
		event: CalendarEventType;
		style: Record<string, string>;
	}>();

	const emit = defineEmits<{
		click: [event: CalendarEventType];
	}>();
</script>

<template>
	<button
		type="button"
		class="hover:cursor-pointer hover:brightness-90 absolute flex flex-col justify-center leading-tight text-black inset-x-0 z-20 rounded border border-neutral-700 text-[12px] sm:rounded-md sm:text-sm"
		:style="{
    ...style,
    backgroundColor: event.color ?? '#6366f1',
  }"
		@click.stop="emit('click', event)"
	>
		<span class="truncate px-1 font-semibold">
			{{ event.title }}
		</span>

		<span v-if="event.room" class="truncate px-1">
			{{ event.room }}
		</span>

		<span v-if="event.teacher" class="truncate px-1">
			{{ event.teacher }}
		</span>
	</button>
</template>
