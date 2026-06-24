import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  type?: string;
}

const BASE_URL = 'https://amotif.onrender.com';

const defaults = {
  title: 'AMOTIF - Plataforma de Colaboração Musical',
  description: 'AMOTIF é uma plataforma de colaboração musical onde músicos podem criar projetos, compartilhar faixas e colabore remotamente.',
  image: '/assets/logo.fav.png',
  type: 'website',
};

export function SEOHead({
  title,
  description,
  url,
  image,
  type = defaults.type,
}: SEOHeadProps) {
  const fullTitle = title ? `${title} | AMOTIF` : defaults.title;
  const desc = description || defaults.description;
  const fullUrl = url ? `${BASE_URL}${url}` : BASE_URL;
  const fullImage = image?.startsWith('http') ? image : `${BASE_URL}${image || defaults.image}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:type" content={type} />

      {/* Twitter */}
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={fullImage} />
    </Helmet>
  );
}
