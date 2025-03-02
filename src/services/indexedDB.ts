import { STORAGE } from '../constants/storage';
import { GeneratedImage, ImagePackEntry } from '@/types/types';

const DB_NAME = 'fluxImages';
const STORES = {
    IMAGES: 'generatedImages',
    FORM_DATA: 'formData',
    SETTINGS: 'settings',
    BUCKET: 'imageBucket',
    IMAGE_PACKS: 'imagePacks'
};
const DB_VERSION = 4;

export const db = {

    async checkStorageQuota() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            return {
                quota: estimate.quota || 0,
                usage: estimate.usage || 0,
                available: (estimate.quota || 0) - (estimate.usage || 0)
            };
        }
        return { quota: 0, usage: 0, available: 0 };
    },

    async init() {
        return new Promise<IDBDatabase>((resolve, reject) => {
            const request = window.indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('IndexedDB error:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Create stores if they don't exist
                if (!db.objectStoreNames.contains(STORES.IMAGES)) {
                    db.createObjectStore(STORES.IMAGES, { keyPath: 'timestamp' });
                }
                if (!db.objectStoreNames.contains(STORES.FORM_DATA)) {
                    db.createObjectStore(STORES.FORM_DATA, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
                    db.createObjectStore(STORES.SETTINGS, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(STORES.BUCKET)) {
                    db.createObjectStore(STORES.BUCKET, { keyPath: 'timestamp' });
                }
                if (!db.objectStoreNames.contains(STORES.IMAGE_PACKS)) {
                    db.createObjectStore(STORES.IMAGE_PACKS, { keyPath: 'id' });
                }
            };
        });
    },

    async saveImages(images: GeneratedImage[]) {
        try {
            const db = await this.init();
            const tx = db.transaction(STORES.IMAGES, 'readwrite');
            const store = tx.objectStore(STORES.IMAGES);

            const currentTime = Date.now();
            for (const image of images) {
                if (!image.timestamp) {
                    image.timestamp = new Date().toISOString();
                }
                await new Promise((resolve, reject) => {
                    const request = store.put(image);
                    request.onsuccess = () => resolve(request);
                    request.onerror = () => reject(request.error);
                });
            }
            return true;
        } catch (error) {
            console.error('Error saving to IndexedDB:', error);
            return false;
        }
    },

    async cleanupExpiredImages() {
        try {
            const db = await this.init();
            const tx = db.transaction(STORES.IMAGES, 'readwrite');
            const store = tx.objectStore(STORES.IMAGES);

            const currentTime = Date.now();
            const request = store.openCursor();

            return new Promise<void>((resolve, reject) => {
                request.onsuccess = (event) => {
                    const cursor = (event.target as IDBRequest).result;
                    if (cursor) {
                        const image = cursor.value;
                        const imageTime = new Date(image.timestamp).getTime();
                        if (currentTime - imageTime >= STORAGE.EXPIRY_TIME_MS) {
                            cursor.delete();
                        }
                        cursor.continue();
                    } else {
                        resolve();
                    }
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Error cleaning up expired images:', error);
        }
    },

    async getImages(): Promise<GeneratedImage[]> {
        try {
            const db = await this.init();
            const tx = db.transaction(STORES.IMAGES, 'readonly');
            const store = tx.objectStore(STORES.IMAGES);

            return new Promise((resolve, reject) => {
                const request = store.getAll();
                request.onsuccess = () => {
                    const images = request.result;
                    // Filter out expired images
                    const currentTime = Date.now();
                    const validImages = images.filter(image => {
                        const imageTime = new Date(image.timestamp).getTime();
                        return currentTime - imageTime < STORAGE.EXPIRY_TIME_MS;
                    });
                    resolve(validImages);
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Error reading from IndexedDB:', error);
            return [];
        }
    },

    async deleteImage(timestamp: string) {
        try {
            const db = await this.init();
            const tx = db.transaction(STORES.IMAGES, 'readwrite');
            const store = tx.objectStore(STORES.IMAGES);

            return new Promise<boolean>((resolve, reject) => {
                const request = store.delete(timestamp);

                tx.oncomplete = () => {
                    resolve(true);
                };

                tx.onerror = () => {
                    reject(tx.error);
                };
            });
        } catch (error) {
            console.error('Error deleting from IndexedDB:', error);
            return false;
        }
    },

    async clearImages() {
        try {
            const db = await this.init();
            const tx = db.transaction(STORES.IMAGES, 'readwrite');
            const store = tx.objectStore(STORES.IMAGES);

            await new Promise((resolve, reject) => {
                const request = store.clear();
                request.onsuccess = () => resolve(request);
                request.onerror = () => reject(request.error);
            });

            localStorage.removeItem('generatedImages');
            return true;
        } catch (error) {
            console.error('Error clearing IndexedDB:', error);
            return false;
        }
    },

    async clearBucket() {
        try {
            const db = await this.init();
            const tx = db.transaction(STORES.BUCKET, 'readwrite');
            const store = tx.objectStore(STORES.BUCKET);
    
            return new Promise<boolean>((resolve, reject) => {
                const request = store.clear();
                
                request.onsuccess = () => resolve(true);
                request.onerror = () => {
                    console.error('Error clearing bucket:', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Error clearing bucket:', error);
            return false;
        }
    },

    async saveToBucket(image: GeneratedImage) {
        try {
            const db = await this.init();
            const tx = db.transaction(STORES.BUCKET, 'readwrite');
            const store = tx.objectStore(STORES.BUCKET);

            if (!image.timestamp) {
                image.timestamp = new Date().toISOString();
            }

            return new Promise<boolean>((resolve, reject) => {
                const request = store.put(image);

                request.onsuccess = () => resolve(true);
                request.onerror = (event) => {
                    const error = (event.target as IDBRequest).error;
                    if (error?.name === 'QuotaExceededError') {
                        reject(new Error('Storage quota exceeded. Please remove some images from your bucket.'));
                    } else {
                        reject(error);
                    }
                };
            });
        } catch (error) {
            console.error('Error saving to bucket:', error);
            if (error instanceof Error && error.name === 'QuotaExceededError') {
                throw new Error('Storage quota exceeded. Please remove some images from your bucket.');
            }
            return false;
        }
    },

    async getBucketImages(): Promise<GeneratedImage[]> {
        try {
            const db = await this.init();
            const tx = db.transaction(STORES.BUCKET, 'readonly');
            const store = tx.objectStore(STORES.BUCKET);

            return new Promise((resolve, reject) => {
                const request = store.getAll();
                request.onsuccess = () => {
                    // Sort by timestamp, newest first
                    const images = request.result.sort((a, b) =>
                        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                    );
                    resolve(images);
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Error reading from bucket:', error);
            return [];
        }
    },

    async removeFromBucket(timestamp: string) {
        try {
            const db = await this.init();
            const tx = db.transaction(STORES.BUCKET, 'readwrite');
            const store = tx.objectStore(STORES.BUCKET);

            return new Promise<boolean>((resolve, reject) => {
                const request = store.delete(timestamp);

                tx.oncomplete = () => {
                    resolve(true);
                };

                tx.onerror = () => {
                    reject(tx.error);
                };
            });
        } catch (error) {
            console.error('Error removing from bucket:', error);
            return false;
        }
    },

    // Image Pack methods
    async saveImagePack(pack: ImagePackEntry): Promise<void> {
        try {
            const db = await this.init();
            const tx = db.transaction(STORES.IMAGE_PACKS, 'readwrite');
            const store = tx.objectStore(STORES.IMAGE_PACKS);

            return new Promise((resolve, reject) => {
                const request = store.put(pack);
                request.onsuccess = () => resolve();
                request.onerror = () => {
                    console.error('Error saving image pack:', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Error saving image pack:', error);
            throw error;
        }
    },

    async getImagePacks(): Promise<ImagePackEntry[]> {
        try {
            const db = await this.init();
            const tx = db.transaction(STORES.IMAGE_PACKS, 'readonly');
            const store = tx.objectStore(STORES.IMAGE_PACKS);

            return new Promise((resolve, reject) => {
                const request = store.getAll();
                request.onsuccess = () => {
                    // Sort by timestamp, newest first
                    const packs = request.result.sort((a, b) =>
                        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                    );
                    resolve(packs);
                };
                request.onerror = () => {
                    console.error('Error getting image packs:', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Error getting image packs:', error);
            return [];
        }
    },

    async getImagePackById(id: string): Promise<ImagePackEntry | undefined> {
        try {
            const db = await this.init();
            const tx = db.transaction(STORES.IMAGE_PACKS, 'readonly');
            const store = tx.objectStore(STORES.IMAGE_PACKS);

            return new Promise((resolve, reject) => {
                const request = store.get(id);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => {
                    console.error('Error getting image pack by ID:', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Error getting image pack by ID:', error);
            return undefined;
        }
    },

    async deleteImagePack(id: string): Promise<void> {
        try {
            const db = await this.init();
            const tx = db.transaction(STORES.IMAGE_PACKS, 'readwrite');
            const store = tx.objectStore(STORES.IMAGE_PACKS);

            return new Promise((resolve, reject) => {
                const request = store.delete(id);
                tx.oncomplete = () => resolve();
                tx.onerror = () => {
                    console.error('Error deleting image pack:', tx.error);
                    reject(tx.error);
                };
            });
        } catch (error) {
            console.error('Error deleting image pack:', error);
            throw error;
        }
    },

    async clearImagePacks(): Promise<void> {
        try {
            const db = await this.init();
            const tx = db.transaction(STORES.IMAGE_PACKS, 'readwrite');
            const store = tx.objectStore(STORES.IMAGE_PACKS);

            return new Promise((resolve, reject) => {
                const request = store.clear();
                request.onsuccess = () => resolve();
                request.onerror = () => {
                    console.error('Error clearing image packs:', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Error clearing image packs:', error);
            throw error;
        }
    },

    async markPackAsFavorite(id: string, isFavorite: boolean): Promise<void> {
        try {
            const db = await this.init();
            const tx = db.transaction(STORES.IMAGE_PACKS, 'readwrite');
            const store = tx.objectStore(STORES.IMAGE_PACKS);

            return new Promise(async (resolve, reject) => {
                const getRequest = store.get(id);
                
                getRequest.onsuccess = () => {
                    const pack = getRequest.result;
                    if (pack) {
                        pack.isFavorite = isFavorite;
                        const updateRequest = store.put(pack);
                        updateRequest.onsuccess = () => resolve();
                        updateRequest.onerror = () => {
                            console.error('Error updating pack favorite status:', updateRequest.error);
                            reject(updateRequest.error);
                        };
                    } else {
                        reject(new Error(`Image pack with ID ${id} not found`));
                    }
                };
                
                getRequest.onerror = () => {
                    console.error('Error getting image pack for favorite update:', getRequest.error);
                    reject(getRequest.error);
                };
            });
        } catch (error) {
            console.error('Error marking pack as favorite:', error);
            throw error;
        }
    },

    async clearNonFavoriteSessionPacks(exceptSessionId: string): Promise<void> {
        try {
            const db = await this.init();
            const tx = db.transaction(STORES.IMAGE_PACKS, 'readwrite');
            const store = tx.objectStore(STORES.IMAGE_PACKS);

            return new Promise(async (resolve, reject) => {
                const getAllRequest = store.getAll();
                
                getAllRequest.onsuccess = () => {
                    const packs = getAllRequest.result;
                    const deletePromises = packs
                        .filter(pack => !pack.isFavorite && pack.sessionId !== exceptSessionId)
                        .map(pack => 
                            new Promise<void>((innerResolve, innerReject) => {
                                const deleteRequest = store.delete(pack.id);
                                deleteRequest.onsuccess = () => innerResolve();
                                deleteRequest.onerror = () => {
                                    console.error('Error deleting non-favorite pack:', deleteRequest.error);
                                    innerReject(deleteRequest.error);
                                };
                            })
                        );
                    
                    Promise.all(deletePromises)
                        .then(() => resolve())
                        .catch(error => reject(error));
                };
                
                getAllRequest.onerror = () => {
                    console.error('Error getting image packs for cleanup:', getAllRequest.error);
                    reject(getAllRequest.error);
                };
            });
        } catch (error) {
            console.error('Error clearing non-favorite packs:', error);
            throw error;
        }
    }
};
