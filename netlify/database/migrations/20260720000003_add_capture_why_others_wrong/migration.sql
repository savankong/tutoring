-- Explanations now have two parts: why the answer is correct (existing
-- `explanation` column) and, for multiple-choice questions, why each other
-- option is wrong.
ALTER TABLE captures ADD COLUMN why_others_wrong TEXT;
