import _ from 'underscore';
import cn from 'classnames';
import op from 'object-path';

import { Link } from 'react-router-dom';
import { __, useHookComponent, useIsContainer, Zone } from 'reactium-core/sdk';
import { Button, Collapsible, Icon } from '@atomic-reactor/reactium-ui';

import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from 'react';

export const ListColumn = ({ column, list, row, ...props }) => {
    const { className, id, zones } = column;
    return (
        <div className={className}>
            {zones.map(zone => (
                <Zone
                    key={zone}
                    zone={zone}
                    list={list}
                    row={row}
                    column={column}
                    {...props}
                />
            ))}
        </div>
    );
};

export const ListItem = forwardRef(({ list, ...props }, ref) => {
    const containerRef = useRef();
    const collapsibleRef = useRef();
    const deleteBtn = useRef();

    const { slug } = props;
    const { state = {}, cx, id } = list;
    const { columns, type } = state;

    const url = `/admin/content/${type}/${slug}`;

    const ListColumn = useHookComponent(`${id}Column`);

    const [confirm, setConfirm] = useState(false);

    const [expanded] = useState(false);

    const isContainer = useIsContainer();

    const deleteCancel = e => {
        if (e.type === 'mouseleave') {
            if (isContainer(e.currentTarget, containerRef.current)) {
                setConfirm(false);
            }
        } else {
            if (isContainer(e.target, containerRef.current)) return;
        }
        deleteBtn.current.blur();
        setConfirm(false);
    };

    const deleteConfirm = e => {
        e.target.blur();
        list.deleteContent(props.objectId);
    };

    const deleteConfirmToggle = () => {
        setConfirm(!confirm);
        handle.collapse();
    };

    const _handle = () => {
        const output = {
            deleteCancel,
            deleteConfirm,
            deleteConfirmToggle,
        };

        if (collapsibleRef.current) {
            const { collapse, expand, toggle } = collapsibleRef.current;
            op.set(output, 'collapse', collapse);
            op.set(output, 'expand', expand);
            op.set(output, 'toggle', toggle);
        }

        if (containerRef.current) {
            op.set(output, 'container', containerRef.current);
        }

        return output;
    };

    const [handle, setHandle] = useState(_handle());

    useEffect(() => {
        if (!collapsibleRef.current) return;

        const newHandle = _handle();
        if (_.isEqual(handle, newHandle)) return;
        setHandle(newHandle);
    }, [collapsibleRef.current, containerRef.current, confirm, expanded]);

    useEffect(() => {
        if (!containerRef.current || typeof window === 'undefined') return;
        window.addEventListener('mousedown', deleteCancel);
        window.addEventListener('touchstart', deleteCancel);

        return () => {
            window.removeEventListener('mousedown', deleteCancel);
            window.removeEventListener('touchstart', deleteCancel);
        };
    }, [containerRef.current]);

    useImperativeHandle(ref, () => handle);

    return !columns ? null : (
        <div
            ref={containerRef}
            onMouseLeave={e => deleteCancel(e)}
            className={cx('item-container')}
            data-id={`item-${props.objectId}`}>
            <div className={cx('item')}>
                <div className={cn(cx('item-delete'), { confirm })}>
                    <Button
                        color={Button.ENUMS.COLOR.DANGER}
                        ref={deleteBtn}
                        type='button'
                        onClick={deleteConfirm}>
                        {__('Delete')}
                    </Button>
                </div>
                <div className={cn(cx('item-columns'), { confirm })}>
                    {columns.map(column => (
                        <ListColumn
                            key={column.id}
                            url={url}
                            column={column}
                            list={list}
                            row={handle}
                            {...props}
                        />
                    ))}
                </div>
            </div>
            <Collapsible
                ref={collapsibleRef}
                className={cx('item-editor')}
                expanded={expanded}>
                QUICK EDIT
                <Zone zone={cx('item-quick-edit')} />
                <Zone zone={cx(`item-quick-edit-${type}`)} />
            </Collapsible>
        </div>
    );
});

export const ListItemActions = ({ url, column, row }) => {
    return (
        <>
            <Button
                type='link'
                to={url}
                style={{ padding: 0, width: 50 }}
                color={Button.ENUMS.COLOR.CLEAR}
                size={Button.ENUMS.SIZE.XS}>
                <span>
                    <Icon name='Feather.Edit2' />
                </span>
            </Button>
            <Button
                color={Button.ENUMS.COLOR.CLEAR}
                type='button'
                style={{ padding: 0, width: 50 }}
                onClick={() => row.deleteConfirmToggle()}
                size={Button.ENUMS.SIZE.XS}>
                <span className='red'>
                    <Icon name='Feather.Trash2' />
                </span>
            </Button>
        </>
    );
};

const statusToColor = status => {
    const COLOR = Button.ENUMS.COLOR;

    const def = COLOR.INFO;

    const map = {
        PUBLISHED: COLOR.SUCCESS,
        DELETE: COLOR.DANGER,
        DRAFT: COLOR.TERTIARY,
    };

    return op.get(map, String(status).toUpperCase(), def);
};

export const ListItemStatus = ({ column, status }) => (
    <Button
        appearance={Button.ENUMS.APPEARANCE.PILL}
        readOnly
        outline
        color={statusToColor(status)}
        size={Button.ENUMS.SIZE.XS}>
        {status}
    </Button>
);

export const ListItemTitle = ({ column, slug, title, url }) => (
    <Link
        to={url}
        style={{ display: 'block', flexGrow: 1, textDecoration: 'none' }}>
        <div>
            <div className='title'>{title}</div>
            <div className='slug'>/{slug}</div>
        </div>
    </Link>
);
