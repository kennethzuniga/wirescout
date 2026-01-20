/**
 * Helper to build SITES_CONFIG JSON for GitHub Secrets
 * Run: npm run helper
 */

const sites = [
  {
    name: 'FCA News',
    url: 'https://www.fca.org.uk/news',
    selectors: {
      container: 'li.content-list-item',
      title: 'span.content-item__title',
      link: 'a',
      summary: '',
    },
  },
  {
    name: 'Allianz Media Center',
    url: 'https://www.allianz.com/en/mediacenter/news/media-releases.html',
    selectors: {
      container: 'div.c-top-product-teaser',
      title: 'h3.c-top-product-teaser__headline',
      link: 'a.c-heading__link',
      summary: 'p.c-top-product-teaser__copytext',
    },
  },
  {
    name: 'Munich Re Media',
    url: 'https://www.munichre.com/en/company/media-relations.html',
    selectors: {
      container: 'div.searchResults__resultPressRelease',
      title: 'div.searchResults__resultPressReleaseTitle',
      link: 'a.searchResults__resultPressReleaseLink',
      summary: '',
    },
  },
];

console.log('🔧 Sites Configuration Helper\n');
console.log('📋 Configured Sites:');
sites.forEach((site, index) => {
  console.log(`   ${index + 1}. ${site.name}`);
});

console.log('\n📝 Single-line JSON for GitHub Secrets (SITES_CONFIG):');
console.log('─'.repeat(80));
console.log(JSON.stringify(sites));
console.log('─'.repeat(80));

console.log('\n📖 Formatted JSON for reference:');
console.log(JSON.stringify(sites, null, 2));

console.log('\n💡 Copy the single-line JSON above and paste it as the value for the');
console.log('   SITES_CONFIG secret in your GitHub repository settings.');
