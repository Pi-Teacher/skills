---
name: pi-teacher-cli
description: 指导 pi-teacher-cli 的安装、配置与使用。pi-teacher-cli 是 Pi-Teacher的客户端cli程序, 覆盖 Topic/Card/Glossary 增查改回收、卡片查重合并、回收站、FSRS 复习调度、审批查询。当用户要求安装、配置、使用 pi-teacher-cli, 或通过命令行操作 Pi Teacher 知识库与复习时使用。
---

# pi-teacher-cli 使用指导

pi-teacher-cli 是 [pi-teacher-server](https://github.com/Pi-Teacher/server) REST API 的命令行封装, 只通过服务端 `/api/cli/...` 接口交互, 永不直连数据库。永久删除、Embedding 管理、系统设置等能力属于 WebUI, 不在本 CLI 范围。

使用前必须依次完成两步预检, 任何一步不通过先解决再继续:

## 第 1 步: 测试 CLI 是否可用

运行 `pi-teacher-cli version`。命令不存在或报错时, 读取 `reference/install.md` 按其指导完成安装, 然后重新验证本步。

## 第 2 步: 检查配置

运行 `pi-teacher-cli config show`。未配置服务端地址或 API Key 时, 读取 `reference/config.md` 按其指导完成配置。API Key 需用户在 WebUI 的 API Keys 页面创建, 不要臆造。

## pi-teacher 核心概念

**Topic (主题)**: 知识库的分组容器, 卡片的归属单元。


**审批 (approvals)**: 服务端审批开关开启时, 写命令返回 202 提案 (未生效), 需用户在 WebUI 审批后才真正执行;

**Card (卡片)**: 记忆卡, front 为正面问题, back 为背面答案, 可归属某个 Topic, 也可无 Topic。开启向量生成 (embedding) 的卡会异步生成语义向量, 用于语义查重, 其状态 embedding_status 取值 pending / processing / ready / failed / disabled。每张卡带 version 乐观锁版本号。

**卡片查重 (check)**: 建卡前用 card check 检测重复, 先精确匹配 front, 无命中再做语义相似度检索 (依赖向量)。英语单词、数学公式这类正面写法固定、存在标准形式的卡, 重复卡正面必然完全一致, 精确查重即可覆盖, 不应使用向量: 建这类卡时加 --no-embedding, 查重时同样加 --no-embedding 只做精确匹配, 避免无意义的向量生成开销。

**复习 (Review)**: 基于 FSRS 调度算法。每张卡有一份调度快照 schedule (due 到期时间 / state 状态 / stability 稳定性 / difficulty 难度 / scheduled_days 计划间隔天数 / reps 复习次数 / lapses 遗忘次数)。到期卡进入复习队列, 提交评分 (again / hard / good / easy) (again为记忆效果最差，easy为记忆效果最好，需要根据用户的回答反馈来选择评分) 后服务端重算下次到期时间。复习提交直接生效, 无需。

**用户信息 (user-profile)**: 用户画像, 一段自由文本 profile, 用于描述用户的学习背景与偏好, 带独立 version 乐观锁, 更新直接生效, 不进审批。

**Glossary (术语表)**: term 词条 + definition 释义, 独立于卡片的术语库，术语表中的名词概念是用户真正理解了的概念，通常来自长期学习与复习中掌握，可根据术语表中的词条作为基础概念进行举例。


## 完整命令清单

所有命令支持 `--json` 输出机器可读结构, 默认人类可读格式, 下文不再重复标注。列表类命令统一支持 `--page` (从 1 开始) 与 `--page-size` (默认 20, 上限 100) 分页。

### version

```bash
pi-teacher-cli version   # 输出 CLI 版本号
```

### config 配置

```bash
pi-teacher-cli config set-server <url>   # 保存服务端地址
pi-teacher-cli config set-api-key <key>   # 保存 API Key
pi-teacher-cli config show               # 展示合并后的有效配置 (Key 脱敏)
```

### system 系统

```bash
pi-teacher-cli system info   # 服务端版本 / go_version / db_driver / 运行时长
```

### topic 主题

```bash
pi-teacher-cli topic list [--q 关键词]                    # 列表, 按 name/description 模糊搜索
pi-teacher-cli topic get <id>
pi-teacher-cli topic create --name <名称> [--description <描述>]
pi-teacher-cli topic update <id> --expected-version <v> [--name n] [--description d]
pi-teacher-cli topic trash <id> --expected-version <v> [--include-cards]
```

topic trash 缺省只回收 Topic 本身, 关联卡解除关联变为无 Topic 卡; 加 `--include-cards` 时关联卡一并进回收站。

### card 卡片

```bash
pi-teacher-cli card list [--q 关键词] [--topic-id t] [--embedding-status s] [--sort created_at|updated_at] [--order asc|desc]
pi-teacher-cli card get <id>                             # 详情含 embedding_error 与 schedule 快照
pi-teacher-cli card create --front <问题> --back <答案> [--topic-id t] [--no-embedding]
pi-teacher-cli card update <id> --expected-version <v> [--front f] [--back b] [--topic-id t] [--enable-embedding|--no-embedding]
pi-teacher-cli card trash <id> --expected-version <v>
pi-teacher-cli card check --front <问题> [--no-embedding] [--top-k 5]
pi-teacher-cli card merge <id1> <id2> [--front f] [--back b] [--topic-id t] [--enable-embedding|--no-embedding]
```

`--topic-id` 三态语义: list 中显式传 0 查无 Topic 的卡; create 中省略表示无 Topic; update 中 0 表示设为无 Topic, 省略表示不修改。

card check 建卡前查重, 只读 dry-run 不进审批: 缺省先精确查重, 无命中再做语义相似度 (返回候选与 similarity, 附向量覆盖率); `--no-embedding` 只做精确查重。语义分支不可用时 (退出码 8/9) 可加 `--no-embedding` 降级重试。

card merge 将两张来源卡合并为一张新卡, 来源卡进回收站; front/back 省略时按 Q1/Q2 规则拼接来源卡; topic 与 embedding 缺省继承, 两张来源卡取值不同时服务端拒绝 (退出码 10/11), 必须用 `--topic-id` 或 `--enable-embedding`/`--no-embedding` 显式指定。

### glossary 术语表

```bash
pi-teacher-cli glossary list [--q 关键词]                 # 按词条/释义模糊搜索
pi-teacher-cli glossary get <id>
pi-teacher-cli glossary create --term <词条> --definition <释义>
pi-teacher-cli glossary update <id> --expected-version <v> [--term t] [--definition d]
pi-teacher-cli glossary trash <id> --expected-version <v>
```

### trash 回收站

```bash
pi-teacher-cli trash cards|topics|glossary list
pi-teacher-cli trash cards|topics|glossary restore <id> --expected-version <v> [--topic-id t]
```

`--expected-version` 取自回收站列表输出的 version。`--topic-id` 仅 cards 恢复适用, 指定恢复后所属 Topic, 0 或省略表示无 Topic。恢复 Card 生成新 id, 输出 trash_card_id 与 new_card_id 的映射。

### review 复习

```bash
pi-teacher-cli review due [--topic-id t] [--limit n]      # 到期队列, 输出 CV (card_version) 与 SV (schedule_version)
pi-teacher-cli review submit <card_id> --rating <again|hard|good|easy> --expected-card-version <CV> --expected-schedule-version <SV>
```

submit 的两个版本号取自 review due 输出的 CV/SV 列; 409 冲突时重新执行 review due 获取最新值再重试。复习提交直接生效, 不进审批。

### approvals 审批

```bash
pi-teacher-cli approvals list [--status pending|approved|rejected|cancelled|stale]
pi-teacher-cli approvals get <id>                         # 详情含 original_payload / approved_payload / targets
```

只能查看本 API Key 发起的提案, 非本人发起的详情返回 404; 审批与拒绝动作在 WebUI 操作。

### user-profile 用户画像

```bash
pi-teacher-cli user-profile get
pi-teacher-cli user-profile set --profile <文本> --expected-version <v>
```

`--profile` 必填, 空串表示清空画像; `--expected-version` 取自 get 输出的 version, 首次写入用 0。更新直接生效, 不进审批。

## 关键约定

修改类命令必须提交 `expected_version` 乐观锁版本号 (取自对应 get 或列表输出的 `version` 字段); 返回 409 表示数据被并发修改, 需重新读取后重试, CLI 不会自动覆盖或重试。所有写命令自动携带 Idempotency-Key, 网络超时后重试是安全的。

服务端审批开关开启时, 写命令返回 202 提案 (输出标注"未生效"), 需用户在 WebUI 审批后才真正执行; `--json` 信封中 `outcome: proposal / applied` 严格区分两种结果。复习提交与用户画像更新始终直写生效, 不进审批。

退出码: 0 成功 / 1 一般错误 / 2 用法错误 / 3 认证失败 / 4 版本冲突 / 5 无权限 / 6 对象不存在 / 7 限流 / 8 embedding 服务不可用 / 9 语义相似度未开放 / 10 合并需显式指定 Topic / 11 合并需显式指定 embedding。
