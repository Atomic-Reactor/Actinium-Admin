import RTEPlugin from '../RTEPlugin';
import { withReact } from 'slate-react';
import { withHistory } from 'slate-history';
import withBold from './withBold';
import withData from './withData';
import withFormatter from './withFormatter';
import withLink from './withLink';
import withItalic from './withItalic';
import withList from './withList';
import withStrike from './withStrike';
import withUnderline from './withUnderline';

export default plugins = {
    withReact: new RTEPlugin({ callback: withReact, order: 0 }),
    withHistory: new RTEPlugin({ callback: withHistory, order: 1 }),
    withData,
    withBold,
    withFormatter,
    withLink,
    withItalic,
    withList,
    withStrike,
    withUnderline,
};
