# Pi Teacher Skills

这是一个"超出 skill 范畴"的 "skill"。为你的 AI agent 构建三个角色：**学习老师、复习老师、助教老师**。通过知识卡片沉淀知识、维护学生画像、完善的教学进度安排跟踪学习轨迹，打造一套越使用越好用的学习 agent 体系。

## 安装

本仓库通过 [filelay](https://www.npmjs.com/package/@xyzensun/filelay) 一条命令铺设到你的 agent 环境，支持 pi / claude-code / codex：
放置目录为空时，使用当前目录，推荐新建”StudySpace“目录 
```bash
npx @xyzensun/filelay add https://github.com/Pi-Teacher/skills - <放置目录> <平台>
```
例如,在claudecode中使用：
 `mkdir /StudySpace && npx @xyzensun/filelay add https://github.com/Pi-Teacher/skills - /StudySpace claude-code`


`<平台>` 可选 `pi`、`claude-code`、`codex`；省略时会交互式选择。铺设结果：

- 各 skill 进入对应平台的 skills 目录（pi → `.pi/skills/`，claude-code → `.claude/skills/`，codex → `.agents/skills/`）
- `AGENTS.md` 与学习工作区（`learn/`、`materials/`、`review/`、`ta/`）落在放置目录根，agent 进入该目录即进入教师角色

## 配置服务端

skill 依赖的 `pi-teacher-cli` 需要与 `pi-teacher-server` 配对安装。安装完成后，将以下 prompt 发给你的 agent，由它引导完成服务端配置：

> pi-teacher-cli 是服务端 pi-teacher-server 的客户端, 两者必须配对安装。读取 skill 后严格按其预检流程执行:
>
> 1. 测试 `pi-teacher-cli version` 是否可用, 不可用时按 `pi-teacher-cli` skill 的 `reference/install.md` 安装 CLI;
> 2. 运行 `pi-teacher-cli config show` 检查配置, 未配置时按 `reference/config.md` 完成; 服务端未安装时按 `reference/server-install.md` 安装服务端——部署到服务器推荐 Docker + PostgreSQL/SQLite, 本机运行直接二进制 nohup 后台启动，询问用户安装到哪里;
> 3. API Key 由用户在服务端 WebUI 的 API Keys 页面创建, 不要臆造; 配好后运行 `pi-teacher-cli system info` 验证连通。
>
> 部署方式、安装目录、密钥等涉及用户决策的环节, 先询问用户, 得到确认再执行。

## 开箱即用

如果你只想快速体验完整服务端，可以直接用 Docker 部署：[XyzenSun/pi-teacher](https://github.com/XyzenSun/pi-teacher)。

本项目（skills）兼容更多 agent 平台，会优先维护。

## Thanks
[Linux.do](https://linux.do/)
## License

MIT