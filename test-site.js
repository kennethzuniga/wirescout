import * as cheerio from 'cheerio';

/**
 * Test site scraping and suggest selectors
 * Usage: npm run test <URL>
 */

const url = process.argv[2];

if (!url) {
  console.error('❌ Usage: npm run test <URL>');
  console.error('   Example: npm run test https://www.fca.org.uk/news');
  process.exit(1);
}

console.log('🔍 Testing site:', url);
console.log('');

async function testSite() {
  try {
    // Fetch HTML
    console.log('🌐 Fetching HTML...');
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    console.log('✅ HTML fetched successfully\n');

    // Test common container selectors
    console.log('📦 Testing common container selectors:');
    const containerSelectors = [
      'article',
      'li.content-list-item',
      'div.article',
      'div.news-item',
      'div.post',
      'div[class*="teaser"]',
      'div[class*="result"]',
      'div[class*="item"]',
    ];

    const containerResults = [];
    containerSelectors.forEach(selector => {
      const count = $(selector).length;
      if (count > 0) {
        containerResults.push({ selector, count });
      }
    });

    containerResults
      .sort((a, b) => a.count - b.count)
      .forEach(result => {
        console.log(`   ${result.selector}: ${result.count} elements`);
      });

    if (containerResults.length === 0) {
      console.log('   ⚠️  No common containers found. Try inspecting the page manually.');
      return;
    }

    // Use the first container with a reasonable count (between 3 and 50)
    const bestContainer = containerResults.find(r => r.count >= 3 && r.count <= 50) || containerResults[0];
    console.log(`\n✅ Using container: ${bestContainer.selector}`);

    // Analyze first article structure
    console.log('\n📄 First article structure:');
    const $first = $(bestContainer.selector).first();

    // Find headings
    const headings = [];
    $first.find('h1, h2, h3, h4, h5, h6, span[class*="title"], span[class*="headline"], div[class*="title"], div[class*="headline"]').each((i, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 10 && text.length < 200) {
        headings.push({
          tag: el.tagName,
          class: $(el).attr('class') || '',
          text: text.substring(0, 80) + (text.length > 80 ? '...' : ''),
        });
      }
    });

    console.log('   Headings found:');
    headings.slice(0, 3).forEach(h => {
      const selector = h.class ? `${h.tag}.${h.class.split(' ')[0]}` : h.tag;
      console.log(`     ${selector}: "${h.text}"`);
    });

    // Find links
    const links = [];
    $first.find('a').each((i, el) => {
      const href = $(el).attr('href');
      if (href) {
        links.push({
          class: $(el).attr('class') || '',
          href,
        });
      }
    });

    console.log('\n   Links found:');
    links.slice(0, 3).forEach(l => {
      const selector = l.class ? `a.${l.class.split(' ')[0]}` : 'a';
      console.log(`     ${selector}: ${l.href}`);
    });

    // Find paragraphs
    const paragraphs = [];
    $first.find('p, div[class*="text"], div[class*="description"], div[class*="summary"], span[class*="text"]').each((i, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 20 && text.length < 500) {
        paragraphs.push({
          tag: el.tagName,
          class: $(el).attr('class') || '',
          text: text.substring(0, 80) + (text.length > 80 ? '...' : ''),
        });
      }
    });

    console.log('\n   Paragraphs/summaries found:');
    paragraphs.slice(0, 3).forEach(p => {
      const selector = p.class ? `${p.tag}.${p.class.split(' ')[0]}` : p.tag;
      console.log(`     ${selector}: "${p.text}"`);
    });

    // Generate suggested configuration
    console.log('\n📋 Suggested configuration:');
    const titleSelector = headings.length > 0 && headings[0].class
      ? `${headings[0].tag}.${headings[0].class.split(' ')[0]}`
      : headings.length > 0 ? headings[0].tag : 'h2';

    const linkSelector = links.length > 0 && links[0].class
      ? `a.${links[0].class.split(' ')[0]}`
      : 'a';

    const summarySelector = paragraphs.length > 0 && paragraphs[0].class
      ? `${paragraphs[0].tag}.${paragraphs[0].class.split(' ')[0]}`
      : '';

    const config = {
      name: 'Site Name',
      url: url,
      selectors: {
        container: bestContainer.selector,
        title: titleSelector,
        link: linkSelector,
        summary: summarySelector,
      },
    };

    console.log(JSON.stringify(config, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testSite();
