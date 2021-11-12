import { app } from './app';
import Logger from './lib/logger';

const port: number = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  Logger.info(`Server listening on port ${port}`);
});
