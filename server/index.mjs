import { createApp } from './app.mjs';
const port = Number(process.env.DIVIDI_API_PORT || process.env.PORT || 3001);
const host = process.env.HOST || '127.0.0.1';
const { server } = createApp();
server.listen(port, host, () => console.log(`Dividi: http://${host}:${port}`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
