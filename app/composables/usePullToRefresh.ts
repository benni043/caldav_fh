type PullStatus = "idle" | "pulling" | "refreshing" | "done" | "error";

const threshold = 70;
const maxPull = 110;
const holdDistance = 56;
const resultDuration = 1500;

// Pulling down (touch) or scrolling up (wheel) while a week is already at the
// top triggers onRefresh. The container's children must carry [data-week]
export const usePullToRefresh = (
	containerRef: Ref<HTMLElement | null>,
	onRefresh: () => Promise<unknown>,
) => {
	const pullDistance = ref(0);
	const status = ref<PullStatus>("idle");

	const progress = computed(() => Math.min(pullDistance.value / threshold, 1));

	let resetTimer: ReturnType<typeof setTimeout> | undefined;

	const reset = () => {
		pullDistance.value = 0;
		status.value = "idle";
	};

	const trigger = async () => {
		if (status.value === "refreshing") {
			return;
		}

		clearTimeout(resetTimer);
		status.value = "refreshing";
		pullDistance.value = holdDistance;

		try {
			await onRefresh();
			status.value = "done";
		} catch (error: unknown) {
			console.error("Refresh failed:", error);
			status.value = "error";
		}

		resetTimer = setTimeout(reset, resultDuration);
	};

	const release = () => {
		if (pullDistance.value >= threshold) {
			trigger();
		} else if (status.value === "pulling") {
			reset();
		}
	};

	const isBusy = () =>
		status.value === "refreshing" ||
		status.value === "done" ||
		status.value === "error";

	const weekAtTop = (target: EventTarget | null) => {
		const week = (target as HTMLElement | null)?.closest?.("[data-week]");

		return week instanceof HTMLElement && week.scrollTop <= 0;
	};

	const setPull = (distance: number) => {
		pullDistance.value = Math.min(Math.max(distance, 0), maxPull);
		status.value = pullDistance.value > 0 ? "pulling" : "idle";
	};

	// Touch: only a mostly vertical drag that starts at the top counts
	let startX = 0;
	let startY = 0;
	let tracking = false;
	let vertical = false;

	const onTouchStart = (event: TouchEvent) => {
		const touch = event.touches[0];

		tracking = !isBusy() && !!touch && weekAtTop(event.target);
		vertical = false;

		if (touch) {
			startX = touch.clientX;
			startY = touch.clientY;
		}
	};

	const onTouchMove = (event: TouchEvent) => {
		const touch = event.touches[0];

		if (!tracking || !touch) {
			return;
		}

		const dx = touch.clientX - startX;
		const dy = touch.clientY - startY;

		if (!vertical) {
			if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
				tracking = false;
				return;
			}

			if (dy < 8) {
				return;
			}

			vertical = true;
		}

		setPull(weekAtTop(event.target) ? dy * 0.5 : 0);
	};

	const onTouchEnd = () => {
		if (tracking) {
			release();
		}

		tracking = false;
	};

	// Wheel: ignore a gesture that scrolled up into the top (incl. trackpad
	// momentum), the pull only starts after a short pause at the top
	let wheelReleaseTimer: ReturnType<typeof setTimeout> | undefined;
	let blockedUntil = 0;

	const onWheel = (event: WheelEvent) => {
		if (isBusy() || Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
			return;
		}

		const now = Date.now();

		if (!weekAtTop(event.target) || now < blockedUntil) {
			blockedUntil = now + 400;
			return;
		}

		if (event.deltaY >= 0) {
			return;
		}

		const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;

		setPull(pullDistance.value - delta * 0.4);

		clearTimeout(wheelReleaseTimer);
		wheelReleaseTimer = setTimeout(release, 200);
	};

	onMounted(() => {
		const el = containerRef.value;

		if (!el) {
			return;
		}

		el.addEventListener("touchstart", onTouchStart, { passive: true });
		el.addEventListener("touchmove", onTouchMove, { passive: true });
		el.addEventListener("touchend", onTouchEnd, { passive: true });
		el.addEventListener("touchcancel", onTouchEnd, { passive: true });
		el.addEventListener("wheel", onWheel, { passive: true });
	});

	onBeforeUnmount(() => {
		clearTimeout(resetTimer);
		clearTimeout(wheelReleaseTimer);

		const el = containerRef.value;

		el?.removeEventListener("touchstart", onTouchStart);
		el?.removeEventListener("touchmove", onTouchMove);
		el?.removeEventListener("touchend", onTouchEnd);
		el?.removeEventListener("touchcancel", onTouchEnd);
		el?.removeEventListener("wheel", onWheel);
	});

	return {
		pullDistance,
		progress,
		status,
		trigger,
	};
};
