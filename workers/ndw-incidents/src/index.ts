import xmlNodeStream from '@omrijden/xml-node-stream';
import { XMLParser } from 'fast-xml-parser';

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

const tagName = 'situation';
const endpoint = 'https://opendata.ndw.nu/incidents.xml.gz';

const parser = new XMLParser({
  attributeNamePrefix: '@_',
  ignoreAttributes: false,
  ignoreDeclaration: true,
});

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const result = await fetch(endpoint);
    if (!result.body) return new Response('ok: no body', { status: 500 });

    let lastPutItem: Promise<void> | undefined;
    const { writable, endOfStream } = xmlNodeStream(
      tagName,
      (xmlNode: string) => {
        const { situation } = parser.parse(xmlNode);
        lastPutItem = env.STORE.put(
          `${tagName}:${situation['@_id']}`,
          JSON.stringify(situation, null, 2),
        );
      },
    );

    result.body
      .pipeThrough(new DecompressionStream('gzip'))
      .pipeThrough(new TextDecoderStream())
      .pipeTo(writable);

    const nodeCount = await endOfStream;
    await lastPutItem;
    return new Response(`ok: ${nodeCount} items`);
  },
};
