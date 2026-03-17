// skills/web-reader/scripts/web-reader.ts

import { Application } from 'express';
import routes from './routes';
import { createServer } from 'http';
import { createExpressServer } from 'routing-controllers';
import { isMainThread, workerData, parentPort, workerPort } from 'worker_threads';
import { join } from 'path';

// Config
const PORT: number = 3000;

// Express setup
const app: Application = createExpressServer({
  controllers: [join(__dirname, './controllers')],
  middlewares: [join(__dirname, './middlewares')],
  routePrefix: '/api',
});

// Routes
app.use('/api', routes);

// Server
const server = createServer(app);

// Run server
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// Development setup (hot reloading)
if (process.env.NODE_ENV === 'development') {
  require('nodemon')({
    exec: 'ts-node',
    script: './web-reader.ts',
    env: { PORT: '3000' },
    watch: ['skills/web-reader/scripts'],
  }).on('restart', () => {
    console.log('Server restarted due to file changes');
  });
}