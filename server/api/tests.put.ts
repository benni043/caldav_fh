import { useDb } from "#server/utils/db.ts";
import { isDateKey } from "#server/utils/validation.ts";

const maxSubjectLength = 200;

export default defineEventHandler(async (event) => {
	const { subject, date, hasTest } = (await readBody(event)) ?? {};

	if (
		typeof subject !== "string" ||
		!subject ||
		subject.length > maxSubjectLength ||
		!isDateKey(date) ||
		typeof hasTest !== "boolean"
	) {
		throw createError({
			statusCode: 400,
			statusMessage: "Subject, date (yyyy-MM-dd) and hasTest are required",
		});
	}

	const sql = useDb();

	if (hasTest) {
		await sql`
			INSERT INTO subject_tests (subject, date)
			VALUES (${subject}, ${date}::date)
			ON CONFLICT DO NOTHING
		`;
	} else {
		await sql`
			DELETE FROM subject_tests
			WHERE subject = ${subject} AND date = ${date}::date
		`;
	}

	setResponseStatus(event, 204);
});
