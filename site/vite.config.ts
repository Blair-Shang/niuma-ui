import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { monacoZhNlsPlugin } from '../vite-plugins/monaco-zh-nls'
import { silenceAntlrParseConsole } from '../vite-plugins/silence-antlr-parse-console'

const siteRoot = fileURLToPath(new URL('.', import.meta.url))
const faviconSvgPath = path.join(siteRoot, 'public', 'favicon.svg')

function faviconIcoFallback(): Plugin {
  const serveSvgAsIco = (
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void,
  ) => {
    if (req.url !== '/favicon.ico') {
      next()
      return
    }
    if (!fs.existsSync(faviconSvgPath)) {
      next()
      return
    }
    res.setHeader('Content-Type', 'image/svg+xml')
    fs.createReadStream(faviconSvgPath).pipe(res)
  }

  return {
    name: 'favicon-ico-fallback',
    configureServer(server) {
      server.middlewares.use(serveSvgAsIco)
    },
    configurePreviewServer(server) {
      server.middlewares.use(serveSvgAsIco)
    },
  }
}

const base = process.env.VITE_BASE || '/'

export default defineConfig({
  root: siteRoot,
  base,
  publicDir: 'public',
  plugins: [vue(), tailwindcss(), faviconIcoFallback(), monacoZhNlsPlugin(), silenceAntlrParseConsole()],
  resolve: {
    alias: {
      'niuma-ui': fileURLToPath(new URL('../src', import.meta.url)),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5181,
    strictPort: true,
  },
  preview: {
    host: '127.0.0.1',
    port: 5181,
    strictPort: true,
  },
  build: {
    outDir: fileURLToPath(new URL('../site-dist', import.meta.url)),
    emptyOutDir: true,
  },
})
