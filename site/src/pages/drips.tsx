import styles from '@/styles/Home.module.css';
import { KVNamespace } from '@cloudflare/workers-types';

import { GetServerSideProps, GetServerSidePropsResult } from 'next';
import Head from 'next/head';

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
  return {
    props: {
      incidents: await INCIDENTS.list<string>(),
    }
  }
}

export default function Drips({ incidents }: Props) {
  return (
    <>
      <Head>
        <title>Dript stream</title>
        <meta name="description" content="Microblogging Nederlandse drips" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <div className={styles.grid}>
          <div className={styles.drip}>
            <h1>Drips stream</h1>
            <ul>
              {JSON.stringify(incidents)}
            </ul>
          </div>
        </div>
      </main >
    </>
  )
}
