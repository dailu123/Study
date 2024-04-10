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

