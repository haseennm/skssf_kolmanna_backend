import app from '../src/app';
import { env } from './utils/env';

const start = async () => {
  try {
    await app.listen({
      port: Number(env.PORT) || 3000,
      host: '0.0.0.0',
    });
    console.log(
      `\x1b[44m Server running on http://localhost:${env.PORT || 3000}.. \x1b[0m`
    );
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};

start();