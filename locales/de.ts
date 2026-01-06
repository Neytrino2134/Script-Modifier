
import { app } from './de/app';
import { ui } from './de/ui';
import { nodes } from './de/nodes';
import { modules } from './de/modules';
import { catalog } from './de/catalog';
import { dialogs } from './de/dialogs';
import { instructions } from './de/instructions';

export const de = {
    ...app,
    ...ui,
    ...nodes,
    ...modules,
    ...catalog,
    ...dialogs,
    ...instructions
};
