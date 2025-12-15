# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of the Timetable Management System seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please Do NOT:
- Open a public GitHub issue for security vulnerabilities
- Post details about the vulnerability in public forums or social media

### Please DO:
**Report security vulnerabilities to: [your-security-email@example.com]**

Include the following information:
- Type of vulnerability
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the vulnerability, including how an attacker might exploit it

### What to Expect:
- **Response Time**: We will acknowledge your email within 48 hours
- **Investigation**: We will investigate the issue and determine its severity
- **Updates**: We will keep you informed about the progress of the fix
- **Credit**: We will publicly acknowledge your responsible disclosure (if you wish)
- **Fix Timeline**: Critical vulnerabilities will be fixed within 7 days, others within 30 days

## Security Best Practices

### For Developers

1. **Environment Variables**
   - Never commit `.env` files to version control
   - Use strong, unique JWT secrets
   - Rotate secrets regularly

2. **Authentication**
   - Use strong password hashing (bcryptjs with salt rounds ≥ 10)
   - Implement rate limiting on authentication endpoints
   - Use secure JWT token expiration times
   - Never store passwords in plain text

3. **Database**
   - Use parameterized queries (Mongoose handles this)
   - Validate and sanitize all user inputs
   - Implement proper error handling without exposing sensitive data

4. **File Uploads**
   - Validate file types and sizes
   - Scan uploaded files for malware
   - Store uploaded files outside the web root
   - Use unique file names to prevent overwrites

5. **API Security**
   - Use HTTPS in production
   - Implement rate limiting
   - Validate all input parameters
   - Use CORS properly
   - Keep dependencies up to date

### For Administrators

1. **Server Configuration**
   ```bash
   # Update system packages regularly
   sudo apt update && sudo apt upgrade
   
   # Use a firewall
   sudo ufw enable
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   ```

2. **MongoDB Security**
   ```bash
   # Enable authentication
   # Create admin user
   # Use SSL/TLS connections
   # Regular backups
   ```

3. **Node.js Security**
   ```bash
   # Check for vulnerabilities
   npm audit
   
   # Fix vulnerabilities automatically
   npm audit fix
   
   # Update dependencies
   npm update
   ```

4. **Environment Setup**
   ```env
   # Strong JWT secret (minimum 32 characters)
   JWT_SECRET=your_very_long_and_random_secret_key_here_minimum_32_chars
   
   # Production MongoDB URI with authentication
   MONGODB_URI=mongodb://username:password@host:port/database?authSource=admin
   
   # Set NODE_ENV to production
   NODE_ENV=production
   ```

## Known Security Considerations

### Current Implementation

1. **JWT Tokens**
   - Tokens are stored in localStorage (consider httpOnly cookies for better security)
   - Token expiration is set to 30 days (consider shorter duration for sensitive operations)

2. **File Upload**
   - Maximum file size: 5MB
   - Allowed file types: .xlsx only
   - Files are processed in memory (consider temporary storage for large files)

3. **Rate Limiting**
   - Not currently implemented (recommended for production)

4. **CORS**
   - Currently allows all origins in development
   - Must be configured for specific domains in production

### Recommended Improvements

1. **Add Rate Limiting**
   ```bash
   npm install express-rate-limit
   ```

2. **Add Helmet for Security Headers**
   ```bash
   npm install helmet
   ```

3. **Add Input Validation**
   ```bash
   npm install express-validator
   ```

4. **Add HTTPS in Production**
   - Use Let's Encrypt for free SSL certificates
   - Force HTTPS redirects

5. **Implement CSRF Protection**
   ```bash
   npm install csurf
   ```

## Security Checklist for Production

- [ ] Change all default credentials
- [ ] Use strong, unique JWT secret
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS for specific domains
- [ ] Implement rate limiting
- [ ] Add security headers (Helmet)
- [ ] Enable MongoDB authentication
- [ ] Set up regular backups
- [ ] Implement logging and monitoring
- [ ] Use environment variables for sensitive data
- [ ] Keep all dependencies up to date
- [ ] Implement input validation
- [ ] Add CSRF protection
- [ ] Configure firewall rules
- [ ] Set up intrusion detection
- [ ] Regular security audits

## Compliance

This application handles educational data. Ensure compliance with:
- FERPA (Family Educational Rights and Privacy Act) - US
- GDPR (General Data Protection Regulation) - EU
- Local data protection regulations

## Updates and Patching

- Security patches are released as soon as possible
- Subscribe to GitHub notifications for security updates
- Run `npm audit` regularly to check for vulnerabilities
- Update dependencies monthly (or when security patches are available)

## Contact

For security concerns, contact:
- **Security Email**: [your-security-email@example.com]
- **Project Maintainer**: [maintainer-email@example.com]

---

**Last Updated**: December 14, 2025
