<script setup lang="ts">
	import type { CalendarEvent as CalendarEventType } from "~/types/calendar";

	defineProps<{
		event: CalendarEventType;
		style: Record<string, string>;
	}>();
</script>

<template>
	<div
		class="absolute left-1 right-1 z-20 overflow-hidden rounded-md border border-black/20 px-2 py-1.5 text-xs text-white shadow-sm"
		:style="{
      ...style,
      backgroundColor: event.color ?? '#6366f1',
    }"
	>
		<div class="font-semibold">
			{{ event.title }}
		</div>

		<div v-if="event.subtitle" class="opacity-95">
			{{ event.subtitle }}
		</div>

		<div v-if="event.room" class="opacity-95">
			{{ event.room }}
		</div>

		<div class="mt-1 text-[10px] opacity-80">
			{{ event.start }} - {{ event.end }}
		</div>
	</div>
</template>
