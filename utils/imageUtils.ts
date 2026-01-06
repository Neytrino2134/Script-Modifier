
export const generateThumbnail = (base64Image: string, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width *= maxHeight / height;
                    height = maxHeight;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                resolve(dataUrl.split(',')[1]);
            } else {
                reject(new Error("Failed to get canvas context"));
            }
        };
        img.onerror = reject;
        img.src = base64Image.startsWith('data:') ? base64Image : `data:image/png;base64,${base64Image}`;
    });
};

export const cropImageTo1x1 = (base64Image: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const size = Math.min(img.width, img.height);
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const x = (img.width - size) / 2;
                const y = (img.height - size) / 2;
                ctx.drawImage(img, x, y, size, size, 0, 0, size, size);
                const dataUrl = canvas.toDataURL('image/png');
                resolve(dataUrl.split(',')[1]);
            } else {
                reject(new Error("Failed to get canvas context"));
            }
        };
        img.onerror = reject;
        img.src = base64Image.startsWith('data:') ? base64Image : `data:image/png;base64,${base64Image}`;
    });
};
