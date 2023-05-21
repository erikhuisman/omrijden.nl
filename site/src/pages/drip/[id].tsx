import styles from '@/styles/Home.module.css';
import { KVNamespace } from '@cloudflare/workers-types';

import MatrixSign from '@/components/matrix-sign';
import { SimpleVmsUnit, VmsImageData } from '@/types/display';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import { nl } from 'date-fns/locale';
import parseISO from 'date-fns/parseISO';
import { GetServerSideProps, GetServerSidePropsResult } from 'next';
import Head from 'next/head';
import Link from 'next/link';

interface Props {
    simpleDrips: SimpleVmsUnit[];
}

export interface ProcessEnv {
    [key: string]: string | undefined
}

declare var process: {
    env: {
        DRIPS: KVNamespace
    }
}

export const config = {
    runtime: 'experimental-edge',
};


export const getServerSideProps: GetServerSideProps = async ({ req, params, query }): Promise<GetServerSidePropsResult<Props>> => {
    const { DRIPS } = process.env

    return {
        props: {
            simpleDrips: await DRIPS.list({ prefix: params?.id as string }).then((keys) => Promise.all(keys.keys.map(async (key) => {
                const drip = await DRIPS.get(key.name, 'text')
                return JSON.parse(drip as string)
            }))),
        }
    }
}

export default function Drips({ simpleDrips }: Props) {
    return (
        <>
            <Head>x§
                <title>Dript stream</title>
                <meta name="description" content="Microblogging Nederlandse drips" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <main className={styles.main}>
                <div className={styles.grid}>
                    <div className={styles.drip}>
                        <Link href="/">Home</Link>
                        <Link href="/drips">Drips</Link>
                        <h1>Drips stream</h1>
                        <ul>
                            {simpleDrips?.map((display: SimpleVmsUnit) => (
                                <li key={display.id}>
                                    {!display.image && display.text?.split('\n').map((line: string) => <>{line}<br /></>)}
                                    {display.image && <MatrixSign image={display.image as unknown as VmsImageData} />}
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