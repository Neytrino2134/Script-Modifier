
import React from 'react';

interface ImageEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (imageBase64: string) => void;
    imageSrc: string | null;
}

const ImageEditorModal: React.FC<ImageEditorModalProps> = ({ isOpen, onClose, onApply, imageSrc }) => {
    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-gray-800 p-6 rounded-lg text-white">
                <h3 className="text-xl mb-4">Simple Editor</h3>
                {imageSrc && (
                    <img src={imageSrc.startsWith('data:') ? imageSrc : `data:image/png;base64,${imageSrc}`} alt="Edit" className="max-w-md max-h-96 object-contain mb-4" />
                )}
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600">Close</button>
                    <button onClick={() => { if(imageSrc) onApply(imageSrc.startsWith('data:') ? imageSrc.split(',')[1] : imageSrc); onClose(); }} className="px-4 py-2 bg-emerald-600 rounded hover:bg-emerald-700">Apply (No Op)</button>
                </div>
            </div>
        </div>
    );
};

export default ImageEditorModal;
