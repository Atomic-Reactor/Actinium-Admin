import React from 'react';
import ENUMS from '../enums';
import useRouteParams from 'components/Admin/Tools/useRouteParams';
import { Button, Icon } from '@atomic-reactor/reactium-ui';

export default () => {
    const { path } = useRouteParams();
    const visible = String(path).startsWith('/admin/type');

    return (
        visible && (
            <Button
                appearance='pill'
                className='mr-xs-24'
                color='primary'
                outline
                size='xs'
                to='/admin/type/new'
                type='link'>
                <Icon name='Feather.Plus' size={18} />
                <span className='hide-xs show-md ml-sm-12'>
                    {' '}
                    {ENUMS.TEXT.ADD}
                </span>
            </Button>
        )
    );
};
