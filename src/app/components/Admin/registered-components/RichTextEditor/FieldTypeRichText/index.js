import React from 'react';
import { Checkbox } from '@atomic-reactor/reactium-ui';
import { useHookComponent, __ } from 'reactium-core/sdk';
/**
 * -----------------------------------------------------------------------------
 * Functional Component: FieldTypeText
 * -----------------------------------------------------------------------------
 */
const FieldTypeText = props => {
    const { DragHandle } = props;
    const FieldTypeDialog = useHookComponent('FieldTypeDialog', DragHandle);

    return (
        <FieldTypeDialog {...props}>
            <div className='field-type-text'>
                <div className={'form-group'}>
                    <label>
                        <span>{__('Default Value')}</span>
                        <input type='text' name='defaultValue' />
                    </label>
                </div>
                <div className={'form-group'}>
                    <label>
                        <span>{__('Pattern')}</span>
                        <input type='text' name='pattern' />
                    </label>
                </div>
            </div>
        </FieldTypeDialog>
    );
};

export default FieldTypeText;
