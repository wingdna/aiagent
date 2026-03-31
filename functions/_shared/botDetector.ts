export const BOT_USER_AGENTS = [
  "googlebot", "bingbot", "yandexbot", "duckduckbot", "slurp", 
  "twitterbot", "facebookexternalhit", "linkedinbot", "embedly",
  "baiduspider", "discordbot", "whatsapp", "telegrambot",
  "gptbot", "claudebot", "ccbot", "semrushbot", "mj12bot",
  "ahrefsbot", "dotbot", "petalbot", "bytespider", "anthropic-ai",
  "chatgpt-user", "perplexitybot", "oai-searchbot", "applebot-extended"
];

export const isBotRequest = (request: Request): boolean => {
  const userAgent = (request.headers.get("User-Agent") || "").toLowerCase();
  
  // Whitelist curl and local dev tools
  if (userAgent.includes("curl") || userAgent.includes("insomnia") || userAgent.includes("postman") || userAgent.includes("node-fetch")) {
    return false;
  }
  
  return BOT_USER_AGENTS.some(bot => userAgent.includes(bot));
};
