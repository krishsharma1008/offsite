# 📷 Zapcom Offsite - Vintage Disposable Camera

A stunning vintage disposable camera web app for your event! Guests can capture memories with an authentic old-school camera experience.

## ✨ Features

### 🎬 Vintage Camera Experience
- **10 Photos Per Roll** - Each guest gets exactly 10 exposures, just like a real disposable camera
- **Mechanical Photo Counter** - Animated flip-style counter that shows remaining shots
- **Authentic Sound Effects** - All generated in real-time using Web Audio API:
  - Shutter click sound
  - Film advance/winding mechanism
  - Flash charge (capacitor whine)
  - Flash fire pop
  - Counter click
  - End-of-roll notification
  - Gallery slide advance

### 📸 Photo Capture
- **Live Viewfinder** - Real-time camera preview with vintage grain overlay
- **Flash Animation** - Realistic flash effect with charging delay
- **Vintage Photo Effects** - Automatic warm tones, grain, and vignette applied to each photo
- **Haptic Feedback** - Phone vibration on shutter press (mobile devices)

### 🎨 Gallery Slideshow
- **Polaroid-Style Display** - Photos shown in vintage polaroid frames
- **Swipe Gestures** - Swipe left/right to navigate through photos
- **Automatic Slideshow** - Optional auto-play mode with smooth transitions
- **Ken Burns Effect** - Subtle zoom animation on photos
- **Thumbnail Navigation** - Quick access to any photo
- **Light Leak Effects** - Random vintage light leaks on some photos

### 📱 Mobile-First Design
- **Optimized for Mobile** - Touch gestures, haptic feedback, full-screen mode
- **No Pull-to-Refresh** - Prevents accidental page refresh
- **Camera Permissions** - Uses back camera by default on mobile
- **PWA Ready** - Can be installed as a standalone app

## 🚀 Getting Started

### Development
```bash
npm install
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) to see the app!

### Production Build
```bash
npm run build
npm run preview
```

## 🎯 How to Use

1. **Load Film** - Click "LOAD FILM" to grant camera permissions
2. **Take Photos** - Press the large orange shutter button to capture photos
   - Wait for flash to charge between shots
   - Watch the counter decrease with each photo
3. **View Gallery** - Click the gallery button (bottom left) to see your photos
4. **Navigate Photos** - Swipe or use arrow buttons to browse
5. **Slideshow Mode** - Click PLAY for automatic slideshow
6. **New Roll** - Click "NEW ROLL" to delete all photos and start fresh

## 🎨 Theme & Styling

### Color Palette
- **Vintage Cream** - `#F5E6D3`
- **Vintage Brown** - `#8B4513`
- **Vintage Orange** - `#D2691E`
- **Vintage Yellow** - `#DAA520`
- **Vintage Red** - `#CD5C5C`
- **Vintage Dark** - `#2C1810`

### Typography
- **Font**: Courier New (monospace) for that classic camera aesthetic

### Effects
- Film grain overlay
- Vignette on photos
- Vintage shadow effects
- Light leak effects (random)

## 🛠 Technology Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations and transitions
- **Web Audio API** - Real-time sound generation
- **MediaDevices API** - Camera access
- **LocalStorage** - Photo persistence

## 📦 Project Structure

```
/src
  /components
    - Camera.jsx          # Main camera interface
    - PhotoCounter.jsx    # Mechanical counter display
    - Gallery.jsx         # Photo slideshow viewer
    - LoadingScreen.jsx   # Vintage loading animation
  /hooks
    - useCamera.js        # Camera API management
  /utils
    - sounds.js           # Web Audio sound generator
    - storage.js          # Photo storage utilities
  /styles
    - index.css           # Global styles + Tailwind
```

## 🎵 Sound Design

All sounds are generated synthetically using the Web Audio API - no audio files needed! Each sound is crafted to mimic the mechanical sounds of vintage disposable cameras:

- **Shutter Click** - Layered oscillators for realistic mechanical snap
- **Film Advance** - Ratchet mechanism sound with multiple clicks
- **Flash Charge** - Frequency sweep mimicking capacitor charging
- **Flash Fire** - Bright noise burst with high-pass filter
- **Counter** - Quick mechanical click
- **End of Roll** - Double-click mechanical stop

## 📸 Photo Features

- **Storage**: Photos stored in browser localStorage
- **Limit**: Maximum 10 photos per session
- **Format**: JPEG with 85% quality
- **Effects**: Warm vintage tone, grain, vignette
- **Resolution**: Matches device camera (up to 1920x1080)

## 🎭 User Experience

- **Loading Animation** - Vintage camera logo with film winding
- **Permission Screen** - Branded camera permission request
- **Counter Warnings** - Red alert when 3 or fewer shots remain
- **Film Empty State** - Clear indication when all photos are used
- **Flash Ready Indicator** - Visual feedback during flash recharge
- **Responsive Feedback** - Haptic vibration on all interactions

## 🌐 Browser Compatibility

Works on all modern browsers that support:
- MediaDevices API (camera access)
- Web Audio API (sound generation)
- LocalStorage (photo persistence)
- CSS Grid & Flexbox

Tested on:
- iOS Safari (mobile)
- Chrome Android (mobile)
- Desktop Chrome, Firefox, Safari, Edge

## 📝 Notes

- Photos are stored locally in the browser - clearing browser data will delete them
- Camera requires HTTPS in production (except localhost)
- First sound interaction may require user gesture (browser policy)
- Haptic feedback only works on supported mobile devices

## 🎉 Perfect For

- Office parties and events
- Weddings and celebrations
- Team offsites
- Meetups and gatherings
- Any event where you want guests to capture authentic, spontaneous moments!

---

**Built with ❤️ for Zapcom Offsite**

*Bringing back the joy of disposable cameras in the digital age!*
# offsite
