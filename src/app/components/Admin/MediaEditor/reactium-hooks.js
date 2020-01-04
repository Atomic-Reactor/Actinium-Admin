import op from 'object-path';
import domain from './domain';
import MediaEditor from './index';
import ImageCrop from './ImageCrop';
import FileEditor from './FileEditor';
import MetaEditor from './MetaEditor';
import Breadcrumbs from './Breadcrumbs';
import ImageEditor from './ImageEditor';
import AudioEditor from './AudioEditor';
import VideoEditor from './VideoEditor';
import Reactium, { __ } from 'reactium-core/sdk';
import { Directory, Tags } from './_utils/components';

Reactium.Plugin.register(domain.name, Reactium.Enums.priority.highest).then(
    () => {
        // Register components
        Reactium.Component.register('AudioEditor', AudioEditor);
        Reactium.Component.register('MediaEditorDirectory', Directory);
        Reactium.Component.register('FileEditor', FileEditor);
        Reactium.Component.register('ImageEditor', ImageEditor);
        Reactium.Component.register('MediaMetaEditor', MetaEditor);
        Reactium.Component.register('MediaEditorTags', Tags);
        Reactium.Component.register('MediaImageCrop', ImageCrop);
        Reactium.Component.register('VideoEditor', VideoEditor);

        // Register plugins
        Reactium.Zone.addComponent({
            id: 'ADMIN-MEDIA-EDITOR',
            component: MediaEditor,
            order: -1000,
            zone: ['admin-media-editor'],
        });

        Reactium.Zone.addComponent({
            id: 'ADMIN-MEDIA-EDITOR-CRUMBS',
            component: Breadcrumbs,
            order: -1000,
            zone: ['admin-header'],
        });

        Reactium.Zone.addComponent({
            id: 'ADMIN-MEDIA-EDITOR-META',
            component: MetaEditor,
            order: 1000,
            zone: ['admin-media-editor-meta'],
        });

        Reactium.Zone.addComponent({
            id: 'ADMIN-MEDIA-THUMBNAIL-EDITOR',
            component: ImageCrop,
            order: 1000,
            label: __('Thumbnail:'),
            field: 'thumbnail',
            tooltip: {
                copy: __('copy url to clipboard'),
                generate: __('create a new thumbnail'),
            },
            zone: ['admin-media-editor-meta-image'],
        });

        Reactium.Zone.addComponent({
            id: 'ADMIN-MEDIA-IMAGE-XS-EDITOR',
            component: ImageCrop,
            order: 1000,
            label: __('XS Image:'),
            field: 'meta.image.xs',
            tooltip: {
                copy: __('copy url to clipboard'),
                generate: __('create a new xs image'),
            },
            options: {
                width: 400,
                height: 200,
            },
            zone: ['admin-media-editor-meta-image'],
        });
    },
);
