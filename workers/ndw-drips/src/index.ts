import { simplifyDripDisplay } from '@omrijden/simplify';
import xmlNodeStream from '@omrijden/xml-node-stream';
import { D1QB, Result } from 'workers-qb';

/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
  // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
  DB: D1Database;
  //
  // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
  // MY_DURABLE_OBJECT: DurableObjectNamespace;
  //
  // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
  // MY_BUCKET: R2Bucket;
  //
  // Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
  // MY_SERVICE: Fetcher;
}

const tagName = 'vmsUnit';
const endpoint = 'https://opendata.ndw.nu/DRIPS.xml.gz';

const syncDrips = async (env: Env) => {
  const qb = new D1QB(env.DB);
  await qb.delete({
    tableName: 'display',
    where: {
      conditions: ['id is not null'],
    },
  });

  const result = await fetch(endpoint);
  if (!result.body) return new Response('ok: no body', { status: 500 });

  let lastInsert: Promise<Result> | undefined;

  const { writable, endOfStream } = xmlNodeStream(
    tagName,
    (xmlNode: string) => {
      const display = simplifyDripDisplay(xmlNode);

      // skip update if no text or image
      if (!display.text && !display.image) return;

      lastInsert = qb.insert({
        tableName: 'display',
        data: {
          id: display.id,
          updatedAt: display.updatedAt,
          image: (display.image && JSON.stringify(display.image)) || null,
          text: display.text || null,
        },
      });
    },
  );

  result.body
    .pipeThrough(new DecompressionStream('gzip'))
    .pipeThrough(new TextDecoderStream())
    .pipeTo(writable);

  const nodeCount = await endOfStream;
  if (lastInsert) await lastInsert;
  return nodeCount;
};

export default {
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response | void> {
    return ctx.waitUntil(syncDrips(env));
  },
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const nodeCount = await syncDrips(env);
    return new Response(`ok: ${nodeCount} items`);
  },
};
