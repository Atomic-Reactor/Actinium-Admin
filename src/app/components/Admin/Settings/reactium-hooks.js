import Reactium from 'reactium-core/sdk';
import SidebarWidget from './SidebarWidget';

const PLUGIN = 'admin-settings';

const settingsPlugin = async () => {
    await Reactium.Plugin.register(PLUGIN);

    await Reactium.Plugin.addComponent({
        id: `${PLUGIN}-admin-sidebar-menu`,
        component: SidebarWidget,
        zone: ['admin-sidebar-menu'],
        order: 1000,
    });
};

settingsPlugin();
