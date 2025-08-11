import { spawn } from 'child_process'
import { execSync } from 'child_process'
import net from 'net'
import os from 'os'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const path = require('path')

function isPortFree(port) {
  return new Promise(resolve => {
    const server = net.createServer()
    server.once('error', () => resolve(false))
    server.once('listening', () => server.close(() => resolve(true)))
    server.listen(port)
  })
}

function getProcessInfo(port) {
  try {
    if (os.platform() === 'win32') {
      const result = execSync(`netstat -ano | findstr :${port}`).toString()
      const line = result.trim().split(/\n/)[0]
      const pid = line.trim().split(/\s+/).pop()
      if (!pid) return null
      const task = execSync(`tasklist /FI "PID eq ${pid}"`).toString()
      const match = task.match(/^(\S+)/m)
      return { pid, command: match ? match[1] : '' }
    } else {
      const result = execSync(`lsof -i :${port} -sTCP:LISTEN -Pn`).toString()
      const parts = result.split('\n')[1]?.trim().split(/\s+/)
      if (!parts) return null
      return { pid: parts[1], command: parts[0] }
    }
  } catch {
    return null
  }
}

function killProcess(pid) {
  try {
    if (os.platform() === 'win32') {
      execSync(`taskkill /PID ${pid} /F`)
    } else {
      execSync(`kill -9 ${pid}`)
    }
  } catch {}
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function waitForServer(port) {
  const url = `http://localhost:${port}/index.html`
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(url)
      const text = await res.text()
      return text
    } catch {
      await wait(500)
    }
  }
  throw new Error('Vite server did not start in time')
}

async function main() {
  const ports = [5173, 5174]
  let portToUse = ports[0]

  for (const port of ports) {
    if (await isPortFree(port)) {
      portToUse = port
      break
    }
    const info = getProcessInfo(port)
    if (info && /python/i.test(info.command)) {
      console.log(`Killing rogue python process ${info.pid} on port ${port}`)
      killProcess(info.pid)
      portToUse = port
      break
    } else {
      console.warn(`Port ${port} occupied by ${info ? info.command : 'unknown process'}`)
    }
  }

  console.log(`Starting Vite on port ${portToUse}`)

  // 🔧 Resolve 'npx' path safely for Windows and Unix
  const viteCmd = process.platform === 'win32'
    ? path.join(process.env.APPDATA, 'npm', 'npx.cmd')
    : 'npx'

  const vite = spawn(viteCmd, ['vite', '--port', String(portToUse)], { stdio: 'inherit' })

  try {
    const html = await waitForServer(portToUse)
    if (html.includes('<div id="root"></div>')) {
      console.log('✅ React root detected, dev server running.')
    } else {
      console.warn('⚠️ Warning: React root not found in served HTML')
    }
  } catch (err) {
    console.warn(`❌ ${err.message}`)
  }

  vite.on('close', code => process.exit(code ?? 0))
}

main()
