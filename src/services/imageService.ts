import { collection, addDoc, getDocs, orderBy, query } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";

export interface PhotoData {
    id?: string;
    originalUrl: string;
    thumbnailUrl: string;
    createdAt: number;
}

export const uploadPhoto = async (originalFile: File, thumbnailBlob: Blob): Promise<void> => {
    const timestamp = Date.now();
    const safeName = originalFile.name.replace(/[^a-zA-Z0-9.]/g, '_');

    const originalRef = ref(storage, `photos/${timestamp}_original_${safeName}`);
    const thumbnailRef = ref(storage, `thumbnails/${timestamp}_thumbnail.jpg`);

    // Upload both files concurrently to Firebase Storage
    await Promise.all([
        uploadBytes(originalRef, originalFile),
        uploadBytes(thumbnailRef, thumbnailBlob)
    ]);

    // Get download URLs concurrently
    const [originalUrl, thumbnailUrl] = await Promise.all([
        getDownloadURL(originalRef),
        getDownloadURL(thumbnailRef)
    ]);

    // Save metadata to Firestore database
    await addDoc(collection(db, "photos"), {
        originalUrl,
        thumbnailUrl,
        createdAt: timestamp
    });
};

export const fetchPhotos = async (): Promise<PhotoData[]> => {
    try {
        const photosRef = collection(db, "photos");
        const q = query(photosRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as PhotoData[];
    } catch (error) {
        console.error("Error fetching photos. Returning mock data instead.", error);
        // Remove mock data in production, only used if firebase is not configured
        return [];
    }
};
