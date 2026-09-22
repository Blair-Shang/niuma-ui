import pkg from '../package.json'

/** 与 package.json 同一版本。发版改版本号后，文档站顶栏和快速上手跟着变。 */
const releaseLine = pkg.version.split('.').slice(0, 2).join('.')

export const siteConfig = {
  name: 'Niuma UI',
  version: pkg.version,
  releaseRange: `^${releaseLine}.0`,
  license: 'Apache-2.0',
  npm: 'niuma-ui',
  github: 'https://github.com/Blair-Shang/niuma-ui',
  install: 'pnpm add niuma-ui',
}
