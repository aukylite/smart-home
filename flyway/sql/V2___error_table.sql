CREATE TABLE errors (
  id SERIAL PRIMARY KEY,
  error TEXT,
  measurement_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sensor TEXT NOT NULL
);
