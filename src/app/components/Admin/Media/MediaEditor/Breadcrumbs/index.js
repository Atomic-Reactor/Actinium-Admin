import React from 'react';
import op from 'object-path';
import ENUMS from 'components/Admin/Media/enums';
import { useHandle, useSelect } from 'reactium-core/sdk';
import { Button, Icon } from '@atomic-reactor/reactium-ui';

export default () => {
    const Editor = useHandle('MediaEditor');

    const ID = op.get(Editor, 'state.value.objectId');

    const path = useSelect(state => op.get(state, 'Router.match.path'));

    const type = op.get(Editor, 'state.value.type');

    const visible = String(path).startsWith('/admin/media/edit/');

    return (
        visible && (
            <ul className='ar-breadcrumbs'>
                <li>
                    <Button
                        appearance='pill'
                        className='px-0'
                        color='clear'
                        size='sm'
                        to='/admin/media/1'
                        type='link'>
                        <Icon name='Linear.Pictures' className='mr-xs-12' />
                        {ENUMS.TEXT.MEDIA}
                    </Button>
                </li>
                <li className='uppercase'>{type}</li>
                <li>{ID}</li>
            </ul>
        )
    );
};
