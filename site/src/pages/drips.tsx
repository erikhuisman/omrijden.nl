import styles from '@/styles/Home.module.css';
import { D1Database } from '@cloudflare/workers-types';

import MatrixSign from '@/components/matrix-sign';
import { SimpleVmsUnit } from '@/types/display';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import { nl } from 'date-fns/locale';
import parseISO from 'date-fns/parseISO';
import { GetServerSideProps, GetServerSidePropsResult } from 'next';
import Head from 'next/head';
import { D1QB, OrderTypes } from 'workers-qb';

interface Props {
  simpleDrips: SimpleVmsUnit[];
}

export interface ProcessEnv {
  [key: string]: string | undefined
}

declare var process: {
  env: {
    DB: D1Database
  }
}

export const config = {
  runtime: 'experimental-edge',
};


export const getServerSideProps: GetServerSideProps = async ({ req, params, query }): Promise<GetServerSidePropsResult<Props>> => {
  const { DB } = (process.env as { DB: D1Database })

  const qb = new D1QB(DB);

  const fetched = await qb.fetchAll({
    tableName: 'display',
    fields: ['display.id', 'text', 'updatedAt', 'location.title', 'location.location', 'image'],
    where: {
      conditions: ['image IS NOT NULL'],
    },
    orderBy: {
      updatedAt: OrderTypes.DESC,
    },
    limit: 50,
    join: {
      table: 'location',
      on: 'display.id = location.id',
    }
  });

  return {
    props: {
      simpleDrips: fetched.results?.map(result => ({
        id: result.id,
        text: result.text || undefined,
        image: result.image || undefined,
        updatedAt: result.updatedAt,
        title: result.title || undefined,
        location: result?.location || undefined,
      }) as SimpleVmsUnit) || [],
    }
  }
}

export default function Drips({ simpleDrips }: Props) {
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
              {simpleDrips?.map((display: SimpleVmsUnit) => (
                <li key={display.id}>
                  <h2>{display.title}</h2>
                  <h3>{display.location}</h3>
                  {!display.image && display.text?.split('\n').map((line: string) => <>{line}<br /></>)}
                  {display.image && <MatrixSign image={JSON.parse(display.image)} />}
                  <br />
                  {formatDistanceToNow(parseISO(display.updatedAt), { locale: nl, addSuffix: true, includeSeconds: true })}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main >
    </>
  )
}