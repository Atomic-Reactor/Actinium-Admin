import React, { useRef, useEffect, useState, memo } from 'react';
import { Dialog } from '@atomic-reactor/reactium-ui';
import { __, useHookComponent } from 'reactium-core/sdk';
import op from 'object-path';
import _ from 'underscore';

const noop = () => {};
const DragHandle = ({ bind = {} }) => {
    const { Icon } = useHookComponent('ReactiumUI');
    return (
        <div className='list-drag-handle' {...bind}>
            <Icon name={'Linear.Move'} />
            <span className='sr-only'>{__('Click to Drag')}</span>
        </div>
    );
};

const areEqual = (pv, nx) => {
    return op.get(pv, 'item.id') === op.get(nx, 'item.id');
};

const ContentTypeMenuItem = memo(props => {
    const dialogRef = useRef();
    const fieldName = op.get(props, 'fieldName');
    const menuItem = op.get(props, 'item', {});
    const item = op.get(props, 'item.item', {});
    const title = op.get(item, 'title', op.get(item, 'slug'));
    const onRemoveItem = op.get(props, 'onRemoveItem', noop);
    const animateResize = () =>
        op.get(props.listRef.current, 'animateResize', noop)();
    const itemId = menuItem.id;

    useEffect(() => {
        if (dialogRef.current) {
            _.defer(dialogRef.current.collapse);
        }
    }, []);

    return (
        <Dialog
            className={'menu-item menu-item-content-type'}
            header={{
                title,
                elements: [
                    <DragHandle key='dh' bind={op.get(props, 'bind')} />,
                ],
            }}
            pref={`menu-item-${menuItem.id}`}
            ref={dialogRef}
            dismissable={true}
            onDismiss={onRemoveItem(menuItem)}
            onCollapse={() => {
                _.defer(animateResize);
            }}
            onExpand={() => {
                _.defer(animateResize);
            }}>
            <div className={'p-xs-20'}>
                <div className='form-group'>
                    <label>
                        <span>{__('Label')}</span>
                        <input
                            type='text'
                            name={`${fieldName}.${itemId}.label`}
                        />
                    </label>
                </div>
            </div>
        </Dialog>
    );
}, areEqual);

export default ContentTypeMenuItem;
