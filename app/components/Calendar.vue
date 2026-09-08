<script setup lang="ts">
import {
  addDays,
  format,
  isSameDay,
  startOfWeek,
} from "date-fns";

interface CalendarEvent {
  uid: string;
  summary: string;
  description: string | null;
  location: string | null;
  start: string;
  end: string;
}

const props = defineProps<{
  week: Date;
}>();

const events = ref<CalendarEvent[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

/*
 * Arbeitszeit des Kalenders
 */
const calendarStartHour = 8;
const calendarEndHour = 18;

/*
 * Höhe einer Stunde in Pixel
 */
const hourHeight = 80;

const days = computed(() => {
  const monday = startOfWeek(props.week, {
    weekStartsOn: 1,
  });

  return Array.from({ length: 5 }, (_, index) => {
    return addDays(monday, index);
  });
});

/*
 * Alle Stunden
 */
const hours = computed(() => {
  return Array.from(
    {
      length: calendarEndHour - calendarStartHour + 1,
    },
    (_, index) => calendarStartHour + index,
  );
});

/*
 * Events dem jeweiligen Tag zuordnen
 */
const eventsForDay = (day: Date) => {
  return events.value.filter((event) => {
    return isSameDay(new Date(event.start), day);
  });
};

/*
 * Position eines Events
 */
const getEventStyle = (event: CalendarEvent) => {
  const start = new Date(event.start);
  const end = new Date(event.end);

  const startMinutes =
    start.getHours() * 60 +
    start.getMinutes();

  const endMinutes =
    end.getHours() * 60 +
    end.getMinutes();

  const calendarStartMinutes =
    calendarStartHour * 60;

  const top =
    ((startMinutes - calendarStartMinutes) / 60) *
    hourHeight;

  const height =
    ((endMinutes - startMinutes) / 60) *
    hourHeight;

  return {
    top: `${top}px`,
    height: `${Math.max(height, 30)}px`,
  };
};

/*
 * Event-Farbe
 *
 * Da CIS die Farbe nicht im ICS liefert,
 * vergeben wir vorerst anhand des Subjects
 * eine deterministische Farbe.
 */
const eventColors = [
  "bg-yellow-500",
  "bg-blue-600",
  "bg-purple-600",
  "bg-pink-500",
  "bg-cyan-600",
  "bg-orange-500",
];

const getEventColor = (event: CalendarEvent) => {
  let hash = 0;

  for (const char of event.summary) {
    hash = char.charCodeAt(0) + ((hash << 5) - hash);
  }

  return eventColors[
    Math.abs(hash) % eventColors.length
  ];
};

/*
 * Daten vom Backend laden
 */
const loadEvents = async () => {
  loading.value = true;
  error.value = null;

  try {
    const monday = startOfWeek(props.week, {
      weekStartsOn: 1,
    });

    const nextMonday = addDays(monday, 7);

    /*
     * Hier deine CalDAV-URL.
     *
     * Die Credentials sollten später NICHT fest
     * im Frontend stehen.
     */
    const url =
      "https://cis.technikum-wien.at/webdav/lvplan.php/";

    const username = "el26b041";
    const password = "6jLd!gfFnzk2";

    events.value = await $fetch<CalendarEvent[]>(
      "/api/calendar",
      {
        query: {
          url,
          from: monday.toISOString(),
          to: nextMonday.toISOString(),
        },

        headers: {
          Authorization:
            "Basic " +
            btoa(`${username}:${password}`),
        },
      },
    );
  } catch (err) {
    console.error(err);

    error.value = "Kalender konnte nicht geladen werden.";
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.week,
  loadEvents,
  { immediate: true },
);

</script>

<template>
  <div
    class="overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900"
  >
    <!-- Loading -->
    <div
      v-if="loading"
      class="flex h-40 items-center justify-center text-zinc-400"
    >
      Kalender wird geladen...
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="flex h-40 items-center justify-center text-red-400"
    >
      {{ error }}
    </div>

    <div v-else class="overflow-x-auto">
      <div class="min-w-[900px]">
        <!-- Tagesüberschriften -->
        <div
          class="grid grid-cols-[70px_repeat(5,1fr)] border-b border-zinc-700"
        >
          <div />

          <div
            v-for="day in days"
            :key="day.toISOString()"
            class="border-l border-zinc-700 px-3 py-3 text-center"
          >
            <div class="text-sm font-semibold">
              {{ format(day, "EEEE") }}
            </div>

            <div class="text-xs text-zinc-400">
              {{ format(day, "dd.MM.yyyy") }}
            </div>
          </div>
        </div>

        <!-- Kalender -->
        <div class="grid grid-cols-[70px_repeat(5,1fr)]">
          <!-- Zeitachse -->
          <div class="relative">
            <div
              v-for="hour in hours"
              :key="hour"
              class="relative border-b border-zinc-700 text-right text-xs text-zinc-400"
              :style="{
                height: `${hourHeight}px`,
              }"
            >
              <span
                class="absolute -top-2 right-2"
              >
                {{ String(hour).padStart(2, "0") }}:00
              </span>
            </div>
          </div>

          <!-- Tage -->
          <div
            v-for="day in days"
            :key="day.toISOString()"
            class="relative border-l border-zinc-700"
            :style="{
              height: `${(calendarEndHour - calendarStartHour) * hourHeight}px`,
            }"
          >
            <!-- Stundenlinien -->
            <div
              v-for="hour in hours.slice(0, -1)"
              :key="hour"
              class="absolute left-0 right-0 border-b border-zinc-800"
              :style="{
                top: `${(hour - calendarStartHour) * hourHeight}px`,
              }"
            />

            <!-- Events -->
            <CalendarEvent
              v-for="calendarEvent in eventsForDay(day)"
              :key="calendarEvent.uid"
              :event="calendarEvent"
              :style="getEventStyle(calendarEvent)"
              :color="getEventColor(calendarEvent)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
