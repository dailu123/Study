-- src/main/resources/data.sql

CREATE TABLE IF NOT EXISTS event_summary (
    id SERIAL PRIMARY KEY,
    event_name VARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    success_count INTEGER NOT NULL,
    failure_count INTEGER NOT NULL,
    failure_rate DECIMAL(5,2) NOT NULL, -- Percentage (e.g., 20.00 for 20%)
    average_latency DECIMAL(10,2) -- in milliseconds
);

CREATE INDEX IF NOT EXISTS idx_event_summary_event_date ON event_summary(event_date);
CREATE INDEX IF NOT EXISTS idx_event_summary_event_name ON event_summary(event_name);


SELECT 
    serviceid,
    SUM(CASE WHEN businessrespcode IS NULL OR businessrespcode = '4008' THEN count ELSE 0 END) AS success_count,
    AVG(CASE WHEN businessrespcode IS NULL OR businessrespcode = '4008' THEN avg_delay ELSE NULL END) AS success_avg_delay,
    SUM(CASE WHEN NOT (businessrespcode IS NULL OR businessrespcode = '4008') THEN count ELSE 0 END) AS failure_count,
    AVG(CASE WHEN NOT (businessrespcode IS NULL OR businessrespcode = '4008') THEN avg_delay ELSE NULL END) AS failure_avg_delay
FROM service_data
GROUP BY serviceid;

