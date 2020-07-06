import _ from 'underscore';
import op from 'object-path';
import Thumb from './Scene/Thumb';
import Action from './Scene/Action';
import Library from './Scene/Library';
import External from './Scene/External';
import React, { useEffect, useState } from 'react';
import useDirectories from '../../Directory/useDirectories';

import Reactium, {
    useEventHandle,
    useHookComponent,
    useRefs,
    useStatus,
} from 'reactium-core/sdk';

const useValue = ({ editor, fieldName }, deps) => {
    const [value, setValue] = useState();

    useEffect(() => {
        if (!editor) return;
        if (!fieldName) return;
        if (!editor.value) return;
        let newValue = op.get(editor.value, fieldName, []);
        newValue = op.get(newValue, 'className') ? [] : newValue;

        newValue = newValue.map(({ objectId, url }) => ({ objectId, url }));

        setValue(newValue);
    }, deps);

    return [value, setValue];
};

const initialActive = (max, value) => {
    if (max === 1 && value.length > 0) return 'thumb';
    return 'action';
};

export const Editor = props => {
    const refs = useRefs();
    const { editor, fieldName, max, required } = props;

    let type = op.get(props, 'type', ['all']);
    type = Array.isArray(op.get(props, 'type', ['all'])) ? type : [type];

    const [value, setSelection] = useValue({ editor, fieldName }, []);
    const dirs = useDirectories() || [];
    const [active, setActive, isActive] = useStatus(
        editor.isNew() ? 'action' : null,
    );
    const [directories, updateDirectories] = useState(dirs);

    const setDirectories = newDirectories => {
        if (editor.unMounted()) return;

        if (_.isString(newDirectories)) {
            newDirectories = String(newDirectories)
                .replace(/ /g, '-')
                .replace(/[^a-z0-9\-\_\/]/gi, '')
                .toLowerCase();

            newDirectories = newDirectories.startsWith('/')
                ? newDirectories.substr(1)
                : newDirectories;

            newDirectories = _.flatten([directories, newDirectories]);
        }

        newDirectories = !newDirectories
            ? []
            : _.chain(newDirectories)
                  .compact()
                  .uniq()
                  .value();

        newDirectories.sort();

        updateDirectories(newDirectories);
    };

    const ElementDialog = useHookComponent('ElementDialog');
    const { Dropzone, Scene } = useHookComponent('ReactiumUI');

    const add = (items = []) => {
        items = Array.isArray(items) ? items : [items];
        items = items.map(({ objectId, url }) => ({ objectId, url }));
        items = max === 1 ? [_.last(items)] : items;

        const values = Array.from(value);

        // if single selection, remove all other values
        if (max === 1) values.forEach(item => op.set(item, 'delete', true));

        // add the items to the value
        items.forEach(item => values.push(item));

        // update the selection`
        setSelection(values);

        // show thumbs
        _.defer(() => nav('thumb', 'left'));
    };

    const cx = Reactium.Utils.cxFactory('field-media');

    const back = () => refs.get('scene').back();

    const isReady = () => {
        if (!active) return;
        if (!editor) return;
        if (editor.isNew()) return true;
        if (!value) return;
        return true;
    };

    const nav = (panel, direction) =>
        refs.get('scene').navTo({ panel, direction });

    const remove = async objectId => {
        const values = Array.from(value);

        values.forEach(item => {
            if (item.objectId === objectId) op.set(item, 'delete', true);
        });

        const count = _.reject(values, { delete: true }).length;
        if (max === 1 || count < 1) await nav('action', 'right');

        setSelection(values);
    };

    const removeAll = async (exclude = []) => {
        const values = Array.from(value).filter(
            ({ objectId }) => !exclude.includes(objectId),
        );
        values.forEach(item => op.set(item, 'delete', true));
        await nav('action', 'right');
        setSelection(values);
    };

    const _handle = () => ({
        ...props,
        add,
        active,
        back,
        cx,
        directories,
        isActive,
        nav,
        refs,
        remove,
        removeAll,
        setActive,
        setDirectories,
        setSelection,
        type,
        value,
    });

    const [handle, setHandle] = useEventHandle(_handle());

    const onContentValidate = ({ context }) => {
        let values = Array.from(value);
        values = values.filter(item => op.get(item, 'delete', false) !== true);

        if (values.length > 0 || !required) return context;

        const err = {
            field: fieldName,
            message: __('%name is a required parameter').replace(
                /\%name/gi,
                fieldName,
            ),
            value: values,
        };

        context.error[fieldName] = err;
        context.valid = false;

        return context;
    };

    const onContentBeforeSave = e => op.set(e.value, fieldName, value);

    const onContentAfterSave = e => op.set(e.value, fieldName, value);

    // listeners
    useEffect(() => {
        if (!editor) return;

        editor.addEventListener('validate', onContentValidate);
        editor.addEventListener('save-success', onContentAfterSave);
        editor.addEventListener('before-save', onContentBeforeSave);

        return () => {
            editor.removeEventListener('validate', onContentValidate);
            editor.removeEventListener('save-success', onContentAfterSave);
            editor.removeEventListener('before-save', onContentBeforeSave);
        };
    });

    // update directories
    useEffect(() => {
        if (!dirs) return;
        const newDirectories = _.chain([directories, dirs])
            .flatten()
            .uniq()
            .value();

        if (!_.isEqual(directories, newDirectories)) {
            setDirectories(newDirectories);
        }
    }, [dirs]);

    // update handle on value change
    useEffect(() => {
        const newHandle = _handle();
        if (_.isEqual(newHandle, handle)) return;
        Object.keys(newHandle).forEach(key =>
            op.set(handle, key, newHandle[key]),
        );
        setHandle(newHandle);
    });

    // initial active
    useEffect(() => {
        if (active || !value) return;
        setActive(initialActive(max, value || []));
    }, [active, max, value]);

    // update value
    useEffect(() => {
        if (!value) return;
        if (_.isEqual(op.get(editor.value, fieldName), value)) {
            return;
        }
        const newValue = { ...editor.value, [fieldName]: value };
        editor.setValue(newValue);
    }, [value]);

    useEffect(() => {
        return () => {
            console.log('unmount Media CTE');
            editor.active = null;
            setActive(null);
        };
    }, []);

    useEffect(() => {
        if (!active) return;
        //console.log('active change', active);
    });

    return isReady() ? (
        <ElementDialog className={cx()} {...props}>
            <Dropzone ref={elm => refs.set('dropzone', elm)}>
                <Scene
                    active={active}
                    className={cx('scene')}
                    onChange={({ active }) => setActive(active, true)}
                    ref={elm => refs.set('scene', elm)}>
                    <Action handle={handle} id='action' />
                    <Thumb handle={handle} id='thumb' />
                    <External handle={handle} id='external' />
                    <Library handle={handle} id='library' />
                </Scene>
            </Dropzone>
        </ElementDialog>
    ) : null;
};