import styles from '@/styles/Home.module.css';
import { SimpleVmsUnit } from '@omrijden/simplify';
import { GetServerSideProps, GetServerSidePropsResult } from 'next';
import Head from 'next/head';

interface Props {
  simpleDrips: SimpleVmsUnit[];
}


export const getServerSideProps: GetServerSideProps = async ({ req, params, query }): Promise<GetServerSidePropsResult<Props>> => {
  const { DB } = (process.env as { DB: D1Database })

  console.log('DB', DB)
  return {
    props: {
      simpleDrips: [] as SimpleVmsUnit[],
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
          <ul>
            {simpleDrips.map((unit: SimpleVmsUnit) => (
              <li key={unit.id}>
                {!unit.image && unit.text?.split('\n').map((line: string) => <>{line}<br /></>)}
                {unit.image && (
                  <img
                    style={{
                      border: '10px solid black',
                    }}
                    alt={unit.text?.split('\n').join(' ')}
                    src={`data:${unit.image.mimeType};base64,${unit.image.binary}`}
                  />
                )}
              </li>
            ))}
          </ul>
        </div>
      </main >
    </>
  )
}
