# pi-teacher-cli 配置

首次使用前需配置服务端地址与 API Key。API Key 由用户在服务端 WebUI 的 API Keys 页面创建, 不要臆造。

```bash
pi-teacher-cli config set-server https://your-server.example
pi-teacher-cli config set-api-key ptk_xxxxxxxxxxxx
pi-teacher-cli config show
```

## 配置存储与安全

配置保存在 `~/.config/pi-teacher/config.json`, 目录权限 `0700`, 文件权限 `0600`, `config show` 输出时 API Key 默认脱敏。

## 环境变量替代

可用环境变量 `PI_TEACHER_SERVER_URL` 与 `PI_TEACHER_API_KEY` 代替配置文件。优先级: 命令行参数 > 环境变量 > 配置文件。适合临时使用或不落盘保存凭据的场景。

## 验证

配置完成后运行 `pi-teacher-cli system info`, 能返回服务端版本与运行状态即配置成功。退出码 3 表示认证失败 (API Key 无效), 此时应检查 API Key 是否正确、服务端地址是否可达。
