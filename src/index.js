import "dotenv/config";
import * as cheerio from "cheerio";
import * as chrono from "chrono-node";
import { sites } from "./sites.js";
import { loadState, saveState, isNewArticle } from "./utils/state.js";
import { sendEmail } from "./utils/email.js";

const CONFIG = {
  sites,
  emailHost: process.env.EMAIL_HOST,
  emailPort: process.env.EMAIL_PORT,
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASS,
  emailRecipients:
    process.env.EMAIL_RECIPIENTS?.split(",").map((e) => e.trim()) || [],
};

const fetchPage = async (url) => {
  const page = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0..." },
  });
  if (!page.ok) throw new Error(`Failed: ${page.status}`);
  return page.text();
};

// Clean and parse any date format
const parseDateString = (dateStr) => {
  if (!dateStr) return null;

  const clean = dateStr.trim();

  // FORCE UK format DD/MM/YYYY
  const ukMatch = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ukMatch) {
    const [_, day, month, year] = ukMatch;
    const date = new Date(`${year}-${month}-${day}`);
    if (!isNaN(date.getTime())) return date.toISOString();
  }

  // Try chrono as fallback
  const parsed = chrono.parseDate(clean);
  if (parsed) return parsed.toISOString();

  return null;
};

const extractArticles = (html, site) => {
  const $ = cheerio.load(html);
  const { container, title, date, summary, link } = site.selectors;
  const articles = [];

  $(container).each((i, obj) => {
    const $obj = $(obj);
    const titleText = title ? $obj.find(title).text().trim() : "";
    const rawDate = date ? $obj.find(date).text().trim() : "";
    const sortableDate = parseDateString(rawDate) || new Date().toISOString();
    const summaryText = summary ? $obj.find(summary).text().trim() : "";
    const linkHref = link ? $obj.find(link).attr("href") : null;
    const fullLink = linkHref
      ? linkHref.startsWith("http")
        ? linkHref
        : new URL(linkHref, site.baseUrl || site.url).href
      : null;

    if (titleText) {
      articles.push({
        source: site.name,
        title: titleText,
        date: rawDate,
        sortDate: sortableDate,
        summary: summaryText,
        link: fullLink,
      });
    }
  });
  return articles;
};

const scrapeAll = async () => {
  const results = await Promise.all(
    CONFIG.sites.map(async (site) => {
      try {
        console.log(`Scraping ${site.name}...`);
        const html = await fetchPage(site.url);
        return extractArticles(html, site);
      } catch (error) {
        console.error(`Error: ${site.name} - ${error.message}`);
        return [];
      }
    }),
  );

  // Sort by sortDate (ISO string)
  return results
    .flat()
    .sort((a, b) => new Date(b.sortDate) - new Date(a.sortDate));
};

const main = async () => {
  console.log("Wirescout starting...");

  if (!CONFIG.sites.length) throw new Error("No sites configured");
  if (!CONFIG.emailRecipients.length) throw new Error("No email recipients");
  if (!CONFIG.emailUser || !CONFIG.emailPass)
    throw new Error("Email credentials missing");

  console.log(`Monitoring ${CONFIG.sites.length} site(s)...`);

  const [lastScan, currentScan] = await Promise.all([loadState(), scrapeAll()]);
  console.log(`Previous: ${lastScan.length} | Current: ${currentScan.length}`);

  const newArticles = currentScan.filter((article) =>
    isNewArticle(article, lastScan),
  );

  if (!newArticles.length) {
    console.log("No new articles");
    await saveState(currentScan);
    return;
  }

  console.log(`Found ${newArticles.length} new articles!`);
  await Promise.all([sendEmail(newArticles, CONFIG), saveState(currentScan)]);
  console.log("Email sent & state saved");
};

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
