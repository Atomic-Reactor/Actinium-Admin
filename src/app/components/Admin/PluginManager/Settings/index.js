import React, { useEffect } from 'react';
import { useHandle, Zone } from 'reactium-core/sdk';

/**
 * -----------------------------------------------------------------------------
 * Functional Component: PluginManager
 * -----------------------------------------------------------------------------
 */
const PluginSettings = ({ plugin }) => {
    console.log({ plugin });
    const SearchBar = useHandle('SearchBar');
    useEffect(() => SearchBar.setState({ visible: false }));

    return (
        <div className={'plugin-manager-settings'}>
            <Zone zone={`plugin-settings-${plugin.ID}`} plugin={plugin} />
        </div>
    );
};

export default PluginSettings;
