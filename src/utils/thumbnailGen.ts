export const generateThumbnail = (file: File, maxWidth: number = 200, maxHeight: number = 200): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.src = url;

        img.onload = () => {
            URL.revokeObjectURL(url);
            const canvas = document.createElement("canvas");
            let { width, height } = img;

            // Maintain aspect ratio while resizing
            if (width > height) {
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");
            if (!ctx) return reject(new Error("Failed to get canvas context"));

            ctx.drawImage(img, 0, 0, width, height);

            // Compress to very low quality JPEG to target 20KB - 50KB range
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error("Canvas to Blob failed"));
                    }
                },
                "image/jpeg",
                0.5 // 50% quality for small size
            );
        };

        img.onerror = (err) => reject(err);
    });
};
