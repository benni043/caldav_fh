<script setup lang="ts">
	import type { CalendarEvent as CalendarEventType } from "~/types/calendar";

	defineProps<{
		event: CalendarEventType;
		style: Record<string, string>;
	}>();
</script>

<template>
	<div
		class="absolute left-0.5 right-0.5 z-20 overflow-hidden rounded border border-black/20 px-1 py-1 text-[9px] leading-tight text-white shadow-sm sm:left-1 sm:right-1 sm:rounded-md sm:px-2 sm:py-1.5 sm:text-xs"
		:style="{
      ...style,
      backgroundColor: event.color ?? '#6366f1',
    }"
	>
		<div class="truncate font-semibold">
			{{ event.title }}
		</div>

		<div v-if="event.room" class="hidden truncate opacity-95 sm:block">
			{{ event.room }}
		</div>

		<div v-if="event.teacher" class="hidden truncate opacity-95 sm:block">
			{{ event.teacher }}
		</div>

		<div v-if="event.className" class="hidden truncate opacity-95 sm:block">
			{{ event.className }}
		</div>

		<div class="mt-0.5 text-[7px] opacity-80 sm:mt-1 sm:text-[10px]">
			{{ event.start }} - {{ event.end }}
		</div>
	</div>
</template>
