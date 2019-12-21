import { __ } from 'reactium-core/sdk';

export default {
    appSettingProps: {
        capabilities: [
            {
                capability: 'admin-ui.view',
                title: __('UI: View Admin Dashboard Page'),
                tooltip: __(
                    'Able to view the admin dashboard page when logged in.',
                ),
            },
            {
                capability: 'settings-ui.view',
                title: __('UI: Settings Admin Page'),
                tooltip: __(
                    'Able to view the settings admin page when logged in.',
                ),
            },
            {
                capability: 'plugins-ui.view',
                title: __('UI: Plugins Admin Page'),
                tooltip: __(
                    'Able to view the plugins manager admin page when logged in.',
                ),
            },
            {
                capability: 'setting.app-get',
                title: __('Setting: View Application Settings group'),
                tooltip: __('Able to see the application settings page.'),
            },
            {
                capability: 'setting.admin-get',
                title: __('Setting: View Admin Settings Group'),
                tooltip: __('Able to access settings in the "admin" group.'),
            },
            {
                capability: 'Setting.retrieve',
                title: __('Setting: Retrieve any settings'),
                tooltip: __(
                    'Able to access any Setting group regardless. (Assign with caution)',
                ),
            },
            {
                capability: 'Setting.create',
                title: __('Setting: Create any setting group.'),
                tooltip: __(
                    'Able to create a new setting group. (Assign with caution)',
                ),
            },
            {
                capability: 'Setting.update',
                title: __('Setting: Update any setting group.'),
                tooltip: __(
                    'Able to update any existing setting group. (Assign with caution)',
                ),
            },
            {
                capability: 'Setting.delete',
                title: __('Setting: Delete any setting group.'),
                tooltip: __(
                    'Able to delete any existing setting group. (Assign with caution)',
                ),
            },
            {
                capability: 'Capability.retrieve',
                title: __('Capability: Retrieve all capabilities.'),
                tooltip: __('Able to access any capability regardless.'),
            },
            {
                capability: 'Capability.create',
                title: __('Capability: Create a capability.'),
                tooltip: __(
                    'Able to create a new capability. (Assign with caution)',
                ),
            },
            {
                capability: 'Capability.update',
                title: __('Capability: Update a capability.'),
                tooltip: __(
                    'Able to update an existing capability. (Assign with caution)',
                ),
            },
            {
                capability: 'Capability.delete',
                title: __('Capability: Delete a capability.'),
                tooltip: __(
                    'Able to delete an existing capability. (Assign with caution)',
                ),
            },
            {
                capability: 'plugins-ui.view',
                title: __('Plugins: Can view plugin manager UI.'),
                tooltip: __('Able to view the plugin manager UI.'),
            },
        ],
    },
};
