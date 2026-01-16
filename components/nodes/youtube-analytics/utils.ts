
// Image Resizer Utility
export const resizeThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error("Could not get canvas context"));
                return;
            }

            // Target dimensions
            const TARGET_WIDTH = 128;
            const TARGET_HEIGHT = 72;

            canvas.width = TARGET_WIDTH;
            canvas.height = TARGET_HEIGHT;

            // Calculate scaling to cover the target area (like object-fit: cover)
            const scale = Math.max(TARGET_WIDTH / img.width, TARGET_HEIGHT / img.height);
            const x = (TARGET_WIDTH / 2) - (img.width / 2) * scale;
            const y = (TARGET_HEIGHT / 2) - (img.height / 2) * scale;

            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
            resolve(canvas.toDataURL('image/png').split(',')[1]); // Return base64 without header
        };
        img.onerror = reject;
    });
};

// Split image for Metadata extraction
export const processYouTubeScreenshot = (file: File): Promise<{ thumbnail: string, metadataImage: string }> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const CUT_X = 136; // Approximate width of the thumbnail in the screenshot
            
            // Canvas 1: Thumbnail
            const cvsThumb = document.createElement('canvas');
            cvsThumb.width = CUT_X;
            cvsThumb.height = img.height;
            const ctxThumb = cvsThumb.getContext('2d');
            if (!ctxThumb) { reject("Canvas error"); return; }
            ctxThumb.drawImage(img, 0, 0, CUT_X, img.height, 0, 0, CUT_X, img.height);
            
            // Canvas 2: Metadata
            const cvsMeta = document.createElement('canvas');
            const metaWidth = img.width - CUT_X;
            cvsMeta.width = metaWidth;
            cvsMeta.height = img.height;
            const ctxMeta = cvsMeta.getContext('2d');
            if (!ctxMeta) { reject("Canvas error"); return; }
            ctxMeta.drawImage(img, CUT_X, 0, metaWidth, img.height, 0, 0, metaWidth, img.height);

            resolve({
                thumbnail: cvsThumb.toDataURL('image/png').split(',')[1],
                metadataImage: cvsMeta.toDataURL('image/png').split(',')[1]
            });
        };
        img.onerror = reject;
    });
};
