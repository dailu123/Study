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
