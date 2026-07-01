import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config';
import authRoutes from './routes/auth';
import benefitRoutes from './routes/benefit';
import couponRoutes from './routes/coupon';
import phoneRoutes from './routes/phone';

const app = express();

app.use(cors());
app.use(express.json());

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const { method, originalUrl } = req;
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const color = status >= 400 ? '\x1b[31m' : status >= 300 ? '\x1b[33m' : '\x1b[32m';
    const reset = '\x1b[0m';
    console.log(`${color}${method}${reset} ${originalUrl} ${color}${status}${reset} ${duration}ms`);
  });
  next();
});
app.use('/api/auth', authRoutes);
app.use('/api/benefit', benefitRoutes);
app.use('/api/coupon', couponRoutes);
app.use('/api/phone', phoneRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ code: 200, message: 'ok' });
});

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});
