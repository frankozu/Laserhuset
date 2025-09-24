// Netlify variant
export const handler = async (event, context) => {
  try {
    const upstream = await fetch('https://www.bokadirekt.se/places/laserhuset-19356', {
      headers: { 'user-agent': 'Mozilla/5.0' }
    });
    const html = await upstream.text();

    const ratingMatch = html.match(/([0-5](?:[.,]\d))\s*<\/?[a-z][^>]*?>?\s*[\s\S]{0,120}Betyg/i) || html.match(/itemprop="ratingValue"[^>]*>([\d.,]+)/i);
    const countMatch  = html.match(/(\d{2,6})\s+Betyg/i) || html.match(/itemprop="reviewCount"[^>]*>(\d{1,7})/i);

    const ratingValue = ratingMatch ? Number(String(ratingMatch[1]).replace(',', '.')) : 4.9;
    const reviewCount = countMatch ? Number(countMatch[1]) : 1191;

    return {
      statusCode: 200,
      headers: { 'Cache-Control': 'public, s-maxage=43200, stale-while-revalidate=43200' },
      body: JSON.stringify({ ratingValue, reviewCount, updatedISO: new Date().toISOString() })
    };
  } catch (e) {
    return {
      statusCode: 200,
      body: JSON.stringify({ ratingValue: 4.9, reviewCount: 1191, updatedISO: '2025-09-24T00:00:00.000Z' })
    };
  }
};
