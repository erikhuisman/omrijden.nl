import { XMLParser } from 'fast-xml-parser';
import pako from 'pako';
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
  // MY_KV_NAMESPACE: KVNamespace;
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
const paths = {
  incidents: 'https://opendata.ndw.nu/incidents.xml.gz',
  trafficspeed: 'https://opendata.ndw.nu/trafficspeed.xml.gz',
  traveltime: 'https://opendata.ndw.nu/traveltime.xml.gz',
  current: 'https://opendata.ndw.nu/actuele_statusberichten.xml.gz',
  bridges: 'https://opendata.ndw.nu/brugopeningen.xml.gz',
};

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);
    // path with trimed leading slash
    const path = url.pathname.slice(1) as keyof typeof paths;

    if (!Object.keys(paths).includes(path)) {
      return new Response(
        `<ul>${Object.keys(paths)
          .map((key) => `<li><a href="/${key}">${key}</a></li>`)
          .join('')}</ul>`,
        {
          headers: {
            'content-type': 'text/html;charset=UTF-8',
          },
        },
      );
    }

    const fileUrl = paths[path] as string;

    const result = await fetch(fileUrl);
    const body = await result.arrayBuffer();
    const xml = pako.inflate(body, { to: 'string' });
    const parser = new XMLParser();
    const json = parser.parse(xml);
    return new Response(JSON.stringify(json));
  },
};
