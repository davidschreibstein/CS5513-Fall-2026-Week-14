// Home page — rendered at the site root URL (/)
import Link from 'next/link'; // Client-side navigation between pages
import Head from 'next/head'; // Edits the document <head> (tab title, meta, etc.)
import Layout, { siteTitle } from '../components/layout'; // Shared page chrome + site title string
import utilStyles from '../styles/utils.module.css'; // Reusable CSS module class names
import { getSortedList } from '../lib/data'; // Fetches WordPress CPT items (movies, bands, TV shows)

// Runs at build time (and on request in dev).
// Loads all content from WordPress and passes it into Home as props.
export async function getStaticProps() {
  const allPostsData = await getSortedList();
  return {
    props: {
      allPostsData, // Becomes the allPostsData argument on Home(...)
    },
  };
}

// Renders a simple linked list of items (id + name).
// Used once per content type section below.
function ItemList({ items }) {
  // Empty state when WordPress returned nothing for this type
  if (!items.length) {
    return <p>No items yet.</p>;
  }

  return (
    <ul className={utilStyles.list}>
      {/* Each item links to its detail page at /posts/[id] */}
      {items.map(({ id, name }) => (
        <li className={utilStyles.listItem} key={id}>
          <Link href={`/posts/${id}`}>{name}</Link>
        </li>
      ))}
    </ul>
  );
}

// React page component for "/".
// allPostsData comes from getStaticProps above (normalized WordPress items).
export default function Home({ allPostsData }) {
  // Split the combined list into sections by WordPress custom post type
  const movies = allPostsData.filter((item) => item.type === 'movie');
  const bands = allPostsData.filter((item) => item.type === 'band');
  const tvShows = allPostsData.filter((item) => item.type === 'tv-show');

  return (
    // home prop → Layout shows the larger homepage header
    <Layout home>
      <Head>
        {/* Browser tab title for the homepage */}
        <title>{siteTitle}</title>
      </Head>

      {/* Movies section (type: movie) */}
      <section className={`${utilStyles.headingMd} ${utilStyles.padding1px}`}>
        <h2 className={utilStyles.headingLg}>Movies</h2>
        <ItemList items={movies} />
      </section>

      {/* Bands section (type: band) */}
      <section className={`${utilStyles.headingMd} ${utilStyles.padding1px}`}>
        <h2 className={utilStyles.headingLg}>Bands</h2>
        <ItemList items={bands} />
      </section>

      {/* TV Shows section (type: tv-show) */}
      <section className={`${utilStyles.headingMd} ${utilStyles.padding1px}`}>
        <h2 className={utilStyles.headingLg}>TV Shows</h2>
        <ItemList items={tvShows} />
      </section>
    </Layout>
  );
}
