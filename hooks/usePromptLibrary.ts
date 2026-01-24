
import React, { useState, useCallback, useMemo, useRef } from 'react';
import { LibraryItem, LibraryItemType } from '../types';

const STORAGE_KEY = 'prompt-library-items';
const ROOT_ID = 'root';

const defaultLibraryItems: LibraryItem[] = [
    { id: 'folder-1', type: LibraryItemType.FOLDER, name: 'Basic Prompts', parentId: null },
    { id: 'prompt-1', type: LibraryItemType.PROMPT, name: 'Fill background', parentId: 'folder-1', content: 'Fill the white background with the surroundings' },
    { id: 'prompt-2', type: LibraryItemType.PROMPT, name: 'Remove all watermarks', parentId: 'folder-1', content: 'Remove all watermarks, logos, text overlays, and advertisement banners from the image. Restore the original background naturally, blending colors and textures smoothly. Keep all other visual elements unchanged and realistic.' },
    { id: 'prompt-3', type: LibraryItemType.PROMPT, name: 'Character concept', parentId: 'folder-1', content: 'Create a character concept based on the provided image. The character is standing full-length against a gray background.' }
];


export const usePromptLibrary = (t: (key: string) => string) => {
    const [libraryItems, setLibraryItems] = useState<LibraryItem[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : defaultLibraryItems;
        } catch (error) {
            console.error("Failed to load prompt library from storage", error);
            return defaultLibraryItems;
        }
    });
    
    // Navigation history tracks folder IDs. 'null' means Root.
    const [navigationHistory, setNavigationHistory] = useState<Array<string | null>>([null]);
    const libraryFileInputRef = useRef<HTMLInputElement>(null);
    
    const currentParentId = navigationHistory[navigationHistory.length - 1];

    const persistItems = (items: LibraryItem[]) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch (error) {
            console.error("Failed to save prompt library to storage", error);
        }
    };

    const currentLibraryItems = useMemo(() => {
        return libraryItems
            .filter(item => item.parentId === currentParentId)
            .sort((a, b) => {
                if (a.type === b.type) {
                    return a.name.localeCompare(b.name);
                }
                return a.type === LibraryItemType.FOLDER ? -1 : 1;
            });
    }, [libraryItems, currentParentId]);

    const currentPath = useMemo(() => {
        const pathChain: LibraryItem[] = [];
        let currentId = currentParentId;
        
        // Build chain from leaf to root
        while (currentId) {
            const folder = libraryItems.find(item => item.id === currentId);
            if (folder) {
                pathChain.push(folder);
                currentId = folder.parentId;
            } else {
                break;
            }
        }
        // Reverse to get Root -> Parent -> Child order
        // Root has ID 'root' which is intercepted by navigateToFolder to mean null
        return [{ id: ROOT_ID, type: LibraryItemType.FOLDER, name: t('catalog.tabs.library'), parentId: null }, ...pathChain.reverse()];
    }, [currentParentId, libraryItems, t]);

    const navigateToFolder = useCallback((folderId: string | null) => {
        // Handle 'root' string from breadcrumb or explicit null
        const targetId = folderId === ROOT_ID ? null : folderId;

        // Check if we are jumping back in history (like breadcrumb click)
        const historyIndex = navigationHistory.findIndex(id => id === targetId);
        
        if (historyIndex > -1) {
            // Jump back: keep history up to the found index
            setNavigationHistory(prev => prev.slice(0, historyIndex + 1));
        } else {
            // Navigate deeper: append new ID
            setNavigationHistory(prev => [...prev, targetId]);
        }
    }, [navigationHistory]);

    const navigateBack = useCallback(() => {
        setNavigationHistory(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));
    }, []);
    
    const createLibraryItem = useCallback((type: LibraryItemType) => {
        const name = type === LibraryItemType.FOLDER ? t('library.actions.newFolder') : t('library.actions.newPrompt');
        const newItem: LibraryItem = {
            id: `lib-item-${Date.now()}`,
            type,
            name,
            parentId: currentParentId,
            content: type === LibraryItemType.PROMPT ? '' : undefined
        };
        setLibraryItems(prev => {
            const updated = [...prev, newItem];
            persistItems(updated);
            return updated;
        });
    }, [currentParentId, t]);

    const updateLibraryItem = useCallback((itemId: string, updates: Partial<Pick<LibraryItem, 'name' | 'content'>>) => {
        setLibraryItems(prev => {
            const updated = prev.map(item => item.id === itemId ? { ...item, ...updates } : item);
            persistItems(updated);
            return updated;
        });
    }, []);

    const deleteLibraryItem = useCallback((itemId: string) => {
        setLibraryItems(prev => {
            const idsToDelete = new Set<string>([itemId]);
            const queue = [itemId];

            // Recursive deletion for folders
            while (queue.length > 0) {
                const currentId = queue.shift();
                for (const item of prev) {
                    if (item.parentId === currentId) {
                        idsToDelete.add(item.id);
                        if (item.type === LibraryItemType.FOLDER) {
                            queue.push(item.id);
                        }
                    }
                }
            }
            
            const updated = prev.filter(item => !idsToDelete.has(item.id));
            persistItems(updated);
            return updated;
        });
    }, []);
    
    const saveLibraryItemToDisk = useCallback((item: LibraryItem) => {
        let content: string;
        let filename: string;
        let type: string;

        if (item.type === LibraryItemType.PROMPT) {
            content = item.content || '';
            filename = `${item.name.replace(/ /g, '_')}.txt`;
            type = 'text/plain';
        } else { // Folder
            const getFolderContents = (folderId: string): any => {
                const folder = libraryItems.find(i => i.id === folderId);
                if (!folder) return null;
                
                const children = libraryItems.filter(i => i.parentId === folderId);
                return {
                    name: folder.name,
                    type: 'folder',
                    children: children.map(child => {
                        return child.type === LibraryItemType.FOLDER
                            ? getFolderContents(child.id)
                            : { name: child.name, type: 'prompt', content: child.content || '' }
                    })
                };
            };
            content = JSON.stringify(getFolderContents(item.id), null, 2);
            filename = `${item.name.replace(/ /g, '_')}_library_export.json`;
            type = 'application/json';
        }

        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        a.remove();
    }, [libraryItems]);

    const loadLibraryFromFileContent = useCallback((text: string) => {
        try {
            if (!text) throw new Error("File content is empty.");
            const loadedData = JSON.parse(text);
    
            if (loadedData.type !== 'folder' || !loadedData.name || !Array.isArray(loadedData.children)) {
                throw new Error(t('alert.invalidCatalogFile'));
            }
    
            const newItems: LibraryItem[] = [];
    
            const recursiveImport = (itemData: any, parentId: string | null) => {
                const newId = `lib-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                
                if (!itemData.name || !itemData.type) return;
    
                const type = itemData.type === 'folder' ? LibraryItemType.FOLDER : LibraryItemType.PROMPT;
                
                const newItem: LibraryItem = {
                    id: newId,
                    type: type,
                    name: itemData.name,
                    parentId: parentId,
                    content: type === LibraryItemType.PROMPT ? itemData.content || '' : undefined
                };
                newItems.push(newItem);
    
                if (type === LibraryItemType.FOLDER && Array.isArray(itemData.children)) {
                    itemData.children.forEach((child: any) => recursiveImport(child, newId));
                }
            };
    
            recursiveImport(loadedData, currentParentId);
    
            setLibraryItems(prev => {
                const updated = [...prev, ...newItems];
                persistItems(updated);
                return updated;
            });
    
        } catch (err: any) {
            alert(`${t('alert.loadCatalogFailed')}: ${err.message}`);
        }
    }, [currentParentId, setLibraryItems, t]);

    const handleLibraryFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
    
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            loadLibraryFromFileContent(text);
            if (e.target) e.target.value = '';
        };
        reader.onerror = () => {
            alert("Error reading the selected file.");
        };
        reader.readAsText(file);
    }, [loadLibraryFromFileContent]);

    const triggerLoadLibraryFromFile = useCallback(() => {
        libraryFileInputRef.current?.click();
    }, []);

    const moveLibraryItem = useCallback((itemId: string, newParentId: string | null) => {
        setLibraryItems(prev => {
            const itemToMove = prev.find(i => i.id === itemId);
            if (!itemToMove || itemToMove.parentId === newParentId) {
                return prev;
            }
    
            if (itemToMove.type === LibraryItemType.FOLDER) {
                let currentParent = newParentId;
                while (currentParent) {
                    if (currentParent === itemId) {
                        return prev; // Prevent circular dependency
                    }
                    const parentFolder = prev.find(i => i.id === currentParent);
                    currentParent = parentFolder ? parentFolder.parentId : null;
                }
            }
    
            const updated = prev.map(item =>
                item.id === itemId ? { ...item, parentId: newParentId } : item
            );
            persistItems(updated);
            return updated;
        });
    }, []);

    const importLibrary = useCallback((items: LibraryItem[]) => {
        setLibraryItems(items);
        persistItems(items);
    }, []);

    // NEW: Merge items from Cloud
    const mergeLibraryItems = useCallback((incomingItems: LibraryItem[]) => {
         setLibraryItems(prev => {
            const existingIds = new Set(prev.map(i => i.id));
            const newItems = incomingItems.filter(i => !existingIds.has(i.id)).map(i => ({
                ...i,
                id: i.id || `cloud-lib-${Date.now()}-${Math.random()}`
            }));
            
            const updated = [...prev, ...newItems];
            persistItems(updated);
            return updated;
        });
    }, []);

    return {
        libraryItems,
        currentLibraryItems,
        currentPath,
        navigateBack,
        navigateToFolder,
        createLibraryItem,
        updateLibraryItem,
        deleteLibraryItem,
        saveLibraryItemToDisk,
        libraryFileInputRef,
        handleLibraryFileChange,
        triggerLoadLibraryFromFile,
        moveLibraryItem,
        importLibrary,
        mergeLibraryItems
    };
};
