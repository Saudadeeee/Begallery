import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Stars } from '@react-three/drei';
import * as THREE from 'three';
import type { PhotoData } from '../services/imageService';
import PhotoPoint from './PhotoPoint';

interface EarthGlobeProps {
    photos: PhotoData[];
    onPhotoClick: (photo: PhotoData) => void;
}

// Function to generate pseudo-random points on a sphere
const generatePointsOnSphere = (count: number, radius: number) => {
    const points: [number, number, number][] = [];
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle

    for (let i = 0; i < count; i++) {
        const y = 1 - (i / (count - 1)) * 2; // y goes from 1 to -1
        const r = Math.sqrt(1 - y * y); // radius at y
        const theta = phi * i; // golden angle increment

        const x = Math.cos(theta) * r;
        const z = Math.sin(theta) * r;

        // Multiply by radius slightly larger than the Earth sphere (3.05 vs 3)
        points.push([x * radius, y * radius, z * radius]);
    }
    return points;
};

export default function EarthGlobe({ photos, onPhotoClick }: EarthGlobeProps) {
    const earthRef = useRef<THREE.Group>(null);

    useFrame(() => {
        if (earthRef.current) {
            earthRef.current.rotation.y += 0.0005; // Gentle rotation
        }
    });

    const photoPositions = useMemo(() => {
        return generatePointsOnSphere(photos.length, 3.01); // 3.01 so they sit slightly above the surface
    }, [photos.length]);

    return (
        <group ref={earthRef}>
            {/* 3D field of stars in the background */}
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

            {/* Lights */}
            <ambientLight intensity={0.2} />
            <directionalLight position={[10, 5, 10]} intensity={2} color="#ffffff" />
            <pointLight position={[-10, -5, -10]} intensity={1} color="#3b82f6" />

            {/* The Core Earth Sphere */}
            <Sphere args={[3, 64, 64]} position={[0, 0, 0]}>
                <meshStandardMaterial
                    color="#0f172a"
                    emissive="#1e293b"
                    emissiveIntensity={0.5}
                    wireframe={true}
                    transparent
                    opacity={0.4}
                />
            </Sphere>

            {/* Map Photos onto the globe */}
            {photos.map((photo, i) => (
                <PhotoPoint
                    key={photo.id || i}
                    photo={photo}
                    position={photoPositions[i]}
                    onClick={onPhotoClick}
                />
            ))}
        </group>
    );
}
