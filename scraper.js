import dotenv from 'dotenv';
import * as cheerio from 'cheerio';
import { loadState, saveState, getNewArticles } from './lib/state.js';
import { sendEmail } from './lib/email.js';

// Load environment variables
dotenv.config();

/**
 * Validate required environment variables
 */
function validateEnvironment() {
  const required = ['SITES_CONFIG', 'EMAIL_RECIPIENTS', 'EMAIL_USER', 'EMAIL_PASS', 'EMAIL_FROM'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    process.exit(1);
  }
}

/**
 * Fetch HTML content from a URL
 * @param {string} url - URL to fetch
 * @returns {Promise<string>} HTML content
 */
async function fetchHTML(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.text();
  } catch (error) {
    console.error(`❌ Error fetching ${url}:`, error.message);
    throw error;
  }
}

/**
 * Resolve relative URL to absolute URL
 * @param {string} baseUrl - Base URL
 * @param {string} relativeUrl - Relative URL
 * @returns {string} Absolute URL
 */
function resolveUrl(baseUrl, relativeUrl) {
  try {
    return new URL(relativeUrl, baseUrl).href;
  } catch (error) {
    console.error('⚠️  Error resolving URL:', relativeUrl);
    return relativeUrl;
  }
}

/**
 * Scrape articles from a site based on configuration
 * @param {Object} siteConfig - Site configuration
 * @returns {Promise<Array>} Array of articles
 */
async function scrapeSite(siteConfig) {
  console.log(`\n🌐 Scraping: ${siteConfig.name}`);
  console.log(`   URL: ${siteConfig.url}`);

  try {
    const html = await fetchHTML(siteConfig.url);
    const $ = cheerio.load(html);
    const articles = [];

    $(siteConfig.selectors.container).each((_, element) => {
      const $container = $(element);

      // Extract title
      const titleEl = $container.find(siteConfig.selectors.title);
      const title = titleEl.text().trim();

      // Extract link
      const linkEl = $container.find(siteConfig.selectors.link);
      const href = linkEl.attr('href');
      const url = href ? resolveUrl(siteConfig.url, href) : '';

      // Extract summary (if configured)
      let summary = '';
      if (siteConfig.selectors.summary) {
        const summaryEl = $container.find(siteConfig.selectors.summary);
        summary = summaryEl.text().trim();
      }

      // Only add if we have at least title and URL
      if (title && url) {
        articles.push({
          title,
          url,
          summary,
          source: siteConfig.name,
        });
      }
    });

    console.log(`   📚 Found ${articles.length} articles`);
    return articles;
  } catch (error) {
    console.error(`   ❌ Error scraping ${siteConfig.name}:`, error.message);
    return [];
  }
}

/**
 * Main scraper function
 */
async function main() {
  console.log('🔍 Wirescout Scraper Starting...\n');

  // Validate environment
  validateEnvironment();

  // Parse sites configuration
  let sitesConfig;
  try {
    sitesConfig = JSON.parse(process.env.SITES_CONFIG);
    console.log(`📄 Loaded ${sitesConfig.length} site configuration(s)`);
  } catch (error) {
    console.error('❌ Error parsing SITES_CONFIG:', error.message);
    process.exit(1);
  }

  // Load previous state
  const previousArticles = loadState();
  console.log(`📰 Previous scan had ${previousArticles.length} articles\n`);

  // Scrape all sites
  const allArticles = [];
  for (const siteConfig of sitesConfig) {
    const articles = await scrapeSite(siteConfig);
    allArticles.push(...articles);
  }

  console.log(`\n📊 Total articles found: ${allArticles.length}`);

  // Find new articles
  const newArticles = getNewArticles(allArticles, previousArticles);
  console.log(`📰 New articles: ${newArticles.length}`);

  // Send email if there are new articles
  if (newArticles.length > 0) {
    try {
      await sendEmail({
        from: process.env.EMAIL_FROM,
        to: process.env.EMAIL_RECIPIENTS,
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      }, newArticles);
    } catch (error) {
      console.error('❌ Failed to send email');
    }
  } else {
    console.log('✅ No new articles found - no email sent');
  }

  // Save current state
  saveState(allArticles);

  console.log('\n✅ Scraper completed successfully');
}

// Run the scraper
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
