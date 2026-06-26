#!/usr/bin/env node
// Adds the ./pqc subpath to @stvor/sdk exports until a proper v3.5.5 release.
// Remove this script once @stvor/sdk publishes with the ./pqc export in package.json.
const fs   = require('fs')
const path = require('path')

const pkgPath = path.join(__dirname, '..', 'node_modules', '@stvor', 'sdk', 'package.json')
if (!fs.existsSync(pkgPath)) {
  console.log('patch-stvor-sdk: @stvor/sdk not found, skipping')
  process.exit(0)
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
if (pkg.exports && pkg.exports['./pqc']) {
  console.log('patch-stvor-sdk: ./pqc already exported, nothing to do')
  process.exit(0)
}

pkg.exports = pkg.exports ?? {}
pkg.exports['./pqc'] = {
  import:  { types: './dist/pqc/index.d.ts',  default: './dist/pqc/index.js'  },
  require: { types: './dist/pqc/index.d.cts', default: './dist/pqc/index.cjs' },
}

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2))
console.log('patch-stvor-sdk: ✓ added ./pqc export to @stvor/sdk')
