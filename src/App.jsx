import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import { LoadingScreen } from './components/LoadingScreen';
import { Camera } from './components/Camera';
import { Gallery } from './components/Gallery';
import { PhotoBook } from './components/PhotoBook';

function AppContent() {
  const { user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState('camera'); // 'camera' | 'gallery' | 'photobook'

  // Show loading screen on first load
  if (isLoading) {
    return <LoadingScreen onComplete={() => setIsLoading(false)} />;
  }

  // Show auth loading
  if (loading) {
    return (
      <div className="w-full h-full bg-night-base flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-night-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show auth screen if not logged in
  if (!user) {
    return <Auth />;
  }

  // Main app views
  return (
    <div className="w-full h-full">
      {currentView === 'camera' && (
        <Camera
          onViewGallery={() => setCurrentView('gallery')}
          onViewPhotoBook={() => setCurrentView('photobook')}
        />
      )}
      {currentView === 'gallery' && (
        <Gallery onClose={() => setCurrentView('camera')} />
      )}
      {currentView === 'photobook' && (
        <PhotoBook onClose={() => setCurrentView('camera')} />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
