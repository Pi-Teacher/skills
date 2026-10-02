import {build} from "esbuild";
import {chmodSync} from "node:fs";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";

/**
 * 把 TS 源码打包成单个 ESM 文件，输出到 ../scripts/pullpage.js。
 *
 * 之所以用 esbuild 打包而非 tsc 多文件输出：产物必须能与源码目录脱钩地单独运行，
 * 单文件便于整体拷贝；同时运行时零第三方依赖，只依赖 Node 内置的 fetch 与 node: 模块。
 * 目标 Node 版本取 22：该版本已稳定支持内置 fetch、AbortSignal.any 与 import.meta.dirname。
 */
const here = dirname(fileURLToPath(import.meta.url));
const outFile = join(here, "..", "scripts", "pullpage.js");

await build({
  entryPoints: [join(here, "main.ts")],
  outfile: outFile,
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  // 产物由 node 直接执行，shebang 与可执行位让 ./scripts/pullpage.js 也能直接调用
  banner: {js: "#!/usr/bin/env node"},
  legalComments: "none",
  logLevel: "info",
});

chmodSync(outFile, 0o755);
console.log(`已生成 ${outFile}`);
