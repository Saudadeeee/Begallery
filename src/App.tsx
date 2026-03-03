import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import BackgroundStars from './components/BackgroundStars';
import EarthGlobe from './components/EarthGlobe';
import UploadModal from './components/UploadModal';
import Lightbox from './components/Lightbox';
import { fetchPhotos } from './services/imageService';
import type { PhotoData } from './services/imageService';
import { Loader2 } from 'lucide-react';

function App() {
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<PhotoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadPhotos = async () => {
    setIsLoading(true);
    try {
      const data = await fetchPhotos();
      setPhotos(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPhotos();
  }, []);

  return (
    <div className="app-container">
      <BackgroundStars />

      <div className="canvas-layer">
        <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
          <Suspense fallback={null}>
            <EarthGlobe photos={photos} onPhotoClick={setLightboxPhoto} />
            <OrbitControls enableZoom={true} enablePan={false} autoRotate={false} minDistance={4} maxDistance={15} />
          </Suspense>
        </Canvas>
      </div>

      <div className="ui-layer">
        <header className="glass-panel" style={{ margin: '20px', padding: '15px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'auto' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, background: 'linear-gradient(to right, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            EarthGallery
          </h1>
          <button className="btn btn-primary" onClick={() => setIsUploadOpen(true)}>
            Upload Memories
          </button>
        </header>

        {/* Loading Indicator */}
        {isLoading && (
          <div style={{ position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.5)', padding: '10px 20px', borderRadius: '30px', backdropFilter: 'blur(10px)', pointerEvents: 'none' }}>
            <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}><Loader2 size={16} color="#60a5fa" /></span>
            <span style={{ fontSize: '0.9rem', color: '#f1f5f9' }}>Synchronizing Universe...</span>
          </div>
        )}

        {/* Empty state helper if no photos */}
        {!isLoading && photos.length === 0 && (
          <div style={{ position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59,130,246,0.4)', padding: '12px 24px', borderRadius: '30px', backdropFilter: 'blur(10px)', pointerEvents: 'none' }}>
            <p style={{ margin: 0, color: '#93c5fd', fontSize: '0.95rem' }}>The globe is empty. Be the first to upload a memory!</p>
          </div>
        )}

        <main style={{ padding: '20px', textAlign: 'center', marginTop: 'auto', marginBottom: 'auto', pointerEvents: 'none' }}>
        </main>
      </div>

      {isUploadOpen && (
        <UploadModal
          onClose={() => setIsUploadOpen(false)}
          onUploadSuccess={loadPhotos}
        />
      )}

      {lightboxPhoto && (
        <Lightbox
          photo={lightboxPhoto}
          onClose={() => setLightboxPhoto(null)}
        />
      )}
    </div>
  )
}

export default App;
