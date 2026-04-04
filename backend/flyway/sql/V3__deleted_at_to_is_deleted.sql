DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'questions'
          AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE questions
            ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;
        ALTER TABLE answers
            ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;

        UPDATE questions SET is_deleted = (deleted_at IS NOT NULL);
        UPDATE answers SET is_deleted = (deleted_at IS NOT NULL);

        ALTER TABLE questions DROP COLUMN deleted_at;
        ALTER TABLE answers DROP COLUMN deleted_at;

        DROP INDEX IF EXISTS uq_answers_one_bot_per_question;

        CREATE UNIQUE INDEX uq_answers_one_bot_per_question ON answers (question_id)
            WHERE is_bot IS TRUE AND is_deleted IS FALSE;
    END IF;
END $$;
