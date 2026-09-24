import type { CalendarConfig, UrlId } from "~/types/calendar";

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

export const taskLineIds: UrlId[] = [
	{
		id: "5586dfca-0146-4c6a-b55c-284f69bfccb0",
		lesson: "KOKO-UE",
	},
	{
		id: "5630f146-c955-44d0-9185-3e7bb5c6a3c2",
		lesson: "MAES1-ILV",
	},
	{
		id: "01c92ed3-90b3-4cb2-adb2-17f6d150cc40",
		lesson: "PHYLB-LAB",
	},
	{
		id: "ca7f6a91-4c5c-4ece-b6bb-b8cd3b84bfc1",
		lesson: "PHY1-ILV",
	},
	{
		id: "068a95da-ec3f-402e-a01a-058a63941306",
		lesson: "ACDC-ILV",
	},
	{
		id: "8922f557-814e-4feb-8577-9933d644a74e",
		lesson: "ENG1-UE",
	},
	{
		id: "86d7b82c-5c70-4791-b251-6eb93c596ce0",
		lesson: "DIGSYS-ILV",
	},
];

export const moodleIds: UrlId[] = [
	{
		id: "34212",
		lesson: "KOKO-UE",
	},
	{
		id: "33744",
		lesson: "MAES1-ILV",
	},
	{
		id: "34714",
		lesson: "PHYLB-LAB",
	},
	{
		id: "33646",
		lesson: "PHY1-ILV",
	},
	{
		id: "34196",
		lesson: "ACDC-ILV",
	},
	{
		id: "34203",
		lesson: "ENG1-UE",
	},
	{
		id: "34360",
		lesson: "DIGSYS-ILV",
	},
];
