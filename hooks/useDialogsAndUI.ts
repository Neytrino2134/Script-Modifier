
import { useState, useCallback } from 'react';
import type { Group, LibraryItem, Point } from '../types';
import { LibraryItemType } from '../types';
import type { Toast } from '../components/ui/ToastContainer';


export const useDialogsAndUI = ({ 
    t, setGroups, renameCatalogItem, updateLibraryItem, libraryItems, 
    deleteLibraryItem, setNodes, setConnections, nodeIdCounter, geminiContext,
    currentCatalogItems, deleteCatalogItem,
    saveDataToCatalog // We will need this passed in
}: any) => {
    const [renameInfo, setRenameInfo] = useState<{ type: 'group' | 'catalog' | 'library' | 'node'; id: string; currentTitle: string } | null>(null);
    const [promptEditInfo, setPromptEditInfo] = useState<LibraryItem | null>(null);
    const [confirmInfo, setConfirmInfo] = useState<{ title: string; message: string; onConfirm: () => void; } | null>(null);
    const [isErrorCopied, setIsErrorCopied] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: 'success' | 'info' = 'info', position?: Point) => {
        const id = Date.now() + Math.random();
        // Keep up to 4 toasts if they are centered, but allow more for cursor-positioned ones.
        const toastsToKeep = position ? toasts : toasts.slice(-4);
        setToasts([...toastsToKeep, { id, message, type, position }]);
    }, [toasts]);

    const removeToast = useCallback((id: number) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const handleCopyError = useCallback(() => {
        if (geminiContext.error) {
            navigator.clipboard.writeText(geminiContext.error).then(() => {
                setIsErrorCopied(true);
            });
        }
    }, [geminiContext.error]);

    const handleRenameGroup = useCallback((groupId: string, currentTitle: string) => { setRenameInfo({ type: 'group', id: groupId, currentTitle }); }, []);
    const handleRenameCatalogItem = useCallback((itemId: string, currentName: string) => { const item = currentCatalogItems.find(i => i.id === itemId); if (item) setRenameInfo({ type: 'catalog', id: itemId, currentTitle: item.name }); }, [currentCatalogItems]);
    const handleRenameLibraryItem = useCallback((itemId: string, currentTitle: string) => { setRenameInfo({ type: 'library', id: itemId, currentTitle }); }, []);
    const handleRenameNode = useCallback((nodeId: string, currentTitle: string) => { setRenameInfo({ type: 'node', id: nodeId, currentTitle }); }, []);

    const confirmRename = (newName: string) => {
        if (!renameInfo || !newName || !newName.trim()) { setRenameInfo(null); return; }
        
        if (renameInfo.type === 'catalog' && renameInfo.id.startsWith('save-node:')) {
            // Format: save-node:NODE_ID:CATALOG_TYPE
            const parts = renameInfo.id.split(':');
            if (parts.length === 3 && saveDataToCatalog) {
                saveDataToCatalog(parts[1], parts[2], newName.trim());
            }
        }
        else if (renameInfo.type === 'group') setGroups(currentGroups => currentGroups.map(g => g.id === renameInfo.id ? { ...g, title: newName.trim() } : g));
        else if (renameInfo.type === 'catalog') renameCatalogItem(renameInfo.id, newName.trim());
        else if (renameInfo.type === 'library') updateLibraryItem(renameInfo.id, { name: newName.trim() });
        else if (renameInfo.type === 'node') setNodes(currentNodes => currentNodes.map(n => n.id === renameInfo.id ? { ...n, title: newName.trim() } : n));
        
        setRenameInfo(null);
    };

    const confirmPromptEdit = (name: string, content: string) => {
        if (promptEditInfo) updateLibraryItem(promptEditInfo.id, { name: name.trim(), content });
        setPromptEditInfo(null);
    };

    const handleDeleteCatalogItem = useCallback((itemId: string) => {
        const item = currentCatalogItems.find(i => i.id === itemId);
        if (!item) return;
        setConfirmInfo({ title: t('dialog.confirmDelete.title'), message: t('dialog.confirmDelete.message', { itemName: item.name }), onConfirm: () => deleteCatalogItem(itemId) });
    }, [currentCatalogItems, t, deleteCatalogItem]);

    const handleDeleteLibraryItem = useCallback((itemId: string) => {
        const item = libraryItems.find(i => i.id === itemId);
        if (!item) return;
        const message = item.type === LibraryItemType.FOLDER ? t('dialog.confirmDelete.folderMessage', { itemName: item.name }) : t('dialog.confirmDelete.message', { itemName: item.name });
        setConfirmInfo({ title: t('dialog.confirmDelete.title'), message, onConfirm: () => deleteLibraryItem(itemId) });
    }, [libraryItems, deleteLibraryItem, t]);
    
    const handleClearCanvas = useCallback(() => {
      setConfirmInfo({ title: t('dialog.confirmClear.title'), message: t('dialog.confirmClear.message'), onConfirm: () => { setNodes([]); setConnections([]); setGroups([]); nodeIdCounter.current = 0; } });
    }, [t, setNodes, setConnections, setGroups, nodeIdCounter]);
    
    return {
        renameInfo, setRenameInfo,
        promptEditInfo, setPromptEditInfo,
        confirmInfo, setConfirmInfo,
        isErrorCopied, handleCopyError,
        toasts,
        addToast,
        removeToast,
        handleRenameGroup, handleRenameCatalogItem, handleRenameLibraryItem, handleRenameNode,
        confirmRename, confirmPromptEdit,
        handleDeleteCatalogItem, handleDeleteLibraryItem,
        handleClearCanvas,
    };
};