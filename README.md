# Pi Teacher Skills

本 README 写给 AI agent (pi / claude / codex 等遵循 AGENTS.md 与 Agent Skills 规范的 agent)。当用户想搭建 Pi Teacher 学习环境时, 你按下述步骤与用户一步步配合完成安装。仓库提供两样东西: 一个可安装的 skill (`skills/pi-teacher-cli/`), 一组作者提供的教学提示词模板 (`prompts/`)。

## 第 1 步: 克隆仓库，安装 pi-teacher-cli skill
首先  ` git clone https://github.com/Pi-Teacher/skills `
skill 位于仓库的 `skills/pi-teacher-cli/`, 整目录复制到你所在 agent 的 skill 目录即可, 无构建步骤。常见位置:

- pi: `~/.pi/agent/skills/pi-teacher-cli/`
- claude: `~/.claude/skills/pi-teacher-cli/` (个人级) 或项目内 `.claude/skills/pi-teacher-cli/`
- codex: `~/.codex/skills/pi-teacher-cli/`

具体位置以你所在 agent 的 skill 机制为准, 不确定时查阅你所在 agent 的文档; 若所在 agent 不支持 skill 目录, 直接读取 `skills/pi-teacher-cli/SKILL.md` 并遵循其内容即可。安装后读取该 skill。

## 第 2 步: 按 skill 完成服务端配对安装

pi-teacher-cli 是服务端 pi-teacher-server 的客户端, 两者必须配对安装。读取 skill 后严格按其预检流程执行:

1. 测试 `pi-teacher-cli version` 是否可用, 不可用时按 `pi-teacher-cli ` skill 的 `reference/install.md` 安装 CLI;
2. 运行 `pi-teacher-cli config show` 检查配置, 未配置时按 `reference/config.md` 完成; 服务端未安装时按 `reference/server-install.md` 安装服务端——部署到服务器推荐 Docker + PostgreSQL/SQLite, 本机运行直接二进制 nohup 后台启动;
3. API Key 由用户在服务端 WebUI 的 API Keys 页面创建, 不要臆造; 配好后运行 `pi-teacher-cli system info` 验证连通。

部署方式、安装目录、密钥等涉及用户决策的环节, 先询问用户, 得到确认再执行。

## 第 3 步: 提示词模板 (可选)

`prompts/` 是作者提供的教学提示词模板, 仅供参考, 是否安装由用户决定:

- `global.md` — 全局规则, 定义 Pi 老师的角色、教学原则与工作区目录布局;
- `study.md` — 学习会话提示词;
- `review.md` — 复习会话提示词。

用户选择安装时, 推荐用法:

1. 新建一个 studyspace 目录作为学习工作区;
2. 把 `global.md` 复制为 `studyspace/AGENTS.md`, 作为全局提示词;
3. 把 `study.md` 复制为 `studyspace/learn/AGENTS.md`, 约定所有学习主题目录的固定结构与学习会话规则; 具体主题怎么教 (学习目的、教学要求) 由用户自行维护;
4. 复习会话在 `studyspace/review/` 下, 把 `review.md` 复制为该目录的 `AGENTS.md`。


