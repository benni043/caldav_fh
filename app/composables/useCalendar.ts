import type {
	CalendarConfig,
	CalendarEvent,
	CalendarSegment,
} from "~/types/calendar";

export function useCalendar(config: CalendarConfig) {
	const timeToMinutes = (time: string): number => {
		const [hours, minutes] = time.split(":").map(Number);

		return hours! * 60 + minutes!;
	};

	const minutesToTime = (minutes: number): string => {
		const hours = Math.floor(minutes / 60);
		const remainingMinutes = minutes % 60;

		return `${String(hours).padStart(2, "0")}:${String(
			remainingMinutes,
		).padStart(2, "0")}`;
	};

	const generateSegments = (): CalendarSegment[] => {
		const segments: CalendarSegment[] = [];

		let current = timeToMinutes(config.startTime);
		const end = timeToMinutes(config.endTime);

		while (current < end) {
			const currentBreak = config.breaks.find(
				(breakItem) => timeToMinutes(breakItem.start) === current,
			);

			if (currentBreak) {
				const breakStart = timeToMinutes(currentBreak.start);
				const breakEnd = timeToMinutes(currentBreak.end);

				segments.push({
					type: "break",
					start: currentBreak.start,
					end: currentBreak.end,
					label: currentBreak.label,
					duration: breakEnd - breakStart,
				});

				current = breakEnd;

				continue;
			}

			const nextBreak = config.breaks
				.map((breakItem) => ({
					...breakItem,
					startMinutes: timeToMinutes(breakItem.start),
					endMinutes: timeToMinutes(breakItem.end),
				}))
				.filter((breakItem) => breakItem.startMinutes > current)
				.sort((a, b) => a.startMinutes - b.startMinutes)[0];

			let lessonEnd = current + config.lessonDuration;

			if (nextBreak && nextBreak.startMinutes < lessonEnd) {
				lessonEnd = nextBreak.startMinutes;
			}

			lessonEnd = Math.min(lessonEnd, end);

			segments.push({
				type: "lesson",
				start: minutesToTime(current),
				end: minutesToTime(lessonEnd),
				duration: lessonEnd - current,
			});

			current = lessonEnd;
		}

		return segments;
	};

	const splitEventBySegments = (
		event: CalendarEvent,
		segments: CalendarSegment[],
	): CalendarEvent[] => {
		const eventStart = timeToMinutes(event.start);
		const eventEnd = timeToMinutes(event.end);

		const parts: CalendarEvent[] = [];

		for (const segment of segments) {
			if (segment.type === "break") {
				continue;
			}

			const segmentStart = timeToMinutes(segment.start);
			const segmentEnd = timeToMinutes(segment.end);

			if (eventEnd <= segmentStart || eventStart >= segmentEnd) {
				continue;
			}

			const partStart = Math.max(eventStart, segmentStart);

			const partEnd = Math.min(eventEnd, segmentEnd);

			if (partStart >= partEnd) {
				continue;
			}

			parts.push({
				...event,

				id: `${event.id}-${segment.start}`,

				start: minutesToTime(partStart),
				end: minutesToTime(partEnd),
			});
		}

		return parts;
	};

	const pixelsPerMinute = 1.8;

	const getSegmentHeight = (segment: CalendarSegment) => {
		return Math.max(
			segment.duration * pixelsPerMinute,
			segment.type === "lesson" ? 70 : 18,
		);
	};

	const getEventPosition = (
		eventStart: string,
		eventEnd: string,
		segments: CalendarSegment[],
	) => {
		let top = 0;

		const start = timeToMinutes(eventStart);
		const end = timeToMinutes(eventEnd);

		for (const segment of segments) {
			const segmentEnd = timeToMinutes(segment.end);

			const height = getSegmentHeight(segment);

			if (start >= segmentEnd) {
				top += height;
				continue;
			}

			break;
		}

		let height = 0;
		let started = false;

		for (const segment of segments) {
			const segmentStart = timeToMinutes(segment.start);
			const segmentEnd = timeToMinutes(segment.end);

			const segmentHeight = getSegmentHeight(segment);

			if (end <= segmentStart) {
				break;
			}

			if (start < segmentEnd && end > segmentStart) {
				const overlapStart = Math.max(start, segmentStart);

				const overlapEnd = Math.min(end, segmentEnd);

				if (!started) {
					top +=
						((overlapStart - segmentStart) / (segmentEnd - segmentStart)) *
						segmentHeight;

					started = true;
				}

				height +=
					((overlapEnd - overlapStart) / (segmentEnd - segmentStart)) *
					segmentHeight;
			} else if (started) {
				break;
			}
		}

		return {
			top: `${top}px`,
			height: `${height}px`,
		};
	};

	return {
		timeToMinutes,
		minutesToTime,

		generateSegments,
		splitEventBySegments,

		getSegmentHeight,
		getEventPosition,
	};
}
