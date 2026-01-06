
import { app } from './pt/app';
import { ui } from './pt/ui';
import { nodes } from './pt/nodes';
import { modules } from './pt/modules';
import { catalog } from './pt/catalog';
import { dialogs } from './pt/dialogs';
import { instructions } from './pt/instructions';

export const pt = {
    ...app,
    ...ui,
    ...nodes,
    ...modules,
    ...catalog,
    ...dialogs,
    ...instructions
};
