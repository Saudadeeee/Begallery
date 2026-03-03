import { X, Download, Loader2 } from 'lucide-react';
import type { GalleryPhoto } from '../services/cloudinaryService';
import { useState } from 'react';

interface LightboxProps {
    photo: GalleryPhoto | null;
    onClose: () => void;
}

export default function Lightbox({ photo, onClose }: LightboxProps) {
    const [isLoading, setIsLoading] = useState(true);

    if (!photo) return null;

    const handleDownload = async () => {
        try {
            // Force download rather than just open in new tab
            const response = await fetch(photo.originalUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `earth_gallery_${photo.createdAt}.jpg`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Download failed", error);
            // Fallback
            window.open(photo.originalUrl, '_blank');
        }
    };

    return (
        <div className="lightbox-overlay" style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            zIndex: 200
        }}>
            <button onClick={onClose} style={{
                position: 'absolute', top: '20px', right: '20px', background: 'transparent',
                border: 'none', color: '#fff', cursor: 'pointer', padding: '10px'
            }}>
                <X size={32} />
            </button>

            <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isLoading && (
                    <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#3b82f6' }}>
                        <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>
                            <Loader2 size={48} />
                        </span>
                        <p style={{ marginTop: '10px' }}>Loading high-res image...</p>
                    </div>
                )}
                <img
                    src={photo.originalUrl}
                    alt="Full resolution"
                    onLoad={() => setIsLoading(false)}
                    style={{
                        maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain',
                        borderRadius: '8px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                        opacity: isLoading ? 0 : 1, transition: 'opacity 0.3s ease'
                    }}
                />
            </div>

            {!isLoading && (
                <button onClick={handleDownload} className="btn btn-primary" style={{ marginTop: '20px', padding: '12px 24px', fontSize: '1.1rem' }}>
                    <Download size={20} /> Download Original
                </button>
            )}
        </div>
    );
}
