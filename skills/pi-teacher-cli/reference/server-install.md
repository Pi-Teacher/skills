# pi-teacher-server 安装

pi-teacher-server 是 Pi Teacher 的服务端 ([源码](https://github.com/Pi-Teacher/server)), 单二进制内嵌 React WebUI, 部署只需一个容器或一个二进制, 不需要单独的 Web 服务器或前端运行时。CLI 通过其 `/api/cli/...` 接口工作, 服务端未安装时 CLI 无法使用。

按部署环境选择方式: 部署到服务器推荐 Docker Compose (数据库用 PostgreSQL 或 SQLite); 本机运行直接二进制 nohup 后台启动。

## 方式一: 服务器部署, Docker Compose (推荐)

需要 Docker Engine 与 Docker Compose v2:

```bash
git clone https://github.com/Pi-Teacher/server.git
cd server
docker compose up -d
docker compose logs -f pi-teacher
```

首次启动会在容器日志中输出随机生成的 WebUI 初始密码, 只显示一次, 立即保存。默认配置: 镜像 `ghcr.io/pi-teacher/server:latest`, 宿主机端口 `3333`, 数据库 SQLite (宿主机 `./data` 挂载到容器 `/data`)。浏览器访问 `http://<服务器地址>:3333` 进入 WebUI。

拉取镜像提示 `denied` 时, 确认 GitHub Packages 中的 server 镜像已设为 Public; 私有镜像需先 `docker login ghcr.io`。暴露到公网时, 在反向代理层配置 HTTPS。

### 数据库选择: PostgreSQL 或 SQLite

默认 Compose 只启动服务端, 不创建外部数据库。用 PostgreSQL 时先自行准备好数据库, 再在仓库根目录创建 `.env` 文件 (Compose 自动读取):

```dotenv
PI_TEACHER_DB_DRIVER=postgres
PI_TEACHER_DB_DSN=postgres://pi_teacher:<密码>@<主机>:5432/pi_teacher?sslmode=require
```

继续用 SQLite 则保持默认 (`PI_TEACHER_DB_DRIVER=sqlite`, `PI_TEACHER_DB_DSN=/data/pi-teacher.db`)。其他常用变量: `PI_TEACHER_VERSION` (镜像标签, 生产建议固定语义化版本如 `v1.0.1`), `PI_TEACHER_PORT` (宿主机端口)。修改后 `docker compose up -d` 重启生效。不要把含真实密码或数据库凭据的 `.env` 提交到版本控制。

## 方式二: 本机运行, 二进制 + nohup

从 [Releases](https://github.com/Pi-Teacher/server/releases) 下载对应平台的 `pi-teacher-server` 二进制, 去掉执行限制后用 nohup 后台启动, 数据库用 SQLite:

```bash
chmod +x pi-teacher-server
mkdir -p ./data
nohup env PI_TEACHER_DB_DSN=./data/pi-teacher.db ./pi-teacher-server serve > pi-teacher.log 2>&1 &
```

初始密码输出在 `pi-teacher.log` 中, 只显示一次, 立即保存。浏览器访问 `http://127.0.0.1:3333`。

相关环境变量: `PI_TEACHER_DB_DRIVER` (默认 sqlite), `PI_TEACHER_DB_DSN` (必填), `PI_TEACHER_LISTEN` (默认 `:3333`); 同名命令行参数 `--db-dsn` / `--listen` 优先于环境变量。停止服务用 `pkill -f pi-teacher-server`; 忘记 WebUI 密码时用同样的 DSN 环境变量执行 `./pi-teacher-server admin reset-password` 重置 (会吊销全部现有 Session)。

## 安装后的衔接

1. 浏览器访问 WebUI, 用初始密码登录。
2. 在 WebUI 的 API Keys 页面创建 API Key (只显示一次, 立即保存)。
3. 回到 CLI, 按 `reference/config.md` 完成 `config set-server` (填 `http://<服务器地址>:3333` 或本机地址) 与 `config set-api-key`。
4. 运行 `pi-teacher-cli system info` 验证连通, 能返回服务端版本即安装配置成功。
