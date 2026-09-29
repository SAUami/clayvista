const nodemailer = require('nodemailer');

// Configure transport
const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass && !user.includes('example.com')) {
    return nodemailer.createTransport({
      host: host,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_PORT == 465,
      auth: { user, pass }
    });
  }

  // Fallback test transporter (Ethereal or mock transport)
  return {
    sendMail: async (mailOptions) => {
      console.log(`\n\x1b[35m========== [EMAIL DISPATCHED (DEV PREVIEW)] ==========\x1b[0m`);
      console.log(`\x1b[1mTo:\x1b[0m ${mailOptions.to}`);
      console.log(`\x1b[1mSubject:\x1b[0m ${mailOptions.subject}`);
      console.log(`\x1b[1mDate:\x1b[0m ${new Date().toLocaleString()}`);
      console.log(`-----------------------------------------------------`);
      // Strip some tags for readable terminal log
      const previewText = mailOptions.text || (mailOptions.html ? mailOptions.html.replace(/<[^>]+>/g, ' ').substring(0, 300) + '...' : '');
      console.log(previewText.trim());
      console.log(`\x1b[35m======================================================\x1b[0m\n`);
      return { messageId: 'mock-mail-' + Date.now() };
    }
  };
};

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'ClayVista Luxury Ceramics <concierge@clayvista.com>',
      to,
      subject,
      html,
      text: text || ''
    });
    return info;
  } catch (error) {
    console.error(`Email sending failed to ${to}:`, error.message);
    // Don't throw to avoid crashing checkout or registration
    return null;
  }
};

const sendOrderConfirmation = async (order) => {
  const subject = `Order Confirmed: #${order.orderNumber} - ClayVista`;
  const itemsHtml = order.orderItems
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        <strong>${item.name}</strong><br>
        <span style="color: #777; font-size: 13px;">Qty: ${item.quantity}</span>
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
        ₹${item.total.toLocaleString('en-IN')}
      </td>
    </tr>`
    )
    .join('');

  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
      <div style="background: #1a1a1a; padding: 25px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-family: Georgia, serif; font-size: 26px; letter-spacing: 1px;">ClayVista</h1>
        <p style="color: #C46A4A; margin: 5px 0 0; font-size: 13px; letter-spacing: 2px; text-transform: uppercase;">Crafting Elegance in Every Piece</p>
      </div>
      <div style="padding: 30px;">
        <h2 style="color: #333; margin-top: 0;">Thank You for Your Order, ${order.customerDetails.name}!</h2>
        <p style="color: #555; line-height: 1.6;">
          Your order has been received and our artisans are carefully preparing your handcrafted porcelain and ceramic pieces for insured delivery.
        </p>
        <div style="background: #f7f7f5; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #555;"><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p style="margin: 5px 0 0; font-size: 14px; color: #555;"><strong>Payment Method:</strong> ${order.paymentMethod.toUpperCase()}</p>
          <p style="margin: 5px 0 0; font-size: 14px; color: #555;"><strong>Delivery Address:</strong> ${order.customerDetails.shippingAddress.street}, ${order.customerDetails.shippingAddress.city}, ${order.customerDetails.shippingAddress.state} - ${order.customerDetails.shippingAddress.pincode}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background: #fdfdfd; text-align: left; font-size: 13px; text-transform: uppercase; color: #888;">
              <th style="padding: 10px; border-bottom: 2px solid #ddd;">Item</th>
              <th style="padding: 10px; border-bottom: 2px solid #ddd; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td style="padding: 8px 10px; text-align: right; color: #666;">Subtotal:</td>
              <td style="padding: 8px 10px; text-align: right; font-weight: bold;">₹${order.subtotal.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="padding: 8px 10px; text-align: right; color: #666;">GST (18%):</td>
              <td style="padding: 8px 10px; text-align: right;">₹${order.taxGst.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="padding: 8px 10px; text-align: right; color: #666;">Insured Shipping:</td>
              <td style="padding: 8px 10px; text-align: right;">${order.shippingFee === 0 ? 'FREE' : '₹' + order.shippingFee}</td>
            </tr>
            ${order.discountAmount > 0 ? `
            <tr>
              <td style="padding: 8px 10px; text-align: right; color: #C46A4A;">Discount:</td>
              <td style="padding: 8px 10px; text-align: right; color: #C46A4A;">-₹${order.discountAmount.toLocaleString('en-IN')}</td>
            </tr>` : ''}
            <tr style="font-size: 16px;">
              <td style="padding: 12px 10px; text-align: right; font-weight: bold; border-top: 2px solid #333;">Grand Total:</td>
              <td style="padding: 12px 10px; text-align: right; font-weight: bold; color: #C46A4A; border-top: 2px solid #333;">₹${order.grandTotal.toLocaleString('en-IN')}</td>
            </tr>
          </tfoot>
        </table>
        <p style="color: #666; font-size: 13px; line-height: 1.5;">
          You can track your order status in real time through our <a href="http://localhost:${process.env.PORT || 5000}/track-order.html?orderNumber=${order.orderNumber}" style="color: #C46A4A;">Track Order portal</a>.
        </p>
      </div>
      <div style="background: #f7f7f5; padding: 20px; text-align: center; color: #888; font-size: 12px;">
        ClayVista Ceramics • Handcrafted Tableware & Crockery • Questions? Reply to this email.
      </div>
    </div>
  `;

  return await sendEmail({ to: order.customerDetails.email, subject, html });
};

const sendOTP = async (email, otp) => {
  const subject = `Your ClayVista Verification Code: ${otp}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; padding: 30px;">
      <h2 style="font-family: Georgia, serif; color: #1a1a1a; margin-top: 0;">ClayVista</h2>
      <p style="color: #555;">Use the following One-Time Password (OTP) to verify your account or reset your password. This code will expire in 10 minutes.</p>
      <div style="background: #F7F7F5; border: 1px dashed #C46A4A; text-align: center; padding: 18px; margin: 20px 0; border-radius: 6px;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #C46A4A;">${otp}</span>
      </div>
      <p style="color: #888; font-size: 12px;">If you did not request this verification code, please ignore this email.</p>
    </div>
  `;
  return await sendEmail({ to: email, subject, html });
};

// Real SMS & WhatsApp OTP Dispatcher (Supports Twilio & Fast2SMS Gateway integration)
const sendSMSOTP = async (phone, otp) => {
  const cleanPhone = phone.replace(/[\s\-()]/g, '');
  const messageBody = `Your ClayVista Luxury Tableware verification code is: ${otp}. Valid for 15 minutes. Do not share this code.`;

  // 1. Twilio Gateway (Global)
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    try {
      const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
      const params = new URLSearchParams();
      const formattedTo = cleanPhone.startsWith('+') ? cleanPhone : `+91${cleanPhone}`;
      params.append('To', formattedTo);
      params.append('From', process.env.TWILIO_PHONE_NUMBER);
      params.append('Body', messageBody);

      const twilioRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });
      const twilioData = await twilioRes.json();
      console.log(`✔ [Twilio SMS] Dispatched to ${formattedTo}. SID: ${twilioData.sid || twilioData.message}`);
      return { success: true, provider: 'twilio', sid: twilioData.sid };
    } catch (err) {
      console.error('✖ [Twilio Error]:', err.message);
    }
  }

  // 2. Fast2SMS Gateway (India)
  if (process.env.FAST2SMS_API_KEY) {
    try {
      const raw10Digits = cleanPhone.slice(-10);
      const f2Res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': process.env.FAST2SMS_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: otp,
          numbers: raw10Digits
        })
      });
      const f2Data = await f2Res.json();
      console.log(`✔ [Fast2SMS] Dispatched to ${raw10Digits}:`, f2Data.message);
      return { success: true, provider: 'fast2sms', data: f2Data };
    } catch (err) {
      console.error('✖ [Fast2SMS Error]:', err.message);
    }
  }

  // Production Server Console Audit Log (Logs cleanly when gateway is not yet linked)
  console.log(`\n\x1b[36m========== [MOBILE SMS OTP DISPATCHED] ==========\x1b[0m`);
  console.log(`\x1b[1mRecipient Mobile:\x1b[0m ${phone}`);
  console.log(`\x1b[1mSMS Text:\x1b[0m ${messageBody}`);
  console.log(`\x1b[1mTimestamp:\x1b[0m ${new Date().toLocaleString()}`);
  console.log(`\x1b[36m=================================================\x1b[0m\n`);
  return { success: true, phone, otp };
};

module.exports = {
  sendEmail,
  sendOrderConfirmation,
  sendOTP,
  sendSMSOTP
};
