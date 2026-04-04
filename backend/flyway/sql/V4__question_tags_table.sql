CREATE TABLE question_tags (
    question_id INTEGER NOT NULL REFERENCES questions (id) ON DELETE CASCADE,
    tag         VARCHAR(128) NOT NULL,
    PRIMARY KEY (question_id, tag)
);

CREATE INDEX ix_question_tags_tag ON question_tags (tag);

INSERT INTO question_tags (question_id, tag)
SELECT q.id, elem
FROM questions AS q,
     LATERAL jsonb_array_elements_text(q.tags) AS elem
WHERE q.tags IS NOT NULL
  AND jsonb_typeof(q.tags) = 'array';

ALTER TABLE questions DROP COLUMN tags;
