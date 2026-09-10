import type { CalendarConfig } from "~/types/calendar";

export const calendarConfig: CalendarConfig = {
	startTime: "08:00",
	endTime: "21:00",

	lessonDuration: 45,

	breaks: [
		{
			id: "break-1",
			start: "09:30",
			end: "09:40",
			label: "Pause",
		},

		{
			id: "break-2",
			start: "11:10",
			end: "11:20",
			label: "Pause",
		},

		{
			id: "break-3",
			start: "14:20",
			end: "14:30",
			label: "Pause",
		},
		{
			id: "break-3",
			start: "16:00",
			end: "16:10",
			label: "Pause",
		},
		{
			id: "break-3",
			start: "17:40",
			end: "17:50",
			label: "Pause",
		},
		{
			id: "break-3",
			start: "19:20",
			end: "19:30",
			label: "Pause",
		},
	],
};
