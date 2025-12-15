const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const validator = require('validator');
const Faculty = require('../models/Faculty');
const { logActivity } = require('../middleware/activityLogger');

// Password validation
const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (!/(?=.*[a-z])/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!/(?=.*[A-Z])/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/(?=.*\d)/.test(password)) {
    return 'Password must contain at least one number';
  }
  return null;
};

// Input sanitization
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>"'&]/g, '');
};

const register = async (req, res) => {
  try {
    const { name, department, email, password, role } = req.body;
    
    // Input validation
    if (!name || !department || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Sanitize inputs
    const sanitizedName = sanitizeInput(name);
    const sanitizedDepartment = sanitizeInput(department);
    const sanitizedEmail = sanitizeInput(email.toLowerCase());
    
    // Validate email
    if (!validator.isEmail(sanitizedEmail)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    
    // Validate password
    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }
    
    // Check if user exists
    const existingUser = await Faculty.findOne({ email: sanitizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new Faculty({
      name: sanitizedName,
      department: sanitizedDepartment,
      email: sanitizedEmail,
      password: hashedPassword,
      role: role === 'admin' ? 'admin' : 'faculty' // Restrict role assignment
    });

    await user.save();
    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    // Log activity
    await logActivity({ user: { id: user._id, name: user.name, role: user.role }, ip: req.ip, headers: req.headers }, {
      action: 'CREATE',
      entity: 'User',
      entityId: user._id,
      description: `User registered: ${user.email}`
    });
    
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Input validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Sanitize email
    const sanitizedEmail = sanitizeInput(email.toLowerCase());
    
    // Validate email format
    if (!validator.isEmail(sanitizedEmail)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    
    // Check for failed login attempts (basic rate limiting)
    const user = await Faculty.findOne({ email: sanitizedEmail });
    if (!user) {
      // Log failed login attempt
      await logActivity({ user: null, ip: req.ip, headers: req.headers }, {
        action: 'LOGIN_FAILED',
        entity: 'User',
        description: `Failed login attempt for email: ${sanitizedEmail}`
      });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Log failed login attempt
      await logActivity({ user: { id: user._id, name: user.name, role: user.role }, ip: req.ip, headers: req.headers }, {
        action: 'LOGIN_FAILED',
        entity: 'User',
        entityId: user._id,
        description: `Failed login attempt: ${user.email}`
      });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    // Log successful login
    await logActivity({ user: { id: user._id, name: user.name, role: user.role }, ip: req.ip, headers: req.headers }, {
      action: 'LOGIN',
      entity: 'User',
      entityId: user._id,
      description: `Successful login: ${user.email}`
    });
    
    res.json({
      token,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        department: user.department 
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Input validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required' });
    }
    
    // Validate new password
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }
    
    const user = await Faculty.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ message: 'New password must be different from current password' });
    }
    
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    
    await logActivity(req, {
      action: 'UPDATE',
      entity: 'User',
      entityId: user._id,
      description: 'Password changed'
    });
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Request password reset
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Input validation
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Sanitize and validate email
    const sanitizedEmail = sanitizeInput(email.toLowerCase());
    if (!validator.isEmail(sanitizedEmail)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    
    const user = await Faculty.findOne({ email: sanitizedEmail });
    if (!user) {
      // Always return success to prevent email enumeration
      return res.json({ message: 'If email exists, password reset link will be sent' });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    
    await user.save();
    
    res.json({ 
      message: 'Password reset link sent to email',
      resetToken // Remove in production
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reset password with token
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    // Input validation
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }
    
    // Validate new password
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }
    
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    const user = await Faculty.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    
    user.password = await bcrypt.hash(newPassword, 12);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    
    await user.save();
    
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  register, 
  login, 
  changePassword, 
  requestPasswordReset, 
  resetPassword 
};