<script setup lang="ts">
import { startOfWeek, addWeeks } from "date-fns";

const currentWeek = ref(
  startOfWeek(new Date(), {
    weekStartsOn: 1,
  }),
);

const previousWeek = () => {
  currentWeek.value = addWeeks(currentWeek.value, -1);
};

const nextWeek = () => {
  currentWeek.value = addWeeks(currentWeek.value, 1);
};

const today = () => {
  currentWeek.value = startOfWeek(new Date(), {
    weekStartsOn: 1,
  });
};
</script>

<template>
  <main class="min-h-screen bg-zinc-900 text-white">
    <div class="mx-auto max-w-[1400px] p-6">
      <!-- Header -->
      <header class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold">
            Stundenplan
          </h1>

          <p class="mt-1 text-sm text-zinc-400">
            Kalenderwoche {{ getWeekNumber(currentWeek) }}
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            class="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm transition hover:bg-zinc-700"
            @click="previousWeek"
          >
            ←
          </button>

          <button
            class="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm transition hover:bg-zinc-700"
            @click="today"
          >
            Heute
          </button>

          <button
            class="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm transition hover:bg-zinc-700"
            @click="nextWeek"
          >
            →
          </button>
        </div>
      </header>

      <Calendar :week="currentWeek" />
    </div>
  </main>
</template>

<script lang="ts">
function getWeekNumber(date: Date) {
  const target = new Date(date);

  target.setHours(0, 0, 0, 0);

  target.setDate(
    target.getDate() + 3 - ((target.getDay() + 6) % 7),
  );

  const week1 = new Date(
    target.getFullYear(),
    0,
    4,
  );

  return (
    1 +
    Math.round(
      ((target.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
      7,
    )
  );
}
</script>
