-- Runs once, when the database volume is first created
CREATE TABLE subject_tests (
	id SERIAL PRIMARY KEY,
	subject TEXT NOT NULL,
	date DATE NOT NULL,
	UNIQUE (date, subject)
);
