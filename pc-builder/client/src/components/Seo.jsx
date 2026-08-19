import { Helmet } from 'react-helmet-async';

export default function Seo({
  title,
  description = 'AetherForge designs and assembles custom PCs for gaming, creation, and work — GST inclusive checkout, pan-India delivery.',
  path = '/',
  jsonLd,
}) {
  const url = `https://aetherforge.example${path}`;
  const full = title ? `${title} · AetherForge` : 'AetherForge — Custom PCs, forged for India';
  return (
    <Helmet>
      <title>{full}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={full} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
}
