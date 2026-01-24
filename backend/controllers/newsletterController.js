const NewsletterSubscription = require('../models/NewsletterSubscription');
const NewsletterCampaign = require('../models/NewsletterCampaign');
const User = require('../models/User');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Subscribe to newsletter
exports.subscribeNewsletter = async (req, res) => {
  try {
    const { email, firstName, lastName, categories, frequency, source } = req.body;

    // Check if already subscribed
    let subscription = await NewsletterSubscription.findOne({ email });

    if (subscription) {
      if (subscription.isActive) {
        return res.status(400).json({ 
          success: false, 
          error: 'Email already subscribed' 
        });
      } else {
        // Reactivate subscription
        subscription.isActive = true;
        subscription.categories = categories || subscription.categories;
        subscription.frequency = frequency || subscription.frequency;
        await subscription.save();
      }
    } else {
      // Create new subscription
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const unsubscribeToken = crypto.randomBytes(32).toString('hex');

      subscription = new NewsletterSubscription({
        email,
        firstName,
        lastName,
        categories: categories || ['promotions', 'deals'],
        frequency: frequency || 'weekly',
        source: source || 'website',
        verificationToken,
        verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
        unsubscribeToken
      });

      await subscription.save();

      // Send verification email (optional)
      // await sendVerificationEmail(email, verificationToken);
    }

    res.json({
      success: true,
      message: 'Successfully subscribed to newsletter',
      data: subscription
    });
  } catch (error) {
    console.error('Subscribe newsletter error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Unsubscribe from newsletter
exports.unsubscribeNewsletter = async (req, res) => {
  try {
    const { email, token } = req.body;

    let filter = { email };
    if (token) {
      filter.unsubscribeToken = token;
    }

    const subscription = await NewsletterSubscription.findOneAndUpdate(
      filter,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );

    if (!subscription) {
      return res.status(404).json({ 
        success: false, 
        error: 'Subscription not found' 
      });
    }

    res.json({
      success: true,
      message: 'Successfully unsubscribed from newsletter'
    });
  } catch (error) {
    console.error('Unsubscribe newsletter error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get subscriber preferences
exports.getSubscriberPreferences = async (req, res) => {
  try {
    const { email } = req.params;

    const subscription = await NewsletterSubscription.findOne({ email });

    if (!subscription) {
      return res.status(404).json({ 
        success: false, 
        error: 'Subscription not found' 
      });
    }

    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update subscriber preferences
exports.updateSubscriberPreferences = async (req, res) => {
  try {
    const { email } = req.params;
    const { categories, frequency, firstName, lastName } = req.body;

    const subscription = await NewsletterSubscription.findOneAndUpdate(
      { email },
      {
        categories: categories || undefined,
        frequency: frequency || undefined,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!subscription) {
      return res.status(404).json({ 
        success: false, 
        error: 'Subscription not found' 
      });
    }

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: subscription
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all subscribers (admin)
exports.getAllSubscribers = async (req, res) => {
  try {
    const { page = 1, limit = 50, isActive = true, category } = req.query;

    let filter = { isActive: isActive === 'true' };
    if (category) {
      filter.categories = category;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [subscribers, total] = await Promise.all([
      NewsletterSubscription.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      NewsletterSubscription.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: subscribers,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get subscribers error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create newsletter campaign (admin)
exports.createCampaign = async (req, res) => {
  try {
    const { title, subject, content, htmlContent, categories, scheduledFor, featuredProducts } = req.body;

    const campaign = new NewsletterCampaign({
      title,
      subject,
      content,
      htmlContent,
      categories,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      featuredProducts,
      createdBy: req.user?.id,
      status: scheduledFor ? 'scheduled' : 'draft'
    });

    await campaign.save();

    res.json({
      success: true,
      data: campaign,
      message: 'Campaign created successfully'
    });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get newsletter campaigns (admin)
exports.getCampaigns = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    let filter = {};
    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [campaigns, total] = await Promise.all([
      NewsletterCampaign.find(filter)
        .populate('createdBy', 'name email')
        .populate('featuredProducts', 'name image price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      NewsletterCampaign.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: campaigns,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Send newsletter campaign (admin)
exports.sendCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;

    const campaign = await NewsletterCampaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    // Get subscribers based on campaign categories
    const subscribers = await NewsletterSubscription.find({
      isActive: true,
      isVerified: true,
      categories: { $in: campaign.categories }
    });

    campaign.recipientCount = subscribers.length;
    campaign.status = 'sent';
    campaign.sentAt = new Date();
    await campaign.save();

    // In production, send emails asynchronously
    // sendEmailsThroughQueue(subscribers, campaign);

    res.json({
      success: true,
      message: `Campaign scheduled to send to ${subscribers.length} subscribers`,
      data: campaign
    });
  } catch (error) {
    console.error('Send campaign error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get newsletter stats (admin)
exports.getNewsletterStats = async (req, res) => {
  try {
    const [totalSubscribers, activeSubscribers, categoryStats, frequencyStats] = await Promise.all([
      NewsletterSubscription.countDocuments({}),
      NewsletterSubscription.countDocuments({ isActive: true }),
      NewsletterSubscription.aggregate([
        { $unwind: '$categories' },
        { $group: { _id: '$categories', count: { $sum: 1 } } }
      ]),
      NewsletterSubscription.aggregate([
        { $group: { _id: '$frequency', count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalSubscribers,
        activeSubscribers,
        inactiveSubscribers: totalSubscribers - activeSubscribers,
        categoryStats,
        frequencyStats
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
