import type { SubjectTest } from "~/types/calendar";

// Shared between all days, so a change shows up on every entry of that subject
export function useSubjectTests() {
	const tests = useState<SubjectTest[]>("subjectTests", () => []);

	const hasTest = (subject: string, date: string) =>
		tests.value.some((test) => test.subject === subject && test.date === date);

	// Replaces what is known about from (inclusive) to (exclusive). Failing only
	// loses the borders, the calendar itself stays usable
	const loadTests = async (from: string, to: string) => {
		try {
			const loaded = await $fetch<SubjectTest[]>("/api/tests", {
				query: { from, to },
			});

			tests.value = [
				...tests.value.filter((test) => test.date < from || test.date >= to),
				...loaded,
			];
		} catch (error: unknown) {
			console.error("Tests could not be loaded:", error);
		}
	};

	const removeTest = (subject: string, date: string) => {
		tests.value = tests.value.filter(
			(test) => test.subject !== subject || test.date !== date,
		);
	};

	const setTest = async (subject: string, date: string, value: boolean) => {
		const apply = (active: boolean) => {
			removeTest(subject, date);

			if (active) {
				tests.value = [...tests.value, { subject, date }];
			}
		};

		apply(value);

		try {
			await $fetch("/api/tests", {
				method: "PUT",
				body: { subject, date, hasTest: value },
			});
		} catch (error: unknown) {
			apply(!value);
			throw error;
		}
	};

	return { hasTest, loadTests, setTest };
}
