import nodemailer from 'nodemailer';

/**
 * Create email transporter for Outlook SMTP
 * @param {string} user - Email username
 * @param {string} pass - Email password
 * @returns {Object} Nodemailer transporter
 */
export function createTransporter(user, pass) {
  return nodemailer.createTransport({
    host: 'smtp.office365.com',
    port: 587,
    secure: false, // Use STARTTLS
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Generate HTML email content from articles
 * @param {Array} articles - Array of new articles
 * @returns {string} HTML email content
 */
export function generateEmailHTML(articles) {
  const articleHTML = articles.map(article => `
    <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #e0e0e0;">
      <h2 style="margin: 0 0 10px 0;">
        <a href="${article.url}" style="color: #0066cc; text-decoration: none;">${article.title}</a>
      </h2>
      ${article.summary ? `<p style="margin: 10px 0; color: #333; line-height: 1.6;">${article.summary}</p>` : ''}
      <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">
        Source: ${article.source}
      </p>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: white; padding: 30px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: #333; margin-top: 0; border-bottom: 2px solid #0066cc; padding-bottom: 10px;">
            New Articles Found
          </h1>
          ${articleHTML}
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #999; font-size: 12px;">
            Powered by Wirescout 🔍
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Send email notification with new articles
 * @param {Object} config - Email configuration
 * @param {string} config.from - Sender email address
 * @param {string} config.to - Recipient email addresses (comma-separated)
 * @param {string} config.user - SMTP username
 * @param {string} config.pass - SMTP password
 * @param {Array} articles - Array of new articles
 */
export async function sendEmail(config, articles) {
  const { from, to, user, pass } = config;

  console.log('✉️  Preparing to send email...');

  const transporter = createTransporter(user, pass);
  const html = generateEmailHTML(articles);

  const mailOptions = {
    from,
    to,
    subject: 'New results from Wirescout!',
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    throw error;
  }
}
