import React, { useRef, useEffect, useState } from 'react';
import { Icon, Button } from '@atomic-reactor/reactium-ui';
import Reactium, { useHookComponent, useIsContainer } from 'reactium-core/sdk';
import op from 'object-path';
import _ from 'underscore';
import Enums from '../enums';

/**
 * -----------------------------------------------------------------------------
 * Functional Component: IconPicker
 * -----------------------------------------------------------------------------
 */
const CTIconPicker = props => {
    const defaultIcon = Enums.DEFAULT_ICON;
    const containerRef = useRef();
    const [state, setState] = useState({
        icon: defaultIcon,
        showPicker: false,
    });

    const update = updates => {
        const newState = {
            ...state,
            ...updates,
        };

        setState(newState);
    };

    const IconPicker = useHookComponent('IconPicker', null);

    const onIconChange = e => {
        const { value } = e.target;
        const [icon] = _.flatten([value]);

        if (icon && icon !== state.icon && op.has(Icon, icon)) {
            update({
                showPicker: false,
                icon,
            });
        }
    };

    const onButtonClick = () => {
        update({
            showPicker: !state.showPicker,
        });
    };

    const isContainer = useIsContainer();

    const autoHidePanel = e => {
        const container = containerRef.current;
        if (!container || isContainer(e.target, container)) return;
        update({ showPicker: false });
    };

    // auto hide
    useEffect(() => {
        if (typeof window === 'undefined') return;
        window.addEventListener('mousedown', autoHidePanel);
        window.addEventListener('touchstart', autoHidePanel);

        return () => {
            window.removeEventListener('mousedown', autoHidePanel);
            window.removeEventListener('touchstart', autoHidePanel);
        };
    });

    useEffect(() => {
        const hookId = Reactium.Hook.register(
            'content-type-form-update',
            async ({ value }) => {
                const icon = op.get(value, 'meta.icon', defaultIcon);
                if (icon && icon !== state.icon && op.has(Icon, icon)) {
                    update({ icon });
                }
            },
        );

        return () => {
            Reactium.Hook.unregister(hookId);
        };
    });

    return (
        <div className='type-icon'>
            <input
                type='hidden'
                name='meta.icon'
                value={state.icon || defaultIcon}
            />
            <Button
                size={Button.ENUMS.SIZE.SM}
                color={Button.ENUMS.COLOR.PRIMARY}
                style={{ width: '40px' }}
                onClick={onButtonClick}>
                <Icon name={state.icon} />
            </Button>
            {state.showPicker && (
                <div className='type-icon-picker' ref={containerRef}>
                    <IconPicker onChange={onIconChange} />
                </div>
            )}
        </div>
    );
};

export default CTIconPicker;
