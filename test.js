# 原始文件路径
$filePath = "C:\path\to\your\file.txt"

# 新的第一行内容
$newFirstLine = "This is the new first line."

# 读取原始文件的内容
$content = Get-Content $filePath

# 添加新的第一行内容到内容数组的开头
$content = @($newFirstLine) + $content

# 将修改后的内容写入原始文件
Set-Content -Path $filePath -Value $content

# 新的第一行内容
$newFirstLine = "This is the new first line."

# 要合并的文件路径
$files = "file*.txt"  # 使用通配符指定文件名模式，例如 file*.txt 匹配所有以 "file" 开头且以 ".txt" 结尾的文件

# 创建新文件并写入新的第一行内容
Set-Content -Path "output.txt" -Value $newFirstLine -Encoding UTF8

# 追加其他文件的内容到新文件中
Get-Content $files | Add-Content -Path "output.txt" -Encoding UTF8


# 文件路径
$filePath = "file.txt"  # 替换为你要读取的文件路径

# 使用 Get-Content 命令读取文件的第一行，并通过管道传递给 Select-Object 命令选择第一行
$firstLine = Get-Content $filePath | Select-Object -First 1

# 输出第一行内容
Write-Host "文件 $filePath 的第一行内容为: $firstLine"


SELECT 
  EXTRACT(EPOCH FROM (timestamp2 - timestamp1)) * 1000 AS milliseconds_diff
FROM 
  your_table;


SELECT
    SUM(CASE WHEN your_column < 100 THEN 1 ELSE 0 END) AS count_less_than_100,
    SUM(CASE WHEN your_column >= 100 AND your_column < 500 THEN 1 ELSE 0 END) AS count_100_to_499,
    SUM(CASE WHEN your_column >= 500 AND your_column < 1000 THEN 1 ELSE 0 END) AS count_500_to_999,
    SUM(CASE WHEN your_column >= 1000 AND your_column < 2000 THEN 1 ELSE 0 END) AS count_1000_to_1999,
    SUM(CASE WHEN your_column >= 2000 AND your_column < 3000 THEN 1 ELSE 0 END) AS count_2000_to_2999,
    SUM(CASE WHEN your_column >= 3000 THEN 1 ELSE 0 END) AS count_greater_than_2999
FROM
    your_table;

SELECT 'count_less_than_100' AS range, COUNT(*) AS count FROM your_table WHERE your_column < 100
UNION ALL
SELECT 'count_100_to_499', COUNT(*) FROM your_table WHERE your_column >= 100 AND your_column < 500
UNION ALL
SELECT 'count_500_to_999', COUNT(*) FROM your_table WHERE your_column >= 500 AND your_column < 1000
UNION ALL
SELECT 'count_1000_to_1999', COUNT(*) FROM your_table WHERE your_column >= 1000 AND your_column < 2000
UNION ALL
SELECT 'count_2000_to_2999', COUNT(*) FROM your_table WHERE your_column >= 2000 AND your_column < 3000
UNION ALL
SELECT 'count_greater_than_2999', COUNT(*) FROM your_table WHERE your_column >= 3000;


mqadmin queryTopicByTopic -n <nameserver-address> -t <topic-name> > /path/to/log-file.log

@echo off
setlocal enabledelayedexpansion
set "search=world"
set "replace=PowerShell"
for /f "tokens=*" %%a in (input.txt) do (
    set "line=%%a"
    set "line=!line:%search%=%replace%!"
    echo !line! >> output.txt
)

$originalString = "Hello, world!"
$newString = $originalString -replace "world", "PowerShell"
Write-Host $newString  # 输出 "Hello, PowerShell!"



#!/bin/bash

# 设置文件大小限制（单位：字节）
# 900MB = 900 * 1024 * 1024 字节
SIZE_LIMIT=$((900 * 1024 * 1024))

# 指定文件夹路径
DIRECTORY="your_folder_path"

# 初始化当前文件大小和文件计数
current_file_size=0
file_count=1

# 初始化当前大文件的名称
output_file="large_file_${file_count}.txt"

# 遍历指定目录中的所有文件
find "$DIRECTORY" -type f | while read -r file; do
    # 获取当前文件的大小
    file_size=$(stat -c %s "$file")

    # 检查添加当前文件后是否会超过大小限制
    if ((current_file_size + file_size > SIZE_LIMIT)); then
        # 创建一个新的大文件
        file_count=$((file_count + 1))
        output_file="large_file_${file_count}.txt"
        current_file_size=0
    fi

    # 将当前小文件追加到当前大文件
    cat "$file" >> "$output_file"

    # 更新当前大文件的大小
    current_file_size=$((current_file_size + file_size))
done


  #!/bin/bash

# 设置文件大小限制（单位：字节）
# 900MB = 900 * 1024 * 1024 字节
SIZE_LIMIT=$((900 * 1024 * 1024))

# 指定文件夹路径
DIRECTORY="your_folder_path"

# 初始化当前文件大小和文件计数
current_file_size=0
file_count=1

# 初始化当前大文件的名称
output_file="large_file_${file_count}.txt"

# 遍历指定目录中的所有文件
find "$DIRECTORY" -type f | while read -r file; do
    # 获取当前文件的大小
    file_size=$(stat -c %s "$file")

    # 检查添加当前文件后是否会超过大小限制
    if ((current_file_size + file_size > SIZE_LIMIT)); then
        # 创建一个新的大文件
        file_count=$((file_count + 1))
        output_file="large_file_${file_count}.txt"
        current_file_size=0
    fi

    # 使用 sed 将当前小文件中的 '#' 替换为 '*'
    sed 's/#/*/g' "$file" >> "$output_file"

    # 更新当前大文件的大小
    current_file_size=$((current_file_size + file_size))
done



