<script setup lang="ts">
import { nextTick, onMounted, ref } from "vue";

interface Section {
  id: number;
  title: string;
  items: (string | number)[];
}

let sectionCounter = 1;

function createSection(title: string, items: (string | number)[]): Section {
  return {
    id: sectionCounter++,
    title,
    items,
  };
}

function fetchNextSectionFromApi(): Section {
  const id = sectionCounter++;
  return {
    id,
    title: `Section ${id}`,
    items: Array.from({ length: 8 }, (_, i) => `Item ${id}-${i + 1}`),
  };
}

const dynamicSections = ref<Section[]>([
  createSection("Section One", [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]),
  createSection("Section Two", [10, 4, 3, 2, 1]),
  createSection("Section Three", [6, 5, 4, 3, 2, 1]),
]);

const sliderRef = ref<HTMLElement | null>(null);
let isUpdating = false;

onMounted(() => {
  if (sliderRef.value) {
    sliderRef.value.scrollLeft = sliderRef.value.clientWidth;
  }
});

async function handleScroll(event: Event) {
  if (isUpdating) return;

  const target = event.target as HTMLElement;
  const sectionWidth = target.clientWidth;

  const isAtEnd =
    target.scrollLeft + target.clientWidth >= target.scrollWidth - 10;
  const isAtBegin = target.scrollLeft <= 10;

  if (isAtEnd) {
    isUpdating = true;

    dynamicSections.value.shift();
    dynamicSections.value.push(fetchNextSectionFromApi());

    await nextTick();
    target.scrollLeft -= sectionWidth;

    setTimeout(() => {
      isUpdating = false;
    }, 50);
  } else if (isAtBegin) {
    isUpdating = true;

    dynamicSections.value.pop();
    dynamicSections.value.unshift(fetchNextSectionFromApi());

    await nextTick();
    target.scrollLeft += sectionWidth;

    setTimeout(() => {
      isUpdating = false;
    }, 50);
  }
}

import { getISOWeek } from "date-fns";
import { calendarConfig } from "~/config/calendar";
import type { CalendarSegment } from "~/types/calendar";

const {
  generateSegments,
  getSegmentHeight,
  getEventPosition,
  getTimePosition,
  splitEventBySegments,
  getCurrentCalendarWeek,
  formatDay,
  formatDayShort,
  formatDate,
  formatMonth,
  dateKey,
} = useCalendar(calendarConfig);

const currentWeek = ref(getCurrentCalendarWeek());

const { events, loading, error } = useCalendarEvents(currentWeek);

const segments = computed(() => {
  return generateSegments();
});

const days = computed(() => {
  const result: Date[] = [];

  for (let i = 0; i < 5; i++) {
    const date = new Date(currentWeek.value);

    date.setDate(currentWeek.value.getDate() + i);

    result.push(date);
  }

  return result;
});

const calendarWeek = computed(() => {
  return getISOWeek(currentWeek.value);
});

const getEventsForDay = (date: Date) => {
  const key = dateKey(date);

  return events.value.filter((event) => event.date === key);
};

const previousWeek = () => {
  const date = new Date(currentWeek.value);

  date.setDate(date.getDate() - 7);

  currentWeek.value = date;
};

const nextWeek = () => {
  const date = new Date(currentWeek.value);

  date.setDate(date.getDate() + 7);

  currentWeek.value = date;
};

const getResponsiveSegmentHeight = (segment: CalendarSegment) => {
  return getSegmentHeight(segment);
};

const getResponsiveEventPosition = (
  start: string,
  end: string,
  segments: CalendarSegment[],
) => {
  return getEventPosition(start, end, segments, getResponsiveSegmentHeight);
};

const getResponsiveTimePosition = (time: Date, segments: CalendarSegment[]) => {
  return getTimePosition(time, segments, getResponsiveSegmentHeight);
};
</script>

<template>
  <div class="flex flex-col w-screen h-screen overflow-hidden">
    <header
      class="h-[60px] w-full bg-red-600 text-white flex items-center px-4 z-10 shrink-0"
    >
      <span>Top Bar</span>
    </header>

    <div class="flex flex-1 h-[calc(100vh-60px)] overflow-hidden">
      <aside class="w-[60px] h-full z-10">
        <div
          class="h-[60px] bg-neutral-800 border-b border-neutral-700 flex flex-col items-center justify-center"
        >
          <div class="text-white">KW {{ calendarWeek }}</div>
          <div class="text-neutral-400">
            {{ formatMonth(currentWeek) }}
          </div>
        </div>

        <div ref="timeColumn">
          <div
            v-for="segment in segments"
            :key="`${segment.type}-${segment.start}-${segment.end}`"
            class="border-b border-neutral-700 text-neutral-400"
            :class="{
              'bg-neutral-500': segment.type === 'break',
            }"
            :style="{
              height: `${getResponsiveSegmentHeight(segment)}px`,
            }"
          >
            <template v-if="segment.type === 'lesson'">
              <div
                class="flex h-full flex-col items-center justify-between py-1 leading-none"
              >
                <span>
                  {{ segment.start }}
                </span>

                <span>
                  {{ segment.end }}
                </span>
              </div>
            </template>
          </div>
        </div>
      </aside>

      <main
        ref="sliderRef"
        class="flex-1 flex overflow-x-auto overflow-y-hidden h-full snap-x snap-mandatory scrollbar-none"
        @scroll="handleScroll"
      >
        <section
          v-for="section in dynamicSections"
          :key="section.id"
          class="w-full h-full snap-start text-center relative overflow-y-auto scrollbar-none shrink-0"
        >
          <div
            class="sticky top-0 z-30 h-[60px] bg-neutral-800 grid grid-cols-5 border-b border-neutral-700"
          >
            <div
              v-for="day in days"
              :key="dateKey(day)"
              class="border-l border-neutral-700 flex flex-col justify-center"
            >
              <div class="text-white sm:hidden">
                {{ formatDayShort(day) }}
              </div>

              <div class="text-neutral-400 sm:hidden">
                {{ day.getDate() }}
              </div>

              <div class="hidden capitalize text-white sm:block">
                {{ formatDay(day) }}
              </div>

              <div class="hidden text-sm text-neutral-400 sm:block">
                {{ formatDate(day) }}
              </div>
            </div>
          </div>

          <div class="overflow-auto">
            <div class="min-w-0 sm:min-w-262.5">
              <div ref="calendarBody" class="grid grid-cols-5">
                <CalendarDay
                  v-for="day in days"
                  :key="dateKey(day)"
                  :date="day"
                  :events="getEventsForDay(day)"
                  :config="calendarConfig"
                  :segments="segments"
                  :get-segment-height="getResponsiveSegmentHeight"
                  :get-event-position="getResponsiveEventPosition"
                  :split-event-by-segments="splitEventBySegments"
                  :get-time-position="getResponsiveTimePosition"
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<style>
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
