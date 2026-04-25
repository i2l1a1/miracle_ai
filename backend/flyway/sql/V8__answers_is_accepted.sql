ALTER TABLE answers
    ADD COLUMN is_accepted BOOLEAN NOT NULL DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS uq_answers_one_accepted_per_question
    ON answers (question_id)
    WHERE is_deleted IS FALSE AND is_accepted IS TRUE;
