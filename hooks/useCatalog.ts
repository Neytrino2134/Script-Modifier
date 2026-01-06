import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Group, Node, Connection, NodeType, CatalogItem, CatalogItemType } from '../types';

const STORAGE_KEY = 'group-catalog-items';

const defaultCatalogItems: CatalogItem[] = [
    {
      id: 'default-base-script-chain-1',
      type: CatalogItemType.GROUP,
      name: "Base Script Chain",
      parentId: null,
      category: 'GROUP',
      nodes: [
        {
          "id": "node-2-1761968471575",
          "type": NodeType.SCRIPT_GENERATOR,
          "position": {
            "x": 0,
            "y": 0
          },
          "value": "{\"prompt\":\"\",\"targetLanguage\":\"en\",\"characterType\":\"simple\",\"useExistingCharacters\":false,\"narratorEnabled\":true,\"narratorMode\":\"normal\",\"summary\":\"\",\"detailedCharacters\":[],\"scenes\":[],\"uiState\":{\"isSummaryCollapsed\":false,\"collapsedCharacters\":[],\"collapsedScenes\":[]}}",
          "title": "Генератор сценариев",
          "width": 700,
          "height": 800
        },
        {
          "id": "node-3-1761968527117",
          "type": NodeType.SCRIPT_ANALYZER,
          "position": {
            "x": 780,
            "y": 0
          },
          "value": "{\"characters\":[],\"scenes\":[],\"targetLanguage\":\"en\"}",
          "title": "Анализатор сценария",
          "width": 680,
          "height": 800
        },
        {
          "id": "node-4-1761968532886",
          "type": NodeType.SCRIPT_PROMPT_MODIFIER,
          "position": {
            "x": 1540,
            "y": 0
          },
          "value": "{\"finalPrompts\":[],\"targetLanguage\":\"en\",\"startFrameNumber\":null,\"styleOverride\":\"\"}",
          "title": "Финалайзер промптов",
          "width": 680,
          "height": 800
        }
      ],
      connections: [
        {
          "fromNodeId": "node-2-1761968471575",
          "toNodeId": "node-3-1761968527117",
          "fromHandleId": "all-script-parts",
          "id": "conn-1761968530829-ctj2uh91t"
        },
        {
          "fromNodeId": "node-3-1761968527117",
          "toNodeId": "node-4-1761968532886",
          "fromHandleId": "all-script-analyzer-data",
          "toHandleId": "all-script-analyzer-data",
          "id": "conn-1761968536068-rm7n9lqr1"
        }
      ]
    }
];

const getContextString = (type: CatalogItemType | null | undefined | string): string => {
    switch (type) {
        case CatalogItemType.GROUP: return 'groups';
        case CatalogItemType.CHARACTERS: return 'characters';
        case CatalogItemType.SCRIPT: return 'scripts';
        case CatalogItemType.ANALYSIS: return 'analysis';
        case CatalogItemType.FINAL_PROMPTS: return 'final_prompts';
        case CatalogItemType.YOUTUBE: return 'youtube';
        case CatalogItemType.MUSIC: return 'music';
        default: return 'groups';
    }
};

export const useCatalog = (t: (key: string) => string) => {
    const [catalogItems, setCatalogItems] = useState<CatalogItem[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : defaultCatalogItems;
        } catch (error) {
            console.error("Failed to load group catalog from storage", error);
            return defaultCatalogItems;
        }
    });

    const [navigationHistory, setNavigationHistory] = useState<Array<string | null>>([null]);
    const [activeCategory, setActiveCategory] = useState<CatalogItemType | null>(CatalogItemType.GROUP); // Null could mean root, but we default to GROUP
    const catalogFileInputRef = useRef<HTMLInputElement>(null);

    const currentParentId = navigationHistory[navigationHistory.length - 1];

    const persistItems = (items: CatalogItem[]) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch (error) {
            console.error("Failed to save group catalog to storage", error);
        }
    };

    const currentCatalogItems = useMemo(() => {
        // Filter by parentId first
        let items = catalogItems.filter(item => item.parentId === currentParentId);
        
        // If at root (parentId is null), we also need to filter by the active category
        // Or if inside a folder, we assume the folder belongs to that category/context.
        if (activeCategory) {
             items = items.filter(item => {
                 if (item.type === CatalogItemType.FOLDER) {
                     // If folder has a category assigned, check it.
                     return !item.category || item.category === activeCategory;
                 }
                 return item.type === activeCategory;
             });
        }

        return items.sort((a, b) => {
            if (a.type === b.type) {
                return a.name.localeCompare(b.name);
            }
            return a.type === CatalogItemType.FOLDER ? -1 : 1;
        });
    }, [catalogItems, currentParentId, activeCategory]);

    const catalogPath = useMemo(() => {
        const pathChain: { id: string | null, name: string }[] = [];
        let currentId = currentParentId;
        
        // Walk up the tree
        while (currentId) {
            const folder = catalogItems.find(item => item.id === currentId && item.type === CatalogItemType.FOLDER);
            if (folder) {
                pathChain.push({ id: folder.id, name: folder.name });
                currentId = folder.parentId;
            } else {
                break;
            }
        }
        
        // Correct order: Root -> ... -> Parent -> Child
        // pathChain contains [Child, Parent], so we reverse it.
        return [{ id: null, name: t('catalog.title') }, ...pathChain.reverse()];
    }, [currentParentId, catalogItems, t]);

    const navigateCatalogToFolder = useCallback((folderId: string | null) => {
        // If folderId is in history, slice back to it. Otherwise push.
        const historyIndex = navigationHistory.findIndex(id => id === folderId);
        if (historyIndex > -1) {
            setNavigationHistory(prev => prev.slice(0, historyIndex + 1));
        } else {
            setNavigationHistory(prev => [...prev, folderId]);
        }
    }, [navigationHistory]);

    const navigateCatalogBack = useCallback(() => {
        setNavigationHistory(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));
    }, []);

    const createCatalogItem = useCallback((type: CatalogItemType) => {
        if (type !== CatalogItemType.FOLDER) return;

        const newItem: CatalogItem = {
            id: `cat-item-${Date.now()}`,
            type,
            name: t('library.actions.newFolder'),
            parentId: currentParentId,
            category: activeCategory || undefined, // Assign current category to folder
        };
        setCatalogItems(prev => {
            const updated = [...prev, newItem];
            persistItems(updated);
            return updated;
        });
    }, [currentParentId, t, activeCategory]);

    const saveGroupToCatalog = useCallback((group: Group, allNodes: Node[], allConnections: Connection[]) => {
        const memberNodes = allNodes.filter(n => group.nodeIds.includes(n.id));
        if (memberNodes.length === 0) return;

        const memberNodeIds = new Set(memberNodes.map(n => n.id));
        const internalConnections = allConnections.filter(c =>
            memberNodeIds.has(c.fromNodeId) && memberNodeIds.has(c.toNodeId)
        );

        const nodesToSave: Node[] = JSON.parse(JSON.stringify(memberNodes));
        const connectionsToSave: Connection[] = JSON.parse(JSON.stringify(internalConnections));
        
        const minX = Math.min(...nodesToSave.map((n: Node) => n.position.x));
        const minY = Math.min(...nodesToSave.map((n: Node) => n.position.y));

        nodesToSave.forEach((n: Node) => {
            n.position.x -= minX;
            n.position.y -= minY;
        });

        const newCatalogItem: CatalogItem = {
            id: `catalog-item-${Date.now()}`,
            type: CatalogItemType.GROUP,
            name: group.title,
            parentId: currentParentId,
            category: CatalogItemType.GROUP,
            nodes: nodesToSave,
            connections: connectionsToSave,
        };

        setCatalogItems(current => {
            const updated = [...current, newCatalogItem];
            persistItems(updated);
            return updated;
        });
    }, [currentParentId]);

    const saveGenericItemToCatalog = useCallback((type: CatalogItemType, name: string, data: any) => {
        const newItem: CatalogItem = {
            id: `catalog-item-${Date.now()}`,
            type,
            name,
            parentId: currentParentId,
            category: type, // Category matches type for data items
            data: data
        };
        setCatalogItems(current => {
            const updated = [...current, newItem];
            persistItems(updated);
            return updated;
        });
    }, [currentParentId]);

    const renameCatalogItem = useCallback((itemId: string, newName: string) => {
        if (!newName || !newName.trim()) return;
        setCatalogItems(current => {
            const updated = current.map(item =>
                item.id === itemId ? { ...item, name: newName.trim() } : item
            );
            persistItems(updated);
            return updated;
        });
    }, []);

    const deleteCatalogItem = useCallback((itemId: string) => {
        setCatalogItems(prev => {
            const idsToDelete = new Set<string>([itemId]);
            const itemToDelete = prev.find(i => i.id === itemId);

            if (itemToDelete?.type === CatalogItemType.FOLDER) {
                const queue = [itemId];
                while (queue.length > 0) {
                    const currentId = queue.shift();
                    for (const item of prev) {
                        if (item.parentId === currentId) {
                            idsToDelete.add(item.id);
                            if (item.type === CatalogItemType.FOLDER) {
                                queue.push(item.id);
                            }
                        }
                    }
                }
            }
            
            const updated = prev.filter(item => !idsToDelete.has(item.id));
            persistItems(updated);
            return updated;
        });
    }, []);

    const saveCatalogItemToDisk = useCallback((itemId: string) => {
        const item = catalogItems.find(i => i.id === itemId);
        if (!item) return;
        
        let rootContent: any;
        
        if (item.type === CatalogItemType.FOLDER) {
             const getFolderContents = (folderId: string): any => {
                const folder = catalogItems.find(i => i.id === folderId);
                if (!folder) return null;
                
                const children = catalogItems.filter(i => i.parentId === folderId);
                return {
                    name: folder.name,
                    type: 'folder',
                    category: folder.category,
                    children: children.map(child => {
                        return child.type === CatalogItemType.FOLDER
                            ? getFolderContents(child.id)
                            : { ...child, id: undefined, parentId: undefined, type: child.type === CatalogItemType.GROUP ? 'scriptModifierGroup' : child.type } // Handle legacy vs new type inside folder too
                    })
                };
            };
            rootContent = getFolderContents(itemId);
        } else {
             rootContent = { 
                 ...item, 
                 id: undefined, 
                 parentId: undefined,
                 type: item.type === CatalogItemType.GROUP ? 'scriptModifierGroup' : item.type // Ensure type override for groups
             };
        }

        // Wrap content with Application Name and Context
        const context = getContextString(item.category || item.type);
        const exportObject = {
            appName: "Script_modifier",
            catalogContext: context,
            root: rootContent
        };
        
        const stateString = JSON.stringify(exportObject, null, 2);
        const blob = new Blob([stateString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Format: Catalog_tabname_foldername_date
        const now = new Date();
        const dateString = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const sanitizedName = item.name.replace(/[^a-z0-9а-яё\s-_]/gi, '').trim().replace(/\s+/g, '_');
        const filename = `Catalog_${context}_${sanitizedName}_${dateString}.json`;
        
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        a.remove();
    }, [catalogItems]);

    const handleCatalogFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                const loadedWrapper = JSON.parse(text);

                // 1. Validate Application Name
                if (loadedWrapper.appName !== "Script_modifier") {
                    throw new Error("File does not belong to Script Modifier application.");
                }

                // 2. Validate Tab/Context
                const currentContext = getContextString(activeCategory);
                if (loadedWrapper.catalogContext && loadedWrapper.catalogContext !== currentContext) {
                    throw new Error(`File belongs to '${loadedWrapper.catalogContext}' tab, but you are currently in '${currentContext}'.`);
                }

                const loadedData = loadedWrapper.root;
                if (!loadedData) {
                     throw new Error("Invalid file structure: 'root' object missing.");
                }

                const newItems: CatalogItem[] = [];
                const recursiveImport = (itemData: any, parentId: string | null) => {
                    const newId = `cat-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    if (!itemData.name || !itemData.type) return;

                    // Map string type to Enum, handling case sensitivity
                    let type: CatalogItemType;
                    const typeLower = String(itemData.type).toLowerCase();

                    if (typeLower === 'folder') {
                        type = CatalogItemType.FOLDER;
                    } else if (itemData.type === 'scriptModifierGroup' || typeLower === 'group') {
                        type = CatalogItemType.GROUP;
                    } else {
                         // Try direct match
                        const directMatch = Object.values(CatalogItemType).find(t => t === itemData.type);
                        if (directMatch) {
                            type = directMatch;
                        } else {
                            // Try upper case match
                            const upper = itemData.type.toUpperCase();
                            const matchedUpper = Object.values(CatalogItemType).find(t => t === upper);
                            if (matchedUpper) {
                                type = matchedUpper;
                            } else {
                                return; // Skip unknown
                            }
                        }
                    }
                    
                    // Ensure category matches current context if imported to root, or inherit
                    const category = itemData.category || activeCategory || undefined;

                    const newItem: CatalogItem = {
                        id: newId,
                        type: type,
                        name: itemData.name,
                        parentId: parentId,
                        category: category,
                        nodes: itemData.nodes,
                        connections: itemData.connections,
                        data: itemData.data
                    };
                    newItems.push(newItem);

                    if (type === CatalogItemType.FOLDER && Array.isArray(itemData.children)) {
                        itemData.children.forEach((child: any) => recursiveImport(child, newId));
                    }
                };
                
                recursiveImport(loadedData, currentParentId);
                
                setCatalogItems(prev => {
                    const updated = [...prev, ...newItems];
                    persistItems(updated);
                    return updated;
                });

            } catch (err: any) {
                alert(`${t('alert.loadCatalogFailed')}: ${err.message}`);
            } finally {
                if (e.target) e.target.value = '';
            }
        };
        reader.readAsText(file);
    }, [t, currentParentId, activeCategory]);

    const triggerLoadFromFile = useCallback(() => {
        catalogFileInputRef.current?.click();
    }, []);

    const moveCatalogItem = useCallback((itemId: string, newParentId: string | null) => {
        setCatalogItems(prev => {
            const itemToMove = prev.find(i => i.id === itemId);
            if (!itemToMove || itemToMove.parentId === newParentId) {
                return prev;
            }
    
            if (itemToMove.type === CatalogItemType.FOLDER) {
                let currentParent = newParentId;
                while (currentParent) {
                    if (currentParent === itemId) {
                        return prev; 
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

    const importCatalog = useCallback((items: CatalogItem[]) => {
        setCatalogItems(items);
        persistItems(items);
    }, []);

    return {
        catalogItems,
        currentCatalogItems,
        catalogPath,
        navigateCatalogBack,
        navigateCatalogToFolder,
        createCatalogItem,
        saveGroupToCatalog,
        saveGenericItemToCatalog,
        renameCatalogItem,
        deleteCatalogItem,
        saveCatalogItemToDisk,
        catalogFileInputRef,
        handleCatalogFileChange,
        triggerLoadFromFile,
        moveCatalogItem,
        activeCategory,
        setActiveCategory,
        importCatalog
    };
};