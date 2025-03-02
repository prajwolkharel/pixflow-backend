import express, { Request, Response, NextFunction } from 'express';
import authRoutes from './routes/auth.routes.js';
import { responseMiddleware } from './middlewares/response.js';

const app = express();

app.use(express.json());
app.use(responseMiddleware);

app.get('/', (req: Request, res: Response, next: NextFunction) => {
  res.ok({ status: 200, message: 'API is running...' });
});

app.use('/auth', authRoutes);

export default app;