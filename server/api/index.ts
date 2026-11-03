import '@vercel/node'
import path from 'node:path'
import fs from 'node:fs'
import cors from 'cors'
import express from 'express'
import cookieParser from 'cookie-parser'
import { env } from './config/env'
import apiRouter from './routes'
import authRouter from './routes/authRoutes'
import roomTypeRouter from './routes/roomTypeRoutes'
import roomRouter from './routes/roomRoutes'
import guestRouter from './routes/guestRoutes'
import availabilityRouter from './routes/availabilityRoutes'
import reservationRouter from './routes/reservationRoutes'
import folioRouter from './routes/folioRoutes'
import billingRouter from './routes/billingRoutes'
import housekeepingRouter from './routes/housekeepingRoutes'
import checkoutRouter from './routes/checkoutRoutes'
import invoiceRouter from './routes/invoiceRoutes'
import dashboardRouter from './routes/dashboardRoutes'

function toExpressReq(vercelReq: any): any {
  const req = { ...vercelReq } as any
  if (vercelReq.cookies) req.cookies = { ...vercelReq.cookies }
  if (vercelReq.headers?.cookie) {
    const parsed: any = {}
    vercelReq.headers.cookie.split(';').forEach((c: string) => {
      const parts = c.split('=').map((s: string) => s.trim())
      if (parts[0] && parts[1]) parsed[parts[0]] = parts.slice(1).join('=')
    })
    req.cookies = { ...req.cookies, ...parsed }
  }
  return req
}

function toExpressRes(vercelRes: any): any {
  return vercelRes as any
}

function createApp(): any {
  const app = express()
  app.disable('x-powered-by')
  app.use(
    cors({ origin: env.CORS_ORIGIN, credentials: true })
  )
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: true }))
  app.use(cookieParser())
  app.use(requestContext)
  app.use(requestLogger)
  app.use('/api/v1', csrfProtection)
  app.use('/api/v1/auth', authRouter)
  app.use('/api/v1/room-types', roomTypeRouter)
  app.use('/api/v1/rooms', roomRouter)
  app.use('/api/v1/guests', guestRouter)
  app.use('/api/v1/availability', availabilityRouter)
  app.use('/api/v1/reservations', reservationRouter)
  app.use('/api/v1/folios', folioRouter)
  app.use('/api/v1/billing', billingRouter)
  app.use('/api/v1/housekeeping', housekeepingRouter)
  app.use('/api/v1/checkout', checkoutRouter)
  app.use('/api/v1/invoices', invoiceRouter)
  app.use('/api/v1/dashboard', dashboardRouter)
  app.get('/api/v1/health', (_req, res) => {
    res.json({ status: 'ok', service: 'luxestay-api', timestamp: new Date().toISOString() })
  })
  const clientDist = path.resolve(__dirname, '../../client/dist')
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist))
    app.get(/^\\/((?!api).*)/, (_req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'))
    })
  } else {
    app.use((_req, res) => {
      res.status(404).json({ success: false, message: 'Route not found' })
    })
  }
  app.use(errorHandler)
  return app
}
export default async function handler(vercelReq: any, vercelRes: any): Promise<void> {
  const app = createApp()
  try {
    const { connectDB } = await import('./config/db')
    await connectDB()
  } catch (err) {
    console.error('Failed to connect to DB:', err)
    vercelRes.status(503).json({
      success: false,
      error: { code: 'DB_CONNECTION_FAILED', message: 'Unable to connect to database' }
    })
    return
  }
  const req = toExpressReq(vercelReq)
  const res = toExpressRes(vercelRes)
  try {
    app(req, res, (err: any) => {
      if (err) {
        console.error('Express error handler triggered:', err)
        vercelRes.status(500).json({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }
        })
      }
    })
  } catch (err) {
    console.error('Unhandled error in serverless handler:', err)
    try {
      vercelRes.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }
      })
    } catch (_) {}
  }
}