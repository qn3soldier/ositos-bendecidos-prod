import express from 'express';
import nodemailer from 'nodemailer';
import Joi from 'joi';

const router = express.Router();

// Create nodemailer transporter
const createTransporter = () => {
  const emailService = process.env.EMAIL_SERVICE; // 'gmail', 'sendgrid', etc.
  
  if (emailService === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // App password
      }
    });
  }
  
  // Default SMTP configuration
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'localhost',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Validation schemas
const confirmationEmailSchema = Joi.object({
  orderId: Joi.string().required(),
  email: Joi.string().email().required()
});

const prayerRequestSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  prayerRequest: Joi.string().required(),
  isPrivate: Joi.boolean().default(false)
});

const communityHelpSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  helpType: Joi.string().required(),
  description: Joi.string().required(),
  urgency: Joi.string().valid('low', 'medium', 'high').default('medium')
});

const investmentInquirySchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  investmentAmount: Joi.number().min(0),
  projectInterest: Joi.string(),
  message: Joi.string().required()
});

// Generate order confirmation email HTML
const generateConfirmationEmailHTML = (order: any) => {
  const { orderId, customerInfo, items, totals } = order;
  
  const itemsHTML = items.map((item: any) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        ${item.name}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
        $${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Confirmation - Ositos Bendecidos</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #FFD700 0%, #F5DEB3 100%); color: #000; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #ddd; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
        .order-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #FFD700; color: #000; padding: 12px; text-align: left; }
        td { padding: 10px; border-bottom: 1px solid #eee; }
        .total { font-weight: bold; font-size: 18px; color: #FFD700; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🐻 Order Confirmation</h1>
          <p>Thank you for your order!</p>
        </div>
        
        <div class="content">
          <h2>Hello ${customerInfo.firstName}!</h2>
          <p>Your order has been confirmed and we're preparing it for shipment.</p>
          
          <div class="order-details">
            <h3>Order Details</h3>
            <p><strong>Order Number:</strong> ${orderId}</p>
            <p><strong>Email:</strong> ${customerInfo.email}</p>
            <p><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          
          <h3>Items Ordered</h3>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align: center;">Quantity</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>
          
          <div style="text-align: right; margin-top: 20px;">
            <p><strong>Subtotal: $${totals.subtotal.toFixed(2)}</strong></p>
            <p><strong>Shipping: $${totals.shipping.toFixed(2)}</strong></p>
            <p><strong>Tax: $${totals.tax.toFixed(2)}</strong></p>
            <p class="total">Total: $${totals.total.toFixed(2)}</p>
          </div>
          
          <h3>What's Next?</h3>
          <ul>
            <li>We'll send you a shipping confirmation with tracking information</li>
            <li>Your order will be delivered within 3-7 business days</li>
            <li>Contact us if you have any questions</li>
          </ul>
        </div>
        
        <div class="footer">
          <p>Thank you for supporting our community!</p>
          <p>
            <strong>Ositos Bendecidos</strong><br>
            Building communities through faith, empowerment, and mutual support
          </p>
          <p>
            Email: support@ositosbendecidos.com<br>
            Phone: +1 (555) 123-4567
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send order confirmation email
router.post('/confirmation', async (req, res) => {
  try {
    const { error, value } = confirmationEmailSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details
      });
    }

    const { orderId, email } = value;

    // In production, fetch order from database
    // For now, we'll create a mock order for demo
    const mockOrder = {
      orderId,
      customerInfo: {
        firstName: 'John',
        lastName: 'Doe',
        email: email
      },
      items: [
        { name: 'Blessed Bear T-Shirt', quantity: 1, price: 29.99 },
        { name: 'Faith & Hope Coffee Mug', quantity: 2, price: 19.99 }
      ],
      totals: {
        subtotal: 69.97,
        shipping: 0,
        tax: 5.60,
        total: 75.57
      }
    };

    const transporter = createTransporter();
    const htmlContent = generateConfirmationEmailHTML(mockOrder);

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'orders@ositosbendecidos.com',
      to: email,
      subject: `Order Confirmation - ${orderId}`,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);

    console.log(`📧 Confirmation email sent to: ${email}`);

    return res.json({
      success: true,
      message: 'Confirmation email sent successfully'
    });

  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send confirmation email',
      error: process.env.NODE_ENV !== 'production' ? error : undefined
    });
  }
});

// Send shipping notification email
router.post('/shipping', async (req, res) => {
  try {
    const { orderId, email, trackingNumber, carrier } = req.body;

    if (!orderId || !email) {
      return res.status(400).json({
        success: false,
        message: 'Order ID and email are required'
      });
    }

    const transporter = createTransporter();

    const htmlContent = `
      <h2>Your Order is on the Way! 📦</h2>
      <p>Great news! Your order ${orderId} has shipped.</p>
      <p><strong>Tracking Number:</strong> ${trackingNumber || 'Will be provided soon'}</p>
      <p><strong>Carrier:</strong> ${carrier || 'Standard Shipping'}</p>
      <p>You can expect delivery within 3-7 business days.</p>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'shipping@ositosbendecidos.com',
      to: email,
      subject: `Your Order ${orderId} Has Shipped!`,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);

    console.log(`📦 Shipping notification sent to: ${email}`);

    return res.json({
      success: true,
      message: 'Shipping notification sent successfully'
    });

  } catch (error) {
    console.error('Error sending shipping notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send shipping notification'
    });
  }
});

// Prayer request endpoint
router.post('/prayer-request', async (req, res) => {
  try {
    const { error, value } = prayerRequestSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details
      });
    }

    const { name, email, prayerRequest, isPrivate } = value;
    const transporter = createTransporter();

    // Email to admin
    const adminHtmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Prayer Request - Ositos Bendecidos</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #FFD700 0%, #F5DEB3 100%); color: #000; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #ddd; }
          .prayer-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FFD700; }
          .private-notice { background: #ffe6e6; padding: 15px; border-radius: 8px; color: #d63384; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🙏 New Prayer Request</h1>
            <p>Someone needs our prayers</p>
          </div>
          
          <div class="content">
            <h2>Prayer Request Details</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            ${isPrivate ? '<div class="private-notice"><strong>🔒 PRIVATE REQUEST</strong> - Please handle with confidentiality</div>' : ''}
            
            <div class="prayer-box">
              <h3>Prayer Request:</h3>
              <p>${prayerRequest.replace(/\n/g, '<br>')}</p>
            </div>
            
            <p><strong>Next Steps:</strong></p>
            <ul>
              <li>Add to prayer board (if not private)</li>
              <li>Include in community prayers</li>
              <li>Follow up with requester if needed</li>
            </ul>
          </div>
        </div>
      </body>
      </html>
    `;

    // Confirmation email to user
    const userHtmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Prayer Request Received - Ositos Bendecidos</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #FFD700 0%, #F5DEB3 100%); color: #000; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🙏 Prayer Request Received</h1>
            <p>We're praying with you</p>
          </div>
          
          <div class="content">
            <h2>Dear ${name},</h2>
            <p>Thank you for sharing your prayer request with our community. We want you to know that you are not alone in this journey.</p>
            
            <p><strong>What happens next:</strong></p>
            <ul>
              <li>Our community will be praying for your request</li>
              <li>${isPrivate ? 'Your request will be kept private as requested' : 'Your request may be added to our prayer board for community support'}</li>
              <li>We'll keep you in our thoughts and prayers</li>
            </ul>
            
            <p>Remember: "And we know that in all things God works for the good of those who love him." - Romans 8:28</p>
            
            <p>Blessings and peace,<br><strong>The Ositos Bendecidos Community</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email to admin
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'prayers@ositosbendecidos.com',
      to: process.env.ADMIN_EMAIL || 'admin@ositosbendecidos.com',
      subject: `🙏 New Prayer Request from ${name}`,
      html: adminHtmlContent
    });

    // Send confirmation to user
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'prayers@ositosbendecidos.com',
      to: email,
      subject: 'Your Prayer Request - Ositos Bendecidos',
      html: userHtmlContent
    });

    console.log(`🙏 Prayer request sent from: ${email}`);

    return res.json({
      success: true,
      message: 'Prayer request submitted successfully'
    });

  } catch (error) {
    console.error('Error handling prayer request:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit prayer request'
    });
  }
});

// Community help request endpoint
router.post('/community-help', async (req, res) => {
  try {
    const { error, value } = communityHelpSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details
      });
    }

    const { name, email, helpType, description, urgency } = value;
    const transporter = createTransporter();

    const urgencyColors: {[key: string]: string} = {
      low: '#28a745',
      medium: '#ffc107', 
      high: '#dc3545'
    };

    // Email to admin
    const adminHtmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Community Help Request - Ositos Bendecidos</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #FFD700 0%, #F5DEB3 100%); color: #000; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #ddd; }
          .help-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FFD700; }
          .urgency { display: inline-block; padding: 5px 10px; border-radius: 15px; color: white; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🤝 Community Help Request</h1>
            <p>Someone needs our support</p>
          </div>
          
          <div class="content">
            <h2>Help Request Details</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Help Type:</strong> ${helpType}</p>
            <p><strong>Urgency:</strong> <span class="urgency" style="background-color: ${urgencyColors[urgency]};">${urgency.toUpperCase()}</span></p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            
            <div class="help-box">
              <h3>Description:</h3>
              <p>${description.replace(/\n/g, '<br>')}</p>
            </div>
            
            <p><strong>Next Steps:</strong></p>
            <ul>
              <li>Review and assess the request</li>
              <li>Connect with community volunteers</li>
              <li>Follow up within 24-48 hours</li>
              <li>Coordinate assistance if possible</li>
            </ul>
          </div>
        </div>
      </body>
      </html>
    `;

    // Confirmation email to user
    const userHtmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Help Request Received - Ositos Bendecidos</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #FFD700 0%, #F5DEB3 100%); color: #000; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🤝 Help Request Received</h1>
            <p>We're here to support you</p>
          </div>
          
          <div class="content">
            <h2>Dear ${name},</h2>
            <p>Thank you for reaching out to our community for help. We believe in lifting each other up through faith and mutual support.</p>
            
            <p><strong>What happens next:</strong></p>
            <ul>
              <li>Our team will review your request within 24-48 hours</li>
              <li>We'll connect you with community volunteers who may be able to help</li>
              <li>You'll receive a follow-up email with next steps</li>
              <li>We'll work together to find the best way to support you</li>
            </ul>
            
            <p>Remember, you are part of our community, and we're here for each other.</p>
            
            <p>With love and support,<br><strong>The Ositos Bendecidos Community</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send emails
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'help@ositosbendecidos.com',
      to: process.env.ADMIN_EMAIL || 'admin@ositosbendecidos.com',
      subject: `🤝 Community Help Request from ${name} (${urgency.toUpperCase()} priority)`,
      html: adminHtmlContent
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'help@ositosbendecidos.com',
      to: email,
      subject: 'Your Help Request - Ositos Bendecidos',
      html: userHtmlContent
    });

    console.log(`🤝 Community help request from: ${email}`);

    return res.json({
      success: true,
      message: 'Help request submitted successfully'
    });

  } catch (error) {
    console.error('Error handling community help request:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit help request'
    });
  }
});

// Investment inquiry endpoint
router.post('/investment-inquiry', async (req, res) => {
  try {
    const { error, value } = investmentInquirySchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details
      });
    }

    const { name, email, investmentAmount, projectInterest, message } = value;
    const transporter = createTransporter();

    // Email to admin
    const adminHtmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Investment Inquiry - Ositos Bendecidos</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #FFD700 0%, #F5DEB3 100%); color: #000; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #ddd; }
          .investment-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FFD700; }
          .amount { color: #28a745; font-weight: bold; font-size: 18px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 Investment Inquiry</h1>
            <p>Potential investor interested</p>
          </div>
          
          <div class="content">
            <h2>Investment Inquiry Details</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            ${investmentAmount ? `<p><strong>Investment Amount:</strong> <span class="amount">$${investmentAmount.toLocaleString()}</span></p>` : ''}
            ${projectInterest ? `<p><strong>Project Interest:</strong> ${projectInterest}</p>` : ''}
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            
            <div class="investment-box">
              <h3>Message:</h3>
              <p>${message.replace(/\n/g, '<br>')}</p>
            </div>
            
            <p><strong>Next Steps:</strong></p>
            <ul>
              <li>Review investor profile and interests</li>
              <li>Schedule a consultation call</li>
              <li>Prepare investment opportunities presentation</li>
              <li>Follow up within 2-3 business days</li>
            </ul>
          </div>
        </div>
      </body>
      </html>
    `;

    // Confirmation email to user
    const userHtmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Investment Inquiry Received - Ositos Bendecidos</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #FFD700 0%, #F5DEB3 100%); color: #000; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 Investment Inquiry Received</h1>
            <p>Thank you for your interest</p>
          </div>
          
          <div class="content">
            <h2>Dear ${name},</h2>
            <p>Thank you for your interest in investing in our community projects. We're excited about the opportunity to create lasting positive change together.</p>
            
            <p><strong>What happens next:</strong></p>
            <ul>
              <li>Our investment team will review your inquiry within 2-3 business days</li>
              <li>We'll schedule a consultation call to discuss opportunities</li>
              <li>You'll receive detailed information about current projects</li>
              <li>We'll work together to find the best investment match for your goals</li>
            </ul>
            
            <p>Our mission is to create sustainable community projects that generate both social impact and financial returns. Together, we can build stronger communities.</p>
            
            <p>Looking forward to partnering with you,<br><strong>The Ositos Bendecidos Investment Team</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send emails
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'investments@ositosbendecidos.com',
      to: process.env.ADMIN_EMAIL || 'admin@ositosbendecidos.com',
      subject: `💰 Investment Inquiry from ${name}${investmentAmount ? ` ($${investmentAmount.toLocaleString()})` : ''}`,
      html: adminHtmlContent
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'investments@ositosbendecidos.com',
      to: email,
      subject: 'Your Investment Inquiry - Ositos Bendecidos',
      html: userHtmlContent
    });

    console.log(`💰 Investment inquiry from: ${email}`);

    return res.json({
      success: true,
      message: 'Investment inquiry submitted successfully'
    });

  } catch (error) {
    console.error('Error handling investment inquiry:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit investment inquiry'
    });
  }
});

export default router;
