<script setup lang="ts">
interface CalendarEvent {
  uid: string;
  summary: string;
  description: string | null;
  location: string | null;
  start: string;
  end: string;
}

defineProps<{
  event: CalendarEvent;
  color: string;
}>();

const formatTime = (date: string) => {
  return new Intl.DateTimeFormat("de-AT", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};
</script>

<template>
  <div
    class="absolute left-1 right-1 z-10 overflow-hidden rounded-md px-2 py-1 text-black shadow-sm"
    :class="color"
  >
    <div class="flex h-full gap-2">
      <!-- Uhrzeit -->
      <div
        class="flex shrink-0 flex-col border-r border-black/20 pr-2 text-xs leading-4"
      >
        <span>
          {{ formatTime(event.start) }}
        </span>

        <span>
          {{ formatTime(event.end) }}
        </span>
      </div>

      <!-- Inhalt -->
      <div
        class="min-w-0 flex-1 text-center text-xs"
      >
        <div
          class="truncate font-semibold"
        >
          {{ event.summary }}
        </div>

        <div
          v-if="event.location"
          class="truncate"
        >
          {{ event.location }}
        </div>
      </div>
    </div>
  </div>
</template>
