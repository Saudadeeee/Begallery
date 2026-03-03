import { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import type { GalleryPhoto } from '../services/cloudinaryService';

interface PhotoPointProps {
    photo: GalleryPhoto;
    position: [number, number, number];
    onClick: (photo: GalleryPhoto) => void;
}

export default function PhotoPoint({ photo, position, onClick }: PhotoPointProps) {
    const meshRef = useRef<THREE.Mesh>(null);
    const texture = useLoader(THREE.TextureLoader, photo.thumbnailUrl);

    // Calculate rotation so the image always faces outward from the origin (0,0,0) center of earth
    const rotation = useMemo(() => {
        const mat = new THREE.Matrix4();
        const vecPos = new THREE.Vector3(...position);
        mat.lookAt(vecPos, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0));
        const euler = new THREE.Euler().setFromRotationMatrix(mat);
        return [euler.x, euler.y, euler.z] as [number, number, number];
    }, [position]);

    useFrame(() => {
        if (meshRef.current) {
            // Small hover animation target
            meshRef.current.scale.lerp(new THREE.Vector3(meshRef.current.userData.hovered ? 1.5 : 1, meshRef.current.userData.hovered ? 1.5 : 1, meshRef.current.userData.hovered ? 1.5 : 1), 0.1);
        }
    });

    return (
        <mesh
            ref={meshRef}
            position={position}
            rotation={rotation}
            onClick={(e) => {
                e.stopPropagation();
                onClick(photo);
            }}
            onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'pointer';
                if (meshRef.current) meshRef.current.userData.hovered = true;
            }}
            onPointerOut={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'auto';
                if (meshRef.current) meshRef.current.userData.hovered = false;
            }}
        >
            <planeGeometry args={[0.3, 0.3]} />
            <meshBasicMaterial map={texture} side={THREE.DoubleSide} transparent opacity={0.9} />
        </mesh>
    );
}
