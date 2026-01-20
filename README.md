# Wirescout 🔍

A lightweight Node.js scraper bot that monitors configured websites for new articles and sends email notifications via Outlook SMTP.

## Features

✅ Monitor multiple websites for new articles/news  
✅ Send HTML email notifications via Outlook SMTP (only when new content found)  
✅ Track last scan results to detect new articles  
✅ Run automatically every hour on GitHub Actions  
✅ Private configuration stored in GitHub Secrets  
✅ Simple helper tools for testing and configuration  

## Project Structure

```
wirescout/
├── .github/
│   └── workflows/
│       └── scraper.yml          # GitHub Actions workflow (runs hourly)
├── lib/
│   ├── email.js                 # Email service with HTML template
│   └── state.js                 # State management (last scan only)
├── scraper.js                   # Main scraper logic
├── test-site.js                 # Helper tool to analyze sites and find selectors
├── sites-helper.js              # Helper to build SITES_CONFIG JSON
├── package.json
├── .env.example                 # Example environment variables
├── .gitignore
└── README.md
```

## Requirements

- Node.js 20 or higher
- Outlook/Microsoft 365 email account
- GitHub account (for GitHub Actions)

## Installation

### Local Setup

1. Clone the repository:
```bash
git clone https://github.com/kennethzuniga/wirescout.git
cd wirescout
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Edit `.env` and configure your settings:
```bash
# Sites configuration (JSON array)
SITES_CONFIG=[{"name":"FCA News","url":"https://www.fca.org.uk/news","selectors":{"container":"li.content-list-item","title":"span.content-item__title","link":"a","summary":""}}]

# Email recipients (comma-separated)
EMAIL_RECIPIENTS=your-email@example.com

# Outlook credentials
EMAIL_USER=your-email@company.com
EMAIL_PASS=your-password
EMAIL_FROM=your-email@company.com
```

5. Run the scraper:
```bash
npm start
```

### GitHub Actions Setup

1. Go to your repository on GitHub

2. Navigate to **Settings** → **Secrets and variables** → **Actions**

3. Add the following repository secrets:

   | Secret Name | Description | Example |
   |-------------|-------------|---------|
   | `SITES_CONFIG` | JSON array of site configurations | See [Default Configuration](#default-configuration) below |
   | `EMAIL_RECIPIENTS` | Comma-separated email addresses | `user1@example.com,user2@example.com` |
   | `EMAIL_USER` | Outlook/Microsoft 365 email | `your-email@company.com` |
   | `EMAIL_PASS` | Outlook password | `your-password` |
   | `EMAIL_FROM` | Sender email address | `your-email@company.com` |

4. The workflow will run automatically every hour, or you can trigger it manually:
   - Go to **Actions** tab
   - Select **Wirescout Scraper** workflow
   - Click **Run workflow**

## Default Configuration

The project comes with three pre-configured sites. Use the helper tool to generate the JSON:

```bash
npm run helper
```

This will output:

```json
[{"name":"FCA News","url":"https://www.fca.org.uk/news","selectors":{"container":"li.content-list-item","title":"span.content-item__title","link":"a","summary":""}},{"name":"Allianz Media Center","url":"https://www.allianz.com/en/mediacenter/news/media-releases.html","selectors":{"container":"div.c-top-product-teaser","title":"h3.c-top-product-teaser__headline","link":"a.c-heading__link","summary":"p.c-top-product-teaser__copytext"}},{"name":"Munich Re Media","url":"https://www.munichre.com/en/company/media-relations.html","selectors":{"container":"div.searchResults__resultPressRelease","title":"div.searchResults__resultPressReleaseTitle","link":"a.searchResults__resultPressReleaseLink","summary":""}}]
```

Copy this single-line JSON and paste it as the `SITES_CONFIG` secret.

## Site Configuration Format

Each site in `SITES_CONFIG` should follow this format:

```json
{
  "name": "Site Name",
  "url": "https://example.com/news",
  "selectors": {
    "container": "CSS selector for article container",
    "title": "CSS selector for article title",
    "link": "CSS selector for article link",
    "summary": "CSS selector for article summary (can be empty string)"
  }
}
```

## Adding New Sites

To add a new site to monitor:

1. **Test the site** to find the right selectors:
```bash
npm run test https://example.com/news
```

This will:
- Fetch the page
- Test common selectors
- Show the structure of the first article
- Suggest a configuration

2. **Add the site** to your configuration:
   - Edit `sites-helper.js` and add your site to the `sites` array
   - Run `npm run helper` to generate the new JSON
   - Update the `SITES_CONFIG` secret in GitHub

## How It Works

1. **Load Configuration**: Reads site configurations from `SITES_CONFIG` environment variable
2. **Load State**: Reads `state.json` to get previous scan results
3. **Scrape Sites**: For each configured site:
   - Fetches HTML with proper User-Agent
   - Extracts articles using cheerio and CSS selectors
   - Resolves relative URLs to absolute URLs
4. **Compare Results**: Compares current articles with previous scan (by URL)
5. **Send Email**: If new articles are found:
   - Generates HTML email with article details
   - Sends via Outlook SMTP using nodemailer
6. **Update State**: Saves current scan results to `state.json` (replaces previous)

## Email Template

The email notification includes:
- Subject: "New results from Wirescout!"
- Article title as clickable link
- Summary paragraph (if available)
- Source name
- Clean HTML styling
- "Powered by Wirescout 🔍" footer

## State Management

The `state.json` file contains only the most recent scan results:
- **Not cumulative** - replaces previous content on each run
- Used to detect new articles by comparing URLs
- Automatically committed and pushed by GitHub Actions

## Troubleshooting

### No emails received

- Check your Outlook credentials are correct
- Verify `EMAIL_USER`, `EMAIL_PASS`, and `EMAIL_FROM` match your Outlook account
- Check if your Outlook account requires app-specific passwords
- Look at the GitHub Actions logs for error messages

### Sites not being scraped

- Run `npm run test <URL>` to verify the selectors work
- Websites may change their HTML structure - update selectors accordingly
- Check if the site blocks automated requests
- Verify the URL is accessible

### GitHub Actions not running

- Check the **Actions** tab in your repository
- Verify all secrets are configured correctly
- Look at workflow run logs for errors
- Make sure the workflow file is in `.github/workflows/scraper.yml`

### State.json not updating

- Verify GitHub Actions has write permissions to the repository
- Check the workflow logs for git push errors
- Ensure the repository is not protected by branch rules that prevent bot commits

## Development

### Running Tests

Test a specific site:
```bash
npm run test https://www.fca.org.uk/news
```

### Generate Configuration

Build SITES_CONFIG JSON:
```bash
npm run helper
```

### Manual Run

Run the scraper locally:
```bash
npm start
```

## Dependencies

- **cheerio** (^1.0.0-rc.12) - HTML parsing and CSS selector queries
- **dotenv** (^16.3.1) - Environment variable management
- **nodemailer** (^6.9.7) - Email sending via SMTP

## Security Notes

- Never commit `.env` file or credentials to the repository
- Use GitHub Secrets for all sensitive data
- `state.json` is excluded from the repository (in `.gitignore`)
- The scraper uses STARTTLS for secure email transmission

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues or questions, please open an issue on GitHub.

---

**Powered by Wirescout 🔍**
