import _ from 'underscore';
import cn from 'classnames';
import op from 'object-path';
import PropTypes from 'prop-types';
import ENUMS from 'components/Admin/Media/enums';

import React, {
    forwardRef,
    useImperativeHandle,
    useEffect,
    useLayoutEffect as useWindowEffect,
    useRef,
    useState,
} from 'react';

import { Button, Dialog, Dropdown, Icon } from '@atomic-reactor/reactium-ui';

// Server-Side Render safe useLayoutEffect (useEffect when node)
const useLayoutEffect =
    typeof window !== 'undefined' ? useWindowEffect : useEffect;

/**
 * -----------------------------------------------------------------------------
 * Hook Component: DirectoryEditor
 * -----------------------------------------------------------------------------
 */
let DirectoryEditor = ({ children, ...props }, ref) => {
    // Refs
    const containerRef = useRef();
    const stateRef = useRef({
        ...props,
    });

    // State
    const [, setNewState] = useState(stateRef.current);

    // Internal Interface
    const setState = newState => {
        // Update the stateRef
        stateRef.current = {
            ...stateRef.current,
            ...newState,
        };

        // Trigger useEffect()
        setNewState(stateRef.current);
    };

    const cx = () => {
        const { className, namespace } = stateRef.current;
        return cn({ [className]: !!className, [namespace]: !!namespace });
    };

    // Side Effects
    useEffect(() => setState(props), Object.values(props));

    const permissions = () => {
        return [
            {
                label: ENUMS.TEXT.FOLDER_EDITOR.CAN_EDIT,
                icon: 'Feather.Edit2',
                value: 'write',
            },
            {
                label: ENUMS.TEXT.FOLDER_EDITOR.CAN_VIEW,
                icon: 'Feather.Eye',
                value: 'read',
            },
        ];
    };

    const onSelect = e => {
        const { value } = e.item;
        setState({ selection: value });
    };

    // Renderer
    const render = () => {
        const perms = permissions();
        const { selection } = stateRef.current;
        const perm = _.findWhere(perms, { value: selection });
        return (
            <div ref={containerRef} className={cx()}>
                <Dialog
                    collapsible={false}
                    dismissable={true}
                    footer={{
                        elements: [
                            <Button
                                color='primary'
                                size='sm'
                                style={{ width: 135 }}>
                                {ENUMS.TEXT.FOLDER_EDITOR.SAVE}
                            </Button>,
                        ],
                    }}
                    header={{ title: ENUMS.TEXT.FOLDER_EDITOR.TITLE }}>
                    <div className='py-xs-16'>
                        <div className='pl-xs-16'>
                            <label
                                className='input-group'
                                style={{ width: '100%' }}>
                                <span className='blue'>
                                    <Icon
                                        name='Feather.Folder'
                                        className='mr-xs-4'
                                    />
                                </span>
                                <input
                                    type='text'
                                    name='directory'
                                    placeholder={
                                        ENUMS.TEXT.FOLDER_EDITOR.DIRECTORY
                                    }
                                />
                            </label>
                        </div>
                        <div className='flex middle pl-xs-16 pr-xs-8 permission'>
                            <label
                                className='input-group'
                                style={{ flexGrow: 1 }}>
                                <span className='blue'>
                                    <Icon
                                        name='Feather.User'
                                        className='mr-xs-4'
                                    />
                                </span>
                                <input
                                    type='text'
                                    placeholder={ENUMS.TEXT.FOLDER_EDITOR.USER}
                                />
                            </label>
                            <Dropdown
                                data={perms}
                                iconField='ico'
                                onChange={onSelect}
                                selection={[selection]}>
                                <Button
                                    outline
                                    color='tertiary'
                                    size='sm'
                                    style={{
                                        padding: '6px 9px',
                                        minWidth: 135,
                                        justifyContent: 'flex-start',
                                    }}
                                    data-dropdown-element>
                                    <Icon
                                        size={16}
                                        name={op.get(perm, 'icon')}
                                        style={{ marginRight: 12 }}
                                    />
                                    {op.get(perm, 'label')}
                                </Button>
                            </Dropdown>
                        </div>
                    </div>
                </Dialog>
            </div>
        );
    };

    // External Interface
    useImperativeHandle(ref, () => ({
        container: containerRef.current,
        ref,
        setState,
        state: stateRef.current,
    }));

    // Render
    return render();
};

DirectoryEditor = forwardRef(DirectoryEditor);

DirectoryEditor.ENUMS = ENUMS;

DirectoryEditor.propTypes = {
    className: PropTypes.string,
    namespace: PropTypes.string,
};

DirectoryEditor.defaultProps = {
    namespace: 'admin-directory-editor',
    selection: 'read',
};

export { DirectoryEditor as default };
