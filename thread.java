#!/bin/bash

# 配置参数
namesrv="localhost:9876"  # NameServer 的地址
topic="TopicTest"         # 要发送消息的主题名称
msg_body="Hello World!"   # 消息内容
msg_tag="TagA"            # 消息标签

# 循环发送消息
for ((i=1; i<=10000; i++)); do
    sh mqadmin.sh sendMsg -n "$namesrv" -t "$topic" -p "$msg_body" -b "$msg_tag"
    echo "Sent message $i"
done


# Configure thread pool parameters
app.thread-pool.core-pool-size=5
app.thread-pool.max-pool-size=10
app.thread-pool.queue-capacity=100


  import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

@Configuration
public class ThreadPoolConfig {

    @Value("${app.thread-pool.core-pool-size}")
    private int corePoolSize;

    @Value("${app.thread-pool.max-pool-size}")
    private int maxPoolSize;

    @Value("${app.thread-pool.queue-capacity}")
    private int queueCapacity;

    @Bean
    public ThreadPoolTaskExecutor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(corePoolSize);
        executor.setMaxPoolSize(maxPoolSize);
        executor.setQueueCapacity(queueCapacity);
        executor.setThreadNamePrefix("DataProcessing-");
        executor.initialize();
        return executor;
    }
}


import java.util.List;

public class DataProcessingTask implements Runnable {

    private List<Data> dataSubset;

    public DataProcessingTask(List<Data> dataSubset) {
        this.dataSubset = dataSubset;
    }

    @Override
    public void run() {
        // Process data subset
        for (Data data : dataSubset) {
            // Data processing logic (e.g., save data)
            saveData(data);
        }
    }

    private void saveData(Data data) {
        // Save data to the database or other storage
    }
}


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;

@Service
public class DataProcessingService {

    @Autowired
    private ThreadPoolTaskExecutor taskExecutor;

    public void processData(List<Data> dataList) {
        // Split data into multiple subsets
        List<List<Data>> dataSubsets = splitDataIntoSubsets(dataList);

        // Submit tasks
        for (List<Data> dataSubset : dataSubsets) {
            taskExecutor.submit(new DataProcessingTask(dataSubset));
        }
    }

    private List<List<Data>> splitDataIntoSubsets(List<Data> dataList) {
        // Implement logic to split data into multiple subsets
        return Collections.emptyList(); // Replace with actual logic
    }
}


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DataProcessingController {

    @Autowired
    private DataProcessingService dataProcessingService;

    @GetMapping("/processData")
    public String processData() {
        List<Data> dataList = fetchData(); // Retrieve the data to be processed
        dataProcessingService.processData(dataList);
        return "Data processing started";
    }

    private List<Data> fetchData() {
        // Implement logic to retrieve data to be processed
        return Collections.emptyList(); // Replace with actual logic
    }
}

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DataProcessingService {

    @Autowired
    private ThreadPoolTaskExecutor taskExecutor;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public void processData(List<Data> dataList) {
        // Split data into subsets for concurrent processing
        List<List<Data>> dataSubsets = splitDataIntoSubsets(dataList);

        // Submit tasks for concurrent execution
        for (List<Data> dataSubset : dataSubsets) {
            taskExecutor.submit(() -> processSubset(dataSubset));
        }
    }

    private void processSubset(List<Data> dataSubset) {
        // Process each data item in the subset
        for (Data data : dataSubset) {
            // Query data using JdbcTemplate
            // JdbcTemplate will automatically use the connection pool
            String query = "SELECT * FROM my_table WHERE data_id = ?";
            Data result = jdbcTemplate.queryForObject(query, new Object[]{data.getId()}, Data.class);
            
            // Process the result or perform other operations
            processResult(result);
        }
    }

    private void processResult(Data result) {
        // Implement your data processing logic here
    }

    private List<List<Data>> splitDataIntoSubsets(List<Data> dataList) {
        // Implement logic to split data into subsets for concurrent processing
        return Collections.emptyList(); // Replace with actual logic
    }
}


# HikariCP connection pool settings
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=30000
spring.datasource.hikari.idle-timeout=600000
spring.datasource.hikari.max-lifetime=1800000
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
public class DataService {

    // Inject the list of query parameters from the configuration file
    @Value("${app.query-parameters}")
    private String queryParameters;

    // Convert the comma-separated string to a list of strings
    private List<String> paramList;

    // Initialize the list of parameters
    public void init() {
        paramList = Arrays.asList(queryParameters.split(","));
    }

    public List<String> getParamList() {
        return paramList;
    }

    // Example usage of the parameter list
    public void processData() {
        // You can use paramList for querying data or other operations
        for (String param : paramList) {
            // Execute SQL query or perform other operations
            executeQuery(param);
        }
    }

    private void executeQuery(String param) {
        // Implement your query execution logic here
    }
}

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;

import java.util.concurrent.atomic.AtomicLong;

@Service
public class QueryService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ThreadPoolTaskExecutor taskExecutor;

    // Total interval for segmentation in milliseconds (e.g., 1 minute).
    private final long totalInterval = 60000; // 1 minute

    // Time interval for each thread to query in milliseconds (e.g., 1 second).
    private final long threadInterval = 1000; // 1 second

    // Atomic variable to track the latest timestamp for querying.
    private final AtomicLong currentTimestamp = new AtomicLong(System.currentTimeMillis());

    // Starts the querying tasks in a loop.
    public void startQuerying() {
        while (true) {
            long startTime = currentTimestamp.get();
            long endTime = startTime + totalInterval;

            // Query in segments.
            for (long time = startTime; time < endTime; time += threadInterval) {
                long finalTime = time;
                taskExecutor.submit(() -> queryData(finalTime, finalTime + threadInterval));
            }

            // Update the latest timestamp.
            currentTimestamp.addAndGet(totalInterval);

            // Sleep interval for querying tasks (e.g., 5 seconds).
            try {
                Thread.sleep(5000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }

    // Executes the query for a specific time interval.
    private void queryData(long startTime, long endTime) {
        // Your query logic using startTime and endTime as parameters.
        String query = "SELECT * FROM my_table WHERE timestamp >= ? AND timestamp < ?";
        jdbcTemplate.query(query, new Object[]{startTime, endTime}, (rs, rowNum) -> {
            // Process the query result.
            System.out.println("Processing data with timestamp between " + startTime + " and " + endTime);
            return null;
        });
    }
}

 // Construct the IN clause with placeholders (e.g., (?, ?, ?))
        String inClause = String.join(", ", parameters.stream().map(param -> "?").toArray(String[]::new));

        // Construct the SQL query
        String sql = "SELECT * FROM my_table WHERE my_column IN (" + inClause + ")";



