import _ from 'underscore';
import cn from 'classnames';
import op from 'object-path';
import React, { useEffect, useCallback } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import Reactium, {
    __,
    useAsyncEffect,
    useDerivedState,
    useHookComponent,
    useRefs,
    useStatus,
} from 'reactium-core/sdk';

const ENUMS = {
    STATUS: {
        PENDING: 'PENDING',
        INITIALIZING: 'INITIALIZING',
        INITIALIZED: 'INITIALIZED',
        LOADING: 'LOADING',
        LOADED: 'LOADED',
        READY: 'READY',
        SEARCHING: 'SEARCHING',
    },
};

/**
 * -----------------------------------------------------------------------------
 * Functional Component: ContentComponent
 * -----------------------------------------------------------------------------
 */
const helpText = () =>
    __(
        'Enter the content type, select the content object, and select the field that represents the component content.',
    );

const ContentComponent = ({ handle, id }) => {
    // -------------------------------------------------------------------------
    // Props
    // -------------------------------------------------------------------------
    const { cx, editor, namespace } = handle;

    // -------------------------------------------------------------------------
    // Components
    // -------------------------------------------------------------------------
    const {
        Alert,
        Button,
        Checkbox,
        Collapsible,
        Dropdown,
        EventForm,
        Icon,
        Spinner,
    } = useHookComponent('ReactiumUI');

    // -------------------------------------------------------------------------
    // Refs
    // -------------------------------------------------------------------------
    const refs = useRefs();

    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------
    const [state, setState] = useDerivedState({
        cacheKey: {
            types: 'component-manager-content-types',
            content: 'component-manager-content',
        },
        content: [],
        error: null,
        helpExpanded: Reactium.Prefs.get(`admin.help.${namespace}-type`),
        search: { content: null, type: null },
        selection: {
            content: [],
            type: [],
        },
        schema: op.get(editor.value, 'component.schema'),
        types: [],
    });

    // -------------------------------------------------------------------------
    // Status
    // -------------------------------------------------------------------------
    const [status, setStatus, isStatus] = useStatus(ENUMS.STATUS.PENDING);

    // -------------------------------------------------------------------------
    // Internal Interface
    // -------------------------------------------------------------------------
    const clear = field => {
        const search = op.get(state, 'search') || { content: null, type: null };
        const selection = op.get(state, 'selection') || {
            content: [],
            type: [],
        };

        op.set(search, field, null);
        op.set(selection, field, null);

        const newState = { search, selection };

        if (field === 'type') op.set(newState, 'content', []);

        setState(newState);

        const elm = refs.get(field);
        if (elm) elm.focus();
    };

    const content = () => {
        let items = _.chain(Object.values(op.get(state, 'content', {})))
            .flatten()
            .compact()
            .sortBy('title')
            .value()
            .map(({ title, uuid }) => ({
                value: uuid,
                label: title,
            }));

        const search = op.get(state, 'search.content');
        return search
            ? items.filter(({ label }) =>
                  String(label)
                      .toLowerCase()
                      .includes(String(search).toLowerCase()),
              )
            : items;
    };

    const errorMsg = () => op.get(state, 'error.message');

    const fetch = async () => {
        const cacheKey = op.get(state, 'cacheKey.types');
        let req = Reactium.Cache.get(cacheKey);

        if (req) return req;

        req = Reactium.ContentType.types({ schema: true });
        Reactium.Cache.set('component-manager-content-types', req);
        return req;
    };

    const header = ({ header: currentHeader, active }) => {
        if (active !== id) return;
        const { elements = [] } = handle.header(true);

        elements.splice(
            0,
            0,
            <Button
                className='ar-dialog-header-btn'
                color={Button.ENUMS.COLOR.CLEAR}
                key='component-type-info'
                onClick={helpToggle}
                style={{ paddingLeft: 2 }}>
                <Icon name='Feather.AlertCircle' />
            </Button>,
        );

        op.set(currentHeader, 'elements', elements);
    };

    const helpToggle = () => {
        const help = refs.get('help');
        if (help) help.toggle();
    };

    const initialize = async () => {
        if (!isActive() || !isStatus(ENUMS.STATUS.PENDING)) return;

        setStatus(ENUMS.STATUS.INITIALIZING);

        let types = await fetch();
        types = types.map(item => ({
            ...item,
            icon: op.get(item, 'meta.icon', 'Linear.FileEmpty'),
            label: op.get(item, 'meta.label'),
            value: op.get(item, 'uuid'),
        }));

        setStatus(ENUMS.STATUS.INITIALIZED);

        setState({ error: null, types });

        Reactium.Cache.del(op.get(state, 'cacheKey.types'));
    };

    const isActive = () => Boolean(handle.state.active === id);

    const isError = field => Boolean(op.get(state, 'error.field') === field);

    const isBusy = () => Boolean(!isStatus(ENUMS.STATUS.READY));

    const isReady = () =>
        Boolean(
            (isStatus(ENUMS.STATUS.READY) ||
                isStatus(ENUMS.STATUS.SEARCHING)) &&
                isActive(),
        );

    const listeners = () => {
        handle.addEventListener('change', _onActive);
        handle.addEventListener('header', header);

        return () => {
            handle.removeEventListener('change', _onActive);
            handle.removeEventListener('header', header);
        };
    };

    const reset = () => {
        const form = refs.get('form');
        if (form) form.setValue(null);
    };

    const getValue = () => {
        const keys = ['content', 'type'];
        const values = keys.map(key =>
            _.chain([op.get(state, ['selection', key])])
                .flatten()
                .compact()
                .first()
                .value(),
        );

        const obj = _.object(keys, values);

        const mapper = [
            {
                field: 'content',
                key: 'title',
                path: 'content',
                where: { uuid: op.get(obj, 'content') },
            },
            {
                field: 'type',
                key: 'meta.label',
                path: 'types',
                where: { uuid: op.get(obj, 'type') },
            },
        ];

        mapper.forEach(({ field, key, path, where }) =>
            op.set(
                obj,
                field,
                op.get(_.findWhere(op.get(state, path, []), where), key),
            ),
        );

        op.set(
            obj,
            'schema',
            op.get(
                state,
                'schema',
                op.get(editor.value, 'component.schema', []),
            ),
        );

        return obj;
    };

    const schema = useCallback(() => {
        let { type } = state.selection;

        const typeID = _.first(type);
        if (!typeID) return [];

        type = _.findWhere(types(), { uuid: typeID });
        if (!type) return [];

        const { fields } = type;
        if (!fields) return [];

        // return _.sortBy(Object.values(fields), 'fieldName').filter(
        //     ({ fieldId }) => fieldId !== 'publisher',
        // );
        return _.sortBy(Object.values(fields), 'fieldName');
    }, []);

    const types = () => {
        const items = op.get(state, 'types', []);
        const search = op.get(state, 'search.type');
        return search
            ? items.filter(({ label }) =>
                  String(label)
                      .toLowerCase()
                      .includes(String(search).toLowerCase()),
              )
            : items;
    };

    const validate = value => {
        if (!op.get(value, 'type')) {
            const elm = refs.get('type');
            if (elm) elm.focus();
            return {
                field: 'type',
                message: __('Select content type'),
            };
        }

        if (!op.get(value, content)) {
            const elm = refs.get('content');
            if (elm) elm.focus();
            return {
                field: 'content',
                message: __('Select %type').replace(
                    /\%type/gi,
                    _.first(type).meta.label || __('content'),
                ),
            };
        }
    };

    const _onActive = ({ active = 'selector' }) => {
        if (active !== id) {
            reset();
            setState({ error: null, search: null, schema: [] });
        } else {
            const form = refs.get('form');
            if (form) form.setValue(editor.value);
        }
    };

    const _onTypeSelect = async ({ item }) => {
        setStatus(ENUMS.STATUS.SEARCHING, true);

        const { label, value } = item;
        const search = JSON.parse(JSON.stringify(state.search || {}));
        const selection = JSON.parse(JSON.stringify(state.selection || {}));

        op.set(search, 'type', label);
        op.set(selection, 'type', [value]);

        const newState = { content: [], error: null, search, selection };

        const { machineName } = item;
        let { results: items = {} } = await Reactium.Content.list({
            type: { machineName },
        });

        items = _.indexBy(Object.values(items), 'uuid');
        op.set(newState, 'content', items);

        setStatus(ENUMS.STATUS.READY);
        setState(newState);
    };

    const _onContentSelect = ({ item }) => {
        const { label, value } = item;
        const search = JSON.parse(JSON.stringify(state.search || {}));
        const selection = JSON.parse(JSON.stringify(state.selection || {}));

        console.log({ label, value, search, selection });

        op.set(search, 'content', label);
        op.set(selection, 'content', [value]);

        setState({ error: null, selection, search });
    };

    const _onHelpToggle = () => {
        const help = refs.get('help');
        const { expanded } = help.state;
        Reactium.Prefs.set(`admin.help.${namespace}-type`, !expanded);
        setState({ helpExpanded: !expanded });
    };

    const _onSearchContent = e => {
        const { search = {} } = state;
        op.set(search, 'content', e.target.value);
        setState({ search });
    };

    const _onSearchType = e => {
        const { search = {} } = state;
        op.set(search, 'type', e.target.value);
        setState({ search });
    };

    const _onStatus = async () => {
        if (!isActive()) return;

        if (isStatus(ENUMS.STATUS.INITIALIZED)) {
            const type = op.get(editor.value, 'type');
            let component = op.get(editor.value, 'component');

            if (component && type === id) {
                setStatus(ENUMS.STATUS.LOADING, true);

                component = _.isString(component)
                    ? JSON.parse(component)
                    : component;

                const search = op.get(state, 'search');
                const selection = op.get(state, 'selection');

                op.set(search, 'type', null);
                op.set(search, 'content', null);

                op.set(
                    selection,
                    'type',
                    _.compact([op.get(component, 'uuid')]),
                );
                op.set(
                    selection,
                    'content',
                    _.chain([op.get(component, 'content.uuid')])
                        .flatten()
                        .compact()
                        .value(),
                );

                const { machineName } = component;
                let { results: items = {} } = await Reactium.Content.list({
                    type: { machineName },
                });
                items = _.indexBy(Object.values(items), 'uuid');

                setStatus(ENUMS.STATUS.LOADED);
                setState({ content: items, search, selection });
            }

            _.defer(() => setStatus(ENUMS.STATUS.READY, true));
        }
    };

    const _onSubmit = e => {
        let { schema } = e.value;
        schema = _.flatten([schema]);

        const types = _.indexBy(op.get(state, 'types', []), 'uuid');
        const contents = op.get(state, 'content', []);

        let type = _.chain(op.get(state, 'selection.type') || [])
            .compact()
            .first()
            .value();

        let content = _.chain(op.get(state, 'selection.content') || [])
            .compact()
            .first()
            .value();

        type = op.get(types, type);
        content = op.get(contents, content);

        const error = validate({ content, type });
        if (error) {
            setState({ error });
            return;
        }

        const component = { ...type, content, schema };

        const obj = { ...editor.value, type: id, component };

        setState({ error: null, schema });
        _.defer(() => handle.save(obj));
    };

    // -------------------------------------------------------------------------
    // Side effects
    // -------------------------------------------------------------------------

    useEffect(listeners, [Object.values(editor.value)]);

    useAsyncEffect(initialize, [handle.state.active]);

    useAsyncEffect(_onStatus, [handle.state.active, status]);

    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------

    return (
        <div className={cx('content')}>
            <Collapsible
                expanded={state.helpExpanded}
                onCollapse={_onHelpToggle}
                onExpand={_onHelpToggle}
                ref={elm => refs.set('help', elm)}>
                <div className='help'>
                    <Alert>{helpText()}</Alert>
                </div>
            </Collapsible>
            {isReady() && (
                <EventForm
                    onChange={({ value }) => {
                        setState({
                            schema: _.chain([op.get(value, 'schema')])
                                .flatten()
                                .compact()
                                .value(),
                        });
                    }}
                    onSubmit={_onSubmit}
                    ref={elm => refs.set('form', elm)}
                    value={getValue()}>
                    <div className='px-xs-20 pt-xs-20'>
                        <Dropdown
                            data={types()}
                            expandEvent={['focus', 'click']}
                            maxHeight={252}
                            onItemSelect={item => _onTypeSelect(item, 'type')}
                            ref={elm => refs.set('dropdown', elm)}
                            selection={op.get(state, 'selection.type', [])}
                            size='md'>
                            <div
                                className={cn('form-group', {
                                    error: isError('type'),
                                })}>
                                <input
                                    data-dropdown-element
                                    defaultValue={op.get(state, 'search.type')}
                                    onChange={_onSearchType}
                                    placeholder={__('Content Type')}
                                    ref={elm => refs.set('type', elm)}
                                    name='type'
                                />
                                {isError('type') && <small>{errorMsg()}</small>}
                                <Button
                                    className='clear-btn'
                                    type='button'
                                    onClick={() => clear('type')}
                                    color={Button.ENUMS.COLOR.DANGER}>
                                    <Icon name='Feather.X' />
                                </Button>
                            </div>
                        </Dropdown>
                        {content().length > 0 && isStatus(ENUMS.STATUS.READY) && (
                            <Dropdown
                                data={content()}
                                expandEvent={['focus', 'click']}
                                maxHeight={252}
                                onItemSelect={_onContentSelect}
                                ref={elm => refs.set('contentDropdown', elm)}
                                selection={op.get(
                                    state,
                                    'selection.content',
                                    [],
                                )}
                                size='md'>
                                <div
                                    className={cn('form-group', {
                                        error: isError('content'),
                                    })}>
                                    <input
                                        data-dropdown-element
                                        defaultValue={op.get(
                                            state,
                                            'search.content',
                                        )}
                                        onChange={_onSearchContent}
                                        placeholder={__('Select %type').replace(
                                            /\%type/gi,
                                            op.get(state, 'search.type') ||
                                                __('content'),
                                        )}
                                        ref={elm => refs.set('content', elm)}
                                        name='content'
                                    />
                                    {isError('content') && (
                                        <small>{errorMsg()}</small>
                                    )}
                                    <Button
                                        className='clear-btn'
                                        color={Button.ENUMS.COLOR.DANGER}
                                        onClick={() => clear('content')}
                                        type='button'>
                                        <Icon name='Feather.X' />
                                    </Button>
                                </div>
                            </Dropdown>
                        )}
                    </div>
                    {state.selection.type && state.selection.type.length > 0 && (
                        <div className={cx('content-schema')}>
                            <Scrollbars>
                                <ul>
                                    {schema().map(
                                        ({ fieldName, fieldId: key }) => {
                                            return (
                                                <li
                                                    key={key}
                                                    style={{
                                                        display:
                                                            key === 'publisher'
                                                                ? 'none'
                                                                : null,
                                                    }}>
                                                    <Checkbox
                                                        label={fieldName}
                                                        labelAlign='right'
                                                        name='schema'
                                                        value={key}
                                                    />
                                                </li>
                                            );
                                        },
                                    )}
                                </ul>
                            </Scrollbars>
                        </div>
                    )}
                    <div className={cx('content-footer')}>
                        <Button
                            type='submit'
                            ref={elm => refs.set('submit', elm)}>
                            {__('Apply Component Type')}
                        </Button>
                    </div>
                </EventForm>
            )}
            {isBusy() && <Spinner />}
        </div>
    );
};

export default ContentComponent;
