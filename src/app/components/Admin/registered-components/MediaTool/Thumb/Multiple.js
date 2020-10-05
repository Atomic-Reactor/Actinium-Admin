import _ from 'underscore';
import cn from 'classnames';
import op from 'object-path';
import Toolbar from './Toolbar';
import { TypeIcon } from 'components/Admin/Media/MediaPicker';
import { Scrollbars } from 'react-custom-scrollbars';
import Reactium, { useHookComponent } from 'reactium-core/sdk';

import React from 'react';

const Multiple = ({ selection, handle, media }) => {
    const { cx, nav, remove, removeAll } = handle;

    const { Button, DataTable, Icon } = useHookComponent('ReactiumUI');

    const columns = () => {
        const output = {
            thumb: {
                width: '80px',
            },
            url: {
                verticalAlign: 'middle',
            },
            delete: {
                width: '80px',
                textAlign: 'right',
                verticalAlign: 'middle',
            },
        };

        Reactium.Hook.runSync('media-field-data-table-columns', output);

        return output;
    };

    const data = () =>
        _.compact(
            selection.map(({ objectId }) => {
                const item = op.get(media.data, objectId);
                if (!item) return null;

                const thumbnail = op.get(item, 'thumbnail')
                    ? url(item, 'thumbnail')
                    : null;

                op.set(item, 'url', url(item, 'relative'));

                op.set(
                    item,
                    'delete',
                    <DeleteButton onClick={() => remove(objectId)} />,
                );

                op.set(
                    item,
                    'thumb',
                    <Thumbnail {...item} thumbnail={thumbnail} />,
                );

                return item;
            }),
        );

    return (
        <div className={cn(cx('thumbs'), 'multiple')}>
            <Toolbar nav={nav}>
                <div className='delete-all-container'>
                    <Button
                        className='delete-btn'
                        color={Button.ENUMS.COLOR.DANGER}
                        onClick={() => removeAll()}
                        outline>
                        <Icon name='Feather.X' />
                    </Button>
                </div>
            </Toolbar>
            <div className='table'>
                <Scrollbars>
                    <DataTable columns={columns()} data={data()} />
                </Scrollbars>
            </div>
        </div>
    );
};

export { Multiple, Multiple as default };

const DeleteButton = props => {
    const { Button, Icon } = useHookComponent('ReactiumUI');
    return (
        <Button
            color={Button.ENUMS.COLOR.DANGER}
            className='delete-btn'
            {...props}>
            <Icon name='Feather.X' />
        </Button>
    );
};

const Thumbnail = ({ thumbnail, type }) => (
    <div
        className='thumb'
        style={{ backgroundImage: thumbnail ? `url(${thumbnail})` : null }}>
        {!thumbnail && <TypeIcon type={type} />}
    </div>
);

const url = (item, which) => {
    switch (which) {
        case 'thumbnail':
            return Reactium.Media.url(op.get(item, 'thumbnail'));

        case 'relative':
            return op.get(item, 'url');

        default:
            return op.get(item, 'redirect.url', op.get(item, 'url'));
    }
};
