/**
 * 从 CHANGELOG.md 抽出指定版本段落，写成 GitHub Release 正文。
 * 用法: node .github/scripts/changelog-notes.mjs <version> [outfile]
 */
import fs from 'node:fs'

const version = process.argv[2]
const outfile = process.argv[3] || 'release-notes.md'

if (!version) {
  console.error('usage: changelog-notes.mjs <version> [outfile]')
  process.exit(1)
}

const md = fs.readFileSync('CHANGELOG.md', 'utf8')
const escaped = version.replace(/\./g, '\\.')
const match = md.match(
  new RegExp(`## \\[${escaped}\\][^\\n]*\\n([\\s\\S]*?)(?=\\n## \\[|$)`),
)
const section = (match ? match[1] : '').trim()
const body = [
  section || `niuma-ui ${version}`,
  '',
  '---',
  '',
  `完整记录见 [CHANGELOG.md](https://github.com/Blair-Shang/niuma-ui/blob/v${version}/CHANGELOG.md)。`,
  `npm: [\`niuma-ui@${version}\`](https://www.npmjs.com/package/niuma-ui/v/${version})`,
].join('\n')

fs.writeFileSync(outfile, `${body}\n`)
process.stdout.write(`${body}\n`)
