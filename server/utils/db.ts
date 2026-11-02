import postgres from "postgres";

let sql: postgres.Sql | undefined;

export function useDb() {
	sql ??= postgres(process.env.DATABASE_URL!);

	return sql;
}
