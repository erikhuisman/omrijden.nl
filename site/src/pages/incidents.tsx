

import styles from '@/styles/Home.module.css';
import { KVNamespace } from '@cloudflare/workers-types';

import { GetServerSideProps, GetServerSidePropsResult } from 'next';
import Head from 'next/head';
import Link from 'next/link';

interface Props {
  incidents: any;
}

export interface ProcessEnv {
  [key: string]: string | undefined
}

declare var process: {
  env: {
    INCIDENTS: KVNamespace
  }
}

export const config = {
  runtime: 'experimental-edge',
};

export const getServerSideProps: GetServerSideProps = async ({ req, params, query }): Promise<GetServerSidePropsResult<Props>> => {
  const { INCIDENTS } = (process.env as { INCIDENTS: KVNamespace })

  const incidents = await INCIDENTS.list<string>();
  const promises = incidents.keys.map(async key => {
    const incident = await INCIDENTS.get<string>(key.name);
    return incident && JSON.parse(incident);
  })

  return {
    props: {
      incidents: await Promise.all(promises),
    }
  }
}

export default function Incidents({ incidents }: Props) {
  console.log({ incidents })
  return (
    <>
      <Head>
        <title>Incident stream</title>
        <meta name="description" content="Microblogging Nederlandse incidents" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <div className={styles.grid}>
          <div className={styles.drip}>
            <Link href="/">Home</Link>
            <h1>Incidents stream</h1>
            <ul>
              {incidents.map((incident: any) => (
                <li key={JSON.stringify(incident)}>
                  <pre>
                    {JSON.stringify(incident, null, 2)}
                  </pre>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main >
    </>
  )
}
