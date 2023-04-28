import styles from '@/styles/Home.module.css';
import { D1Database } from '@cloudflare/workers-types';
import { GetServerSideProps, GetServerSidePropsResult } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { D1QB, OrderTypes } from 'workers-qb';

interface ImageData {
  binary: string;
  encoding: string;
  mimeType: string;
}
export interface SimpleVmsUnit {
  id: string;
  updatedAt: string;
  image?: string;
  text?: string;
}

export const config = {
  runtime: 'experimental-edge',
};

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

export const getServerSideProps: GetServerSideProps = async ({ req, params, query }): Promise<GetServerSidePropsResult<Props>> => {
  const { DB } = (process.env as { DB: D1Database })
  const qb = new D1QB(DB);

  const fetched = await qb.fetchAll({
    tableName: 'VmsUnit',
    fields: ['id', 'text', 'image'],
    orderBy: {
      updatedAt: OrderTypes.DESC,
    },
    limit: 50,
  });

  return {
    props: {
      simpleDrips: fetched.results?.map(result => ({
        id: result.id,
        text: result.text || undefined,
        image: result.image || undefined,
      }) as SimpleVmsUnit) || [],
    }
  }
}

export const MatrixSign = ({ unit }: { unit: SimpleVmsUnit }) => {
  if (!unit.image) return null;
  const image: ImageData = JSON.parse(unit.image || '{}');
  return (
    <>
      <Image
        style={{
          border: '10px solid black',
        }}
        alt={unit.text?.split('\n').join(' ') || ''}
        src={`data:${image.mimeType};base64,${image.binary}`}
      />
      <pre>
        {unit.image}
      </pre>
      <pre>
        {JSON.stringify(unit, null, 2)}
      </pre>
    </>
  )
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
          <ul>
            {simpleDrips.map((unit: SimpleVmsUnit) => (
              <li key={unit.id}>
                {!unit.image && unit.text?.split('\n').map((line: string) => <>{line}<br /></>)}
              </li>
            ))}
          </ul>
        </div>
      </main >
    </>
  )
}
