import React, { useState, useRef, useEffect } from 'react';
import Reactium, {
    __,
    useHookComponent,
    useAsyncEffect,
    useFulfilledObject,
} from 'reactium-core/sdk';

import {
    Button,
    Icon,
    DatePicker,
    TimePicker,
    Dialog,
    Dropdown,
} from '@atomic-reactor/reactium-ui';

import op from 'object-path';
import _ from 'underscore';
import cn from 'classnames';
import uuid from 'uuid/v4';

const ENUMS = {
    DEFAULT_STATUSES: ['DRAFT', 'PUBLISHED'],
    MODES: {
        LOADING: 'LOADING',
        LOADED: 'LOADED',
    },
    CAPS: {
        PUBLISH: collection => [
            [`${collection}.publish`, 'publish-content'],
            false,
        ],
        UNPUBLISH: collection => [
            [`${collection}.unpublish`, 'unpublish-content'],
            false,
        ],
        STATUS: (collection, status) => [
            [`${collection}.setStatus-${status}`, 'set-content-status'],
            false,
        ],
    },
    BUTTON_MODES: {
        PUBLISH: {
            text: __('Publish'),
            tooltip: __('Publish current version of content'),
        },
        UNPUBLISH: {
            text: __('Unpublish'),
            tooltip: __('Unpublish current version of content'),
        },
        SET_STATUS: {
            text: __('Set Status'),
            tooltip: __('Set status on current version of content.'),
        },
        DISABLED: {
            text: __('Disabled'),
            tooltip: __(
                'You do not have permission to do anything to this content.',
            ),
        },
    },
};

const usePublisherSettings = props => {
    const contentType = op.get(props, 'editor.contentType');
    const collection = op.get(contentType, 'collection');
    const statuses = _.chain((op.get(props, 'statuses', '') || '').split(','))
        .without(...ENUMS.DEFAULT_STATUSES)
        .compact()
        .uniq()
        .sort()
        .value();

    const simple = !!op.get(props, 'simple');

    const can = {};

    const [config, setConfig] = useState({ can, simple, statuses });

    useAsyncEffect(
        async isMounted => {
            const can = {
                publish: await Reactium.Capability.check(
                    ...ENUMS.CAPS.PUBLISH(collection),
                ),
                unpublish: await Reactium.Capability.check(
                    ...ENUMS.CAPS.UNPUBLISH(collection),
                ),
            };

            const canStatus = {};
            for (const status of statuses) {
                const can = await Reactium.Capability.check(
                    ...ENUMS.CAPS.STATUS(collection, status),
                );
                op.set(canStatus, status, can);
            }

            if (isMounted())
                setConfig({
                    ...config,
                    can: {
                        ...can,
                        status: canStatus,
                    },
                });
        },
        [contentType.objectId],
    );

    return useFulfilledObject(config, [
        'statuses',
        'can.publish',
        'can.unpublish',
        'can.status',
    ]);
};

const UnsavedNotice = props => {
    return (
        <div className='p-xs-20'>
            {__('Save content to see publishing options.')}
        </div>
    );
};

const ContentStatus = props => {
    const ddRef = useRef();
    const { editor, config } = props;
    const simple = op.get(config, 'simple', false);
    const [statusState, setStatusState] = useState({
        currentStatus: op.get(editor, 'value.status'),
        selectedStatus: op.get(editor, 'value.status'),
    });

    const { currentStatus, selectedStatus } = statusState;
    const statusLabel = __('Status: %status')
        .split('%status')
        .map(label => {
            if (label.length) return <span key='status-label'>{label}</span>;
            else return <strong key={currentStatus}>{currentStatus}</strong>;
        });

    const changeButtonLabel = __('Change');

    const updateStatus = status => {
        const newStatusState = {
            ...statusState,
            ...status,
        };
        setStatusState(newStatusState);
    };

    const statuses = config.statuses.filter(
        status => config.can.status[status],
    );

    const _contentStatusEventHandler = e => {
        const status = op.get(e.detail, 'value.status');
        updateStatus({ currentStatus: status, selectedStatus: status });
        ddRef.current.setState({ selection: [status] });
    };

    // On submit handler
    useEffect(() => {
        if (editor.unMounted()) return;
        editor.addEventListener(
            'content-set-status',
            _contentStatusEventHandler,
        );

        return () => {
            editor.removeEventListener(
                'content-set-status',
                _contentStatusEventHandler,
            );
        };
    }, [editor]);

    const canChangeStatus = () => {
        // simple workflow
        if (simple) return false;
        // no extra statuses
        if (!statuses.length) return false;
        // can't change status if published
        if (currentStatus === 'PUBLISHED') return false;

        return true;
    };

    if (!canChangeStatus()) {
        return <div className='status-label'>{statusLabel}</div>;
    }

    return (
        <Dialog
            className={'publish-status-dialog'}
            header={{
                title: <div className='status-label'>{statusLabel}</div>,
            }}
            dismissable={false}>
            <div className={'publish-status-dialog-content'}>
                <Dropdown
                    ref={ddRef}
                    className='publish-status-dropdown'
                    data={statuses.map(status => ({
                        label: status,
                        value: status,
                    }))}
                    maxHeight={160}
                    selection={[selectedStatus]}
                    onChange={val => {
                        const selectedStatus = op.get(val, 'item.value');
                        if (selectedStatus)
                            updateStatus({
                                selectedStatus,
                            });
                    }}>
                    <Button
                        color={Button.ENUMS.COLOR.TERTIARY}
                        data-dropdown-element>
                        {selectedStatus}
                    </Button>
                </Dropdown>
                <Button
                    disabled={currentStatus === selectedStatus}
                    className='publish-status-set'
                    color={Button.ENUMS.COLOR.PRIMARY}
                    data-dropdown-element
                    onClick={() => editor.setContentStatus(selectedStatus)}>
                    {changeButtonLabel}
                </Button>
            </div>
        </Dialog>
    );
};

const PublisherEditor = props => {
    const id = op.get(props, 'editor.value.objectId');
    const [config, ready] = usePublisherSettings(props);
    const ElementDialog = useHookComponent('ElementDialog');

    const editor = op.get(props, 'editor');
    const unsaved = !id;

    const render = () => {
        if (!id) return <UnsavedNotice {...props} />;

        return (
            <>
                <ContentStatus editor={editor} config={config} />
            </>
        );
    };

    return (
        ready && (
            <ElementDialog {...props}>
                <div className={cn('publisher-editor', { unsaved })}>
                    {render()}
                </div>
            </ElementDialog>
        )
    );
};

export default PublisherEditor;
