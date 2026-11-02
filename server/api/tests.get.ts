import { useDb } from "#server/utils/db.ts";
import { isDateKey } from "#server/utils/validation.ts";

export default defineEventHandler(async (event) => {
	const { from, to } = getQuery(event);

	if (!isDateKey(from) || !isDateKey(to)) {
		throw createError({
			statusCode: 400,
			statusMessage: "From and to must be dates (yyyy-MM-dd)",
		});
	}

	const sql = useDb();

	return await sql`
		SELECT subject, date::text AS date
		FROM subject_tests
		WHERE date >= ${from}::date AND date < ${to}::date
	`;
});
