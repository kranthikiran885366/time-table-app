# GitHub Release Guide

This guide will help you create and manage releases for the Timetable Management System on GitHub.

## 🚀 Automated Release Process

### Method 1: Using GitHub Actions Workflow (Recommended)

1. **Go to GitHub Actions**
   - Navigate to your repository on GitHub
   - Click on "Actions" tab
   - Find "Create New Release" workflow

2. **Run Workflow**
   - Click "Run workflow" button
   - Fill in the details:
     - **Version number**: e.g., `1.0.0` (without 'v' prefix)
     - **Release name**: e.g., `Initial Release` or `Feature Update`
     - **Pre-release**: Check if this is a beta/test release
   - Click "Run workflow"

3. **Automatic Build**
   - The workflow will automatically:
     - Create a git tag (e.g., `v1.0.0`)
     - Trigger the release build workflow
     - Build APK files (ARM64, ARMv7, x86_64)
     - Build App Bundle (AAB)
     - Create GitHub release with all files attached

### Method 2: Manual Tag Creation

1. **Create Tag Locally**
   ```bash
   cd "d:\time table app"
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin v1.0.0
   ```

2. **Automated Build Triggers**
   - Once the tag is pushed, GitHub Actions automatically starts
   - Builds are created and attached to the release

## 📦 What Gets Built

For each release, the following files are automatically generated:

| File | Description | Size |
|------|-------------|------|
| `timetable-app-arm64-v8a-vX.X.X.apk` | ARM64 APK (Most devices) | ~25-30 MB |
| `timetable-app-armeabi-v7a-vX.X.X.apk` | ARMv7 APK (Older devices) | ~25-30 MB |
| `timetable-app-x86_64-vX.X.X.apk` | x86_64 APK (Emulators) | ~30-35 MB |
| `timetable-app-vX.X.X.aab` | App Bundle (Play Store) | ~20-25 MB |

## 📝 Version Naming Convention

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR.MINOR.PATCH** (e.g., `1.2.3`)
  - **MAJOR**: Breaking changes
  - **MINOR**: New features (backward compatible)
  - **PATCH**: Bug fixes (backward compatible)

### Examples:
- `v1.0.0` - Initial release
- `v1.1.0` - Added new features
- `v1.1.1` - Bug fixes
- `v2.0.0` - Major update with breaking changes

## ✏️ Release Notes Template

When creating a release, use this template for the description:

```markdown
## 🎉 What's New in vX.X.X

### ✨ New Features
- Feature 1 description
- Feature 2 description

### 🐛 Bug Fixes
- Fixed bug 1
- Fixed bug 2

### 🔧 Improvements
- Improvement 1
- Improvement 2

### 📱 Download

Choose the APK that matches your device:
- **ARM64-v8a**: Most modern Android devices (recommended)
- **ARMv7**: Older 32-bit devices
- **x86_64**: Android emulators

### 👥 Credits
Developed by: Kranthi • Sawdik • Kartheek
Under the guidance of: Uttejkumar

---
**Full Changelog**: https://github.com/kranthikiran885366/time-table-app/compare/vOLD...vNEW
```

## 🔄 Updating an Existing Release

### To Edit Release Notes:
1. Go to [Releases](https://github.com/kranthikiran885366/time-table-app/releases)
2. Click on the release you want to edit
3. Click "Edit release" button
4. Update the description
5. Click "Update release"

### To Add New Files:
1. Edit the release
2. Drag and drop files or click "Attach binaries"
3. Click "Update release"

## 🔍 Verifying Builds

After the automated build completes:

1. **Check Build Status**
   - Go to Actions tab
   - Verify "Release APK and App Bundle" workflow succeeded
   - Check for green checkmark ✅

2. **Verify Release Assets**
   - Go to Releases
   - Ensure all 4 files are attached:
     - 3 APK files
     - 1 AAB file

3. **Test Downloads**
   - Download ARM64 APK
   - Install on test device
   - Verify app functionality

## 🚨 Common Issues

### Build Fails
- **Solution**: Check GitHub Actions logs for errors
- Common fixes:
  - Ensure all dependencies are in `pubspec.yaml`
  - Check for syntax errors in workflow files
  - Verify Flutter version compatibility

### Missing Assets
- **Solution**: Re-run the workflow
- Check that file paths in workflow are correct

### Tag Already Exists
- **Solution**: Delete the tag and recreate
  ```bash
  git tag -d v1.0.0
  git push origin :refs/tags/v1.0.0
  ```

## 📊 Release Checklist

Before creating a release:

- [ ] All tests pass locally
- [ ] Code is committed and pushed
- [ ] Version number is updated in `pubspec.yaml`
- [ ] CHANGELOG.md is updated
- [ ] Release notes are prepared
- [ ] Backend is deployed and stable
- [ ] Test devices are ready for verification

After creating a release:

- [ ] Build completed successfully
- [ ] All 4 files are attached
- [ ] Download links work
- [ ] APK installs and runs correctly
- [ ] Release notes are complete
- [ ] Social media announcement (if applicable)

## 🔗 Quick Links

- [Releases Page](https://github.com/kranthikiran885366/time-table-app/releases)
- [Actions Page](https://github.com/kranthikiran885366/time-table-app/actions)
- [Issues](https://github.com/kranthikiran885366/time-table-app/issues)
- [Pull Requests](https://github.com/kranthikiran885366/time-table-app/pulls)

## 📞 Support

For release-related issues:
- Create an issue on GitHub
- Tag with `release` label
- Provide workflow run URL if build failed
