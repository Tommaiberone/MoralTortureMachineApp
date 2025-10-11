# Quick Start Guide

## 🚀 Getting Started in 3 Steps

### 1. Install Dependencies

From the root directory, run:

```bash
npm run install:all
```

This will install dependencies for both mobile and web versions.

### 2. Choose Your Platform

#### 🌐 Web Version (Recommended for Testing)

```bash
npm run web
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

#### 📱 Mobile Version

```bash
npm run mobile
```

Then:
- Press `i` for iOS simulator (Mac only)
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

### 3. Explore the App

1. **Home Screen**: Choose your mode
2. **Evaluation Mode**: Take the full test (5 dilemmas)
3. **Arcade Mode**: Infinite dilemmas for fun
4. **Results**: View your moral profile

---

## 📦 Individual Platform Commands

### Mobile Commands

```bash
# From root
npm run mobile              # Start Expo dev server
npm run mobile:android      # Run on Android
npm run mobile:ios          # Run on iOS

# Or from mobile directory
cd mobile
npm start
npm run android
npm run ios
```

### Web Commands

```bash
# From root
npm run web                 # Start development server
npm run web:build          # Build for production
npm run web:preview        # Preview production build

# Or from web directory
cd web
npm run dev
npm run build
npm run preview
```

---

## 🔧 Troubleshooting

### Mobile Issues

**"Metro bundler not starting"**
```bash
cd mobile
rm -rf node_modules package-lock.json
npm install
npm start -- --clear
```

**"Expo Go not connecting"**
- Make sure phone and computer are on same WiFi
- Try tunnel connection: `npm start -- --tunnel`

### Web Issues

**"Dependencies not found"**
```bash
cd web
rm -rf node_modules package-lock.json
npm install
```

**"Port 5173 already in use"**
```bash
# Kill the process or use a different port
npm run dev -- --port 3000
```

---

## 📱 Testing on Your Phone

### iOS (Expo Go)
1. Install Expo Go from App Store
2. Run `npm run mobile` from root
3. Scan QR code with Camera app
4. App opens in Expo Go

### Android (Expo Go)
1. Install Expo Go from Play Store
2. Run `npm run mobile` from root
3. Scan QR code with Expo Go app
4. App opens automatically

---

## 🎨 Features to Try

1. **Dark Mode Toggle**: Available in all dilemma screens
2. **Voting Statistics**: See how others voted in Evaluation mode
3. **Results Visualization**: Complete 5 dilemmas to see your radar chart
4. **Responsive Design**: Try resizing browser or rotating device

---

## 📚 Next Steps

- Read [README.md](README.md) for detailed documentation
- Explore the code structure in `mobile/` and `web/`
- Check `shared/` for backend files
- Customize themes and colors
- Add new dilemmas to the database

---

## 💡 Pro Tips

- **Web**: Use Chrome DevTools mobile view for responsive testing
- **Mobile**: Enable Fast Refresh for instant updates
- **Both**: Keep console open to see API calls and data flow

---

## 🆘 Need Help?

- Check the main [README.md](README.md)
- Review error messages in console
- Make sure backend API is accessible
- Verify all dependencies are installed

---

Happy coding! 🎉
