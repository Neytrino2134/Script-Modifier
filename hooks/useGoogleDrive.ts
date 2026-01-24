
import { useState, useEffect, useCallback } from 'react';
import { initGoogleDrive, requestAccessToken, getAppFolderId, listFilesInAppFolder, downloadFileContent, saveFileToDrive, deleteFile } from '../services/googleDriveService';
import { CatalogItem, CatalogItemType, LibraryItem, LibraryItemType } from '../types';

export const useGoogleDrive = (
    addToast: (msg: string, type: 'success' | 'info' | 'error') => void,
    saveDataToCatalog: (id: string, type: CatalogItemType, name: string) => void,
    saveGroupToCatalog: (group: any, nodes: any, conns: any) => void,
    importCatalog: (items: any[]) => void,
    getAllProjectData: () => any,
    // New Props for specific merge operations
    mergeCatalogItems?: (newItems: CatalogItem[]) => void,
    mergeLibraryItems?: (newItems: LibraryItem[]) => void,
) => {
    const [isAuthenticated, setIsConnected] = useState(false);
    const [clientId, setClientId] = useState(() => localStorage.getItem('settings_googleClientId') || '');
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        if (clientId) {
            try {
                initGoogleDrive(clientId, (success) => {
                    if (success) console.log("Google Drive API initialized");
                });
            } catch (e) {
                console.error("Failed to init Drive", e);
            }
        }
    }, [clientId]);

    const handleConnect = useCallback(() => {
        if (!clientId) {
            addToast("Please enter a Google Client ID in settings.", 'error');
            return;
        }
        try {
            requestAccessToken((token) => {
                if (token && token.access_token) {
                    setIsConnected(true);
                    addToast("Connected to Google Drive!", 'success');
                }
            });
        } catch (e) {
            addToast("Failed to connect to Google Drive.", 'error');
        }
    }, [clientId, addToast]);

    const handleSaveToDrive = useCallback(async () => {
        if (!isAuthenticated) {
            addToast("Not connected to Google Drive.", 'error');
            return;
        }

        try {
            setIsSyncing(true);
            const folderId = await getAppFolderId();
            const projectData = getAllProjectData();
            const fileName = `Prompt_Modifier_Project_${Date.now()}.json`;
            const content = JSON.stringify(projectData, null, 2);

            await saveFileToDrive(fileName, content, folderId);
            addToast("Project saved to Google Drive!", 'success');
        } catch (e: any) {
            console.error(e);
            addToast(`Save failed: ${e.message}`, 'error');
        } finally {
            setIsSyncing(false);
        }
    }, [isAuthenticated, getAllProjectData, addToast]);

    // NEW: Upload specific catalog item or library item
    const uploadCatalogItem = useCallback(async (item: CatalogItem | LibraryItem, context: 'characters' | 'sequences' | 'library' | 'scripts') => {
        if (!isAuthenticated) {
            addToast("Not connected to Google Drive.", 'error');
            return;
        }

        try {
            setIsSyncing(true);
            const folderId = await getAppFolderId();
            
            // Construct filename
            const safeName = item.name.replace(/[^a-z0-9а-яё\s-_]/gi, '').trim().replace(/\s+/g, '_');
            const timestamp = Date.now();
            const fileName = `Catalog_${context}_${safeName}_${timestamp}.json`;

            // Wrap Data
            const wrapper = {
                appName: "Script_modifier",
                catalogContext: context,
                root: item
            };

            const content = JSON.stringify(wrapper, null, 2);
            await saveFileToDrive(fileName, content, folderId);
            addToast(`"${item.name}" uploaded to Cloud!`, 'success');
        } catch (e: any) {
            console.error(e);
            addToast(`Upload failed: ${e.message}`, 'error');
        } finally {
            setIsSyncing(false);
        }
    }, [isAuthenticated, addToast]);

    // NEW: Sync all relevant files from Drive
    const syncCloudItems = useCallback(async () => {
        if (!isAuthenticated) {
             addToast("Not connected to Google Drive.", 'error');
             return;
        }
        setIsSyncing(true);
        
        try {
            const folderId = await getAppFolderId();
            const files = await listFilesInAppFolder(folderId);
            
            let importedCount = 0;
            const newCatalogItems: CatalogItem[] = [];
            const newLibraryItems: LibraryItem[] = [];

            for (const file of files) {
                // Check if file matches our protocol pattern or is a JSON
                if (file.name.startsWith('Catalog_') && file.name.endsWith('.json')) {
                    try {
                        const content = await downloadFileContent(file.id);
                        const data = JSON.parse(content);

                        if (data.appName && data.catalogContext && data.root) {
                            // Protocol Match
                            const item = data.root;
                            // Reset ID to avoid collision or allow merge logic to handle it
                            // Actually, keeping ID might be useful for update logic, but for now we treat as new import if ID doesn't exist
                            
                            switch (data.catalogContext) {
                                case 'characters':
                                    // Can be CHARACTERS or GROUP (if grouped)
                                    // Assume data.root is a CatalogItem
                                    // Fix type if needed, older files might have 'item'
                                    if (!item.type || item.type === 'item') item.type = CatalogItemType.CHARACTERS;
                                    newCatalogItems.push(item);
                                    break;
                                case 'sequences':
                                    if (!item.type || item.type === 'item') item.type = CatalogItemType.FINAL_PROMPTS;
                                    newCatalogItems.push(item);
                                    break;
                                case 'scripts':
                                    if (!item.type || item.type === 'item') item.type = CatalogItemType.SCRIPT;
                                    newCatalogItems.push(item);
                                    break;
                                case 'library':
                                    // Library Item
                                    if (item.type === 'folder') item.type = LibraryItemType.FOLDER;
                                    else if (item.type === 'prompt') item.type = LibraryItemType.PROMPT;
                                    newLibraryItems.push(item);
                                    break;
                            }
                            importedCount++;
                        }
                    } catch (e) {
                        console.warn(`Failed to process file ${file.name}`, e);
                    }
                }
            }

            if (mergeCatalogItems && newCatalogItems.length > 0) {
                mergeCatalogItems(newCatalogItems);
            }
            if (mergeLibraryItems && newLibraryItems.length > 0) {
                mergeLibraryItems(newLibraryItems);
            }

            addToast(`Cloud Sync Complete. ${importedCount} items processed.`, 'success');

        } catch (e: any) {
            console.error(e);
            addToast(`Sync failed: ${e.message}`, 'error');
        } finally {
            setIsSyncing(false);
        }
    }, [isAuthenticated, addToast, mergeCatalogItems, mergeLibraryItems]);


    const handleSyncCatalogs = useCallback(async () => {
        // Kept for backward compatibility or different logic if needed, 
        // but generally syncCloudItems should replace it for the new protocol.
        // For now, redirect to the new robust one.
        await syncCloudItems();
    }, [syncCloudItems]);

    const handleCleanupDuplicates = useCallback(async () => {
        if (!isAuthenticated) return;
        setIsSyncing(true);
        try {
            const folderId = await getAppFolderId();
            const files = await listFilesInAppFolder(folderId);
            
            const groups: Record<string, any[]> = {};
            files.forEach((f: any) => {
                if (!groups[f.name]) groups[f.name] = [];
                groups[f.name].push(f);
            });

            let deletedCount = 0;
            for (const name in groups) {
                const group = groups[name];
                if (group.length > 1) {
                    group.sort((a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime());
                    for (let i = 1; i < group.length; i++) {
                        await deleteFile(group[i].id);
                        deletedCount++;
                    }
                }
            }
            addToast(`Cleanup complete. Deleted ${deletedCount} duplicates.`, 'success');
        } catch (e: any) {
            addToast(`Cleanup failed: ${e.message}`, 'error');
        } finally {
            setIsSyncing(false);
        }
    }, [isAuthenticated, addToast]);

    return {
        isAuthenticated,
        clientId,
        setClientId: (id: string) => {
            setClientId(id);
            localStorage.setItem('settings_googleClientId', id);
        },
        handleConnect,
        handleSaveToDrive,
        handleSyncCatalogs,
        handleCleanupDuplicates,
        isSyncing,
        uploadCatalogItem,
        syncCloudItems
    };
};
