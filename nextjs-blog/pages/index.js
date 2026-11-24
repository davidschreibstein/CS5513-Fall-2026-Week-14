// Home page — rendered at the site root URL (/)
import Link from 'next/link';
import Head from 'next/head';
import Layout, { siteTitle } from '../components/layout';
import utilStyles from '../styles/utils.module.css';
import { getSortedList } from '../lib/data';

export async function getStaticProps() {
  const allPostsData = await getSortedList();
  return {
    props: {
      allPostsData,
    },
  };
}

function ItemList({ items }) {
  if (!items.length) {
    return <p>No items yet.</p>;
  }

  return (
    <ul className={utilStyles.list}>
      {items.map(({ id, name }) => (
        <li className={utilStyles.listItem} key={id}>
          <Link href={`/posts/${id}`}>{name}</Link>
        </li>
      ))}
    </ul>
  );
}

export default function Home({ allPostsData }) {
  const movies = allPostsData.filter((item) => item.type === 'movie');
  const bands = allPostsData.filter((item) => item.type === 'band');
  const tvShows = allPostsData.filter((item) => item.type === 'tv-show');

  return (
    <Layout home>
      <Head>
        <title>{siteTitle}</title>
      </Head>

      <section className={`${utilStyles.headingMd} ${utilStyles.padding1px}`}>
        <h2 className={utilStyles.headingLg}>Movies</h2>
        <ItemList items={movies} />
      </section>

      <section className={`${utilStyles.headingMd} ${utilStyles.padding1px}`}>
        <h2 className={utilStyles.headingLg}>Bands</h2>
        <ItemList items={bands} />
      </section>

      <section className={`${utilStyles.headingMd} ${utilStyles.padding1px}`}>
        <h2 className={utilStyles.headingLg}>TV Shows</h2>
        <ItemList items={tvShows} />
      </section>
    </Layout>
  );
}
