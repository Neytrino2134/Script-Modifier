import { app } from './ru/app';
import { ui } from './ru/ui';
import { nodes } from './ru/nodes';
import { modules } from './ru/modules';
import { catalog } from './ru/catalog';
import { dialogs } from './ru/dialogs';
import { instructions } from './ru/instructions';

export const ru = {
    ...app,
    ...ui,
    ...nodes,
    ...modules,
    ...catalog,
    ...dialogs,
    ...instructions
};