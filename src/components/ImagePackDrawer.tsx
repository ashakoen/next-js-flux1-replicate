'use client';

import { Button } from "@/components/ui/button";
import { Archive, Search, Star, StarOff, SortAsc, Filter } from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";
import { toast } from "sonner";
import { ImagePackConfig, ImagePackEntry } from '@/types/types';
import { db } from '@/services/indexedDB';
import { useDropzone } from 'react-dropzone';

interface ImagePackCardProps {
    pack: ImagePackEntry;
    onSelect: (pack: ImagePackEntry) => void;
    onDelete: (id: string) => void;
    onToggleFavorite: (id: string, isFavorite: boolean) => void;
}

const ImagePackCard: React.FC<ImagePackCardProps> = ({ 
    pack, 
    onSelect,
    onDelete,
    onToggleFavorite 
}) => {
    const getModelLabel = (model: string) => {
        switch (model) {
            case 'dev': return 'FLUX.1 Dev';
            case 'pro': return 'FLUX.1 Pro';
            case 'pro-ultra': return 'FLUX.1 Pro Ultra';
            case 'schnell': return 'FLUX.1 Schnell';
            case 'recraftv3': return 'ReCraft v3';
            case 'ideogram': return 'Ideogram';
            case 'luma': return 'Luma';
            default: return model.includes('/') ? 'Custom LoRA' : model;
        }
    };

    const formatDate = (timestamp: string) => {
        try {
            const date = new Date(timestamp);
            return date.toLocaleString(undefined, { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit', 
                minute: '2-digit'
            });
        } catch (e) {
            return timestamp;
        }
    };

    const truncateText = (text: string, maxLength: number) => {
        if (!text) return '';
        return text.length > maxLength 
            ? text.substring(0, maxLength) + '...' 
            : text;
    };

    return (
        <div className="group relative p-3 rounded-lg border border-gray-200 
            dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
            <div className="flex gap-3">
                <HoverCard>
                    <HoverCardTrigger asChild>
                        <div className="relative w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden cursor-zoom-in">
                            <Image 
                                src={pack.previewImageUrl} 
                                alt="Preview"
                                fill
                                className="object-cover"
                                sizes="64px"
                                style={{ objectFit: "cover" }}
                            />
                        </div>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80 p-2">
                        <div className="relative w-full aspect-square rounded overflow-hidden">
                            <Image 
                                src={pack.previewImageUrl} 
                                alt="Preview"
                                fill
                                className="object-contain"
                                sizes="320px"
                                style={{ objectFit: "contain" }}
                            />
                        </div>
                        <div className="pt-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400">{getModelLabel(pack.config.model)}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 mt-1">{pack.config.prompt}</p>
                        </div>
                    </HoverCardContent>
                </HoverCard>
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate">
                        {getModelLabel(pack.config.model)}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                        {truncateText(pack.config.prompt, 60)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        {formatDate(pack.timestamp)}
                    </p>
                </div>
            </div>
            <div className="absolute right-2 top-2">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(pack.id, !pack.isFavorite);
                    }}
                >
                    {pack.isFavorite ? (
                        <Star className="h-4 w-4 text-yellow-400" fill="#FBBF24" />
                    ) : (
                        <StarOff className="h-4 w-4 text-gray-400" />
                    )}
                </Button>
            </div>
            <div className="absolute right-2 bottom-2 flex gap-1">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect(pack);
                    }}
                    className="h-7 px-2 text-xs bg-emerald-50 hover:bg-emerald-100 
                        dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30 
                        text-emerald-600 dark:text-emerald-400"
                >
                    Use
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(pack.id);
                    }}
                    className="h-7 px-2 text-xs bg-red-50 hover:bg-red-100 
                        dark:bg-red-900/20 dark:hover:bg-red-900/30 
                        text-red-600 dark:text-red-400"
                >
                    Delete
                </Button>
            </div>
        </div>
    );
};

interface ImagePackDrawerProps {
    onImagePackUpload: (config: ImagePackConfig) => Promise<void>;
}

export function ImagePackDrawer({
    onImagePackUpload
}: ImagePackDrawerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [imagePacks, setImagePacks] = useState<ImagePackEntry[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [sessionId, setSessionId] = useState<string>('');
    
    // Search and filtering state
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [sortOption, setSortOption] = useState<string>('newest');
    const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);

    // Initialize session ID
    useEffect(() => {
        const storedSessionId = localStorage.getItem('imagePackSessionId');
        const newSessionId = storedSessionId || 
            `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        localStorage.setItem('imagePackSessionId', newSessionId);
        setSessionId(newSessionId);
        
        // Clean up old session data
        if (localStorage.getItem('cleanupLastRun') !== new Date().toDateString()) {
            db.clearNonFavoriteSessionPacks(newSessionId)
                .then(() => localStorage.setItem('cleanupLastRun', new Date().toDateString()))
                .catch(error => console.error('Error during cleanup:', error));
        }
    }, []);

    // Load saved image packs when drawer opens
    useEffect(() => {
        if (isOpen) {
            loadImagePacks();
        }
    }, [isOpen]);

    const loadImagePacks = async () => {
        try {
            const packs = await db.getImagePacks();
            setImagePacks(packs || []);
        } catch (error) {
            console.error('Error loading image packs:', error);
            toast.error('Failed to load image packs');
        }
    };

    const handleFileProcessing = useCallback(async (file: File) => {
        setIsUploading(true);
        try {
            console.log('Processing file:', file.name, file.size, file.type);
            
            // Convert the file to an ArrayBuffer for secure storage
            const fileArrayBuffer = await file.arrayBuffer();
            const zipFileData = new Uint8Array(fileArrayBuffer);
            
            // Create a copy of the file for processing
            const fileClone = new File([zipFileData], file.name, { type: file.type });
            
            const JSZip = (await import('jszip')).default;
            const zip = await JSZip.loadAsync(fileClone);
            
            // Find the JSON config file
            const configFile = Object.values(zip.files).find(file => 
                file.name.endsWith('.json') && !file.dir
            );
            
            if (!configFile) {
                toast.error(`No configuration file found in ${file.name}`);
                return false;
            }
            
            // Extract configuration data
            const configText = await configFile.async('text');
            const config = JSON.parse(configText) as ImagePackConfig;
            
            // Find the generated image
            const imageFile = Object.values(zip.files).find(file =>
                !file.name.includes('source') &&
                !file.name.includes('mask') &&
                !file.name.includes('.json') &&
                !file.dir &&
                /\.(png|jpg|jpeg|webp)$/i.test(file.name)
            );

            if (!imageFile) {
                toast.error(`No image file found in ${file.name}`);
                return false;
            }

            // Process image for preview
            const imageBlob = await imageFile.async('blob');
            const imageUrl = URL.createObjectURL(imageBlob);
            
            // Find source image if it exists
            let sourceImageUrl: string | undefined;
            const sourceFile = Object.values(zip.files).find(file => 
                file.name.includes('source') && 
                /\.(png|jpg|jpeg|webp)$/i.test(file.name)
            );
            
            if (sourceFile) {
                const sourceBlob = await sourceFile.async('blob');
                sourceImageUrl = URL.createObjectURL(sourceBlob);
            }
            
            // Find mask if it exists
            let maskDataUrl: string | undefined;
            const maskFile = Object.values(zip.files).find(file => 
                file.name.includes('mask') && 
                /\.(png|jpg|jpeg|webp)$/i.test(file.name)
            );
            
            if (maskFile) {
                const maskBlob = await maskFile.async('blob');
                const reader = new FileReader();
                maskDataUrl = await new Promise<string>((resolve) => {
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(maskBlob);
                });
            }
            
            // Store the file data as a blob (safer than storing a File object)
            const zipBlob = new Blob([zipFileData], { type: 'application/zip' });
            
            // Create a URL for the zipFile
            const zipUrl = URL.createObjectURL(zipBlob);
            
            // Create pack entry
            const packEntry: ImagePackEntry = {
                id: `pack-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                timestamp: new Date().toISOString(),
                previewImageUrl: imageUrl,
                zipFileUrl: zipUrl,  // Add this for direct access to the zip data
                config: {
                    ...config,
                    zipFile: file  // This is mainly for interface compatibility
                },
                sourceImageUrl,
                maskDataUrl,
                originalFilename: file.name,
                sessionId,
                isFavorite: false
            };
            
            // Save to IndexedDB
            await db.saveImagePack(packEntry);
            
            // Update state
            setImagePacks(prev => [packEntry, ...prev]);
            
            toast.success(`Image pack "${file.name}" uploaded successfully!`);
            return true;
        } catch (error) {
            console.error(`Error processing ${file.name}:`, error);
            toast.error(`Failed to process ${file.name}`);
            return false;
        }
    }, [sessionId]);

    const handleFilesDropped = useCallback(async (acceptedFiles: File[]) => {
        setIsUploading(true);
        try {
            const zipFiles = acceptedFiles.filter(file => file.name.endsWith('.zip'));
            
            if (zipFiles.length === 0) {
                toast.error('Please upload valid image pack ZIP files');
                return;
            }
            
            const results = await Promise.all(zipFiles.map(handleFileProcessing));
            const successCount = results.filter(Boolean).length;
            
            if (successCount > 0 && successCount === zipFiles.length) {
                toast.success(`All ${successCount} image packs processed successfully!`);
            } else if (successCount > 0) {
                toast.success(`${successCount} of ${zipFiles.length} image packs processed successfully.`);
            }
        } catch (error) {
            console.error('Error processing ZIP files:', error);
            toast.error('Failed to process ZIP files');
        } finally {
            setIsUploading(false);
        }
    }, [handleFileProcessing]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: handleFilesDropped,
        accept: { 'application/zip': ['.zip'] },
        multiple: true
    });

    const handleSelectPack = async (pack: ImagePackEntry) => {
        try {
            console.log('Selected pack:', pack);
            
            let zipBlob: Blob;
            
            // First try to use the zipFileUrl if available
            if (pack.zipFileUrl) {
                console.log('Using zipFileUrl for pack retrieval');
                const response = await fetch(pack.zipFileUrl);
                zipBlob = await response.blob();
            } else {
                // Fall back to the download API
                console.log('Using download API for pack retrieval');
                const response = await fetch(`/api/download?filename=${encodeURIComponent(pack.originalFilename || 'image-pack.zip')}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        imageUrl: pack.config.zipFile instanceof File 
                            ? URL.createObjectURL(pack.config.zipFile)
                            : pack.previewImageUrl
                    })
                });
                
                if (!response.ok) {
                    throw new Error('Failed to retrieve image pack data');
                }
                
                zipBlob = await response.blob();
            }
            
            // Create a File object from the blob
            const virtualZipFile = new File(
                [zipBlob],
                pack.originalFilename || 'image-pack.zip',
                { type: 'application/zip' }
            );
            
            // Call the upload handler from the parent
            await onImagePackUpload({
                ...pack.config,
                zipFile: virtualZipFile
            });
            
            setIsOpen(false);
            toast.success('Image pack applied successfully!');
        } catch (error) {
            console.error('Error selecting image pack:', error);
            toast.error('Failed to apply image pack');
        }
    };

    const handleDeletePack = async (id: string) => {
        try {
            await db.deleteImagePack(id);
            setImagePacks(prev => prev.filter(pack => pack.id !== id));
            toast.success('Image pack deleted');
        } catch (error) {
            console.error('Error deleting image pack:', error);
            toast.error('Failed to delete image pack');
        }
    };

    const handleToggleFavorite = async (id: string, isFavorite: boolean) => {
        try {
            await db.markPackAsFavorite(id, isFavorite);
            setImagePacks(prev => prev.map(pack => 
                pack.id === id ? { ...pack, isFavorite } : pack
            ));
            toast.success(isFavorite ? 'Added to favorites' : 'Removed from favorites');
        } catch (error) {
            console.error('Error updating favorite status:', error);
            toast.error('Failed to update favorite status');
        }
    };

    const handleClearAll = async () => {
        try {
            await db.clearImagePacks();
            setImagePacks([]);
            toast.success('All image packs cleared');
        } catch (error) {
            console.error('Error clearing image packs:', error);
            toast.error('Failed to clear image packs');
        }
    };

    // Apply filtering and sorting
    const filteredImagePacks = useMemo(() => {
        // First apply search filtering
        let filtered = imagePacks;
        
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(pack => {
                const promptMatch = pack.config.prompt?.toLowerCase().includes(query);
                const modelMatch = pack.config.model?.toLowerCase().includes(query);
                return promptMatch || modelMatch;
            });
        }
        
        // Then apply favorites filtering
        if (showFavoritesOnly) {
            filtered = filtered.filter(pack => pack.isFavorite);
        }
        
        // Finally sort the results
        return filtered.sort((a, b) => {
            switch (sortOption) {
                case 'oldest':
                    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
                case 'model':
                    return (a.config.model || '').localeCompare(b.config.model || '');
                case 'newest':
                default:
                    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
            }
        });
    }, [imagePacks, searchQuery, showFavoritesOnly, sortOption]);

    return (
        <div className="fixed left-0 top-[38.5rem] z-30">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className={`flex flex-col items-center gap-2 py-3 h-auto
                            border-l-0 rounded-l-none border-2
                            bg-gradient-to-r from-emerald-200 to-teal-200
                            hover:from-emerald-300 hover:to-teal-300
                            dark:from-emerald-900 dark:to-teal-900
                            dark:hover:from-emerald-800 dark:hover:to-teal-800
                            transition-all duration-300 shadow-md
                            hover:shadow-lg hover:scale-105
                            ${imagePacks.length > 0 ? 'ring-2 ring-emerald-500 dark:ring-emerald-400' : ''}`}
                    >
                        <div className="relative">
                            <Archive className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
                            {imagePacks.length > 0 && (
                                <div className="absolute -top-1 -right-2.5 w-2 h-2 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-pulse" />
                            )}
                        </div>
                        <span
                            className="text-base font-medium bg-gradient-to-b from-emerald-500 to-teal-500 
                                dark:from-emerald-400 dark:to-teal-400 
                                text-transparent bg-clip-text"
                            style={{ writingMode: 'vertical-rl' }}
                        >
                            {isOpen ? 'Close' : 'Image Packs'}
                        </span>
                    </Button>
                </SheetTrigger>
                <SheetContent className="w-[500px] fixed left-0 h-[calc(100vh-9rem)] mt-[2rem] p-4 flex flex-col slide-in-from-left rounded-r-xl focus-visible:outline-none">
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                            <Archive className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
                            <span className="bg-gradient-to-r from-emerald-500 to-teal-500 
                                dark:from-emerald-400 dark:to-teal-400 
                                text-transparent bg-clip-text font-semibold">
                                Image Packs ({imagePacks.length})
                            </span>
                        </SheetTitle>
                    </SheetHeader>

                    {/* Search and filters */}
                    {imagePacks.length > 0 && (
                        <div className="flex flex-col gap-2 mt-4">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search by prompt or model..."
                                    className="pl-8"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            
                            {/* Sort and filter options */}
                            <div className="flex items-center justify-between gap-2">
                                <Select value={sortOption} onValueChange={setSortOption}>
                                    <SelectTrigger className="w-[150px]">
                                        <SelectValue placeholder="Sort by" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="newest">Newest first</SelectItem>
                                        <SelectItem value="oldest">Oldest first</SelectItem>
                                        <SelectItem value="model">By model</SelectItem>
                                    </SelectContent>
                                </Select>
                                
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    className={`flex items-center gap-1 ${showFavoritesOnly ? "bg-amber-100 dark:bg-amber-900/30" : ""}`}
                                    onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                                >
                                    {showFavoritesOnly ? "All Packs" : "Favorites Only"}
                                    {showFavoritesOnly && <Star className="ml-1 h-3 w-3 text-yellow-500" fill="#EAB308" />}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Drop Zone */}
                    <div 
                        {...getRootProps()} 
                        className={`mt-4 border-2 border-dashed rounded-lg p-4 text-center transition-colors
                            ${isDragActive 
                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' 
                                : 'border-gray-300 dark:border-gray-700'}`}
                    >
                        <input {...getInputProps()} />
                        <Archive className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {isDragActive
                                ? "Drop image packs here..."
                                : "Drag & drop image packs here or click to browse"}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            Only .zip files containing image packs are supported
                        </p>
                    </div>

                    {/* Image Pack Gallery */}
                    <ScrollArea className="flex-1 mt-4">
                        <div className="space-y-3 pr-4">
                            {isUploading ? (
                                <div className="text-center py-8">
                                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                                    <p className="text-sm text-gray-500 mt-2">Processing image packs...</p>
                                </div>
                            ) : imagePacks.length === 0 ? (
                                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                    No image packs uploaded yet
                                </div>
                            ) : filteredImagePacks.length === 0 ? (
                                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                    No matching image packs found
                                </div>
                            ) : (
                                filteredImagePacks.map((pack) => (
                                    <ImagePackCard
                                        key={pack.id}
                                        pack={pack}
                                        onSelect={handleSelectPack}
                                        onDelete={handleDeletePack}
                                        onToggleFavorite={handleToggleFavorite}
                                    />
                                ))
                            )}
                        </div>
                    </ScrollArea>

                    {/* Clear All Button */}
                    {imagePacks.length > 0 && (
                        <div className="mt-4 flex justify-end">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleClearAll}
                                className="text-xs hover:bg-red-100 
                                    dark:hover:bg-red-900/30 text-red-600 
                                    dark:text-red-400"
                            >
                                Clear All Packs
                            </Button>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
