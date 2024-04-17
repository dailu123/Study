import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;
import java.util.Map;

@Service
public class DataExportService {
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    // 定时执行数据导出任务
    @Scheduled(fixedRate = 600000)  // 每隔 10 分钟执行一次
    public void exportDataToCSV() {
        // 定义查询
        String query = "SELECT * FROM your_table_name";
        
        // 执行查询
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(query);
        
        // 导出文件路径
        String outputFile = "output.csv";
        
        try (FileWriter fileWriter = new FileWriter(outputFile);
             PrintWriter printWriter = new PrintWriter(fileWriter)) {
            
            // 写入表头
            if (!rows.isEmpty()) {
                Map<String, Object> firstRow = rows.get(0);
                printWriter.println(String.join(",", firstRow.keySet()));
            }
            
            // 写入数据
            for (Map<String, Object> row : rows) {
                printWriter.println(String.join(",",
                        row.values().stream().map(String::valueOf).toList()));
            }
            
            System.out.println("数据已成功导出到 " + outputFile);
        } catch (IOException e) {
            System.out.println("导出过程中出现错误：" + e.getMessage());
        }
    }
}

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>

<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-core</artifactId>
    <scope>test</scope>
</dependency>
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import java.io.FileWriter;
import java.io.PrintWriter;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@SpringBootTest
public class DataExportServiceTest {

    @Mock
    private JdbcTemplate jdbcTemplate;  // Mock JdbcTemplate

    @InjectMocks
    private DataExportService dataExportService;  // 注入要测试的服务

    @Test
    public void testExportDataToCSV() {
        // 准备模拟数据
        List<Map<String, Object>> mockData = Collections.singletonList(
                Map.of("column1", "value1", "column2", "value2")
        );
        when(jdbcTemplate.queryForList("SELECT * FROM your_table_name")).thenReturn(mockData);

        // 调用要测试的方法
        dataExportService.exportDataToCSV();

        // 你可以根据实际情况检查结果，例如检查文件是否正确创建
        // 这里以检查文件是否存在为例
        java.io.File file = new java.io.File("output.csv");
        assertTrue(file.exists(), "输出文件应存在");
        
        // 清理测试文件
        file.delete();
    }
}

