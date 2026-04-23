CREATE UNIQUE INDEX IF NOT EXISTS uq_answers_one_active_ai_generation_per_question
    ON answers (question_id)
    WHERE is_bot IS TRUE AND is_deleted IS FALSE AND status = 'generating';
