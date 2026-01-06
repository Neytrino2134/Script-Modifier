
import { common } from './instructions/common';
import { generator } from './instructions/generator';
import { analyzer } from './instructions/analyzer';
import { modifier } from './instructions/modifier';
import { music } from './instructions/music';
import { youtube } from './instructions/youtube';
import { narrator } from './instructions/narrator';

export const instructions = {
    ...common,
    ...generator,
    ...analyzer,
    ...modifier,
    ...music,
    ...youtube,
    ...narrator
};
