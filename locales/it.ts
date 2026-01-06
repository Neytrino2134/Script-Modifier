
import { app } from './it/app';
import { ui } from './it/ui';
import { nodes } from './it/nodes';
import { modules } from './it/modules';
import { catalog } from './it/catalog';
import { dialogs } from './it/dialogs';
import { instructions } from './it/instructions';

export const it = {
    ...app,
    ...ui,
    ...nodes,
    ...modules,
    ...catalog,
    ...dialogs,
    ...instructions
};
