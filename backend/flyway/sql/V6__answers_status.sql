ALTER TABLE answers
    ADD COLUMN status VARCHAR(32) NOT NULL DEFAULT 'posted';

UPDATE answers SET status = 'posted';
