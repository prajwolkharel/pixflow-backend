import express from 'express';
import taskRoutes from './routes/task.routes.js';
import authRoutes from './routes/auth.routes.js';
import { responseMiddleware } from './middlewares/response.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

app.use(express.json());
app.use(responseMiddleware);

// Add GET / route handler
app.get('/', (req: express.Request, res: express.Response) => {
  res.ok({
    status: 200,
    message: 'API is running...',
    data: null
  });
});

app.use('/tasks', taskRoutes);
app.use('/auth', authRoutes);
app.use(errorHandler);

export default app;