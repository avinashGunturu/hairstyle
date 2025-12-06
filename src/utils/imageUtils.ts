
/**
 * Resizes an image to a maximum dimension while maintaining aspect ratio.
 * Returns the resized image as a base64 string.
 */
export const resizeImage = (file: File, maxDimension: number = 1024, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > maxDimension || height > maxDimension) {
                    if (width > height) {
                        height = (height / width) * maxDimension;
                        width = maxDimension;
                    } else {
                        width = (width / height) * maxDimension;
                        height = maxDimension;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error("Could not get canvas context"));
                    return;
                }
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to base64 string (JPEG for better compression)
                const base64 = canvas.toDataURL('image/jpeg', quality);
                resolve(base64);
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};

/**
 * Converts a base64 string to a File object (useful if we already have base64 but need to resize).
 */
export const base64ToFile = async (base64: string, filename: string): Promise<File> => {
    const res = await fetch(base64);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type });
};

/**
 * Resizes a base64 image string directly.
 */
export const resizeBase64 = async (base64: string, maxDimension: number = 1024, quality: number = 0.8): Promise<string> => {
    const file = await base64ToFile(base64, "temp.jpg");
    return resizeImage(file, maxDimension, quality);
};
