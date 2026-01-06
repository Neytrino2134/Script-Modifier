
import { app } from './es/app';
import { ui } from './es/ui';
import { nodes } from './es/nodes';
import { modules } from './es/modules';
import { catalog } from './es/catalog';
import { dialogs } from './es/dialogs';
import { instructions } from './es/instructions';

export const es = {
    ...app,
    ...ui,
    ...nodes,
    ...modules,
    ...catalog,
    ...dialogs,
    ...instructions
};
