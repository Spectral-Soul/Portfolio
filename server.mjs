import 'dotenv/config'
import express from 'express'
import { createServer as createViteServer } from 'vite'

const app = express()
const port = Number(process.env.PORT || 5173)
const isProduction = process.env.NODE_ENV === 'production'
const recipient = process.env.CONTACT_TO || 'info@tickers.online'
const sender = process.env.RESEND_FROM_EMAIL || "TICKER'S ONLINE <info@tickers.online>"
const recentRequests = new Map()

app.disable('x-powered-by')
app.use(express.json({ limit: '16kb' }))

app.post('/api/contact', async (req, res) => {
  const now = Date.now()
  const address = req.ip || 'unknown'
  const windowStart = recentRequests.get(address) || 0
  if (now - windowStart < 60_000) return res.status(429).json({ error: 'Please wait a moment before sending another inquiry.' })

  const { name, email, phone, service, description } = req.body || {}
  const values = [name, email, phone, service, description]
  if (values.some((value) => typeof value !== 'string' || !value.trim())) {
    return res.status(400).json({ error: 'Please complete all inquiry fields.' })
  }
  if (name.length > 120 || email.length > 254 || phone.length > 30 || service.length > 100 || description.length > 5000) {
    return res.status(400).json({ error: 'One or more fields are too long.' })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' })
  if (!process.env.RESEND_API_KEY) return res.status(503).json({ error: 'Email delivery is not configured yet.' })

  recentRequests.set(address, now)
  for (const [ip, timestamp] of recentRequests) if (now - timestamp > 60_000) recentRequests.delete(ip)

  const text = [
    'New project inquiry from the TICKER\'S ONLINE website',
    '',
    `Name: ${name.trim()}`,
    `Email: ${email.trim()}`,
    `Phone: ${phone.trim()}`,
    `Service: ${service.trim()}`,
    '',
    'Project description:',
    description.trim(),
  ].join('\n')

  try {
    const result = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: sender, to: [recipient], reply_to: email.trim(), subject: `Website inquiry: ${service.trim()}`, text }),
    })
    if (!result.ok) {
      console.error('Resend rejected a website inquiry:', result.status)
      return res.status(502).json({ error: 'We could not deliver your inquiry right now. Please try again shortly.' })
    }
    return res.status(202).json({ ok: true })
  } catch (error) {
    console.error('Resend request failed:', error instanceof Error ? error.message : 'unknown error')
    return res.status(502).json({ error: 'We could not deliver your inquiry right now. Please try again shortly.' })
  }
})

if (isProduction) {
  app.use(express.static('dist'))
  app.get('*splat', (_req, res) => res.sendFile('index.html', { root: 'dist' }))
} else {
  const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' })
  app.use(vite.middlewares)
}

app.listen(port, () => console.log(`TICKER'S ONLINE running at http://localhost:${port}`))
