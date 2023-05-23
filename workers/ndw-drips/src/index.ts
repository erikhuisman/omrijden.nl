import { DripDisplay, simplifyDripDisplay } from '@omrijden/simplify';
import xmlNodeStream from '@omrijden/xml-node-stream';
import { D1QB, D1Result } from 'workers-qb';

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
  DRIPS: KVNamespace;
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

  const result = await fetch(endpoint);
  if (!result.body) return new Response('ok: no body', { status: 500 });

  let lastInsert: Promise<D1Result> | undefined;

  const { writable, endOfStream } = xmlNodeStream(
    tagName,
    async (xmlNode: string) => {
      const display = simplifyDripDisplay(xmlNode);

      // skip update if no text or image
      if (!display.text && !display.image) return;

      // skip if the image is the same as the last one
      const lastDrips = await env.DRIPS.list({ prefix: display.id, limit: 1 });
      if (lastDrips.keys.length > 0) {
        const lastDrip = await env.DRIPS.get(lastDrips.keys[0].name);
        if (lastDrip) {
          const lastDripDisplay = JSON.parse(lastDrip) as DripDisplay;
          if (lastDripDisplay.image?.binary === display.image?.binary) return;
        }
      }

      await qb.delete({
        tableName: 'display',
        where: {
          conditions: `id is ?1`,
          params: [display.id],
        },
      });

      // make timestamp from iso string
      const timestamp = new Date(display.updatedAt).getTime();

      // store each display in KV
      env.DRIPS.put(`${display.id}:${10_000_000_000_000 - timestamp}`, JSON.stringify(display));

      // store latest display in DB
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
