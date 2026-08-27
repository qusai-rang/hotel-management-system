import path from 'node:path';
import fs from 'node:fs';
import cors from 'cors';
import express from 'express';
import { env } from './config/env';
import apiRouter from './routes';
import authRouter from './routes/authRoutes';
import roomTypeRouter from './routes/roomTypeRoutes';
import roomRouter from './routes/roomRoutes';
import guestRouter from './routes/guestRoutes';
import availabilityRouter from './routes/availabilityRoutes';
import reservationRouter from './routes/reservationRoutes';
import folioRouter from './routes/folioRoutes';
import billingRouter from './routes/billingRoutes';
import housekeepingRouter from './routes/housekeepingRoutes';
import checkoutRouter from './routes/checkoutRoutes';
import invoiceRouter from './routes/invoiceRoutes';
import dashboardRouter from './routes/dashboardRoutes';
import { requestContext } from './middleware/requestContext';
import { requestLogger } from './middleware/requestLogger';
import { apiNotFound } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.disable('x-powered-by');

app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

/* Correlation id + structured request logging (headers/bodies never logged). */
app.use(requestContext);
app.use(requestLogger);

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/room-types', roomTypeRouter);
app.use('/api/v1/rooms', roomRouter);
app.use('/api/v1/guests', guestRouter);
app.use('/api/v1/availability', availabilityRouter);
app.use('/api/v1/reservations', reservationRouter);
app.use('/api/v1/folios', folioRouter);
app.use('/api/v1/billing', billingRouter);
app.use('/api/v1/housekeeping', housekeepingRouter);
app.use('/api/v1/checkout', checkoutRouter);
app.use('/api/v1/invoices', invoiceRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1', apiRouter);

/* Structured 404 for unknown /api/v1 routes only; non-API paths keep the
   legacy plain-JSON behavior. */
app.use('/api/v1', apiNotFound);

/* SPA fallback — serve the Vite build and return index.html for any non-API
   path so client-side routing works on direct page refresh. In development
   the Vite dev server handles this; in production the built Express server
   serves the static assets directly. */
const clientDist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
  });
}

app.use(errorHandler);

export default app;
