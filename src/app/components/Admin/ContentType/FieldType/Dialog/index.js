import React, { useRef } from 'react';
import { __, useHandle } from 'reactium-core/sdk';
import { Dialog, Icon, Button } from '@atomic-reactor/reactium-ui';
import PropTypes from 'prop-types';
import cn from 'classnames';
import op from 'object-path';
import Enums from '../../enums';

const Header = props => {
    const inputRef = useRef();
    const { id, icon: FieldIcon, DragHandle } = props;
    const handle = useHandle('ContentTypeEditor');
    const errors = handle.getFormErrors(id);

    const editClicked = () => {
        inputRef.current.focus();
    };

    const value = op.get(props, 'formRef.current.getValue')();

    return (
        <div className='fieldtype-header'>
            <div className='fieldtype-header-icon'>
                <FieldIcon />
            </div>
            <div
                className={cn('fieldtype-header-name', {
                    error: op.get(errors, 'fields', []).includes('fieldName'),
                })}>
                <input
                    ref={inputRef}
                    type={'text'}
                    defaultValue={value.fieldName}
                    name='fieldName'
                    placeholder={__('Field Name')}
                    className='fieldtype-header-name-input'
                />
                <Button
                    className='fieldtype-header-name-icon'
                    onClick={editClicked}>
                    <span className='sr-only'>{__('Edit')}</span>
                    <Icon.Linear.Pencil />
                </Button>
            </div>
            <DragHandle />
        </div>
    );
};

/**
 * -----------------------------------------------------------------------------
 * Functional Component: FieldTypeDialog
 * -----------------------------------------------------------------------------
 */
const FieldTypeDialog = props => {
    const ContentTypeEditor = useHandle('ContentTypeEditor');
    const removeField = op.get(ContentTypeEditor, 'removeField', () => {});
    const isNew = op.get(ContentTypeEditor, 'isNew', () => true);
    const { id, type, dialogProps, children } = props;
    const header = {
        elements: [<Header key='header' {...props} />],
    };

    const pref = isNew()
        ? {}
        : {
              pref: `field-type-dialog.${id}`,
          };

    return (
        <Dialog
            {...dialogProps}
            {...pref}
            dismissable={true}
            header={header}
            className={cn('fieldtype', `fieldtype-${type}`)}
            onDismiss={() => removeField(id)}>
            {children}
            <div className='form-group'>
                <label>
                    <input
                        type='text'
                        name='helpText'
                        placeholder={__('Help Text')}
                    />
                </label>
            </div>
        </Dialog>
    );
};

FieldTypeDialog.propTypes = {
    // uuid/v4
    id: (propValue, key) => {
        const regex = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
        return regex.test(propValue[key])
            ? null
            : new Error('Expecting id of type uuid/v4');
    },
    type: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
    dialogProps: PropTypes.shape(Dialog.propTypes),
};

export default FieldTypeDialog;
