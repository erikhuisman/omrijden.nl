import plaatsnamen from '@/data/plaatsnames'
import styles from '@/styles/Home.module.css'
import Head from 'next/head'
import Link from 'next/link'
import slugify from 'slugify'

export default function Home() {
  return (
    <>
      <Head>
        <title>Omrijdenn.nl</title>
        <meta name="description" content="Expirment voor het maken van real time verkeerinfo op basis van open data" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <div className={styles.grid}>
          <ul>
            <li><Link href="/drips">Drips stream</Link></li>
          </ul>
          <ul>
            {plaatsnamen.map((plaatnaam: string) => (
              <li key={slugify(plaatnaam)}>
                <Link href={slugify(plaatnaam)}>
                  {plaatnaam}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </>
  )
}
