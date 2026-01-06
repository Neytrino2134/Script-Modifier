
import { app } from './fr/app';
import { ui } from './fr/ui';
import { nodes } from './fr/nodes';
import { modules } from './fr/modules';
import { catalog } from './fr/catalog';
import { dialogs } from './fr/dialogs';
import { instructions } from './fr/instructions';

export const fr = {
    ...app,
    ...ui,
    ...nodes,
    ...modules,
    ...catalog,
    ...dialogs,
    ...instructions
};
