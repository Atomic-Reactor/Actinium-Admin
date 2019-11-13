import React from 'react';
import op from 'object-path';
import MenuItem from 'components/Admin/MenuItem';
import { Dialog } from '@atomic-reactor/reactium-ui';
import ConfirmBox from 'components/Admin/ConfirmBox';
import { useHandle, useSelect } from 'reactium-core/sdk';

const noop = {
    dismiss: () => {},
    show: () => {},
};

const Widget = () => {
    const Router = useSelect(state => op.get(state, 'Router'));

    const tools = useHandle('AdminTools');

    const Modal = op.get(tools, 'Modal', noop);

    const confirm = () => {
        Router.history.replace('/logout');
        Modal.dismiss();
    };

    const showModal = () =>
        Modal.show(
            <ConfirmBox
                message='Are you sure?'
                onCancel={() => Modal.hide()}
                onConfirm={confirm}
                title='Sign Out'
            />,
        );

    const render = () => (
        <>
            <MenuItem
                label='Sign Out'
                onClick={showModal}
                icon='Linear.PowerSwitch'
            />
        </>
    );

    return render();
};

export default Widget;
