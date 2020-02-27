import React from 'react';
import cn from 'classnames';
import { __, useHookComponent } from 'reactium-core/sdk';
import ElementDialog from 'components/Admin/Content/Editor/ElementDialog';
/**
 * -----------------------------------------------------------------------------
 * Functional Component: FieldTypeRichText
 * -----------------------------------------------------------------------------
 */
export const FieldType = props => {
    const { DragHandle } = props;
    const FieldTypeDialog = useHookComponent('FieldTypeDialog', DragHandle);

    return (
        <FieldTypeDialog {...props}>
            <div className='field-type-text'>
                <div className={'form-group'}>
                    <label>
                        <span className='sr-only'>{__('Default Value')}</span>
                        <input
                            type='text'
                            name='defaultValue'
                            placeholder={__('Default Value')}
                        />
                    </label>
                </div>
                <div className={'form-group'}>
                    <label>
                        <span className='sr-only'>{__('Placeholder')}</span>
                        <input
                            type='text'
                            name='placeholder'
                            placeholder={__('Placeholder')}
                        />
                    </label>
                </div>
                <div className={'form-group'}>
                    <label>
                        <span className='sr-only'>{__('Pattern')}</span>
                        <input
                            type='text'
                            name='pattern'
                            placeholder={__('Pattern')}
                        />
                    </label>
                </div>
            </div>
        </FieldTypeDialog>
    );
};

export const Editor = props => {
    const { defaultValue, errorText, fieldName, pattern, placeholder } = props;

    const inputProps = {
        defaultValue,
        name: fieldName,
        pattern,
        placeholder,
        type: 'text',
    };

    const className = cn({ error: !!errorText, 'form-group': true });

    return (
        <ElementDialog {...props}>
            <div className='p-xs-20'>
                <div className={className}>
                    <input {...inputProps} />
                    {errorText && <small>{errorText}</small>}
                </div>
            </div>
        </ElementDialog>
    );
};

export const QuickEditor = props => {
    return 'QuickEditor';
};
