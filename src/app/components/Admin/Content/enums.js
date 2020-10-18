import { __ } from 'reactium-core/sdk';

const ENUMS = {
    TEXT: {
        EDITOR: __('Editor'),
        LIST: __('Content'),
        NEW: __('New'),
        SAVE: __('Save %type'),
        SAVING: __('Saving %type...'),
        SAVED: __('Saved %type!'),
        SAVE_ERROR: __('Unable to save %type'),
        TYPE_LOAD_ERROR: __('Unable to load content types.'),
        TYPE_INVALID_ERROR: __('Invalid content type.'),
        CONTENT_LOAD_ERROR: __('Error loading content'),
    },
    STATUS: {
        /**
         * INIT STATUSES
         */
        // Fresh Editor
        INITIALIZING: 'INITIALIZING',
        // Need Content Types
        LOADING_TYPES: 'LOADING_TYPES',
        // Content Types Available
        TYPES_LOADED: 'TYPES_LOADED',

        /**
         * CLEANUP NEEDED STATUSES
         */
        // Editor needs reset or content reloaded
        RESETTING: 'RESETTING',
        READY_TO_LOAD: 'READY_TO_LOAD',

        /**
         * LOADING or SAVING
         */
        // Content is loading
        LOADING_CONTENT: 'LOADING_CONTENT',
        // Content is saving
        CONTENT_SAVING: 'CONTENT_SAVING',

        /**
         * READINESS STATUSES
         */
        // Content is new (editing allowed)
        CONTENT_DRAFT: 'CONTENT_DRAFT',
        // Content is loaded (editing allowed)
        CONTENT_REVISE: 'CONTENT_REVISE',

        /**
         * EDITOR ERROR STATUSES
         */
        TYPE_INVALID_ERROR: 'TYPE_INVALID_ERROR',
        TYPES_LOAD_ERROR: 'TYPES_LOAD_ERROR',
        CONTENT_LOAD_ERROR: 'CONTENT_LOAD_ERROR',
    },
};

export default ENUMS;
