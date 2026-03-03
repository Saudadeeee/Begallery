import React, { useState } from 'react';
import { uploadPhotoToCloudinary } from '../services/cloudinaryService';
import { X, UploadCloud, Loader2 } from 'lucide-react';

interface UploadModalProps {
    onClose: () => void;
    onUploadSuccess: () => void;
}

export default function UploadModal({ onClose, onUploadSuccess }: UploadModalProps) {
    const [password, setPassword] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleAuth = (e: React.FormEvent) => {
        e.preventDefault();
        const correctPassword = import.meta.env.VITE_UPLOAD_PASSWORD || 'earth';
        if (password === correctPassword) {
            setIsAuthenticated(true);
        } else {
            alert('Incorrect password!');
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const handleUpload = async () => {
        if (files.length === 0) return;
        setIsUploading(true);
        let completed = 0;

        try {
            for (const file of files) {
                // Task 1 execution: Upload original file directly to Cloudinary (unsigned, no client-side compression)
                await uploadPhotoToCloudinary(file);
                completed++;
                setProgress((completed / files.length) * 100);
            }

            onUploadSuccess(); // Inform parent to refetch or display success

            // We don't close immediately here because Cloudinary lists take 1-2 mins to update.
            // Inform the user about the caching delay.
            alert('Upload successful! Note: It may take 1-2 minutes for new images to appear on the globe due to Cloudinary caching. Please refresh the page later to see them.');
            onClose();
        } catch (error) {
            console.error(error);
            alert('Upload failed. Check console and Cloudinary config.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="upload-modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
            backgroundColor: 'rgba(5, 5, 16, 0.8)', backdropFilter: 'blur(10px)'
        }}>
            <div className="upload-modal-content glass-panel" style={{
                background: 'rgba(15, 23, 42, 0.8)', padding: '30px', borderRadius: '20px', width: '90%', maxWidth: '400px',
                position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)'
            }}>
                <button onClick={onClose} style={{
                    position: 'absolute', top: '15px', right: '15px', background: 'transparent',
                    border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.7
                }}>
                    <X size={24} />
                </button>

                <h2 style={{ marginBottom: '20px', textAlign: 'center', color: '#f1f5f9' }}>Upload Station</h2>

                {!isAuthenticated ? (
                    <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <p style={{ textAlign: 'center', opacity: 0.8 }}>Please enter the access code to upload memories.</p>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Access Code"
                            style={{
                                padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)',
                                background: 'rgba(0,0,0,0.3)', color: 'white', outline: 'none', fontSize: '1rem'
                            }}
                        />
                        <button type="submit" className="btn btn-primary" style={{ padding: '12px', fontSize: '1rem', marginTop: '10px' }}>
                            Authenticate
                        </button>
                    </form>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{
                            border: '2px dashed rgba(255,255,255,0.2)', borderRadius: '12px', padding: '40px 20px',
                            textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s ease', background: 'rgba(255,255,255,0.02)'
                        }} onClick={() => document.getElementById('file-upload')?.click()}>
                            <UploadCloud size={48} color="#3b82f6" style={{ marginBottom: '10px' }} />
                            <p style={{ margin: 0, fontWeight: 500 }}>Click to select or drag & drop</p>
                            <p style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '8px' }}>Supports JPG, PNG (Original quality)</p>
                            <input
                                id="file-upload"
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleFileSelect}
                                style={{ display: 'none' }}
                            />
                        </div>

                        {files.length > 0 && (
                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '10px' }}>
                                <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>{files.length} file(s) selected.</p>
                                {isUploading ? (
                                    <div style={{ marginTop: '15px' }}>
                                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ width: `${progress}%`, height: '100%', background: '#3b82f6', transition: 'width 0.3s ease' }} />
                                        </div>
                                        <p style={{ fontSize: '0.9rem', textAlign: 'center', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', margin: '10px 0 0' }}>
                                            <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}><Loader2 size={16} /></span>
                                            Uploading original images... {Math.round(progress)}%
                                        </p>
                                    </div>
                                ) : (
                                    <button onClick={handleUpload} className="btn btn-primary" style={{ width: '100%', marginTop: '15px', padding: '12px' }}>
                                        Start Upload to Cloudinary
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
