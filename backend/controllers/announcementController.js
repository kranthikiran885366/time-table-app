const Announcement = require('../models/Announcement');
const { logActivity } = require('../middleware/activityLogger');

// Get all announcements
const getAnnouncements = async (req, res) => {
  try {
    const { targetAudience, isActive, isPinned } = req.query;
    
    const filter = {};
    if (targetAudience) filter.targetAudience = targetAudience;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (isPinned !== undefined) filter.isPinned = isPinned === 'true';
    
    // Only show active announcements within date range
    const now = new Date();
    filter.startDate = { $lte: now };
    filter.$or = [
      { endDate: null },
      { endDate: { $gte: now } }
    ];
    
    const announcements = await Announcement.find(filter)
      .populate('createdBy', 'name email')
      .populate('targetSections', 'name department')
      .sort({ isPinned: -1, createdAt: -1 });
    
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get announcement by ID
const getAnnouncementById = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('createdBy', 'name email department')
      .populate('targetSections', 'name department year');
    
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    
    // Increment view count
    announcement.viewCount += 1;
    await announcement.save();
    
    res.json(announcement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create announcement
const createAnnouncement = async (req, res) => {
  try {
    const announcementData = {
      ...req.body,
      createdBy: req.user.id
    };
    
    const announcement = new Announcement(announcementData);
    await announcement.save();
    
    // Log activity
    await logActivity(req, {
      action: 'CREATE',
      entity: 'Announcement',
      entityId: announcement._id,
      description: `Created announcement: ${announcement.title}`
    });
    
    // TODO: Send notifications if enabled
    // if (announcement.sendEmail) await sendEmailNotifications(announcement);
    // if (announcement.sendPush) await sendPushNotifications(announcement);
    
    res.status(201).json(announcement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update announcement
const updateAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');
    
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    
    // Log activity
    await logActivity(req, {
      action: 'UPDATE',
      entity: 'Announcement',
      entityId: announcement._id,
      description: `Updated announcement: ${announcement.title}`
    });
    
    res.json(announcement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete announcement
const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    
    await Announcement.findByIdAndDelete(req.params.id);
    
    // Log activity
    await logActivity(req, {
      action: 'DELETE',
      entity: 'Announcement',
      entityId: req.params.id,
      description: `Deleted announcement: ${announcement.title}`
    });
    
    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle pin status
const togglePin = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    
    announcement.isPinned = !announcement.isPinned;
    await announcement.save();
    
    res.json(announcement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  togglePin
};
