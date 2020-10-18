import uuid from 'uuid/v4';
import _ from 'underscore';
import cn from 'classnames';
import op from 'object-path';
import Region from './Region';
import PropTypes from 'prop-types';
import ContentEvent from '../_utils/ContentEvent';
import DEFAULT_ENUMS from 'components/Admin/Content/enums';
import useProperCase from 'components/Admin/Tools/useProperCase';
import ErrorBoundary from './ErrorBoundary';

import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from 'react';

import Reactium, {
    __,
    useSelect,
    useAsyncEffect,
    useEventHandle,
    useEventRefs,
    useFulfilledObject,
    useHookComponent,
    useRegisterHandle,
    useStatus,
} from 'reactium-core/sdk';

import { fromEvent } from 'rxjs';

import { refSubject, refPromise } from './helpers';

/**
 * -----------------------------------------------------------------------------
 * Functional Component: ContentEditor
 * -----------------------------------------------------------------------------
 */
const noop = () => {};

const ErrorMessages = ({ editor, errors }) => {
    const { Icon } = useHookComponent('ReactiumUI');
    const canFocus = element => {
        if (!element) return false;
        return typeof element.focus === 'function';
    };

    const jumpTo = (e, element) => {
        e.preventDefault();
        element.focus();
    };

    return (
        <ul className={editor.cx('errors')}>
            {errors.map(({ message, field, focus, value = '' }, i) => {
                const replacers = {
                    '%fieldName': field,
                    '%type': editor.type,
                    '%value': value,
                };
                message = editor.parseErrorMessage(message, replacers);
                message = !canFocus(focus) ? (
                    message
                ) : (
                    <a href='#' onClick={e => jumpTo(e, focus)}>
                        {message}
                        <Icon
                            name='Feather.CornerRightDown'
                            size={12}
                            className='ml-xs-8'
                        />
                    </a>
                );
                return <li key={`error-${i}`}>{message}</li>;
            })}
        </ul>
    );
};

const useRouteChange = () => {
    return useSelect({
        select: state => {
            const Router = op.get(state, 'Router');
            return {
                type: op.get(Router, 'params.type'),
                slug: op.get(Router, 'params.slug', 'new'),
                branch: op.get(Router, 'params.branch', 'master'),
                search: op.get(Router, 'urlParams', {}),
            };
        },
        shouldUpdate: ({ newState, prevState }) => {
            const update =
                newState.type !== prevState.type ||
                newState.slug !== prevState.slug ||
                newState.branch !== prevState.branch;

            console.log({ update, newState, prevState });
            return update;
        },
        returnMode: 'get',
    });
};

let ContentEditor = (
    {
        className,
        id,
        namespace,
        onChange,
        onError,
        onFail,
        onLoad,
        onReady,
        onStatus,
        onSubmit,
        onSuccess,
        onValidate,
        sidebar = true,

        // aliasing these to clean up rest props
        /*eslint-disable */
        params: routeParams,
        search: routeSearch,
        route: bpRoute,
        meta: bpMeta,
        zone: bpZone,
        zones: bpZones,
        section: bpSection,
        sections: bpSections,
        /*eslint-enable */

        ...props
    },
    ref,
) => {
    const ENUMS = ContentEditor.ENUMS;
    const STATUSES = ENUMS.STATUS;

    // more instant route information
    const rt = useRouteChange();
    const [, _setStatus, isStatus, getStatus] = useStatus(
        STATUSES.INITIALIZING,
    );
    const setStatus = (status, force) => {
        debug('setStatus', { status, force });
        _setStatus(status, force);
    };

    const refs = useEventRefs();
    const refsObserver = fromEvent(refs, 'set');
    const formSubject = refSubject(refsObserver, 'form');

    const formRef = refs.createProxy('form');
    const alertRef = refs.createProxy('alert');
    const loadingRef = refs.createProxy('loading');
    const sidebarRef = refs.createProxy('sidebar');
    const valueRef = refs.createProxy('value');
    const ignoreChangeEvent = refs.createProxy('ignore-change');

    const Helmet = useHookComponent('Helmet');
    const Loading = useHookComponent(`${id}Loading`);
    const Sidebar = useHookComponent(`${id}Sidebar`);
    const SlugInput = useHookComponent('SlugInput');
    const { Alert, EventForm, Icon, Toast } = useHookComponent('ReactiumUI');
    const alertDefault = {
        color: Alert.ENUMS.COLOR.INFO,
        icon: 'Feather.Flag',
    };

    const isNew = () => String(rt('slug')).toLowerCase() === 'new';

    // is the editor in a left-over status from a previous load?
    const isResetNeeded = () => {
        if (isStatus(STATUSES.RESETTING)) return false;

        if (!isNew() && isStatus(STATUSES.CONTENT_DRAFT)) return true;

        if (isNew() && isStatus([STATUSES.CONTENT_REVISE])) return true;

        debug({ slug: rt('slug'), currentSlug: refs.get('value.slug') });

        // loaded / saved content, but it's the wrong content
        if (
            isStatus([STATUSES.CONTENT_REVISE]) &&
            rt('slug') !== refs.get('value.slug')
        )
            return true;

        return false;
    };

    const [contentType, _setContentType] = useState();
    const [alert, setNewAlert] = useState(alertDefault);
    const [fieldTypes] = useState(Reactium.ContentType.FieldType.list);
    const [dirty, setNewDirty] = useState(true);
    const [errors, setErrors] = useState({});
    const [stale, setNewStale] = useState(false);
    const [state, _setState] = useState({});
    const setState = (val = {}) => {
        const newState = {
            ...state,
            ...(val || {}),
        };

        debug('setState', { val, newState });

        _setState(newState);
    };

    const [types, setTypes] = useState();

    // Aliases prevent memory leaks
    const setAlert = newAlert => {
        newAlert = _.isObject(newAlert) ? newAlert : alertDefault;

        const { color, icon, message } = newAlert;

        if (message) {
            if (!icon) op.set(newAlert, 'icon', 'Feather.AlertOctagon');
            if (!color) op.set(newAlert, 'color', Alert.ENUMS.COLOR.DANGER);
        }

        setNewAlert(newAlert);
    };

    const setClean = (params = {}) => {
        // if (!refs.get('form')) return;

        setNewDirty(false);

        const newValue = op.get(params, 'value', op.get(params, 'content'));

        if (newValue) setValue(newValue);
        dispatch('clean', { value: newValue });
    };

    const setDirty = (params = {}) => {
        // if (!refs.get('form')) return;
        const newValue = op.get(params, 'value');

        setNewDirty(true);

        if (newValue) setValue(newValue);
        dispatch('dirty', { value: newValue });
    };

    const setStale = val => {
        // if (!refs.get('form')) return;
        setNewStale(val);

        _.defer(() => {
            dispatch('stale', { stale: val });
        });
    };

    const setValue = (newValue, forceUpdate = false) => {
        if (_.isObject(newValue)) {
            const { value = {} } = state;
            newValue = { ...value, ...newValue };
        } else {
            newValue = null;
        }

        valueRef.current = newValue || {};

        if (forceUpdate === true) {
            update(valueRef.current);
        } else {
            op.set(handle, 'value', newValue);
        }
    };

    const update = newValue => {
        setState({ value: newValue });
    };

    // Functions
    const debug = (...args) => {
        const debugMode = ['on', 'true', '1', true].includes(
            rt('search.debug', window && window.debugEditor),
        );
        const stackTraceMode = ['on', 'true', '1', true].includes(
            rt('search.debugStack', window && window.debugEditorStack),
        );

        if (!debugMode) return;
        if (stackTraceMode) args.push(new Error().stack);
        console.log(...args);
    };

    const cx = Reactium.Utils.cxFactory(namespace);

    const cname = cn(cx(), { [className]: !!className });

    const dispatch = async (eventType, event, callback) => {
        if (eventType === 'change' && ignoreChangeEvent.current === true) {
            ignoreChangeEvent.current = false;
            return;
        } else {
            if (op.get(event, 'ignoreChangeEvent') === true) {
                ignoreChangeEvent.current = true;
            }
        }

        // dispatch exact eventType
        const evt = new ContentEvent(eventType, event);
        if (eventType !== 'status') {
            handle.dispatchEvent(evt);
        }

        // dispatch status event
        const statusType =
            eventType === 'status' ? op.get(event, 'event') : eventType;

        const statusEvt = new ContentEvent('status', {
            ...event,
            event: String(statusType).toUpperCase(),
        });

        debug('dispatch:', eventType, statusEvt.event, handle.value, event);

        handle.dispatchEvent(statusEvt);

        // dispatch exact reactium hook
        await Reactium.Hook.run(`form-${rt('type')}-${eventType}`, evt, handle);

        // dispatch status reactium hook
        await Reactium.Hook.run(`form-${rt('type')}-status`, statusEvt, handle);

        // dispatch generic status reactium hook
        await Reactium.Hook.run(
            'form-editor-status',
            statusEvt,
            rt('type'),
            handle,
        );

        // execute basic callback
        if (typeof callback === 'function') await callback(evt);

        // passive clean/dirty events
        const dirtyEvents = _.pluck(Reactium.Content.DirtyEvent.list, 'id');
        const scrubEvents = _.pluck(Reactium.Content.ScrubEvent.list, 'id');

        if (dirtyEvents.includes(eventType)) _.defer(() => setDirty(event));
        if (scrubEvents.includes(eventType)) _.defer(() => setClean(event));
    };

    const getContent = async () => {
        console.log('getContent', { contentType });
        const request = {
            refresh: true,
            type: contentType,
            slug: rt('slug'),
            history: {
                branch: rt('branch', 'master'),
            },
        };

        return Reactium.Content.retrieve(request);
    };

    const getTypes = () => Reactium.ContentType.types();

    const isClean = () => dirty !== true;

    const isDirty = () => dirty === true;

    const isMounted = (checkReady = false) => {
        return !!formRef.current;
    };

    const isStale = () => stale;

    const parseErrorMessage = (str, replacers = {}) => {
        Object.entries(replacers).forEach(([key, value]) => {
            str = str.split(key).join(value);
        });

        return str;
    };

    const properCase = useProperCase();

    const regions = () => {
        const _regions = op.get(contentType, 'regions', {});

        const contentRegions = sidebar
            ? _.without(Object.keys(_regions), 'sidebar').map(
                  key => _regions[key],
              )
            : Object.values(_regions);

        const sidebarRegions = sidebar
            ? _.compact([op.get(_regions, 'sidebar')])
            : [];

        return [contentRegions, sidebarRegions];
    };

    const reset = async () => {
        if (isStatus(STATUSES.RESETTING)) return;
        setStatus(STATUSES.RESETTING, true);
    };

    const save = async (mergeValue = {}) => {
        setAlert();

        const { value = {} } = state;
        const newValue = { ...value, ...mergeValue };

        Toast.show({
            toastId: 'content-save',
            icon: 'Feather.UploadCloud',
            message: String(ENUMS.TEXT.SAVING).replace('%type', rt('type')),
            type: Toast.TYPE.INFO,
            autoClose: false,
            closeButton: false,
        });

        // only track branch for saves
        // always create new revision in current branch
        op.del(newValue, 'history.revision');

        await dispatch('content-parse', {
            value: newValue,
            dispatcher: 'ContentEditor.save',
        });

        await dispatch('before-save', { value: newValue });

        if (!op.get(newValue, 'type')) {
            op.set(newValue, 'type', contentType);
        }

        const newSlug = op.get(newValue, 'slug');

        if (!isNew() && newSlug !== rt('slug')) {
            await Reactium.Content.changeSlug({
                objectId: op.get(newValue, 'objectId'),
                newSlug,
                type: contentType,
            });

            op.del(newValue, 'slug');
            op.del(newValue, 'uuid');
        } else {
            if (isNew() && !op.get(newValue, 'slug')) {
                op.set(newValue, 'slug', `${rt('type')}-${uuid()}`);
            }
        }

        await dispatch('save', { value: newValue }, onChange);
        setStatus(STATUSES.CONTENT_SAVING);

        return Reactium.Content.save(newValue, [], handle)
            .then(async result => {
                await dispatch(
                    'save-success',
                    { value: result, ignoreChangeEvent: true },
                    _onSuccess,
                );

                setStatus(STATUSES.CONTENT_REVISE);
            })
            .catch(async error => {
                await dispatch('save-fail', { error }, _onFail);
                setStatus(STATUSES.RESETTING, true);
            });
    };

    const setContentStatus = async status => {
        if (isNew()) return;

        setAlert();
        const { value = {} } = state;
        const newValue = { ...value, status };
        // only latest revision
        op.del(newValue, 'history.revision');

        if (!op.get(newValue, 'type')) {
            op.set(newValue, 'type', contentType);
        }

        await dispatch('content-parse', {
            value: newValue,
            dispatcher: 'ContentEditor.setContentStatus',
        });

        await dispatch('before-content-set-status', { value: newValue });

        try {
            const contentObj = await Reactium.Content.setStatus(
                newValue,
                handle,
            );

            await dispatch(
                'content-set-status',
                { value: contentObj, ignoreChangeEvent: true },
                setClean,
            );
            Toast.show({
                icon: 'Feather.Check',
                message: __('Content status %status').replace(
                    '%status',
                    status,
                ),
                type: Toast.TYPE.INFO,
            });
        } catch (error) {
            Toast.show({
                icon: 'Feather.AlertOctagon',
                message: __('Content status change failed'),
                type: Toast.TYPE.ERROR,
            });
            console.error({ error });
        }
    };

    const setBranch = async branch => {
        const { value = {} } = state;
        const request = { ...value };

        op.set(request, 'history', { branch });
        const newValue = await Reactium.Content.retrieve(request);

        await dispatch('content-parse', {
            value: newValue,
            dispatcher: 'ContentEditor.setBranch',
        });

        await handle.dispatch('load', {
            value: newValue,
            ignoreChangeEvent: true,
        });

        _.defer(() => {
            const slug = op.get(value, 'slug');
            if (branch === 'master') {
                Reactium.Routing.history.push(
                    `/admin/content/${rt('type')}/${slug}`,
                );
            } else {
                Reactium.Routing.history.push(
                    `/admin/content/${rt('type')}/${slug}/branch/${branch}`,
                );
            }
        });
    };

    const publish = async (action = 'publish') => {
        if (isNew()) return;

        setAlert();
        const { value = {} } = state;
        const newValue = { ...value, status };
        // only latest revision
        op.del(newValue, 'history.revision');

        if (!op.get(newValue, 'type')) {
            op.set(newValue, 'type', contentType);
        }

        await dispatch('content-parse', {
            value: newValue,
            dispatcher: 'ContentEditor.publish',
        });

        await dispatch(`before-${action}`, { value: newValue });

        const successMessage = {
            publish: __('%type published').replace('%type', type),
            unpublish: __('%type unpublished').replace('%type', type),
        };
        const errorMessage = {
            publish: __('Unable to publish %type').replace('%type', type),
            unpublish: __('Unable to unpublish %type').replace('%type', type),
        };

        try {
            const contentObj = await Reactium.Content[action](newValue, handle);

            await dispatch(
                action,
                { value: contentObj, ignoreChangeEvent: true },
                setClean,
            );
            Toast.show({
                icon: 'Feather.Check',
                message: successMessage[action],
                type: Toast.TYPE.INFO,
            });
        } catch (error) {
            Toast.show({
                icon: 'Feather.AlertOctagon',
                message: errorMessage[action],
                type: Toast.TYPE.ERROR,
            });
            console.error({ error });
        }
    };

    const schedule = async (request = {}) => {
        if (isNew()) return;

        setAlert();

        const { value = {} } = state;

        const payload = {
            type,
            objectId: value.objectId,
            ...request,
        };

        if (!op.get(payload, 'type')) {
            op.set(payload, 'type', contentType);
        }

        await dispatch('content-parse', {
            value: newValue,
            dispatcher: 'ContentEditor.schedule',
        });

        await dispatch('before-schedule', { value: payload });

        const successMessage = __('%type scheduled').replace('%type', type);
        const errorMessage = __('Unable to schedule %type').replace(
            '%type',
            type,
        );

        try {
            const response = await Reactium.Content.schedule(payload, handle);
            const newValue = {
                ...value,
                publish: response.publish,
            };

            await dispatch(
                'schedule',
                { value: newValue, ignoreChangeEvent: true },
                isDirty() ? setDirty : setClean,
            );

            Toast.show({
                icon: 'Feather.Check',
                message: successMessage,
                type: Toast.TYPE.INFO,
            });
        } catch (error) {
            Toast.show({
                icon: 'Feather.AlertOctagon',
                message: errorMessage,
                type: Toast.TYPE.ERROR,
            });
            console.error({ error });
        }
    };

    const unschedule = async jobId => {
        if (isNew()) return;

        setAlert();

        const { value = {} } = state;

        const payload = {
            type,
            objectId: value.objectId,
            jobId,
        };

        if (!op.get(payload, 'type')) {
            op.set(payload, 'type', contentType);
        }

        await dispatch('content-parse', {
            value: newValue,
            dispatcher: 'ContentEditor.unschedule',
        });

        await dispatch('before-unschedule', { value: payload });
        const successMessage = __('%type unscheduled').replace('%type', type);
        const errorMessage = __('Unable to unschedule %type').replace(
            '%type',
            type,
        );

        try {
            const response = await Reactium.Content.unschedule(payload, handle);
            const newValue = {
                ...value,
                publish: response.publish,
            };

            await dispatch(
                'unschedule',
                { value: newValue, ignoreChangeEvent: true },
                isDirty() ? setDirty : setClean,
            );

            Toast.show({
                icon: 'Feather.Check',
                message: successMessage,
                type: Toast.TYPE.INFO,
            });
        } catch (error) {
            Toast.show({
                icon: 'Feather.AlertOctagon',
                message: errorMessage,
                type: Toast.TYPE.ERROR,
            });
            console.error({ error });
        }
    };

    const submit = () => formRef.current.submit();

    const _onChange = async ({ value }) => setValue(value);

    const _onError = async context => {
        const { error } = context;
        const errors = Object.values(error);

        const alertObj = {
            message: <ErrorMessages errors={errors} editor={handle} />,
            icon: 'Feather.AlertOctagon',
            color: Alert.ENUMS.COLOR.DANGER,
        };

        await dispatch('save-error', { error }, onError);
        if (isMounted()) {
            setErrors(error);
            setAlert(alertObj);
        }

        return context;
    };

    const _onFail = async e => {
        const error = e.error;
        const Msg = () => (
            <span>
                <Icon name='Feather.AlertOctagon' style={{ marginRight: 8 }} />
                {String(ENUMS.TEXT.SAVE_ERROR).replace('%type', rt('type'))}
            </span>
        );

        Toast.update('content-save', {
            render: <Msg />,
            autoClose: 1000,
            closeOnClick: true,
            type: Toast.TYPE.ERROR,
        });
        console.error(error);

        if (isMounted()) setAlert(error);
        onFail(e);
    };

    const _onStatus = ({ detail }) =>
        dispatch('status', { event: detail }, onStatus);

    const _onSubmit = async e => {
        debug(e.value);
        await dispatch('submit', e.value, onSubmit);
        save(e.value);
    };

    const _onSuccess = async e => {
        const result = e.value;

        const Msg = () => (
            <span>
                <Icon name='Feather.Check' style={{ marginRight: 8 }} />
                {String(ENUMS.TEXT.SAVED).replace('%type', rt('type'))}
            </span>
        );

        Toast.update('content-save', {
            render: <Msg />,
            autoClose: 1000,
            closeOnClick: true,
            type: Toast.TYPE.SUCCESS,
        });

        setValue(result, true);

        if (isNew() || result.slug !== rt('slug')) {
            _.defer(
                Reactium.Routing.history.push,
                `/admin/content/${rt('type')}/${result.slug}`,
            );
        }

        onSuccess(e);
    };

    const _onValidate = async e => {
        setErrors({});

        const { value = {} } = state;
        const { value: val, ...context } = e;
        await dispatch('validate', { context, value: val }, onValidate);

        if (context.valid !== true) _onError(context);
        return { ...context, value };
    };

    const saveHotkey = e => {
        if (e) e.preventDefault();
        submit();
    };

    const pulse = () => {
        const { value = {} } = state;

        const slug = op.get(value, 'slug');
        const currentSlug = refs.get('value.slug');
        if (
            slug === currentSlug &&
            Object.values(value).length > 0 &&
            !_.isEqual(value, valueRef.current)
        ) {
            update(valueRef.current);
            dispatch(
                'change',
                { previous: value, value: valueRef.current },
                onChange,
            );
        }
    };

    // Handle
    const _handle = () => ({
        AlertBox: alertRef.current,
        EventForm: formRef.current,
        Sidebar: sidebarRef.current,
        alert: setAlert,
        contentType,
        cx,
        dispatch,
        errors,
        fieldTypes,
        id,
        isClean,
        isDirty,
        isMounted,
        isNew,
        isStale,
        parseErrorMessage,
        properCase,
        ready,
        reset,
        regions,
        save,
        slug: rt('slug'),
        state,
        setContentStatus,
        setStale,
        setBranch,
        schedule,
        unschedule,
        publish,
        setClean,
        setDirty,
        setStale,
        setState,
        setValue,
        submit,
        type: rt('type'),
        types,
        unMounted: () => !isMounted(),
        value: valueRef.current,
    });

    const [handle, setHandle] = useEventHandle({});
    setHandle(_handle());
    useImperativeHandle(ref, () => handle, [handle]);
    useRegisterHandle(`${id}Editor`, () => handle, [handle]);

    const isInitializing = () =>
        isStatus([STATUSES.INITIALIZING, STATUSES.LOADING_TYPES]);

    // get fullfilled handle
    const ready = Boolean(handle.types && handle.contentType);

    const isReady = () => ready === true;

    // is the editor fetching data needed to render properly
    // Note: When waiting, the formRef is completely unavailable!
    const isWaiting = () =>
        !ready || !isStatus([STATUSES.CONTENT_DRAFT, STATUSES.CONTENT_REVISE]);

    const toastError = (message, context, status) => {
        Toast.show({
            icon: 'Feather.AlertOctagon',
            message,
            type: Toast.TYPE.ERROR,
        });

        console.error({ message, context, status });
        if (status) setStatus(status);
    };

    const EDITOR_ERROR = {
        TYPE_INVALID: () =>
            toastError(
                ENUMS.TEXT.TYPE_INVALID_ERROR,
                rt('type'),
                STATUSES.TYPE_INVALID_ERROR,
            ),
        TYPE_LOAD: error =>
            toastError(
                ENUMS.TEXT.TYPE_LOAD_ERROR,
                error,
                STATUSES.TYPE_LOAD_ERROR,
            ),
        CONTENT_LOAD: error =>
            toastError(
                ENUMS.TEXT.CONTENT_LOAD_ERROR,
                error,
                STATUSES.CONTENT_LOAD_ERROR,
            ),
    };

    // get content types
    useAsyncEffect(
        async mounted => {
            console.log('LOADING TYPES', {
                mounted: mounted(),
                type: rt('type'),
                types,
            });
            if (!isStatus(STATUSES.LOADING_TYPES)) {
                setStatus(STATUSES.LOADING_TYPES);

                console.log({ type: rt('type') });
                if (!rt('type')) {
                    return;
                }

                try {
                    const results = await getTypes();
                    setStatus(STATUSES.TYPES_LOADED);
                    setTypes(results);
                    const newTitle = properCase(
                        `${rt('type')} ${ENUMS.TEXT.EDITOR}`,
                    );
                    if (op.get(state, 'title') === newTitle) return;
                    setState({ title: newTitle });

                    if (!_.pluck(results, 'machineName').includes(rt('type'))) {
                        EDITOR_ERROR.TYPE_INVALID();
                        return;
                    }

                    console.log('LOADING TYPES', { mounted: mounted() });
                    if (mounted()) {
                    }
                } catch (error) {
                    EDITOR_ERROR.TYPE_LOAD(error);
                    return;
                }
            }
        },
        [rt('type')],
    );

    const setContentType = () => {
        if (types) {
            if (
                !contentType ||
                (rt('type') && contentType.machineName !== rt('type'))
            ) {
                const ct = _.findWhere(types, { machineName: rt('type') });
                if (ct) _setContentType(ct);
            }
        }
    };

    // update handle refs
    useEffect(() => {
        handle.AlertBox = alertRef.current;
        handle.EventForm = formRef.current;
        handle.Sidebar = sidebarRef.current;
        handle.value = valueRef.current;
    });

    // dispatch ready
    // TODO: Check this behavior
    useEffect(() => {
        if (isReady() === true) {
            dispatch('status', { event: 'READY', ready }, onReady);
        }
    }, [isReady()]);

    // dispatch status
    useEffect(() => {
        if (ready !== true || !formRef.current) return;
        formRef.current.addEventListener('status', _onStatus);
        return () => {
            formRef.current.removeEventListener('status', _onStatus);
        };
    }, [ready]);

    // save hotkey
    useEffect(() => {
        if (ready !== true) return;
        Reactium.Hotkeys.register('content-save', {
            callback: saveHotkey,
            key: 'mod+s',
            order: Reactium.Enums.priority.lowest,
            scope: document,
        });

        return () => {
            Reactium.Hotkeys.unregister('content-save');
        };
    }, [ready]);

    // Always flag a reset right away
    if (isResetNeeded()) {
        // No forced reload here! This is just an early catch
        setStatus(STATUSES.RESETTING);
    }

    // get content or reset editor
    useAsyncEffect(
        async mounted => {
            debug('status loop', {
                status: getStatus(),
                type: rt('type'),
                slug: rt('slug'),
            });

            // Wait for initialization before loading content
            if (isInitializing()) return;

            if (isResetNeeded()) {
                setStatus(STATUSES.RESETTING, true);
                return;
            }

            // fresh load
            if (isStatus([STATUSES.TYPES_LOADED, STATUSES.RESETTING])) {
                setContentType();
                setValue({});
                setStatus(STATUSES.READY_TO_LOAD, true);
                return;
            }

            if (isStatus(STATUSES.READY_TO_LOAD)) {
                try {
                    if (isNew()) {
                        // give RTE time to tear down
                        setValue({});
                        await new Promise(resolve => setTimeout(resolve, 250));
                        setStatus(STATUSES.CONTENT_DRAFT, true);
                        return;
                    }

                    setStatus(STATUSES.LOADING_CONTENT);
                    const content = await getContent();

                    // time has gone by, and status may have changed
                    // asynchrounously
                    if (isStatus(STATUSES.LOADING_CONTENT)) {
                        setValue(content);
                        setStatus(STATUSES.CONTENT_REVISE, true);
                    }
                } catch (error) {
                    EDITOR_ERROR.CONTENT_LOAD(error);
                    _.delay(() => {
                        Reactium.Routing.history.push(
                            `/admin/content/${rt('type')}/new`,
                        );
                    }, 1000);
                }
            }

            if (isStatus(STATUSES.CONTENT_REVISE)) {
                await refPromise(formSubject);
                formRef.current.setValue(refs.get('value'));

                debug('Content revise mode', {
                    value: refs.get('value'),
                    mounted: mounted(),
                });

                if (mounted()) {
                    _.defer(() =>
                        dispatch('load', { value: refs.get('value') }, onLoad),
                    );
                }
                return;
            }

            if (isStatus(STATUSES.CONTENT_DRAFT)) {
                await refPromise(formSubject);
                formRef.current.setValue(null);

                debug('Content draft mode', {
                    value: refs.get('value'),
                    mounted: mounted(),
                });

                if (mounted()) {
                    _.defer(() =>
                        dispatch('load', { value: refs.get('value') }, onLoad),
                    );
                }
                return;
            }
        },
        [getStatus(), rt('type'), rt('slug')],
    );

    // create pulse
    useEffect(() => {
        if (!ready) return;
        Reactium.Pulse.register('content-editor', pulse, { delay: 250 });
        return () => Reactium.Pulse.unregister('content-editor');
    }, [ready]);

    // scroll to top
    useEffect(() => {
        if (isReady()) return;
        document.body.scrollTop = 0;
    }, [isReady()]);

    const render = () => {
        if (isWaiting()) return <Loading ref={loadingRef} />;

        const { title, value = {} } = state;
        const currentValue = valueRef.current || {};
        const [contentRegions, sidebarRegions] = regions();

        return (
            <ErrorBoundary debug={debug}>
                <Helmet>
                    <title>{title}</title>
                </Helmet>
                <EventForm
                    className={cname}
                    ref={formRef}
                    onChange={_onChange}
                    onSubmit={_onSubmit}
                    validator={_onValidate}
                    value={currentValue}>
                    {op.get(currentValue, 'objectId') && (
                        <input type='hidden' name='objectId' />
                    )}
                    {value && contentRegions.length > 0 && (
                        <div className={cx('editor')}>
                            <div className={cx('regions')}>
                                {op.get(alert, 'message') && (
                                    <div className={cx('editor-region')}>
                                        <Alert
                                            dismissable
                                            ref={alertRef}
                                            onHide={() =>
                                                setAlert(alertDefault)
                                            }
                                            color={op.get(alert, 'color')}
                                            icon={
                                                <Icon
                                                    name={op.get(
                                                        alert,
                                                        'icon',
                                                        'Feather.AlertOctagon',
                                                    )}
                                                />
                                            }>
                                            {op.get(alert, 'message')}
                                        </Alert>
                                    </div>
                                )}
                                <SlugInput editor={handle} />
                                {contentRegions.map(item => (
                                    <Region
                                        key={item.slug}
                                        editor={handle}
                                        {...item}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                    {value && sidebarRegions.length > 0 && (
                        <Sidebar editor={handle} ref={sidebarRef}>
                            <div className={cx('meta')}>
                                <div className={cx('regions')}>
                                    {sidebarRegions.map(item => (
                                        <Region
                                            key={item.slug}
                                            editor={handle}
                                            {...item}
                                        />
                                    ))}
                                </div>
                            </div>
                        </Sidebar>
                    )}
                </EventForm>
            </ErrorBoundary>
        );
    };

    return render();
};

ContentEditor = forwardRef(ContentEditor);

ContentEditor.propTypes = {
    className: PropTypes.string,
    id: PropTypes.string,
    namespace: PropTypes.string,
    onChange: PropTypes.func,
    onError: PropTypes.func,
    onFail: PropTypes.func,
    onLoad: PropTypes.func,
    onReady: PropTypes.func,
    onStatus: PropTypes.func,
    onSubmit: PropTypes.func,
    onSuccess: PropTypes.func,
    onValidate: PropTypes.func,
    sidebar: PropTypes.bool,
    title: PropTypes.string,
    value: PropTypes.object,
};

ContentEditor.defaultProps = {
    namespace: 'admin-content',
    onChange: noop,
    onError: noop,
    onFail: noop,
    onLoad: noop,
    onReady: noop,
    onStatus: noop,
    onSubmit: noop,
    onSuccess: noop,
    onValidate: noop,
    sidebar: true,
    title: DEFAULT_ENUMS.TEXT.EDITOR,
    value: null,
};

ContentEditor.ENUMS = DEFAULT_ENUMS;

export default ContentEditor;
