import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import BackgroundStars from './components/BackgroundStars';
import EarthGlobe from './components/EarthGlobe';
import AlbumGrid from './components/AlbumGrid';
import UploadModal from './components/UploadModal';
import Lightbox from './components/Lightbox';
import { fetchCloudinaryImageList } from './services/cloudinaryService';
import type { GalleryPhoto } from './services/cloudinaryService';
import { Loader2, Globe, LayoutGrid } from 'lucide-react';

type ViewMode = 'globe' | 'album';

function App() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<GalleryPhoto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('globe');

  const loadPhotos = async () => {
    setIsLoading(true);
    try {
      const data = await fetchCloudinaryImageList();
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

      {/* ── 3D Globe layer (hidden when in album mode) ── */}
      <div className="canvas-layer" style={{ visibility: viewMode === 'globe' ? 'visible' : 'hidden' }}>
        <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
          <Suspense fallback={null}>
            <EarthGlobe photos={photos} onPhotoClick={(p) => { setLightboxPhoto(p); }} />
            <OrbitControls enableZoom={true} enablePan={false} autoRotate={false} minDistance={4} maxDistance={15} />
          </Suspense>
        </Canvas>
      </div>

      {/* ── Album Grid layer (shown when in album mode) ── */}
      {viewMode === 'album' && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2, overflowY: 'auto' }}>
          <AlbumGrid photos={photos} />
        </div>
      )}

      {/* ── UI layer ── */}
      <div className="ui-layer">
        <header className="glass-panel" style={{ margin: '20px', padding: '15px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'auto' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, background: 'linear-gradient(to right, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            EarthGallery
          </h1>
          <button className="btn btn-primary" onClick={() => setIsUploadOpen(true)}>
            Upload Memories
          </button>
        </header>

        {/* Loading indicator */}
        {isLoading && (
          <div style={{ position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.5)', padding: '10px 20px', borderRadius: '30px', backdropFilter: 'blur(10px)', pointerEvents: 'none' }}>
            <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}><Loader2 size={16} color="#60a5fa" /></span>
            <span style={{ fontSize: '0.9rem', color: '#f1f5f9' }}>Synchronizing Universe...</span>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && photos.length === 0 && (
          <div style={{ position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59,130,246,0.4)', padding: '12px 24px', borderRadius: '30px', backdropFilter: 'blur(10px)', pointerEvents: 'none' }}>
            <p style={{ margin: 0, color: '#93c5fd', fontSize: '0.95rem' }}>The globe is empty. Be the first to upload a memory!</p>
          </div>
        )}

        {/* ── View Toggle Button (bottom-right corner) ── */}
        <button
          onClick={() => setViewMode(v => v === 'globe' ? 'album' : 'globe')}
          title={viewMode === 'globe' ? 'Switch to Album view' : 'Switch to Globe view'}
          style={{
            position: 'absolute',
            bottom: '28px',
            right: '28px',
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.18)',
            background: 'rgba(15,23,42,0.75)',
            backdropFilter: 'blur(12px)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            transition: 'all 0.3s ease',
            pointerEvents: 'auto',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.55)';
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.12)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(15,23,42,0.75)';
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          }}
        >
          {viewMode === 'globe'
            ? <LayoutGrid size={22} />   /* currently globe → show album icon */
            : <Globe size={22} />         /* currently album → show globe icon */
          }
        </button>

        <main style={{ padding: '20px', textAlign: 'center', marginTop: 'auto', marginBottom: 'auto', pointerEvents: 'none' }} />
      </div>

      {isUploadOpen && (
        <UploadModal
          onClose={() => setIsUploadOpen(false)}
          onUploadSuccess={loadPhotos}
        />
      )}

      {/* Globe lightbox (only in globe mode) */}
      {lightboxPhoto && viewMode === 'globe' && (
        <Lightbox
          photo={lightboxPhoto}
          onClose={() => setLightboxPhoto(null)}
        />
      )}
    </div>
  );
}

export default App;
