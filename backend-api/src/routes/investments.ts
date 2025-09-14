import express from 'express';
import Joi from 'joi';
import nodemailer from 'nodemailer';

const router = express.Router();

// In-memory storage for investment inquiries (replace with database in production)
const inquiries: any[] = [];

// Validation schema for investment inquiries
const investmentInquirySchema = Joi.object({
  fullName: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  investmentAmount: Joi.string().valid(
    '1000-5000',
    '5000-10000',
    '10000-25000',
    '25000+'
  ).required(),
  interestArea: Joi.string().valid(
    'retail',
    'education',
    'crafts',
    'technology',
    'any'
  ).required(),
  message: Joi.string().min(10).max(1000).required(),
  receiveUpdates: Joi.boolean().default(false)
});

// Create email transporter
const createTransporter = () => {
  const emailService = process.env.EMAIL_SERVICE;
  
  if (emailService === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
  
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

// Generate investment inquiry email HTML
const generateInquiryEmailHTML = (inquiry: any) => {
  const amountRanges: { [key: string]: string } = {
    '1000-5000': '$1,000 - $5,000',
    '5000-10000': '$5,000 - $10,000',
    '10000-25000': '$10,000 - $25,000',
    '25000+': '$25,000+'
  };

  const interestAreas: { [key: string]: string } = {
    'retail': 'Retail Development',
    'education': 'Education & Training',
    'crafts': 'Traditional Crafts',
    'technology': 'Technology',
    'any': 'Open to All Projects'
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Investment Inquiry - Ositos Bendecidos</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #FFD700 0%, #F5DEB3 100%); color: #000; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #ddd; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
        .field { margin-bottom: 20px; }
        .label { font-weight: bold; color: #555; margin-bottom: 5px; }
        .value { color: #000; padding: 10px; background: #f8f9fa; border-radius: 4px; }
        .highlight { background: #FFD700; color: #000; padding: 2px 6px; border-radius: 3px; }
        .message-box { background: #f8f9fa; padding: 20px; border-left: 4px solid #FFD700; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🐻 New Investment Inquiry</h1>
          <p>A potential investor has submitted an inquiry</p>
        </div>
        
        <div class="content">
          <h2>Investor Information</h2>
          
          <div class="field">
            <div class="label">Full Name:</div>
            <div class="value">${inquiry.fullName}</div>
          </div>
          
          <div class="field">
            <div class="label">Email Address:</div>
            <div class="value"><a href="mailto:${inquiry.email}">${inquiry.email}</a></div>
          </div>
          
          <div class="field">
            <div class="label">Investment Amount Range:</div>
            <div class="value"><span class="highlight">${amountRanges[inquiry.investmentAmount]}</span></div>
          </div>
          
          <div class="field">
            <div class="label">Interest Area:</div>
            <div class="value">${interestAreas[inquiry.interestArea]}</div>
          </div>
          
          <div class="field">
            <div class="label">Receive Updates:</div>
            <div class="value">${inquiry.receiveUpdates ? 'Yes' : 'No'}</div>
          </div>
          
          <h3>Message / Investment Goals</h3>
          <div class="message-box">
            ${inquiry.message.replace(/\n/g, '<br>')}
          </div>
          
          <div style="margin-top: 30px; padding: 20px; background: #fffef5; border: 1px solid #FFD700; border-radius: 8px;">
            <h3 style="margin-top: 0;">Next Steps:</h3>
            <ol>
              <li>Review the investor's information and goals</li>
              <li>Prepare relevant investment materials</li>
              <li>Respond within 24-48 hours</li>
              <li>Schedule a follow-up call if appropriate</li>
            </ol>
          </div>
        </div>
        
        <div class="footer">
          <p style="margin: 0;">This inquiry was submitted on ${new Date(inquiry.createdAt).toLocaleString()}</p>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">
            Inquiry ID: ${inquiry.id}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Create new investment inquiry
router.post('/inquiries', async (req, res) => {
  try {
    const { error, value } = investmentInquirySchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details
      });
    }

    // Create inquiry object
    const inquiry = {
      ...value,
      id: `INV-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    // Store inquiry
    inquiries.push(inquiry);

    // Send email notification if configured
    if (process.env.EMAIL_USER) {
      try {
        const transporter = createTransporter();
        
        // Send notification to admin
        await transporter.sendMail({
          from: `"Ositos Bendecidos" <${process.env.EMAIL_USER}>`,
          to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
          subject: `New Investment Inquiry - ${inquiry.fullName}`,
          html: generateInquiryEmailHTML(inquiry)
        });

        // Send confirmation to investor
        await transporter.sendMail({
          from: `"Ositos Bendecidos" <${process.env.EMAIL_USER}>`,
          to: inquiry.email,
          subject: 'Thank you for your investment inquiry - Ositos Bendecidos',
          html: `
            <h2>Thank you for your interest!</h2>
            <p>Dear ${inquiry.fullName},</p>
            <p>We have received your investment inquiry and appreciate your interest in supporting our mission.</p>
            <p>Our team will review your information and contact you within 24-48 hours to discuss potential opportunities.</p>
            <p>Best regards,<br>The Ositos Bendecidos Team</p>
          `
        });

        console.log(`💼 Investment inquiry email sent for ${inquiry.id}`);
      } catch (emailError) {
        console.error('Failed to send investment inquiry email:', emailError);
        // Continue processing even if email fails
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Investment inquiry submitted successfully',
      inquiryId: inquiry.id
    });

  } catch (error) {
    console.error('Error creating investment inquiry:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit investment inquiry'
    });
  }
});

// Get all investment inquiries (admin endpoint)
router.get('/inquiries', async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    let filteredInquiries = inquiries;
    
    // Filter by status if provided
    if (status) {
      filteredInquiries = inquiries.filter(inquiry => inquiry.status === status);
    }

    // Sort by creation date (newest first)
    filteredInquiries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Pagination
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedInquiries = filteredInquiries.slice(startIndex, endIndex);

    return res.json({
      success: true,
      inquiries: paginatedInquiries,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(filteredInquiries.length / Number(limit)),
        totalInquiries: filteredInquiries.length,
        hasNext: endIndex < filteredInquiries.length,
        hasPrev: startIndex > 0
      }
    });

  } catch (error) {
    console.error('Error fetching investment inquiries:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch investment inquiries'
    });
  }
});

// Get single investment inquiry
router.get('/inquiries/:id', async (req, res) => {
  try {
    const inquiry = inquiries.find(i => i.id === req.params.id);
    
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Investment inquiry not found'
      });
    }

    return res.json({
      success: true,
      inquiry
    });

  } catch (error) {
    console.error('Error fetching investment inquiry:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch investment inquiry'
    });
  }
});

// Update investment inquiry status
router.patch('/inquiries/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'contacted', 'in-progress', 'completed', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const inquiry = inquiries.find(i => i.id === req.params.id);
    
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Investment inquiry not found'
      });
    }

    inquiry.status = status;
    inquiry.updatedAt = new Date().toISOString();

    return res.json({
      success: true,
      message: 'Investment inquiry status updated successfully',
      inquiry
    });

  } catch (error) {
    console.error('Error updating investment inquiry:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update investment inquiry'
    });
  }
});

export default router;
