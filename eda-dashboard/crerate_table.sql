-- src/main/resources/data.sql

 extractDateRange() {
      const dates = new Set(this.originalJson.map(event => event.eventDate));
      this.dateRange = Array.from(dates).sort(); // Sort dates in ascending order
    },
    // Process the JSON data and generate the desired structure
    processJson() {
      const data = this.originalJson;
      const grouped = {};

      // 1. Group data by eventName
      data.forEach(event => {
        const eventName = event.eventName;

        // Initialize group for the eventName if it doesn't exist
        if (!grouped[eventName]) {
          grouped[eventName] = {};
        }

        // Save data by eventDate
        grouped[eventName][event.eventDate] = {
          date: event.eventDate,
          success: event.successCount || 0,
          failure: event.failureCount || 0
        };
      });

      // 2. Fill missing dates for each eventName
      const result = [];
      Object.keys(grouped).forEach(eventName => {
        const days = [];

        // Iterate through all dates to ensure completeness
        this.dateRange.forEach(date => {
          if (grouped[eventName][date]) {
            days.push(grouped[eventName][date]); // Add existing data for the date
          } else {
            // Add default values if the date is missing
            days.push({
              date,
              success: 0,
              failure: 0
            });
          }
        });

        // Construct the final structure for each eventName
        result.push({
          name: eventName,
          days
        });
      });

      this.groupedJson = result; // Save the final JSON structure
    }
  },

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

