ALTER TABLE questions
    ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE answers
    ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT false;

DROP INDEX IF EXISTS uq_answers_one_bot_per_question;

CREATE UNIQUE INDEX uq_answers_one_bot_per_question ON answers (question_id)
    WHERE is_bot IS TRUE AND is_deleted IS FALSE;
