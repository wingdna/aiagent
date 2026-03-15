
import { Agent } from '../../types';

/**
 * PURE CORE: SEO Metadata Builder
 * Platform-Agnostic: Works in Node.js, Cloudflare Workers, Deno, or Browser.
 * 
 * Generates standard <title> and <meta> strings based on agent data.
 */

export function buildSEOMetadata(agent: Agent): { title: string, metaTags: string } {
  const title = `${agent.name} - ${agent.slogan} | AIHunter`;
  const description = (agent.description || '').substring(0, 160) + '...';
  const image = agent.video_poster || agent.persona_img || 'https://aihunter.io/og-default.jpg';
  const url = `https://aihunter.io/agent/${agent.id}`;

  const metaTags = `
    <meta name="description" content="${description}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${image}">
    <meta property="og:url" content="${url}">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${image}">
    <meta name="theme-color" content="${agent.theme_color || '#000000'}">
  `.trim();

  return { title, metaTags };
}
