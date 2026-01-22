const mongoose = require('mongoose');

const AdSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  type: { 
    type: String, 
    required: true, 
    enum: ['promo', 'event', 'partner', 'community', 'sports', 'product', 'service'],
    default: 'promo'
  },
  category: { 
    type: String, 
    enum: ['premier-league', 'food', 'services', 'products', 'events', 'general'],
    default: 'general'
  },
  image: { type: String }, // URL or emoji
  imageUrl: { type: String }, // Full image URL
  link: { type: String }, // Optional link for the ad
  cta: { type: String, default: 'Learn More' }, // Call to action text
  featured: { type: Boolean, default: false },
  trending: { type: Boolean, default: false },
  showAsPopup: { type: Boolean, default: false }, // Show as pop-up to WiFi users
  sendPushNotification: { type: Boolean, default: false }, // Send push notification
  priority: { type: Number, default: 0 }, // Higher priority shows first
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date }, // Optional expiry date
  active: { type: Boolean, default: true },
  targetAudience: {
    all: { type: Boolean, default: true },
    newUsers: { type: Boolean, default: false },
    existingUsers: { type: Boolean, default: false },
    verifiedUsers: { type: Boolean, default: false }
  },
  displaySettings: {
    showOnHomePage: { type: Boolean, default: true },
    showOnAdsPage: { type: Boolean, default: true },
    showOnPortal: { type: Boolean, default: true },
    maxDisplays: { type: Number, default: 0 }, // 0 = unlimited
    currentDisplays: { type: Number, default: 0 }
  },
  clicks: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for efficient queries
AdSchema.index({ active: 1, startDate: 1, endDate: 1 });
AdSchema.index({ showAsPopup: 1, active: 1 });
AdSchema.index({ trending: 1, active: 1 });
AdSchema.index({ type: 1, category: 1 });

// Method to check if ad is currently active
AdSchema.methods.isActive = function() {
  if (!this.active) return false;
  const now = new Date();
  if (this.startDate && now < this.startDate) return false;
  if (this.endDate && now > this.endDate) return false;
  return true;
};

// Method to increment views
AdSchema.methods.incrementViews = async function() {
  this.views += 1;
  if (this.displaySettings.maxDisplays > 0) {
    this.displaySettings.currentDisplays += 1;
  }
  await this.save();
};

// Method to increment clicks
AdSchema.methods.incrementClicks = async function() {
  this.clicks += 1;
  await this.save();
};

module.exports = mongoose.model('Ad', AdSchema);
