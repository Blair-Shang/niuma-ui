/**
 * Vite optimizeDeps 扫描入口：在 dev server 启动时预构建 xterm，
 * 避免 SSH / Redis / Mongo 控制台首次加载命中过期 hash 导致 504 (Outdated Optimize Dep)。
 * CSS 一并扫描，防止 JS 预构建后样式副作用丢失。
 */
import '@xterm/addon-fit'
import '@xterm/xterm'
import '@xterm/xterm/css/xterm.css'
