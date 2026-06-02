const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const nodemailer = require('nodemailer');

const normalizeLogoUrl = (value) =>
  String(value || '').trim().replace(/^['"]|['"]$/g, '');

const getLogoSrc = () => {
  const logoSrc = normalizeLogoUrl(process.env.EMAIL_LOGO_URL);

  if (!/^https:\/\//i.test(logoSrc)) {
    throw new Error('EMAIL_LOGO_URL must be a public HTTPS URL for invoice emails');
  }

  return logoSrc;
};

const buildLogoImgTag = (src) =>
  `<img class="email-logo" src="${escapeHtml(src)}" width="260" alt="Astravia" title="Astravia" style="display:block;margin:0 auto;width:260px;height:auto;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;" />`;

const createTransport = () => {
  const user = String(process.env.SMTP_USER || process.env.GMAIL_USER || '').trim();
  const pass = String(process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || '').replace(/\s/g, '');

  if (!user || !pass) {
    throw new Error('SMTP_USER and SMTP_PASS are required to send invoice emails with Gmail SMTP');
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
    auth: { user, pass },
  });
};

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const dateText = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

const buildDefaultMessage = ({ customerName, orderId, transactionId, invoiceId, orderDate }) => [
  `Dear ${customerName || 'Customer'},`,
  '',
  'Thank you for choosing Astravia.',
  '',
  'Your order has been successfully confirmed.',
  '',
  'Your official invoice PDF is attached for your records.',
  '',
  `Order ID: ${orderId}`,
  `Transaction ID: ${transactionId}`,
  `Invoice ID: ${invoiceId}`,
  `Order Date: ${orderDate}`,
  '',
  'We appreciate your trust in Astravia and look forward to serving you again.',
  '',
  'Thank you for being part of the Astravia experience.',
  '',
  'Astravia Luxury Fashion House',
].join('\n');

const buildLuxuryEmailHtml = ({ invoice }) => {
  const orderId = invoice.orderId || invoice.orderReference || '';
  const invoiceId = invoice.invoiceId || 'Astravia Invoice';
  const transactionId = invoice.transactionId || invoice.transactionReference || '';
  const status = invoice.paymentStatus || invoice.status || 'Paid';
  const orderDate = dateText(invoice.date || invoice.issueDate || invoice.createdAt);
  const customerName = invoice.customer || invoice.customerName || 'Customer';
  const amount = Number(invoice.grandTotal || invoice.amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const emailLogoSrc = getLogoSrc();
  const logoImgTag = buildLogoImgTag(emailLogoSrc);

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta http-equiv="x-ua-compatible" content="ie=edge">
        <meta name="color-scheme" content="light dark">
        <meta name="supported-color-schemes" content="light dark">
        <style>
          [data-ogsc] .header-table,
          [data-ogsc] .email-header,
          [data-ogsc] .footer-table,
          [data-ogsc] .email-footer,
          [data-ogsb] .header-table,
          [data-ogsb] .email-header,
          [data-ogsb] .footer-table,
          [data-ogsb] .email-footer {
            background: #000000 !important;
            background-color: #000000 !important;
          }
          @media only screen and (max-width: 600px) {
            .email-shell { width: 100% !important; max-width: 100% !important; }
            .email-frame { padding: 10px 6px !important; }
            .email-card { border-radius: 12px !important; }
            .header-table { width: 100% !important; max-width: 100% !important; background: #000000 !important; background-color: #000000 !important; }
            .email-header { padding: 30px 20px !important; background: #000000 !important; background-color: #000000 !important; text-align: center !important; }
            .email-logo { width: 180px !important; max-width: 180px !important; height: auto !important; }
            .email-content { padding-left: 18px !important; padding-right: 18px !important; }
            .title-section { padding-top: 26px !important; padding-bottom: 12px !important; }
            .body-section { padding-top: 10px !important; padding-bottom: 8px !important; }
            .email-title { font-size: 20px !important; line-height: 1.25 !important; font-weight: 700 !important; text-align: center !important; white-space: normal !important; }
            .intro-text { font-size: 15px !important; line-height: 1.58 !important; }
            .intro-greeting { margin-bottom: 12px !important; }
            .intro-thanks { margin-bottom: 12px !important; }
            .intro-confirmed { margin-bottom: 16px !important; }
            .order-details-list { width: 100% !important; max-width: 100% !important; margin: 0 0 14px !important; }
            .order-detail-bullet { padding-bottom: 10px !important; }
            .order-detail-text { padding-bottom: 10px !important; font-size: 16px !important; line-height: 1.9 !important; }
            .order-detail-last { padding-bottom: 0 !important; }
            .section-wrap { padding: 12px 14px 0 !important; }
            .email-card-inner { padding: 18px !important; }
            .stack-column { display: block !important; width: 100% !important; max-width: 100% !important; }
            .stack-gap { padding-top: 12px !important; }
            .detail-label,
            .detail-value,
            .summary-label,
            .summary-value { font-size: 13px !important; }
            .summary-total { font-size: 17px !important; }
            .callout-wrap { padding: 14px 14px 24px !important; }
            .callout-card { padding: 16px !important; font-size: 14px !important; }
            .footer-table { width: 100% !important; max-width: 100% !important; background: #000000 !important; background-color: #000000 !important; }
            .email-footer { width: 100% !important; max-width: 100% !important; box-sizing: border-box !important; padding: 40px 20px !important; text-align: center !important; background: #000000 !important; background-color: #000000 !important; }
            .footer-title { font-size: 16px !important; line-height: 1.35 !important; max-width: 100% !important; }
            .footer-brand { font-size: 11px !important; line-height: 1.45 !important; letter-spacing: .75px !important; max-width: 100% !important; overflow-wrap: break-word !important; word-break: normal !important; }
            .footer-contact { font-size: 12px !important; line-height: 1.85 !important; max-width: 100% !important; overflow-wrap: anywhere !important; }
          }
        </style>
      </head>
      <body style="margin:0;padding:0;background:#f3eee6;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background:#f3eee6;">
          <tr>
            <td class="email-frame" align="center" style="padding:30px 12px;">
              <table role="presentation" class="email-shell" width="640" cellspacing="0" cellpadding="0" border="0" style="width:640px;max-width:640px;border-collapse:collapse;">
                <tr>
                  <td class="email-card" style="overflow:hidden;border:1px solid #e7dcc9;border-radius:12px;background:#ffffff;box-shadow:0 24px 58px rgba(28,22,15,.14);">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;">
                      <tr>
                        <td bgcolor="#000000" data-ogsc data-ogsb style="padding:0;background:#000000 !important;background-color:#000000 !important;">
                          <table class="header-table" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#000000" data-ogsc data-ogsb style="width:100%;max-width:100%;border-collapse:collapse;background:#000000 !important;background-color:#000000 !important;">
                            <tr>
                              <td class="email-header" align="center" bgcolor="#000000" data-ogsc data-ogsb style="background:#000000 !important;background-color:#000000 !important;mso-line-height-rule:exactly;padding:30px 20px;text-align:center;">
                                ${logoImgTag}
                              </td>
                            </tr>
                            <tr>
                              <td style="height:1px;background:#c9a86a;background-color:#c9a86a;font-size:0;line-height:0;">&nbsp;</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td class="email-content title-section" style="padding:38px 46px 14px;background:#ffffff;text-align:center;">
                          <h1 class="email-title" style="margin:0;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:30px;line-height:1.12;font-weight:700;color:#111111;letter-spacing:.4px;text-align:center;">Thank you for your purchase!</h1>
                          <div style="width:72px;height:1px;margin:18px auto 0;background:#c9a86a;font-size:0;line-height:0;">&nbsp;</div>
                        </td>
                      </tr>
                      <tr>
                        <td class="email-content body-section" style="padding:10px 46px 8px;background:#ffffff;">
                          <div class="intro-text intro-greeting" style="margin:0 0 14px;font-family:Poppins,Arial,Helvetica,sans-serif;font-size:16px;line-height:1.58;font-weight:400;color:#17120e;">Dear <strong style="font-weight:700;">${escapeHtml(customerName)}</strong>,</div>
                          <div class="intro-text intro-thanks" style="margin:0 0 10px;font-family:Poppins,Arial,Helvetica,sans-serif;font-size:16px;line-height:1.58;color:#3b332a;">Thank you for choosing Astravia.</div>
                          <div class="intro-text intro-confirmed" style="margin:0 0 10px;font-family:Poppins,Arial,Helvetica,sans-serif;font-size:16px;line-height:1.58;color:#3b332a;">Your order has been successfully confirmed.</div>
                          <table class="order-details-list" role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;margin:2px 0 14px;font-family:Poppins,Arial,Helvetica,sans-serif;font-size:16px;line-height:1.9;font-weight:500;color:#333333;text-align:left;">
                            <tr>
                              <td class="order-detail-bullet" width="18" valign="top" style="width:18px;padding:0 0 8px;color:#c9a96e;font-size:16px;line-height:1.9;font-weight:700;">&bull;</td>
                              <td class="order-detail-text" style="padding:0 0 8px;color:#333333;font-size:16px;line-height:1.9;font-weight:400;"><span style="font-weight:600;">Order ID:</span> ${escapeHtml(orderId)}</td>
                            </tr>
                            <tr>
                              <td class="order-detail-bullet" width="18" valign="top" style="width:18px;padding:0 0 8px;color:#c9a96e;font-size:16px;line-height:1.9;font-weight:700;">&bull;</td>
                              <td class="order-detail-text" style="padding:0 0 8px;color:#333333;font-size:16px;line-height:1.9;font-weight:400;"><span style="font-weight:600;">Transaction ID:</span> ${escapeHtml(transactionId)}</td>
                            </tr>
                            <tr>
                              <td class="order-detail-bullet" width="18" valign="top" style="width:18px;padding:0 0 8px;color:#c9a96e;font-size:16px;line-height:1.9;font-weight:700;">&bull;</td>
                              <td class="order-detail-text" style="padding:0 0 8px;color:#333333;font-size:16px;line-height:1.9;font-weight:400;"><span style="font-weight:600;">Invoice ID:</span> ${escapeHtml(invoiceId)}</td>
                            </tr>
                            <tr>
                              <td class="order-detail-bullet order-detail-last" width="18" valign="top" style="width:18px;padding:0;color:#c9a96e;font-size:16px;line-height:1.9;font-weight:700;">&bull;</td>
                              <td class="order-detail-text order-detail-last" style="padding:0;color:#333333;font-size:16px;line-height:1.9;font-weight:400;"><span style="font-weight:600;">Order Date:</span> ${escapeHtml(orderDate)}</td>
                            </tr>
                          </table>
                          <div class="intro-text" style="margin:0 0 10px;font-family:Poppins,Arial,Helvetica,sans-serif;font-size:16px;line-height:1.58;color:#3b332a;">Your official invoice PDF is attached for your records.</div>
                          <div class="intro-text" style="margin:0 0 10px;font-family:Poppins,Arial,Helvetica,sans-serif;font-size:16px;line-height:1.58;color:#3b332a;">We appreciate your trust in Astravia and look forward to serving you again.</div>
                          <div class="intro-text" style="margin:0 0 12px;font-family:Poppins,Arial,Helvetica,sans-serif;font-size:16px;line-height:1.58;color:#3b332a;">Thank you for being part of the Astravia experience.</div>
                          <div style="margin:8px 0 0;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:16px;line-height:1.25;font-weight:600;color:#111111;">Astravia Luxury Fashion House</div>
                        </td>
                      </tr>
                      <tr>
                        <td class="section-wrap" style="padding:16px 46px 0;background:#ffffff;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:separate;border-spacing:0;border:1px solid #e4d5b7;border-radius:12px;background:#faf8f4;">
                            <tr>
                              <td class="email-card-inner" style="padding:24px;">
                                <div style="margin:0 0 14px;color:#111111;text-transform:uppercase;font-family:Montserrat,Arial,Helvetica,sans-serif;font-size:12px;line-height:1.2;font-weight:800;letter-spacing:1.7px;">INVOICE SUMMARY</div>
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;font-family:Poppins,Arial,Helvetica,sans-serif;">
                                  <tr>
                                    <td class="summary-label" style="padding:9px 0;color:#756958;font-size:14px;line-height:1.35;">Order ID</td>
                                    <td class="summary-value" align="right" style="padding:9px 0;text-align:right;font-size:14px;line-height:1.35;font-weight:700;color:#111111;">${escapeHtml(orderId)}</td>
                                  </tr>
                                  <tr>
                                    <td class="summary-label" style="padding:9px 0;color:#756958;font-size:14px;line-height:1.35;">Transaction ID</td>
                                    <td class="summary-value" align="right" style="padding:9px 0;text-align:right;font-size:14px;line-height:1.35;font-weight:700;color:#111111;">${escapeHtml(transactionId)}</td>
                                  </tr>
                                  <tr>
                                    <td class="summary-label" style="padding:9px 0;color:#756958;font-size:14px;line-height:1.35;">Invoice ID</td>
                                    <td class="summary-value" align="right" style="padding:9px 0;text-align:right;font-size:14px;line-height:1.35;font-weight:700;color:#111111;">${escapeHtml(invoiceId)}</td>
                                  </tr>
                                  <tr>
                                    <td class="summary-label" style="padding:9px 0;color:#756958;font-size:14px;line-height:1.35;">Payment Status</td>
                                    <td class="summary-value" align="right" style="padding:9px 0;text-align:right;font-size:14px;line-height:1.35;color:#111111;font-weight:800;">${escapeHtml(String(status).toUpperCase())}</td>
                                  </tr>
                                  <tr>
                                    <td colspan="2" style="padding:12px 0 0;border-bottom:1px solid #e4d5b7;font-size:0;line-height:0;">&nbsp;</td>
                                  </tr>
                                  <tr>
                                    <td class="summary-label" style="padding:18px 0 0;color:#756958;font-size:14px;line-height:1.35;font-weight:700;">Grand Total</td>
                                    <td class="summary-total" align="right" style="padding:18px 0 0;text-align:right;font-size:19px;line-height:1.3;font-weight:900;color:#111111;">LKR ${amount}</td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td class="callout-wrap" style="padding:18px 46px 30px;background:#ffffff;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background:#f8f3e8;border-left:4px solid #c9a86a;">
                            <tr>
                              <td class="callout-card" style="padding:17px 20px;font-family:Poppins,Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#3b332a;">
                                Your official Astravia invoice PDF is attached to this email for your records.
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td bgcolor="#000000" data-ogsc data-ogsb style="padding:0;background:#000000 !important;background-color:#000000 !important;">
                          <table class="footer-table" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#000000" data-ogsc data-ogsb style="width:100%;max-width:100%;border-collapse:collapse;background:#000000 !important;background-color:#000000 !important;">
                            <tr>
                              <td class="email-footer" align="center" bgcolor="#000000" data-ogsc data-ogsb style="width:100%;max-width:100%;box-sizing:border-box;background:#000000 !important;background-color:#000000 !important;mso-line-height-rule:exactly;padding:40px 20px;color:#ffffff;text-align:center;">
                                <div class="footer-title" style="font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:18px;line-height:1.35;font-weight:700;letter-spacing:.3px;color:#ffffff;">Luxury Fashion. Timeless Elegance.</div>
                                <div class="footer-brand" style="margin-top:13px;font-family:Montserrat,Arial,Helvetica,sans-serif;font-weight:800;font-size:13px;line-height:1.4;letter-spacing:1.1px;text-transform:uppercase;color:#c9a86a;">Astravia Luxury Fashion House</div>
                                <div class="footer-contact" style="margin-top:16px;color:#ded7cc;font-family:Poppins,Arial,Helvetica,sans-serif;font-size:12px;line-height:1.9;">
                                  <a href="mailto:support@astravia.com" style="color:#c9a86a;text-decoration:none;">support@astravia.com</a><br>
                                  +94 77 123 4567<br>
                                  <a href="http://www.astravia.com" style="color:#c9a86a;text-decoration:none;">www.astravia.com</a>
                                </div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

const sendInvoiceEmail = async ({ invoice, pdfPath, to, subject, message }) => {
  const recipient = String(to || invoice.email || invoice.customerEmail || '').trim();
  const orderId = invoice.orderId || invoice.orderReference || '';
  const customerName = invoice.customer || invoice.customerName || 'Customer';
  const invoiceId = invoice.invoiceId || 'Astravia Invoice';
  const transactionId = invoice.transactionId || invoice.transactionReference || '';
  const orderDate = dateText(invoice.date || invoice.issueDate || invoice.createdAt);
  const emailSubject = String(subject || `Astravia Invoice - ${invoiceId}`).trim();
  const emailMessage = String(message || buildDefaultMessage({ customerName, orderId, transactionId, invoiceId, orderDate })).trim();

  if (!recipient) {
    throw new Error('Invoice customer email is missing');
  }

  const transporter = createTransport();
  const emailLogoSrc = getLogoSrc();
  const emailHtml = buildLuxuryEmailHtml({ invoice });
  const finalLogoImgTag = buildLogoImgTag(emailLogoSrc);

  console.info('[InvoiceEmail] EMAIL_LOGO_URL runtime value:', emailLogoSrc);
  console.info('[InvoiceEmail] Final HTML contains EMAIL_LOGO_URL:', emailHtml.includes(emailLogoSrc));
  console.info('[InvoiceEmail] Final img tag sent to Gmail:', finalLogoImgTag);

  const result = await transporter.sendMail({
    from: process.env.INVOICE_FROM_EMAIL || process.env.SMTP_FROM || `Astravia Luxury Fashion House <${process.env.SMTP_USER || process.env.GMAIL_USER || 'support@astravia.com'}>`,
    to: recipient,
    subject: emailSubject,
    text: emailMessage,
    html: emailHtml,
    attachments: [
      ...(pdfPath ? [{
        filename: `${invoiceId}.pdf`,
        path: pdfPath,
        contentType: 'application/pdf',
      }] : []),
    ],
  });

  return {
    accepted: result.accepted || [],
    messageId: result.messageId,
    preview: result.message,
  };
};

module.exports = { sendInvoiceEmail };
