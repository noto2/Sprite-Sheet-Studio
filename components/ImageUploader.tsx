
import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons';

interface ImageUploaderProps {
    onFilesChange: (files: File[]) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onFilesChange }) => {
    const [previews, setPreviews] = useState<string[]>([]);
    const [isDragging, setIsDragging] = useState(false);

    const handleFiles = useCallback((acceptedFiles: FileList | null) => {
        if (acceptedFiles) {
            const filesArray = Array.from(acceptedFiles).filter(file => file.type.startsWith('image/'));
            onFilesChange(filesArray);

            const newPreviews = filesArray.map(file => URL.createObjectURL(file));
            setPreviews(previews => {
                previews.forEach(URL.revokeObjectURL);
                return newPreviews;
            });
        }
    }, [onFilesChange]);

    const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };
    const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };
    const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };
    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFiles(e.target.files);
    };

    return (
        <div className="bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">1. 프레임 업로드</h2>
            <label
                htmlFor="file-upload"
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 ${isDragging ? 'border-cyan-400 bg-gray-700' : 'border-gray-600 bg-gray-700/50 hover:bg-gray-700'}`}
            >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadIcon className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-400">
                        <span className="font-semibold text-cyan-400">클릭해서 업로드</span>하거나 파일을 드래그하세요
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, WEBP 등</p>
                </div>
                <input id="file-upload" type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
            {previews.length > 0 && (
                <div className="mt-4">
                    <p className="text-sm font-medium text-gray-300 mb-2">{previews.length}개의 프레임 선택됨</p>
                    <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-2">
                        {previews.map((src, index) => (
                            <img key={index} src={src} alt={`preview ${index}`} className="w-full h-full object-cover rounded" />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
