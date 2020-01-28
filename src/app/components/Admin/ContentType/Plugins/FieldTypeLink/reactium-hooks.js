import Reactium from 'reactium-core/sdk';
import FieldTypeLink from './index';
import { __ } from 'reactium-core/sdk';
import { Icon } from '@atomic-reactor/reactium-ui';

const registerFieldTypePlugin = async () => {
    await Reactium.Plugin.register('FieldTypeLink');

    Reactium.Component.register('FieldTypeLink', FieldTypeLink);

    Reactium.ContentType.FieldType.register({
        type: 'Link',
        label: __('Link Field'),
        icon: Icon.Feather.Link,
        tooltip: __('Adds a link field to your content type.'),
        component: 'FieldTypeLink',
        order: Reactium.Enums.priority.high,
    });
};

registerFieldTypePlugin();
