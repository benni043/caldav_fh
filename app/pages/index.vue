<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue';

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
    items
  };
}

function fetchNextSectionFromApi(): Section {
  const id = sectionCounter++;
  return {
    id,
    title: `Section ${id}`,
    items: Array.from({ length: 8 }, (_, i) => `Item ${id}-${i + 1}`)
  };
}

const dynamicSections = ref<Section[]>([
  createSection('Section One', [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]),
  createSection('Section Two', [10, 4, 3, 2, 1]),
  createSection('Section Three', [6, 5, 4, 3, 2, 1])
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

  const isAtEnd = target.scrollLeft + target.clientWidth >= target.scrollWidth - 10;
  const isAtBegin = target.scrollLeft <= 10;

  if (isAtEnd) {
    isUpdating = true;

    dynamicSections.value.shift();
    dynamicSections.value.push(fetchNextSectionFromApi());

    await nextTick();
    target.scrollLeft -= sectionWidth;

    setTimeout(() => { isUpdating = false; }, 50);
  } else if (isAtBegin) {
    isUpdating = true;

    dynamicSections.value.pop();
    dynamicSections.value.unshift(fetchNextSectionFromApi());

    await nextTick();
    target.scrollLeft += sectionWidth;

    setTimeout(() => { isUpdating = false; }, 50);
  }
}
</script>

<template>
  <div class="flex flex-col w-screen h-screen overflow-hidden">
    <header class="h-[60px] w-full bg-red-600 text-white flex items-center px-4 z-10 shrink-0">
      <span>Top Bar</span>
    </header>

    <div class="flex flex-1 h-[calc(100vh-60px)] overflow-hidden">
      <aside class="w-[60px] h-full bg-blue-600 text-white p-4 z-10 shrink-0">
        <span>Left Bar</span>
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
          <h1 class="text-3xl font-bold my-4">{{ section.title }}</h1>
          <div v-for="(item, index) in section.items" :key="index">
            <h2 class="text-9xl font-extrabold my-4">{{ item }}</h2>
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
