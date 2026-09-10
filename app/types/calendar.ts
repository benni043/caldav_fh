export interface CalendarBreak {
	id: string;
	start: string;
	end: string;
	label?: string;
}

export interface CalendarConfig {
	startTime: string;
	endTime: string;
	lessonDuration: number;
	breaks: CalendarBreak[];
}

export interface CalendarEvent {
	id: string;
	date: string;

	title: string;
	subtitle?: string;
	room?: string;

	start: string;
	end: string;

	color?: string;
}

export interface CalendarSegment {
	type: "lesson" | "break";

	start: string;
	end: string;

	label?: string;

	duration: number;
}
