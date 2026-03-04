import React, { useState } from 'react';
import { uploadPhotoToCloudinary } from '../services/cloudinaryService';
import { X, UploadCloud, Loader2 } from 'lucide-react';
import type { CloudinaryUploadResponse } from '../services/cloudinaryService';

interface UploadModalProps {
    onClose: () => void;
    onUploadSuccess: (newPhotos: CloudinaryUploadResponse[]) => void;
}

export default function UploadModal({ onClose, onUploadSuccess }: UploadModalProps) {
    const [password, setPassword] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    // Camera State
    const [isCameraActive, setIsCameraActive] = useState(false);
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);

    // Stop camera stream safely
    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    const startCamera = async () => {
        setIsCameraActive(true);
        setCapturedImage(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' } // Prefer rear camera on mobile
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("Could not access camera. Please check permissions.");
            setIsCameraActive(false);
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                setCapturedImage(dataUrl);
            }
        }
    };

    const retakePhoto = () => {
        setCapturedImage(null);
    };

    const acceptCapturedPhoto = async () => {
        if (!capturedImage) return;
        // Convert base64 DataURL back to Blob/File to pass into the existing flow
        const res = await fetch(capturedImage);
        const blob = await res.blob();
        const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });

        setFiles(prev => [...prev, file]);
        stopCamera();
        setIsCameraActive(false);
        setCapturedImage(null);
    };

    // Make sure we stop the camera if the modal closes unexpectedly
    React.useEffect(() => {
        return () => stopCamera();
    }, []);

    const handleAuth = (e: React.FormEvent) => {
        e.preventDefault();
        const correctPassword = import.meta.env.VITE_UPLOAD_PASSWORD || '25122025';
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
        const uploadedResponses: CloudinaryUploadResponse[] = [];

        try {
            for (const file of files) {
                const res = await uploadPhotoToCloudinary(file);
                uploadedResponses.push(res);
                completed++;
                setProgress((completed / files.length) * 100);
            }

            // Pass the new data back to App.tsx for Optimistic Update
            onUploadSuccess(uploadedResponses);
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
                <button onClick={() => { stopCamera(); onClose(); }} style={{
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
                        {/* Camera Flow or File Selection Flow */}
                        {isCameraActive ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
                                <div style={{ position: 'relative', width: '100%', borderRadius: '12px', overflow: 'hidden', background: '#000' }}>
                                    {!capturedImage ? (
                                        <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', display: 'block' }} />
                                    ) : (
                                        <img src={capturedImage} alt="Captured" style={{ width: '100%', display: 'block' }} />
                                    )}
                                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                                </div>

                                {!capturedImage ? (
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button onClick={capturePhoto} className="btn" style={{ background: '#3b82f6', color: '#fff', padding: '10px 20px' }}>
                                            📸 Snap Photo
                                        </button>
                                        <button onClick={() => { stopCamera(); setIsCameraActive(false); }} className="btn" style={{ background: 'rgba(255,255,255,0.1)' }}>
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button onClick={retakePhoto} className="btn" style={{ background: 'rgba(255,255,255,0.1)' }}>
                                            Retake
                                        </button>
                                        <button onClick={acceptCapturedPhoto} className="btn btn-primary" style={{ padding: '10px 20px' }}>
                                            Accept
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div style={{
                                    border: '2px dashed rgba(255,255,255,0.2)', borderRadius: '12px', padding: '20px',
                                    textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s ease', background: 'rgba(255,255,255,0.02)'
                                }} onClick={() => document.getElementById('file-upload')?.click()}>
                                    <UploadCloud size={32} color="#3b82f6" style={{ marginBottom: '10px' }} />
                                    <p style={{ margin: 0, fontWeight: 500, fontSize: '0.9rem' }}>Upload File</p>
                                    <input
                                        id="file-upload"
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                        style={{ display: 'none' }}
                                    />
                                </div>
                                <div style={{
                                    border: '2px solid rgba(59, 130, 246, 0.4)', borderRadius: '12px', padding: '20px',
                                    textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s ease', background: 'rgba(59, 130, 246, 0.1)'
                                }} onClick={startCamera}>
                                    <span style={{ fontSize: '32px', display: 'block', marginBottom: '10px' }}>📸</span>
                                    <p style={{ margin: 0, fontWeight: 500, fontSize: '0.9rem', color: '#93c5fd' }}>Take Photo</p>
                                </div>
                            </div>
                        )}

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
