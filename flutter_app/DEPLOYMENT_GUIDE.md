# Flutter App Deployment Guide

## Web Deployment Options

### Option 1: Netlify (Recommended)
1. Build the web app: `flutter build web --release`
2. Upload the `build/web` folder to Netlify
3. Or connect your GitHub repo and use the `netlify.toml` config

### Option 2: Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel --prod`
3. Follow the prompts

### Option 3: Firebase Hosting
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init hosting`
4. Build: `flutter build web --release`
5. Deploy: `firebase deploy`

### Option 4: GitHub Pages
1. Build: `flutter build web --release --base-href "/your-repo-name/"`
2. Copy `build/web` contents to `docs` folder
3. Enable GitHub Pages in repository settings

## Mobile App Deployment

### Android APK
1. Run: `flutter build apk --release`
2. APK will be in `build/app/outputs/flutter-apk/app-release.apk`

### Android App Bundle (for Play Store)
1. Run: `flutter build appbundle --release`
2. Bundle will be in `build/app/outputs/bundle/release/app-release.aab`

### iOS (requires macOS)
1. Run: `flutter build ios --release`
2. Open `ios/Runner.xcworkspace` in Xcode
3. Archive and upload to App Store Connect

## Environment Configuration

The app is already configured to use your deployed backend:
- Backend URL: `https://time-table-app-exrd.onrender.com/api`
- MongoDB: Cloud Atlas database

## Quick Deploy Commands

```bash
# Build web version
flutter build web --release

# Build Android APK
flutter build apk --release

# Build for all platforms
flutter build web --release && flutter build apk --release
```

## Hosting Services

### Free Options:
- **Netlify**: Best for web deployment
- **Vercel**: Good for web with GitHub integration
- **Firebase Hosting**: Google's hosting service
- **GitHub Pages**: Simple static hosting

### Paid Options:
- **AWS S3 + CloudFront**: Scalable hosting
- **Google Cloud Storage**: Enterprise hosting
- **Azure Static Web Apps**: Microsoft's hosting

## Notes
- Web app works on all modern browsers
- Mobile app requires Android 5.0+ or iOS 11.0+
- All API calls are configured for production backend
- HTTPS is required for production deployment