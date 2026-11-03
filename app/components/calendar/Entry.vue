<script setup lang="ts">
	import type { CalendarEvent as CalendarEventType } from "~/types/calendar";

	const props = defineProps<{
		event: CalendarEventType;
		style: Record<string, string>;
	}>();

	const emit = defineEmits<{
		click: [event: CalendarEventType];
	}>();

	const { hasTest } = useSubjectTests();

	const test = computed(() => {
		return hasTest(props.event.title, props.event.date);
	});

	const color = computed(() => {
		return props.event.color ?? "#6366f1";
	});

	const darkenColor = computed(() => {
		return darkenHex(color.value, 10);
	});

	const el = ref<HTMLElement>();
	const bgPosition = ref("0px 0px");

	function updateBgPosition() {
		if (!el.value) return;
		const r = el.value.getBoundingClientRect();
		bgPosition.value = `${-(r.left + window.scrollX)}px ${-(r.top + window.scrollY)}px`;
	}

	let ro: ResizeObserver | undefined;
	onMounted(() => {
		updateBgPosition();
		window.addEventListener("resize", updateBgPosition);
		ro = new ResizeObserver(updateBgPosition);
		ro.observe(document.body);
	});
	onBeforeUnmount(() => {
		window.removeEventListener("resize", updateBgPosition);
		ro?.disconnect();
	});
</script>

<template>
	<button
		ref="el"
		type="button"
		class="hover:cursor-pointer hover:brightness-90 absolute flex flex-col justify-center leading-tight text-black inset-x-0 z-20 rounded border border-neutral-700 text-[12px] sm:rounded-md sm:text-sm"
		:style="{
      ...style,
      backgroundColor: color,
      backgroundImage: test
        ? `repeating-linear-gradient(45deg, ${color}, ${color} 10px, ${darkenColor} 10px, ${darkenColor} 20px)`
        : undefined,
      backgroundSize: '28.28px 28.28px',
      backgroundPosition: bgPosition,
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
