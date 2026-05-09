// Local dev server — simulates Vercel serverless functions on port 3001
// Run with: node frontend/api/_dev-server.js
// Then run: npm run dev (in frontend/) in a separate terminal
// Both must be running for /api/* calls to work locally.

import express from 'express'
import { readdir } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
app.use(express.json())

const apiDir = __dirname
const files = await readdir(apiDir)

for (const file of files) {
  // Skip private _lib helpers, this file itself, and non-JS files
  if (file.startsWith('_') || !file.endsWith('.js')) continue

  const route = '/' + file.replace('.js', '')
  const mod = await import(path.join(apiDir, file))
  app.all(route, mod.default)
  app.all(`${route}/*`, mod.default)   // handles sub-paths like /content/:id
  console.log(`  Registered: /api${route}`)
}

const PORT = 3001
app.listen(PORT, () => {
  console.log(`\n✅ Dev API running at http://localhost:${PORT}`)
  console.log('   Start the Vite dev server in another terminal:\n   cd frontend && npm run dev\n')
})
