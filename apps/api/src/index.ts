import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import { buildApp } from "./app";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3002);
const host = process.env.HOST || "0.0.0.0";

async function main() {
  const app = Fastify({
    logger: true,
  });

  await buildApp(app, { rootDir: path.resolve(__dirname, "..") });

  try {
    await app.listen({ port, host });
    app.log.info(`API listening on http://${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
