import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../backend/.env') })

import express from 'express'
import { readdir } from 'fs/promises'
import path from 'path'
import { pathToFileURL } from 'url'


const app = express()
app.use(express.json())

const apiDir = __dirname
const files = await readdir(apiDir)

for (const file of files) {
  if (file.startsWith('_') || !file.endsWith('.js')) continue

  const route = '/' + file.replace('.js', '')
  const mod = await import(pathToFileURL(path.join(apiDir, file)).href)
  app.all(route, mod.default)
  app.all(`${route}/*path`, mod.default)
  console.log(`  Registered: /api${route}`)
}

const PORT = 3001
app.listen(PORT, () => {
  console.log(`\n✅ Dev API running at http://localhost:${PORT}`)
  console.log('   Start the Vite dev server in another terminal:\n   cd frontend && npm run dev\n')
})