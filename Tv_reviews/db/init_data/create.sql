DROP TABLE IF EXISTS tv_reviews CASCADE;
CREATE TABLE IF NOT EXISTS tv_reviews(
  id SERIAL PRIMARY KEY,
  tv_name VARCHAR(50),
  review VARCHAR(200),
  review_date VARCHAR(200)
);