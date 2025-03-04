import express, { Request, Response, NextFunction } from 'express';
import authRoutes from './routes/auth.routes.js';
import taskRoutes from './routes/task.routes.js';
import { responseMiddleware } from './middlewares/response.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

app.use(express.json());
app.use(responseMiddleware);

app.get('/', (req: Request, res: Response, next: NextFunction) => {
  res.ok({ status: 200, message: 'API is running...' });
});

app.use('/auth', authRoutes);
app.use('/tasks', taskRoutes);

app.use(errorHandler);

export default app;