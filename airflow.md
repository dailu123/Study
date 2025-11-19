subgraph Source_Layer [数据源层]
    direction TB
    K[Kafka Cluster]:::kafka
    T1[Topic 1..8]:::kafka
    K --> T1
end

subgraph Airflow_Cluster [Airflow 调度集群]
    direction TB
    S[Scheduler]:::airflow
    W[Worker Nodes]:::airflow
    
    subgraph Worker_Runtime [Worker 运行时环境]
        P_Pool[Airflow Pool Limiter\n(并发限流)]:::airflow
        
        subgraph Task_A [DAG A: Ingestion Task]
            Consumer[Kafka Consumer\nNo-Auto-Commit]:::airflow
        end
        
        subgraph Task_B [DAG B: Processing Task]
            SA_Pool[SQLAlchemy Conn Pool\n(进程级连接池)]:::airflow
            Logic[数据清洗 & 计算逻辑]:::airflow
        end
    end
    
    S -- 调度指令 --> W
end

subgraph Storage_Layer [DB2 数据存储层]
    direction TB
    
    subgraph Staging_Area [缓冲与去重]
        RAW[RAW_DATA_BUFFER\n(原始数据表+唯一索引)]:::db
        DLQ[ERROR_TABLE\n(死信队列)]:::db
    end
    
    subgraph Hub_Data [业务数据]
        HUB[HUB_TABLES\n(关联查询表)]:::db
    end
    
    subgraph Target_Data [结果数据]
        RES[TARGET_TABLE\n(最终结果表)]:::db
    end
end

subgraph Observability [可观测性 & 治理]
    Logs[ELK/Loki Logs]:::obs
    Metrics[Prometheus Metrics]:::obs
    Alert[Slack/钉钉告警]:::obs
end

%% 链路关系
T1 == "1. 批量拉取 (Micro-batch)" ==> Consumer
Consumer -- "2. 批量写入 (Ignore Dup)" --> RAW
Consumer -- "2.1 解析失败" --> DLQ
Consumer -.-> |"3. 手动 Commit Offset"| T1

P_Pool -.-> |"限制并发 Slot=20"| Task_B

Task_B -- "4. 抢占任务 (Select For Update)" --> RAW
Task_B <== "5. 关联查询 (Batch Query)" ==> HUB
Task_B -- "6. 结果写入 (Transactional)" --> RES
Task_B -- "7. 更新状态 (Status=Done)" --> RAW

Worker_Runtime -.-> Metrics
Worker_Runtime -.-> Logs这个看不出来样式效果呀
