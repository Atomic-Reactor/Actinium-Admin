import React, { useState, useEffect } from 'react';
import cn from 'classnames';
import op from 'object-path';
import Reactium, { useHandle } from 'reactium-core/sdk';
import { Icon } from '@atomic-reactor/reactium-ui';
import { useWindowSize } from '@atomic-reactor/reactium-ui/hooks';

/**
 * -----------------------------------------------------------------------------
 * Component: Toggle
 * Hide/Show the Admin Sidebar
 * -----------------------------------------------------------------------------
 */

const Toggle = ({ zones = [] }) => {
    if (!zones.includes('admin-sidebar')) {
        return null;
    }

    const Sidebar = useHandle('AdminSidebar');

    const [state, setState] = useState(Sidebar.state);

    const expanded = () =>
        op.get(Sidebar, 'state.status') === Sidebar.ENUMS.STATUS.EXPANDED;

    const cname = () =>
        cn({ 'admin-sidebar-toggle': true, expanded: expanded() });

    const { width } = useWindowSize();

    const icon = () => {
        const i =
            Reactium.Utils.breakpoint(width) !== 'xs'
                ? expanded()
                    ? 'Feather.MoreVertical'
                    : 'Feather.Menu'
                : expanded()
                ? 'Feather.X'
                : 'Feather.Menu';

        return i;
    };

    const render = () => {
        return (
            <button
                className={cname()}
                onClick={() => Sidebar.toggle()}
                type='button'>
                <Icon name={icon()} />
            </button>
        );
    };

    return render();
};

export { Toggle as default };
