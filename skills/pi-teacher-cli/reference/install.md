# pi-teacher-cli 安装

pi-teacher-cli 是 Go 编写的单二进制, 零第三方运行时依赖。两种安装方式任选其一。

## 方式一: 从 Releases 下载二进制 (推荐)

从 https://github.com/Pi-Teacher/cli/releases 下载对应平台的二进制, 文件名为 `{platform}-pi-teacher-cli-{version}`, platform 覆盖 linux/darwin/windows 与 amd64/arm64 共六种组合。

以 linux-amd64 为例, 下载后去掉执行限制即可使用:

```bash
chmod +x linux-amd64-pi-teacher-cli-v1.0.0
./linux-amd64-pi-teacher-cli-v1.0.0 version
```

建议重命名为 `pi-teacher-cli` 并移入 PATH 目录 (如 `/usr/local/bin`), 使其可在任意位置直接调用:

```bash
mv linux-amd64-pi-teacher-cli-v1.0.0 /usr/local/bin/pi-teacher-cli
pi-teacher-cli version
```

## 方式二: 从源码构建

需要 Go 1.26.7:

```bash
git clone https://github.com/Pi-Teacher/cli.git
cd cli
make build # 产物在 ./bin/pi-teacher-cli
```

同样建议将 `./bin/pi-teacher-cli` 移入 PATH 目录。

## 验证

安装完成后运行 `pi-teacher-cli version`, 能输出版本号即安装成功。若仍提示命令不存在, 检查两点: 文件是否有执行权限 (`chmod +x`), 以及二进制所在目录是否在 PATH 中。
