# 消费方接入

## 本地联调

仓库与消费方同级目录：

```text
E:\shangijan\
  niuma-ui\
  NiuMa\
  niuma-site\
```

```json
"@niuma/ui": "link:../niuma-ui"
```

```bash
pnpm install
```

改 `niuma-ui` 源码即可在消费方热更新（Vite 直连 `.vue`）。

## 锁定版本

```json
"@niuma/ui": "git+https://github.com/Blair-Shang/niuma-ui.git#v0.1.0"
```

私有库需可读权限。

## Vite 插件

桌面端可从包导出引用：

```ts
import { monacoZhNlsPlugin } from '@niuma/ui/vite-plugins/monaco-zh-nls'
import { silenceAntlrParseConsole } from '@niuma/ui/vite-plugins/silence-antlr-parse-console'
```
