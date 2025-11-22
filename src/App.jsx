import { useState } from 'react';
import { LoadingScreen } from './components/LoadingScreen';
import { Camera } from './components/Camera';
import { Gallery } from './components/Gallery';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [showGallery, setShowGallery] = useState(false);

  return (
    <div className="w-full h-full">
      {isLoading ? (
        <LoadingScreen onComplete={() => setIsLoading(false)} />
      ) : showGallery ? (
        <Gallery onClose={() => setShowGallery(false)} />
      ) : (
        <Camera
          onPhotoTaken={(count) => {
            // Optional: Do something when photo is taken
            console.log(`Photo taken! Total: ${count}`);
          }}
          onViewGallery={() => setShowGallery(true)}
        />
      )}
    </div>
  );
}

export default App;
