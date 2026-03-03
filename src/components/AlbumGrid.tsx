import type { GalleryPhoto } from '../services/cloudinaryService';
import { useState } from 'react';
import { X, Download, Loader2 } from 'lucide-react';

interface AlbumGridProps {
    photos: GalleryPhoto[];
}

interface GridLightboxState {
    photo: GalleryPhoto | null;
    isLoading: boolean;
}

export default function AlbumGrid({ photos }: AlbumGridProps) {
    const [lightbox, setLightbox] = useState<GridLightboxState>({ photo: null, isLoading: true });

    const openLightbox = (photo: GalleryPhoto) => {
        setLightbox({ photo, isLoading: true });
    };

    const closeLightbox = () => {
        setLightbox({ photo: null, isLoading: true });
    };

    const handleDownload = async (photo: GalleryPhoto) => {
        try {
            const response = await fetch(photo.originalUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `earth_gallery_${photo.id}.jpg`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch {
            window.open(photo.originalUrl, '_blank');
        }
    };

    if (photos.length === 0) {
        return (
            <div style={{
                width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#93c5fd', fontSize: '1rem'
            }}>
                No memories yet. Be the first to upload!
            </div>
        );
    }

    return (
        <>
            {/* Grid */}
            <div style={{
                width: '100%',
                height: '100%',
                overflowY: 'auto',
                padding: '90px 20px 30px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: '12px',
                alignContent: 'start',
            }}>
                {photos.map((photo) => (
                    <div
                        key={photo.id}
                        onClick={() => openLightbox(photo)}
                        style={{
                            aspectRatio: '1 / 1',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            border: '1px solid rgba(255,255,255,0.08)',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            background: 'rgba(255,255,255,0.03)',
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.04)';
                            (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(59,130,246,0.3)';
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
                            (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                        }}
                    >
                        <img
                            src={photo.thumbnailUrl}
                            alt=""
                            loading="lazy"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                    </div>
                ))}
            </div>

            {/* Lightbox */}
            {lightbox.photo && (
                <div
                    onClick={closeLightbox}
                    style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                        backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(6px)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        zIndex: 500
                    }}
                >
                    <button
                        onClick={closeLightbox}
                        style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
                    >
                        <X size={32} />
                    </button>

                    <div
                        onClick={e => e.stopPropagation()}
                        style={{ position: 'relative', maxWidth: '90%', maxHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        {lightbox.isLoading && (
                            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#3b82f6' }}>
                                <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}><Loader2 size={40} /></span>
                                <p style={{ marginTop: '10px', fontSize: '0.9rem' }}>Loading...</p>
                            </div>
                        )}
                        <img
                            src={lightbox.photo.originalUrl}
                            alt="Full resolution"
                            onLoad={() => setLightbox(prev => ({ ...prev, isLoading: false }))}
                            style={{
                                maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain',
                                borderRadius: '8px', boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
                                opacity: lightbox.isLoading ? 0 : 1, transition: 'opacity 0.3s ease'
                            }}
                        />
                    </div>

                    {!lightbox.isLoading && (
                        <button
                            onClick={() => handleDownload(lightbox.photo!)}
                            className="btn btn-primary"
                            style={{ marginTop: '20px', padding: '12px 24px', fontSize: '1rem' }}
                        >
                            <Download size={18} /> Download Original
                        </button>
                    )}
                </div>
            )}
        </>
    );
}
