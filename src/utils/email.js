import nodemailer from "nodemailer";

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Generate HTML email from articles
function generateEmailHTML(articles) {
  const articleItems = articles
    .map(
      (article) => `
    <div style="margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom:  24px;">
      <small style="font-size: 12px; color: #999; margin-bottom: 8px;">${escapeHtml(article.source)}</small>
      ${article.link ? `<a href="${article.link}" style="text-decoration:  none; color: #2c3e50;">` : ""}
        <h3 style="margin-bottom: 16px;">${escapeHtml(article.title)}</h3>
      ${article.link ? `</a>` : ""}
      ${article.date ? `<small style="font-size: 12px; color: #999; margin-bottom: 8px;">${escapeHtml(article.date)}</small>` : ""}
      ${article.summary ? `<p style="color: #555;">${escapeHtml(article.summary)}</p>` : ""}
    </div>
  `,
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #2c3e50;">📰 New Articles Found (${articles.length})</h2>
      ${articleItems}
      <p style="text-align: center; color: #999; font-size:  12px; margin-top:  48px;">
        Powered by Wirescout 🔍
      </p>
    </body>
    </html>
  `;
}

// Send email via Gmail SMTP
export async function sendEmail(articles, config) {
  const transporter = nodemailer.createTransport({
    host: config.emailHost || "smtp.gmail.com",
    port: config.emailPort || 587,
    secure: false,
    auth: {
      user: config.emailUser,
      pass: config.emailPass,
    },
  });

  await transporter.sendMail({
    from: config.emailFrom,
    to: config.emailRecipients.join(", "),
    subject: "New results from Wirescout! ",
    html: generateEmailHTML(articles),
  });
}
