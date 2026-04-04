CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR,
    hashed_password VARCHAR,
    questions_count INTEGER NOT NULL DEFAULT 0,
    answers_count INTEGER NOT NULL DEFAULT 0,
    language VARCHAR(5) NOT NULL DEFAULT 'en',
    status VARCHAR(10) NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT uq_users_username UNIQUE (username)
);

CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    username VARCHAR NOT NULL,
    title VARCHAR NOT NULL,
    text TEXT NOT NULL,
    tags JSONB,
    date_added TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'Answered by AI',
    answers_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX ix_questions_user_id ON questions (user_id);
CREATE INDEX ix_questions_username ON questions (username);

CREATE TABLE answers (
    id SERIAL PRIMARY KEY,
    question_id INTEGER NOT NULL REFERENCES questions (id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    username VARCHAR NOT NULL,
    text TEXT NOT NULL,
    rating INTEGER NOT NULL DEFAULT 0,
    is_bot BOOLEAN NOT NULL DEFAULT FALSE,
    date_added TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX ix_answers_question_id ON answers (question_id);
CREATE INDEX ix_answers_user_id ON answers (user_id);

CREATE UNIQUE INDEX uq_answers_one_bot_per_question ON answers (question_id)
    WHERE is_bot IS TRUE;

CREATE TABLE votes (
    id SERIAL PRIMARY KEY,
    answer_id INTEGER NOT NULL REFERENCES answers (id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    vote_type INTEGER NOT NULL,
    CONSTRAINT uq_vote_answer_user UNIQUE (answer_id, user_id)
);

CREATE INDEX ix_votes_answer_id ON votes (answer_id);
CREATE INDEX ix_votes_user_id ON votes (user_id);

CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token VARCHAR NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_refresh_tokens_token UNIQUE (token)
);

CREATE INDEX ix_refresh_tokens_user_id ON refresh_tokens (user_id);
