/**
 * 1. Show panel that allows you to select how many columns
 * 2. Size of each column.
 * 3. Insert
 */

import _ from 'underscore';
import Panel from './Panel';
import op from 'object-path';
import { Editor, Transforms } from 'slate';
import { useSlate } from 'slate-react';
import RTEPlugin from '../../RTEPlugin';
import Reactium from 'reactium-core/sdk';
import React, { useEffect, useState } from 'react';
import { Button, Icon } from '@atomic-reactor/reactium-ui';

const Plugin = new RTEPlugin({ type: 'grid', order: 100 });

Plugin.callback = editor => {
    const onButtonClick = e => {
        const btn = e.currentTarget;

        let {
            x,
            y,
            width,
        } = editor.sidebar.container.current.getBoundingClientRect();
        x += width;

        editor.panel
            .setID(Plugin.type)
            .setContent(<Panel selection={editor.selection} />)
            .moveTo(x, y)
            .show();
    };

    // register leaf format
    Reactium.RTE.Format.register('row', {
        element: ({ ID, children, type, ...props }) => {
            return (
                <div id={ID} type={type} className='row' children={children} />
            );
        },
    });

    Reactium.RTE.Format.register('col', {
        element: ({ ID, column, children, type, ...props }) => {
            return (
                <div type={type} className={column}>
                    <div>{children}</div>
                </div>
            );
        },
    });

    // register toolbar button
    Reactium.RTE.Button.register(Plugin.type, {
        order: 60,
        sidebar: true,
        button: props => {
            return (
                <Button
                    {...Reactium.RTE.ENUMS.PROPS.BUTTON}
                    onClick={onButtonClick}
                    {...props}>
                    <Icon
                        {...Reactium.RTE.ENUMS.PROPS.ICON}
                        name='Feather.Sidebar'
                    />
                </Button>
            );
        },
    });

    // register hotkeys
    Reactium.RTE.Hotkey.register('grid-backspace', {
        keys: ['backspace'],
        order: 100,
        callback: ({ editor, event }) => {
            const [parent] = Editor.parent(editor, editor.selection);
            const [node] = Editor.node(editor, editor.selection);

            const isEmpty = _.chain([op.get(node, 'text')])
                .compact()
                .isEmpty()
                .value();

            if (!isEmpty) return;

            let type = op.get(parent, 'type');
            type = String(type).toLowerCase();

            if (type === 'row' || type === 'col') {
                event.preventDefault();
                return false;
            }
        },
    });

    Reactium.RTE.Hotkey.register('grid-enter', {
        keys: ['enter'],
        order: 100,
        callback: ({ editor, event }) => {
            const [parent, parentAt] = Editor.parent(editor, editor.selection);
            let [node, nodeAt] = Editor.node(editor, editor.selection);

            const text = op.get(node, 'text');
            const isEmpty = _.chain([text])
                .compact()
                .isEmpty()
                .value();

            let type = op.get(parent, 'type');
            type = String(type).toLowerCase();

            if (type === 'row' || type === 'col') {
                if (isEmpty) return;
                event.preventDefault();
                return false;
            }
        },
    });

    return editor;
};

export default Plugin;
