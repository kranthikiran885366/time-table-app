const ActivityLog = require('../models/ActivityLog');

// Middleware to log activities
const logActivity = async (req, data) => {
  try {
    if (!req.user) return;
    
    const log = new ActivityLog({
      userId: req.user.id,
      userName: req.user.name || 'Unknown',
      userRole: req.user.role || 'unknown',
      action: data.action,
      entity: data.entity,
      entityId: data.entityId || null,
      description: data.description,
      changes: data.changes || {},
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'] || '',
      device: parseDevice(req.headers['user-agent']),
      browser: parseBrowser(req.headers['user-agent']),
      status: data.status || 'success',
      errorMessage: data.errorMessage || null
    });
    
    await log.save();
  } catch (error) {
    console.error('Activity logging error:', error);
    // Don't throw error to prevent disrupting main operation
  }
};

// Express middleware wrapper
const activityLogger = (action, entity) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function (data) {
      // Log after successful operation
      if (res.statusCode >= 200 && res.statusCode < 300) {
        logActivity(req, {
          action,
          entity,
          description: `${action} ${entity}`,
          status: 'success'
        }).catch(console.error);
      }
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

// Helper functions
const parseDevice = (userAgent) => {
  if (!userAgent) return 'Unknown';
  
  if (/mobile/i.test(userAgent)) return 'Mobile';
  if (/tablet/i.test(userAgent)) return 'Tablet';
  if (/android/i.test(userAgent)) return 'Android';
  if (/iphone|ipad/i.test(userAgent)) return 'iOS';
  return 'Desktop';
};

const parseBrowser = (userAgent) => {
  if (!userAgent) return 'Unknown';
  
  if (/chrome/i.test(userAgent)) return 'Chrome';
  if (/firefox/i.test(userAgent)) return 'Firefox';
  if (/safari/i.test(userAgent)) return 'Safari';
  if (/edge/i.test(userAgent)) return 'Edge';
  if (/opera/i.test(userAgent)) return 'Opera';
  return 'Unknown';
};

// Get activity logs with filters
const getActivityLogs = async (req, res) => {
  try {
    const { 
      userId, 
      action, 
      entity, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 50 
    } = req.query;
    
    const filter = {};
    if (userId) filter.userId = userId;
    if (action) filter.action = action;
    if (entity) filter.entity = entity;
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    const logs = await ActivityLog.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await ActivityLog.countDocuments(filter);
    
    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user activity summary
const getUserActivitySummary = async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 7 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const logs = await ActivityLog.find({
      userId,
      createdAt: { $gte: startDate }
    });
    
    const summary = {
      totalActions: logs.length,
      actionBreakdown: {},
      entityBreakdown: {},
      recentActions: logs.slice(0, 10)
    };
    
    logs.forEach(log => {
      summary.actionBreakdown[log.action] = (summary.actionBreakdown[log.action] || 0) + 1;
      summary.entityBreakdown[log.entity] = (summary.entityBreakdown[log.entity] || 0) + 1;
    });
    
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Export logs
const exportActivityLogs = async (req, res) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;
    
    const filter = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    const logs = await ActivityLog.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(10000); // Limit for safety
    
    if (format === 'json') {
      res.json(logs);
    } else if (format === 'csv') {
      // Simple CSV conversion
      const csv = [
        'Timestamp,User,Role,Action,Entity,Description,IP,Device,Browser',
        ...logs.map(log => 
          `${log.createdAt},${log.userName},${log.userRole},${log.action},${log.entity},"${log.description}",${log.ipAddress},${log.device},${log.browser}`
        )
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=activity-logs.csv');
      res.send(csv);
    } else {
      res.status(400).json({ message: 'Unsupported format' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  logActivity,
  activityLogger,
  getActivityLogs,
  getUserActivitySummary,
  exportActivityLogs
};
