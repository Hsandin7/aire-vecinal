import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import airQualityRouter from './routes/airQualityRoutes.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Logging de desarrollo
app.use((req, _res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[${new Date().toISOString().slice(11, 19)}] ${req.method} ${req.url}`);
  }
  next();
});

// Rutas de la API
app.use('/api', airQualityRouter);

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'AireVecinal API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Middleware 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo centralizado de errores
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Server Error]:', err);
  res.status(500).json({ error: 'Error interno del servidor', message: err.message });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[Backend] AireVecinal API corriendo en http://localhost:${PORT}`);
  });
}

export default app;
