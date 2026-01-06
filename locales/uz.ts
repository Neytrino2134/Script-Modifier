
import { app } from './uz/app';
import { ui } from './uz/ui';
import { nodes } from './uz/nodes';
import { modules } from './uz/modules';
import { catalog } from './uz/catalog';
import { dialogs } from './uz/dialogs';
import { instructions } from './uz/instructions';

export const uz = {
    ...app,
    ...ui,
    ...nodes,
    ...modules,
    ...catalog,
    ...dialogs,
    ...instructions
};
