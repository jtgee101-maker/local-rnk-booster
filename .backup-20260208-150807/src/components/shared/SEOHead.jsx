import React from 'react';
import { Helmet } from 'react-helmet';

export default function SEOHead({
  title = "LocalRank.ai - Free AI-Powered Local SEO Audit",
  description = "Discover why 73% of local customers can't find your business. Get a free AI audit revealing your exact geographic blind spots and revenue leaks in 60 seconds.",
  image = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696d57cd4797fbebf0798aa4/2f56189cf_Gemini_Generated_Image_yyfn0byyfn0byyfn-removebg-preview.png",
  url = typeof window !== 'undefined' ? window.location.href : '',
  type = "website",
  noindex = false
}) {
  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Canonical URL */}
      {url && <link rel="canonical" href={url} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />

      {/* Additional SEO */}
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      <meta name="theme-color" content="#c8ff00" />
    </Helmet>
  );
}