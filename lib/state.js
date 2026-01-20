import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STATE_FILE = path.join(__dirname, '..', 'state.json');

/**
 * Load the last scan results from state.json
 * @returns {Array} Array of articles from the last scan, or empty array if file doesn't exist
 */
export function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = fs.readFileSync(STATE_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('⚠️  Error loading state:', error.message);
  }
  return [];
}

/**
 * Save the current scan results to state.json (replaces previous content)
 * @param {Array} articles - Array of articles to save
 */
export function saveState(articles) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(articles, null, 2), 'utf-8');
    console.log('💾 State saved successfully');
  } catch (error) {
    console.error('❌ Error saving state:', error.message);
    throw error;
  }
}

/**
 * Check if an article is new by comparing URLs
 * @param {Object} article - Article to check
 * @param {Array} previousArticles - Array of previous articles
 * @returns {boolean} True if article is new
 */
export function isNewArticle(article, previousArticles) {
  return !previousArticles.some(prev => prev.url === article.url);
}

/**
 * Filter new articles from the current scan
 * @param {Array} currentArticles - Current scan results
 * @param {Array} previousArticles - Previous scan results
 * @returns {Array} Array of new articles
 */
export function getNewArticles(currentArticles, previousArticles) {
  return currentArticles.filter(article => isNewArticle(article, previousArticles));
}
