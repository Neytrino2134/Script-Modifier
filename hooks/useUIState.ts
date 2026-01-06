
import { useState, useCallback } from 'react';
import { Point } from '../types';

export const useUIState = () => {
    const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [quickAddPosition, setQuickAddPosition] = useState<Point>({ x: 0, y: 0 });
    const [isCatalogOpen, setIsCatalogOpen] = useState(false);
    const [isRadialMenuOpen, setIsRadialMenuOpen] = useState(false);
    const [radialMenuPosition, setRadialMenuPosition] = useState<Point>({ x: 0, y: 0 });
    const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState<Point>({ x: 0, y: 0 });
    const [isContextMenuPinned, setIsContextMenuPinned] = useState(false);
    const [isQuickAddPinned, setIsQuickAddPinned] = useState(false);
    
    // State for connection quick add menu
    const [connectionMenu, setConnectionMenu] = useState<{ 
        isOpen: boolean; 
        position: Point; 
        sourceNodeId: string; 
        sourceHandleId?: string; 
        fromType: 'text' | 'image' | null 
    } | null>(null);

    const openRadialMenu = useCallback((position: Point) => {
        setIsRadialMenuOpen(true);
        setRadialMenuPosition(position);
    }, []);

    const closeRadialMenu = useCallback(() => {
        setIsRadialMenuOpen(false);
    }, []);
    
    const openContextMenu = useCallback((position: Point) => {
        setIsContextMenuOpen(true);
        setContextMenuPosition(position);
    }, []);
    
    const closeContextMenu = useCallback(() => {
        setIsContextMenuOpen(false);
    }, []);

    const toggleContextMenuPin = useCallback(() => {
        setIsContextMenuPinned(prev => !prev);
    }, []);

    const toggleQuickAddPin = useCallback(() => {
        setIsQuickAddPinned(prev => !prev);
    }, []);

    const openQuickSearchMenu = useCallback((position: Point) => {
        setIsQuickSearchOpen(true);
        setQuickAddPosition(position);
    }, []);

    const openQuickAddMenu = useCallback((position: Point) => {
        setIsQuickAddOpen(true);
        setQuickAddPosition(position);
    }, []);
    
    const handleCloseAddNodeMenus = useCallback(() => {
        setIsQuickSearchOpen(false);
        
        if (!isQuickAddPinned) {
            setIsQuickAddOpen(false);
        }
        
        // Do not force close connection menu here, it handles its own closure via click-outside listener.
        // This prevents it from closing when pinned menus trigger this function on canvas click.
        // setConnectionMenu(null); 
        
        closeRadialMenu();
        
        if (!isContextMenuPinned) {
            closeContextMenu();
        }
    }, [closeRadialMenu, closeContextMenu, isContextMenuPinned, isQuickAddPinned]);
    
    const handleToggleCatalog = useCallback(() => setIsCatalogOpen(prev => !prev), []);
    const handleCloseCatalog = useCallback(() => setIsCatalogOpen(false), []);

    return {
        isQuickSearchOpen,
        isQuickAddOpen,
        quickAddPosition,
        openQuickSearchMenu,
        openQuickAddMenu,
        handleCloseAddNodeMenus,
        isCatalogOpen,
        handleToggleCatalog,
        handleCloseCatalog,
        isRadialMenuOpen,
        radialMenuPosition,
        openRadialMenu,
        closeRadialMenu,
        isContextMenuOpen,
        contextMenuPosition,
        openContextMenu,
        closeContextMenu,
        isContextMenuPinned,
        toggleContextMenuPin,
        isQuickAddPinned,
        toggleQuickAddPin,
        connectionMenu,
        setConnectionMenu
    };
};
