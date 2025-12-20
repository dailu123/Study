结合你提供的 Schema 图片，嫌疑对象已经非常明确了：msg_body 字段。

其他字段 (msg_id, ack_time, 时间戳) 都是定长或短文本，不可能撑到 1.3TB。唯独 msg_body（消息体）是 text 类型，它是最可能发生“体积膨胀”的地方。

鉴于你的表有 1.3TB 那么大，绝对不要直接对全表跑统计，否则数据库可能会卡死几个小时。

请运行下面这段经过优化的 SQL，它会采样 2万行数据来计算平均大小，足以说明问题：

code
SQL
download
content_copy
expand_less
-- 针对你的表结构定制的诊断 SQL
SELECT
    -- 1. 看看采样的这部分数据平均每行多大
    count(*) as "采样行数",
    
    -- 2. 重点检查 msg_body
    pg_size_pretty(avg(pg_column_size(msg_body))::bigint) as "msg_body_平均大小",
    pg_size_pretty(max(pg_column_size(msg_body))::bigint) as "msg_body_最大值",
    
    -- 3. 顺便看看 msg_id (通常很小)
    pg_size_pretty(avg(pg_column_size(msg_id))::bigint) as "msg_id_平均大小",
    
    -- 4. 推算全表大小 (采样总大小)
    pg_size_pretty(sum(pg_column_size(t.*))::bigint) as "采样数据总积(仅2万行)"

FROM (
    SELECT * 
    FROM public.hub_river_test_data_20251218
    LIMIT 20000  -- 只取2万行，速度快，不会卡死
) t;
预期结果分析

运行完上面的 SQL，请关注 msg_body_平均大小 这一列：

如果平均值在 1MB 左右（或几百KB）：

这证实了我的推测：虽然没有单一的“巨大”字段，但每行数据都偏大。

为什么源表只有30G？ 很有可能源表里的这个字段存的是压缩后的二进制，或者源表存的是JSONB。当你 CREATE TABLE AS SELECT 并将其转为 TEXT 时，数据失去了压缩结构，或者格式化（Pretty Print）增加了大量换行和空格，导致体积膨胀。

验证行数是否爆炸：
另外，请务必单独执行一次这个查询，确认行数是否符合你的预期（源表的1/10）：

code
SQL
download
content_copy
expand_less
SELECT count(*) FROM public.hub_river_test_data_20251218;

如果源表（30G）有 1000万行，那么新表理论上应该是 100万行。

如果这里查出来显示有 1亿行，那就是你在抽取数据时 JOIN 写错了，导致了笛卡尔积。

总结

问题几乎肯定出在 msg_body 这一列。

要么是行数太多（JOIN爆炸）。

要么是单行膨胀（源数据被解压或格式化了）。

用上面的 SQL 查一下，几秒钟就能看到真相。
