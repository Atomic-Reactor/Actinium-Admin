import _ from 'underscore';
import op from 'object-path';
import Element from './Element';
import RTEPlugin from '../../RTEPlugin';
import Reactium from 'reactium-core/sdk';
import ToolbarButton from './ToolbarButton';
import { Editor, Node, Path, Transforms } from 'slate';
const Plugin = new RTEPlugin({ type: 'block', order: -1 });

const isColumn = (editor, path) => {
    const nodes = Array.from(Node.ancestors(editor, path, { reverse: true }));
    const columns = nodes.filter(([node]) => {
        if (Editor.isEditor(node)) return false;
        return !!op.get(node, 'column');
    });

    return columns.length > 0;
};

Plugin.callback = editor => {
    // register toolbar button
    Reactium.RTE.Button.register(Plugin.type, {
        order: 0,
        sidebar: true,
        button: ToolbarButton,
    });

    // register block format
    Reactium.RTE.Block.register('block', {
        element: Element,
    });

    // register hotkey: backspace
    Reactium.RTE.Hotkey.register('block-backspace', {
        order: -100000000,
        keys: ['backspace'],
        callback: ({ editor, event }) => {
            const offset = editor.selection.anchor.offset;
            const path = Array.from(editor.selection.anchor.path);
            const node = Reactium.RTE.getNode(editor, path);
            const parent = Reactium.RTE.getNode(editor, node.path);
            const block = Reactium.RTE.getBlock(editor, node.path);

            let canDelete = !offset ? false : offset !== 0;

            // Check parent container's blocked status
            if (offset === 0 && node.empty && !parent.blocked) {
                canDelete = true;
            }

            // no deleting the [0] node
            if (offset === 0 && node.path.join(',') === '0') {
                canDelete = false;
            }

            // check sibling node's blocked status
            if (offset === 0 && canDelete === false) {
                const sibling = Reactium.RTE.before(editor, path);
                canDelete = sibling && op.get(sibling, 'blocked') !== true;
            }

            // Check if we're in a grid column
            if (
                offset === 0 &&
                parent &&
                isColumn(editor, node.path) &&
                op.get(parent.node, 'children', []).length < 2
            ) {
                canDelete = false;
            }

            if (block && block.empty && block.node.blocked) {
                canDelete = false;
            }

            if (!canDelete) {
                event.preventDefault();
                return false;
            }

            return true;
        },
    });

    // Editor overrides
    const { isInline, normalizeNode } = editor;
    editor.isInline = element =>
        element.type === Plugin.type ? false : isInline(element);

    editor.normalizeNode = entry => {
        const path = [editor.children.length - 1];
        const next = [editor.children.length];
        const last = _.object(['node', 'path'], Editor.node(editor, path));

        if (op.get(last.node, 'type') !== 'p') {
            Transforms.insertNodes(
                editor,
                { type: 'p', children: [{ text: '' }] },
                { at: next },
            );
        }

        normalizeNode(entry);
    };

    return editor;
};

export default Plugin;
