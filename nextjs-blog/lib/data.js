// BEFORE USING got MUST DO: npm install got@9.6.0
import got from 'got';

const WP_BASE = 'https://dev-cs-55-13-david-schreibstein.pantheonsite.io/wp-json';

// Custom post types from WP REST
const moviesURL = `${WP_BASE}/wp/v2/movie`;
const bandsURL = `${WP_BASE}/wp/v2/band`;
const tvShowsURL = `${WP_BASE}/wp/v2/tv-show`;

async function fetchJson(url) {
  try {
    const response = await got(url);
    console.log(response.body);
    const data = JSON.parse(response.body);
    return Array.isArray(data) ? data : [data];
  } catch (error) {
    console.log(error);
    return [];
  }
}

// ACF image fields are media IDs — look up the public URL
async function resolveMediaUrl(mediaId, fallbackSearch) {
  if (mediaId && typeof mediaId === 'object') {
    return mediaId.url || mediaId.source_url || null;
  }

  if (mediaId) {
    try {
      const response = await got(`${WP_BASE}/wp/v2/media/${mediaId}`);
      const media = JSON.parse(response.body);
      if (media.source_url) return media.source_url;
    } catch (error) {
      console.log(`Could not resolve media ${mediaId}:`, error.message || error);
    }
  }

  // Fallback: search media library by title (helps when ACF still points at a private ID)
  if (fallbackSearch) {
    try {
      const searchUrl = `${WP_BASE}/wp/v2/media?search=${encodeURIComponent(
        fallbackSearch
      )}&per_page=5`;
      const response = await got(searchUrl);
      const results = JSON.parse(response.body);
      if (Array.isArray(results) && results[0]?.source_url) {
        return results[0].source_url;
      }
    } catch (error) {
      console.log(`Media search failed for "${fallbackSearch}":`, error.message || error);
    }
  }

  return null;
}

function getAcfImageId(acf) {
  if (!acf) return null;
  return (
    acf.movie_image ||
    acf.band_image ||
    acf.tv_show_image ||
    acf.image ||
    null
  );
}

// Normalize WP REST CPT items into one shape
async function normalizeItem(item) {
  const type = item.post_type || item.type || 'post';
  const id = (item.ID ?? item.id).toString();
  const acf = item.acf || null;

  const title =
    item.post_title ||
    item.title?.rendered ||
    acf?.movie_title ||
    acf?.band_name ||
    acf?.tv_show_title ||
    acf?.game_name ||
    '';

  const dateRaw = item.post_date || item.date || '';
  const post_date = dateRaw.includes('T')
    ? dateRaw.replace('T', ' ').slice(0, 19)
    : dateRaw;

  let post_content = item.post_content || item.content?.rendered || '';
  if (!post_content && acf) {
    const parts = [];

    const synopsis = acf.synopsis || acf.decription || acf.description || '';
    if (synopsis) {
      parts.push(`<p>${synopsis}</p>`);
    }
    if (acf.imdb_rating) {
      parts.push(`<p>IMDb rating: ${acf.imdb_rating}</p>`);
    }
    if (acf.most_popular_song) {
      parts.push(`<p>Most popular song: ${acf.most_popular_song}</p>`);
    }
    if (acf.years_active) {
      parts.push(`<p>Years active: ${acf.years_active}</p>`);
    }
    if (acf.year_of_releaste) {
      parts.push(`<p>Year of release: ${acf.year_of_releaste}</p>`);
    }

    post_content = parts.join('');
  }

  // Prefer ACF title fields when WP title is empty/Untitled
  const displayName =
    (title && title !== 'Untitled'
      ? title
      : acf?.movie_title || acf?.band_name || acf?.tv_show_title || title) ||
    '';

  const image_url = await resolveMediaUrl(getAcfImageId(acf), displayName);

  return {
    id,
    name: displayName,
    post_title: displayName,
    post_content,
    post_date,
    type,
    acf,
    image_url,
  };
}

async function getAllContent() {
  const [movies, bands, tvShows] = await Promise.all([
    fetchJson(moviesURL),
    fetchJson(bandsURL),
    fetchJson(tvShowsURL),
  ]);

  return Promise.all(
    [...movies, ...bands, ...tvShows].map((item) => normalizeItem(item))
  );
}

// function returns ids for all json objects in array
export async function getAllIds() {
  const jsonObj = await getAllContent();

  return jsonObj.map((item) => {
    return {
      params: {
        id: item.id,
      },
    };
  });
}

// function returns names and ids for all json objects in array, sorted by name property
export async function getSortedList() {
  const jsonObj = await getAllContent();

  jsonObj.sort(function (a, b) {
    return a.name.localeCompare(b.name);
  });

  return jsonObj.map((item) => {
    return {
      id: item.id,
      name: item.name,
      type: item.type,
    };
  });
}

export async function getData(idRequested) {
  const jsonObj = await getAllContent();

  const objMatch = jsonObj.filter((obj) => {
    return obj.id === idRequested;
  });

  let objReturned;
  if (objMatch.length > 0) {
    objReturned = objMatch[0];
  } else {
    objReturned = {};
  }

  return objReturned;
}
