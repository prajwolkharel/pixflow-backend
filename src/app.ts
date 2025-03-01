import express, { Request, Response } from 'express';

const app = express();

app.use(express.json());

const apiResponse = (
  res: Response,
  status: number,
  success: boolean,
  message: string,
  data: any = null
) => {
  res.status(status).json({ success, message, data });
};

app.get('/', (req: Request, res: Response) => {
  apiResponse(res, 200, true, 'API is running...', null);
});

export default app;
