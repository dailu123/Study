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
