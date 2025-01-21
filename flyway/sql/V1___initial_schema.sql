CREATE TABLE measurements (
  id SERIAL PRIMARY KEY,
  data_type TEXT NOT NULL,
  measurement_value INTEGER,
  measurement_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sensor TEXT NOT NULL
);
