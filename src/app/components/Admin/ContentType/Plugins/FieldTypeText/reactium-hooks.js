import Reactium from 'reactium-core/sdk';
import FieldTypeText from './index';
import { __ } from 'reactium-core/sdk';
import { Icon } from '@atomic-reactor/reactium-ui';
import op from 'object-path';

const registerFieldTypePlugin = async () => {
    await Reactium.Plugin.register('FieldTypeText');
    Reactium.Component.register('FieldTypeText', FieldTypeText);

    await Reactium.Hook.register('field-type-enums', async Enums => {
        op.set(Enums, 'TYPES.TEXT', {
            type: 'Text',
            label: __('Text Field'),
            icon: Icon.Feather.Type,
            tooltip: __('Adds a text field to your content type.'),
            component: 'FieldTypeText',
            order: Reactium.Enums.priority.highest,
        });
    });
};

registerFieldTypePlugin();
