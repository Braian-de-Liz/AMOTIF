// 1. Marca o início exato da execução do script
const startTime = performance.now();

import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

function logServerInfo(port: number) {
  const bootTime = ((performance.now() - startTime) / 1000).toFixed(3);
  
  const memory = process.memoryUsage();
  const heapUsedMB = (memory.heapUsed / 1024 / 1024).toFixed(2);
  const rssMB = (memory.rss / 1024 / 1024).toFixed(2);

  console.log(`
    Hono + Bun Server Online!
    -----------------------------------------
    URL: http://localhost:${port}
    Boot Time: ${bootTime}s
    -----------------------------------------
    Heap Used: ${heapUsedMB} MB (Memória ativa do JS)
    RSS Memory: ${rssMB} MB (Total alocado pelo processo)
    -----------------------------------------
  `);
}

const PORT = 3000;

logServerInfo(PORT);

export default {
  port: PORT,
  fetch: app
}