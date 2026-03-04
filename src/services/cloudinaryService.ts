// ─── Cloudinary Configuration ────────────────────────────────────────────────
const CLOUD_NAME = 'djjwfq7my';
const UPLOAD_PRESET = 'Begallery';
const GALLERY_TAG = 'Begallery';    // Tag used to filter the JSON list endpoint
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Task 3: URL Transformation Logic (Optimization for Three.js)
 * 
 * Takes a public_id and version and returns URLs for the original image and a lightweight thumbnail.
 * 
 * @param publicId - The Cloudinary public_id of the uploaded resource.
 * @param version - The version number to bust CDN cache (optional but recommended).
 * @param format - The file format extension (e.g., 'jpg', 'png').
 * @returns An object containing the originalURL and the thumbnailURL.
 */
export const getCloudinaryUrls = (publicId: string, version: number, format: string) => {
    const versionStr = version ? `v${version}/` : '';

    // Original URL: full resolution, used for Lightbox and Download button.
    const originalUrl = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${versionStr}${publicId}.${format}`;

    // Thumbnail URL: 200×200 fill crop — lightweight texture for the 3D globe.
    // w_200,h_200,c_fill keeps the tile square and consistent on the sphere surface.
    const thumbnailUrl = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_200,h_200,c_fill/${versionStr}${publicId}.${format}`;

    return { originalUrl, thumbnailUrl };
};

/**
 * Interface representing the structure of a Cloudinary resource object
 * returned by the JSON list API.
 */
export interface CloudinaryResource {
    public_id: string;
    version: number;
    format: string;
    width: number;
    height: number;
    type: string;
    created_at: string;
}

/**
 * Interface representing the overall response from the JSON list API.
 */
interface CloudinaryListResponse {
    resources: CloudinaryResource[];
    updated_at: string;
}

/**
 * Unified application format representing a photo with URLs suitable for rendering.
 */
export interface GalleryPhoto {
    id: string;
    originalUrl: string;
    thumbnailUrl: string;
    createdAt: number;
}

/**
 * Task 2: Fetch Image List (Database Replacement)
 * 
 * Fetches all uploaded images by requesting the tagged resource JSON list.
 * Note: This JSON list is cached by Cloudinary's CDN and may take 1-2 minutes to update.
 * We fetch it once on page load as requested.
 * 
 * Endpoint: https://res.cloudinary.com/{cloud_name}/image/list/globe_gallery.json
 * Method: GET
 * 
 * @returns A promise resolving to an array of mapped GalleryPhoto objects.
 */
export const fetchCloudinaryImageList = async (): Promise<GalleryPhoto[]> => {
    try {
        const listUrl = `https://res.cloudinary.com/${CLOUD_NAME}/image/list/${GALLERY_TAG}.json`;

        // Add a cache-busting query parameter to encourage fetching the freshest possible JSON, 
        // although the CDN edge cache might still serve a slightly stale list (1-2 min TTL).
        const cacheBuster = `?t=${Date.now()}`;

        const response = await fetch(`${listUrl}${cacheBuster}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            // Cloudinary returns a 404 if the tag doesn't exist yet (no images uploaded with that tag)
            if (response.status === 404) {
                console.log("No images found with tag:", GALLERY_TAG);
                return [];
            }
            throw new Error(`Failed to fetch Cloudinary list. Status: ${response.status}`);
        }

        const data: CloudinaryListResponse = await response.json();

        // Map the Cloudinary resources to our application's unified GalleryPhoto format
        const photos: GalleryPhoto[] = data.resources.map((res) => {
            const urls = getCloudinaryUrls(res.public_id, res.version, res.format);
            return {
                id: res.public_id, // Use public_id as the unique key
                originalUrl: urls.originalUrl,
                thumbnailUrl: urls.thumbnailUrl,
                createdAt: new Date(res.created_at).getTime()
            };
        });

        // Optionally sort by created_at descending if not already sorted by Cloudinary
        return photos.sort((a, b) => b.createdAt - a.createdAt);

    } catch (error) {
        console.error("Error fetching images from Cloudinary:", error);
        return [];
    }
};

/**
 * Interface representing the response after a successful Cloudinary unsigned upload.
 */
export interface CloudinaryUploadResponse {
    asset_id: string;
    public_id: string;
    version: number;
    version_id: string;
    signature: string;
    width: number;
    height: number;
    format: string;
    resource_type: string;
    created_at: string;
    tags: string[];
    bytes: number;
    type: string;
    etag: string;
    placeholder: false,
    url: string;
    secure_url: string;
    folder: string;
}

/**
 * Task 1: Unsigned Upload Logic
 * 
 * Uploads a raw image file directly to Cloudinary using the fetch API via an unsigned upload preset.
 * Does NOT compress the image on the client side; uploads the original file.
 * 
 * Endpoint: https://api.cloudinary.com/v1_1/{cloud_name}/image/upload
 * Method: POST
 * 
 * @param file - The raw File object obtained from an input[type="file"].
 * @returns A promise resolving to the Cloudinary upload response metadata.
 */
export const uploadPhotoToCloudinary = async (file: File): Promise<CloudinaryUploadResponse> => {
    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    // Explicitly send the tag so images are always discoverable via the JSON list endpoint,
    // even if the upload preset on the Cloudinary dashboard isn't fully configured yet.
    formData.append('tags', GALLERY_TAG);

    try {
        const response = await fetch(uploadUrl, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Cloudinary upload failed: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
        }

        const data: CloudinaryUploadResponse = await response.json();
        console.log(`Successfully uploaded image. Public ID: ${data.public_id}`);
        return data;

    } catch (error) {
        console.error("Error during Cloudinary unsigned upload:", error);
        throw error;
    }
};
