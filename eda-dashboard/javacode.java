// src/main/java/com/hsbc/mca/smarteda_dashboard/SmartedaDashboardApplication.java

package com.hsbc.mca.smarteda_dashboard;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SmartedaDashboardApplication {

    public static void main(String[] args) {
        SpringApplication.run(SmartedaDashboardApplication.class, args);
    }
}


// src/main/java/com/hsbc/mca/smarteda_dashboard/entity/RawEvent.java

package com.hsbc.mca.smarteda_dashboard.entity;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "raw_event")
public class RawEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="escflow", nullable = false)
    private String escFlow;

    @Column(name="event_name", nullable = false)
    private String eventName;

    @Column(name="status", nullable = false)
    private String status; // "SUCCESS" or "FAILURE"

    @Column(name="transaction_timestamp", nullable = false)
    private LocalDateTime transactionTimestamp;

    @Column(name="latency", nullable = false)
    private Long latency; // in milliseconds

    // Constructors
    public RawEvent() {}

    public RawEvent(String escFlow, String eventName, String status, LocalDateTime transactionTimestamp, Long latency) {
        this.escFlow = escFlow;
        this.eventName = eventName;
        this.status = status;
        this.transactionTimestamp = transactionTimestamp;
        this.latency = latency;
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public String getEscFlow() {
        return escFlow;
    }

    public void setEscFlow(String escFlow) {
        this.escFlow = escFlow;
    }

    public String getEventName() {
        return eventName;
    }

    public void setEventName(String eventName) {
        this.eventName = eventName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getTransactionTimestamp() {
        return transactionTimestamp;
    }

    public void setTransactionTimestamp(LocalDateTime transactionTimestamp) {
        this.transactionTimestamp = transactionTimestamp;
    }

    public Long getLatency() {
        return latency;
    }

    public void setLatency(Long latency) {
        this.latency = latency;
    }
}


// src/main/java/com/hsbc/mca/smarteda_dashboard/entity/EventSummary.java

package com.hsbc.mca.smarteda_dashboard.entity;

import javax.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "event_summary")
public class EventSummary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="event_name", nullable = false)
    private String eventName;

    @Column(name="event_date", nullable = false)
    private LocalDate eventDate;

    @Column(name="success_count", nullable = false)
    private Integer successCount;

    @Column(name="failure_count", nullable = false)
    private Integer failureCount;

    @Column(name="failure_rate", nullable = false)
    private Double failureRate; // e.g., 20.00 for 20%

    @Column(name="average_latency")
    private Double averageLatency; // in milliseconds

    // Constructors
    public EventSummary() {}

    public EventSummary(String eventName, LocalDate eventDate, Integer successCount, Integer failureCount, Double failureRate, Double averageLatency) {
        this.eventName = eventName;
        this.eventDate = eventDate;
        this.successCount = successCount;
        this.failureCount = failureCount;
        this.failureRate = failureRate;
        this.averageLatency = averageLatency;
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public String getEventName() {
        return eventName;
    }

    public void setEventName(String eventName) {
        this.eventName = eventName;
    }

    public LocalDate getEventDate() {
        return eventDate;
    }

    public void setEventDate(LocalDate eventDate) {
        this.eventDate = eventDate;
    }

    public Integer getSuccessCount() {
        return successCount;
    }

    public void setSuccessCount(Integer successCount) {
        this.successCount = successCount;
    }

    public Integer getFailureCount() {
        return failureCount;
    }

    public void setFailureCount(Integer failureCount) {
        this.failureCount = failureCount;
    }

    public Double getFailureRate() {
        return failureRate;
    }

    public void setFailureRate(Double failureRate) {
        this.failureRate = failureRate;
    }

    public Double getAverageLatency() {
        return averageLatency;
    }

    public void setAverageLatency(Double averageLatency) {
        this.averageLatency = averageLatency;
    }
}
// src/main/java/com/hsbc/mca/smarteda_dashboard/repository/RawEventRepository.java

package com.hsbc.mca.smarteda_dashboard.repository;

import com.hsbc.mca.smarteda_dashboard.entity.RawEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RawEventRepository extends JpaRepository<RawEvent, Long> {

    /**
     * Find all raw events within the specified date range.
     * 
     * @param startDateTime Start of the date range
     * @param endDateTime End of the date range
     * @return List of RawEvent
     */
    List<RawEvent> findByTransactionTimestampBetween(LocalDateTime startDateTime, LocalDateTime endDateTime);
}

// src/main/java/com/hsbc/mca/smarteda_dashboard/repository/EventSummaryRepository.java

package com.hsbc.mca.smarteda_dashboard.repository;

import com.hsbc.mca.smarteda_dashboard.entity.EventSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface EventSummaryRepository extends JpaRepository<EventSummary, Long> {

    /**
     * Find event summaries for the given date.
     * 
     * @param date Event date
     * @return List of EventSummary
     */
    List<EventSummary> findByEventDate(LocalDate date);

    /**
     * Find event summaries within a date range.
     * 
     * @param startDate Start date
     * @param endDate End date
     * @return List of EventSummary
     */
    List<EventSummary> findByEventDateBetween(LocalDate startDate, LocalDate endDate);
}


// src/main/java/com/hsbc/mca/smarteda_dashboard/service/EventDataService.java

package com.hsbc.mca.smarteda_dashboard.service;

import com.hsbc.mca.smarteda_dashboard.entity.EventSummary;
import com.hsbc.mca.smarteda_dashboard.repository.EventSummaryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class EventDataService {

    @Autowired
    private EventSummaryRepository eventSummaryRepository;

    /**
     * Retrieves event summaries for the last three days based on the given date.
     * 
     * @param date Reference date
     * @return List of EventSummary for the last three days
     */
    public List<EventSummary> getLastThreeDaysData(LocalDate date) {
        LocalDate startDate = date.minusDays(2);
        return eventSummaryRepository.findByEventDateBetween(startDate, date);
    }
}


// src/main/java/com/hsbc/mca/smarteda_dashboard/config/QuartzConfig.java

package com.hsbc.mca.smarteda_dashboard.config;

import com.hsbc.mca.smarteda_dashboard.job.DataPreprocessingJob;
import org.quartz.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class QuartzConfig {

    // Define JobDetail for DataPreprocessingJob
    @Bean
    public JobDetail dataPreprocessingJobDetail() {
        return JobBuilder.newJob(DataPreprocessingJob.class)
                .withIdentity("DataPreprocessingJob")
                .storeDurably()
                .build();
    }

    // Define Trigger to run the job daily at midnight
    @Bean
    public Trigger dataPreprocessingJobTrigger() {
        CronScheduleBuilder scheduleBuilder = CronScheduleBuilder.cronSchedule("0 0 0 * * ?"); // Every day at 00:00

        return TriggerBuilder.newTrigger()
                .forJob(dataPreprocessingJobDetail())
                .withIdentity("DataPreprocessingTrigger")
                .withSchedule(scheduleBuilder)
                .build();
    }
}

// src/main/java/com/hsbc/mca/smarteda_dashboard/job/DataPreprocessingJob.java

package com.hsbc.mca.smarteda_dashboard.job;

import com.hsbc.mca.smarteda_dashboard.entity.EventSummary;
import com.hsbc.mca.smarteda_dashboard.entity.RawEvent;
import com.hsbc.mca.smarteda_dashboard.repository.EventSummaryRepository;
import com.hsbc.mca.smarteda_dashboard.repository.RawEventRepository;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Component
public class DataPreprocessingJob implements org.quartz.Job {

    @Autowired
    private RawEventRepository rawEventRepository;

    @Autowired
    private EventSummaryRepository eventSummaryRepository;

    @Override
    public void execute(JobExecutionContext context) throws JobExecutionException {
        System.out.println("Data Preprocessing Job Started at " + LocalDateTime.now());

        // Define the date range (e.g., yesterday)
        LocalDate processingDate = LocalDate.now().minusDays(1);
        LocalDateTime startDateTime = processingDate.atStartOfDay();
        LocalDateTime endDateTime = processingDate.plusDays(1).atStartOfDay();

        // Fetch raw events for the processing date
        List<RawEvent> rawEvents = rawEventRepository.findByTransactionTimestampBetween(startDateTime, endDateTime);

        // Group raw events by event name
        Map<String, List<RawEvent>> eventsGroupedByName = rawEvents.stream()
                .collect(Collectors.groupingBy(RawEvent::getEventName));

        List<EventSummary> summaries = new ArrayList<>();

        // Process each event group
        for (Map.Entry<String, List<RawEvent>> entry : eventsGroupedByName.entrySet()) {
            String eventName = entry.getKey();
            List<RawEvent> eventList = entry.getValue();

            int successCount = (int) eventList.stream()
                    .filter(e -> "SUCCESS".equalsIgnoreCase(e.getStatus()))
                    .count();

            int failureCount = (int) eventList.stream()
                    .filter(e -> "FAILURE".equalsIgnoreCase(e.getStatus()))
                    .count();

            double failureRate = (successCount + failureCount) > 0
                    ? ((double) failureCount / (successCount + failureCount)) * 100
                    : 0.0;

            double averageLatency = eventList.stream()
                    .mapToLong(RawEvent::getLatency)
                    .average()
                    .orElse(0.0);

            EventSummary summary = new EventSummary(
                    eventName,
                    processingDate,
                    successCount,
                    failureCount,
                    failureRate,
                    averageLatency
            );

            summaries.add(summary);
        }

        // Save summaries to the intermediate table
        eventSummaryRepository.saveAll(summaries);

        System.out.println("Data Preprocessing Job Completed at " + LocalDateTime.now());
    }
}


// src/main/java/com/hsbc/mca/smarteda_dashboard/controller/EventDataController.java

package com.hsbc.mca.smarteda_dashboard.controller;

import com.hsbc.mca.smarteda_dashboard.entity.EventSummary;
import com.hsbc.mca.smarteda_dashboard.service.EventDataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/event-data")
public class EventDataController {

    @Autowired
    private EventDataService eventDataService;

    /**
     * Retrieves event summaries for the last three days based on the provided date.
     * 
     * @param date Reference date in 'yyyy-MM-dd' format
     * @return List of EventSummary
     */
    @GetMapping
    public List<EventSummary> getEventData(
            @RequestParam("date") 
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return eventDataService.getLastThreeDaysData(date);
    }
}
