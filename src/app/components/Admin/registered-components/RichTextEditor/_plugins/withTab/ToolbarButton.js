import React from 'react';
import _ from 'underscore';
import uuid from 'uuid/v4';
import { Editor, Transforms } from 'slate';
import { ReactEditor, useEditor } from 'slate-react';
import Reactium, { __, useHookComponent } from 'reactium-core/sdk';

export default props => {
    const editor = useEditor();
    const { Button, Icon } = useHookComponent('ReactiumUI');

    const onClick = () => {
        Transforms.insertNodes(editor, [
            {
                type: 'block',
                blocked: true,
                children: [
                    {
                        id: uuid(),
                        children: [{ text: '' }],
                        content: [{ children: [{ text: '' }], type: 'empty' }],
                        tabs: ['Tab 1'],
                        type: 'tabs',
                        vertical: false,
                    },
                ],
            },
            {
                type: 'p',
                children: [{ text: '' }],
            },
        ]);

        Transforms.move(editor, Editor.end(editor));
        ReactEditor.focus(editor);
    };

    return (
        <Button
            {...Reactium.RTE.ENUMS.PROPS.BUTTON}
            onClick={onClick}
            data-tooltip={__('Add Tabs')}
            data-vertical-align='middle'
            data-align='right'
            {...props}>
            <Icon
                {...Reactium.RTE.ENUMS.PROPS.ICON}
                name='Linear.NewTab'
                size={18}
            />
        </Button>
    );
};
