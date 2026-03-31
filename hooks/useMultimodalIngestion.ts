import { useState, useRef, useCallback } from 'react';
import { useDropzone, DropzoneOptions } from 'react-dropzone';

export interface MultimodalIngestionHook {
    fileInputRef: React.RefObject<HTMLInputElement>;
    isDragging: boolean;
    triggerIngestion: () => void;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    dropzoneProps: {
        getRootProps: any;
        getInputProps: any;
        isDragActive: boolean;
    };
    ingestedFiles: File[];
    clearFiles: () => void;
}

export const useMultimodalIngestion = (
    onFilesIngested?: (files: File[]) => void
): MultimodalIngestionHook => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [ingestedFiles, setIngestedFiles] = useState<File[]>([]);

    const triggerIngestion = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFiles = useCallback((files: File[]) => {
        if (files.length > 0) {
            setIngestedFiles(prev => [...prev, ...files]);
            if (onFilesIngested) {
                onFilesIngested(files);
            }
        }
    }, [onFilesIngested]);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(Array.from(e.target.files));
        }
    }, [handleFiles]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setIsDragging(false);
        handleFiles(acceptedFiles);
    }, [handleFiles]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        noClick: true,
        noKeyboard: true,
        onDragEnter: () => setIsDragging(true),
        onDragLeave: () => setIsDragging(false),
        multiple: true
    } as DropzoneOptions);

    const clearFiles = useCallback(() => {
        setIngestedFiles([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    return {
        fileInputRef,
        isDragging: isDragging || isDragActive,
        triggerIngestion,
        handleFileChange,
        dropzoneProps: {
            getRootProps,
            getInputProps,
            isDragActive
        },
        ingestedFiles,
        clearFiles
    };
};
