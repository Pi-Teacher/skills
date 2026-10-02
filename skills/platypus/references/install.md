# 安装和检验

需要 Node.js >=20。优先从 npm 安装；只有 npm 安装失败或需要自行构建时，才从 GitHub 源码安装。

## 优先：从 npm 安装

```bash
npm install -g @xyzensun/platypus
platypus --help
```

安装的是 `@xyzensun/platypus`，终端执行的命令是 `platypus`；

## 备选：从 GitHub 源码构建安装

从包含 CLI 源码的 `refactor/skills` 分支构建。需要 Git、npm 和 Node.js >=20：

```bash
git clone --branch refactor/skills --single-branch https://github.com/XyzenSun/Platypus.git
cd Platypus
npm ci
npm run build
npm link
platypus --help
```

`npm link` 会将本地构建产物注册为系统可调用的 `platypus` 命令；如不希望全局注册，可在仓库目录直接运行 `node dist/index.js --help`。程序自身报错时，检查所安装版本随包提供的 `src/` 源码或克隆目录的 `src/`。
