import _ from 'underscore';
import op from 'object-path';
import { Editor, Transforms, Text } from 'slate';
import React, { useEffect, useState } from 'react';
import { Button, Icon } from '@atomic-reactor/reactium-ui';
import Reactium, { useDerivedState } from 'reactium-core/sdk';
import useEditorPlugins from './useEditorPlugins';
import useRegistryFilter from './useRegistryFilter';
import useSelectProps from './useSelectProps';

import ENUMS from '../enums';

const { LIST_TYPES } = ENUMS;

export { useEditorPlugins, useRegistryFilter, useSelectProps };

export const getRange = (index = 0) => {
    try {
        return window.getSelection().getRangeAt(index);
    } catch (err) {}
};

export const getRect = () => {
    if (!getRange()) return;

    try {
        return getRange().getBoundingClientRect();
    } catch (err) {}
};

export const getSelected = () => {
    return !window.getSelection().isCollapsed;
};

export const isBlockActive = (editor, block) => {
    if (!editor) return false;
    if (!block) return false;

    try {
        const [match] = Editor.nodes(editor, {
            match: n => n.type === block,
        });

        return !!match;
    } catch (err) {}
};

export const isMarkActive = (editor, format) => {
    if (!editor) return false;
    if (!format) return false;

    try {
        const marks = Editor.marks(editor) || {};
        return op.has(marks, format);
    } catch (err) {
        return false;
    }
};

export const toggleBlock = (editor, block, e) => {
    if (e) {
        e.preventDefault();
    }

    const isActive = isBlockActive(editor, block);
    const isList = LIST_TYPES.includes(block);

    Transforms.unwrapNodes(editor, {
        match: n => LIST_TYPES.includes(n.type),
        split: true,
    });

    if (isList) {
        Transforms.setNodes(editor, {
            type: isActive ? 'p' : 'li',
        });
    } else {
        Transforms.setNodes(editor, {
            type: isActive ? 'p' : block,
        });
    }

    if (!isActive && isList) {
        const element = { type: block, children: [] };
        Transforms.wrapNodes(editor, element);
    }
};

export const toggleMark = (editor, format, e) => {
    if (op.has(e, 'preventDefault')) e.preventDefault();

    const isActive = isMarkActive(editor, format);

    if (isActive) {
        Editor.removeMark(editor, format);
    } else {
        Editor.addMark(editor, format, true);
    }
};

export const useSelected = () => {
    if (typeof window === 'undefined') return {};

    const [state, setState] = useDerivedState({
        selected: getSelected(),
        range: getRange(),
        rect: getRect(),
        selection: window.getSelection(),
    });

    useEffect(() => {
        setState({
            selected: getSelected(),
            range: getRange(),
            rect: getRect(),
            selection: window.getSelection(),
        });
    }, [getRange(), getSelected()]);

    return state;
};
