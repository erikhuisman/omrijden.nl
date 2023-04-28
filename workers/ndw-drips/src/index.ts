import { simplifyVmsUnit } from '@omrijden/simplify';
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
  STORE: KVNamespace;
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

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const result = await fetch(endpoint);
    if (!result.body) return new Response('ok: no body', { status: 500 });

    const qb = new D1QB(env.DB);
    let lastInsert: Promise<Result> | undefined;

    const { writable, endOfStream } = xmlNodeStream(
      tagName,
      (xmlNode: string) => {
        const vmsUnit = simplifyVmsUnit(xmlNode);

        // skip update if no text or image
        if (!vmsUnit.text && !vmsUnit.image) return;

        lastInsert = qb.insert({
          tableName: 'VmsUnit',
          data: {
            id: vmsUnit.id,
            updatedAt: vmsUnit.updatedAt,
            image: (vmsUnit.image && JSON.stringify(vmsUnit.image)) || null,
            text: vmsUnit.text || null,
          },
          returning: '*',
        });
      },
    );

    result.body
      .pipeThrough(new DecompressionStream('gzip'))
      .pipeThrough(new TextDecoderStream())
      .pipeTo(writable);

    const nodeCount = await endOfStream;
    if (lastInsert) await lastInsert;
    return new Response(`ok: ${nodeCount} items`);
  },
};
