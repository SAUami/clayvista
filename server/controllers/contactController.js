const Contact = require('../models/Contact');
const Newsletter = require('../models/Newsletter');
const { sendEmail } = require('../utils/sendEmail');

// Submit Contact / Inquiry / Wholesale Form
exports.submitContact = async (req, res, next) => {
  try {
    const { name, email, phone, subject, message, inquiryType } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
    }

    const contact = await Contact.create({
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      subject,
      message,
      inquiryType: inquiryType || 'General Inquiry'
    });

    // Notify concierge team
    sendEmail({
      to: process.env.STORE_EMAIL || 'Clayvistaindia@gmail.com',
      subject: `[New Inquiry] ${inquiryType || 'Message'} from ${name}`,
      text: `Inquiry from ${name} (${email}, Phone: ${phone || 'N/A'})\n\nSubject: ${subject}\n\nMessage:\n${message}`
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Thank you for reaching out to ClayVista. Our concierge team will connect with you within 24 hours.',
      contact
    });
  } catch (error) {
    next(error);
  }
};

// Newsletter Subscription
exports.subscribeNewsletter = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    let subscriber = await Newsletter.findOne({ email: email.toLowerCase() });
    if (subscriber) {
      return res.status(200).json({
        success: true,
        message: 'You are already subscribed to ClayVista artisanal dispatches!',
        couponCode: 'WELCOME15'
      });
    }

    subscriber = await Newsletter.create({ email: email.toLowerCase() });

    // Send Welcome Email with Coupon
    sendEmail({
      to: email,
      subject: 'Welcome to the ClayVista Circle | Your 15% Welcome Gift',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; border: 1px solid #ddd; padding: 25px; border-radius: 8px;">
          <h2 style="font-family: Georgia, serif; color: #1a1a1a;">Welcome to ClayVista</h2>
          <p style="color: #555;">Thank you for subscribing to our artisanal updates, kiln dispatches, and table styling inspirations.</p>
          <div style="background: #F7F7F5; border: 1px dashed #C46A4A; padding: 15px; text-align: center; margin: 20px 0; border-radius: 6px;">
            <p style="margin: 0; color: #777; font-size: 13px;">Enjoy 15% off your first handcrafted set with code:</p>
            <h3 style="margin: 8px 0; color: #C46A4A; font-size: 26px; letter-spacing: 2px;">WELCOME15</h3>
            <p style="margin: 0; color: #888; font-size: 12px;">Valid on all ceramic tableware and dinner sets.</p>
          </div>
        </div>
      `
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Thank you for subscribing! Your 15% discount code is WELCOME15.',
      couponCode: 'WELCOME15'
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get all inquiries
exports.getInquiries = async (req, res, next) => {
  try {
    const inquiries = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: inquiries.length, inquiries });
  } catch (error) {
    next(error);
  }
};

// Admin: Get all newsletter subscribers
exports.getSubscribers = async (req, res, next) => {
  try {
    const subscribers = await Newsletter.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: subscribers.length, subscribers });
  } catch (error) {
    next(error);
  }
};
