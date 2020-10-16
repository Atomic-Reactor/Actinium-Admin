import uuid from 'uuid/v4';
import _ from 'underscore';
import cn from 'classnames';
import op from 'object-path';
import Region from './Region';
import PropTypes from 'prop-types';
import ContentEvent from '../_utils/ContentEvent';
import DEFAULT_ENUMS from 'components/Admin/Content/enums';
import useProperCase from 'components/Admin/Tools/useProperCase';

import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from 'react';

import Reactium, {
    __,
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
        params: routeParams,
        search: routeSearch,

        // aliasing these to clean up rest props
        /*eslint-disable */
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

    const [status, setStatus, isStatus] = useStatus(STATUSES.INITIALIZING);
    console.log({ status });

    const refs = useEventRefs();
    const refsObserver = fromEvent(refs, 'set');
    const formRef = refs.createProxy('form');
    const formSubject = refSubject(refsObserver, 'form');

    const alertRef = useRef();
    const loadingRef = useRef();
    const sidebarRef = useRef();
    const valueRef = useRef({});
    const ignoreChangeEvent = useRef(true);
    const loadingStatus = useRef(false);
    const Helmet = useHookComponent('Helmet');
    const Loading = useHookComponent(`${id}Loading`);
    const Sidebar = useHookComponent(`${id}Sidebar`);
    const SlugInput = useHookComponent('SlugInput');
    const { Alert, EventForm, Icon, Toast } = useHookComponent('ReactiumUI');

    const alertDefault = {
        color: Alert.ENUMS.COLOR.INFO,
        icon: 'Feather.Flag',
    };

    const [contentType, setContentType] = useState();
    const [alert, setNewAlert] = useState(alertDefault);
    const [fieldTypes] = useState(Reactium.ContentType.FieldType.list);

    const type = op.get(routeParams, 'type');
    const slug = op.get(routeParams, 'slug', 'new');
    const branch = op.get(routeSearch, 'branch', 'master');
    const currentSlug = op.get(valueRef.current, 'slug');

    console.log({ type, slug, branch, currentSlug });

    const [dirty, setNewDirty] = useState(true);
    const [errors, setErrors] = useState({});
    const [stale, setNewStale] = useState(false);
    const [state, _setState] = useState({});
    const setState = (val = {}) => {
        if (unMounted()) return;

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
        if (unMounted()) return;

        newAlert = _.isObject(newAlert) ? newAlert : alertDefault;

        const { color, icon, message } = newAlert;

        if (message) {
            if (!icon) op.set(newAlert, 'icon', 'Feather.AlertOctagon');
            if (!color) op.set(newAlert, 'color', Alert.ENUMS.COLOR.DANGER);
        }

        setNewAlert(newAlert);
    };

    const setClean = (params = {}) => {
        if (unMounted()) return;

        setNewDirty(false);

        const newValue = op.get(params, 'value', op.get(params, 'content'));

        if (newValue) setValue(newValue);
        dispatch('clean', { value: newValue });
    };

    const setDirty = (params = {}) => {
        if (unMounted()) return;

        const newValue = op.get(params, 'value');

        setNewDirty(true);

        if (unMounted()) return;
        if (newValue) setValue(newValue);
        dispatch('dirty', { value: newValue });
    };

    const setStale = val => {
        if (unMounted()) return;

        setNewStale(val);

        _.defer(() => {
            if (unMounted()) return;
            dispatch('stale', { stale: val });
        });
    };

    const setValue = (newValue, forceUpdate = false) => {
        if (unMounted()) return;
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
        if (unMounted()) return;
        setState({ value: newValue });
    };

    // Functions
    const debug = (...args) => {
        const debugMode = ['on', 'true', '1'].includes(
            op.get(props, 'search.debug', window && window.debugEditor),
        );
        const stackTraceMode = ['on', 'true', '1'].includes(
            op.get(props, 'search.stack', window && window.debugEditorStack),
        );

        if (!debugMode) return;
        if (stackTraceMode) args.push(new Error().stack);
        console.log(...args);
    };

    const cx = Reactium.Utils.cxFactory(namespace);

    const cname = cn(cx(), { [className]: !!className });

    const dispatch = async (eventType, event, callback) => {
        if (unMounted()) return;
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
        await Reactium.Hook.run(`form-${type}-${eventType}`, evt, handle);

        // dispatch status reactium hook
        await Reactium.Hook.run(`form-${type}-status`, statusEvt, handle);

        // dispatch generic status reactium hook
        await Reactium.Hook.run('form-editor-status', statusEvt, type, handle);

        // execute basic callback
        if (typeof callback === 'function') await callback(evt);

        // passive clean/dirty events
        const dirtyEvents = _.pluck(Reactium.Content.DirtyEvent.list, 'id');
        const scrubEvents = _.pluck(Reactium.Content.ScrubEvent.list, 'id');

        if (dirtyEvents.includes(eventType)) _.defer(() => setDirty(event));
        if (scrubEvents.includes(eventType)) _.defer(() => setClean(event));
    };

    const getContent = async () => {
        const request = {
            refresh: true,
            type: contentType,
            slug,
            history: {
                branch,
            },
        };

        return Reactium.Content.retrieve(request);
    };

    const getTypes = () => Reactium.ContentType.types();

    const unMounted = () => {
        return !formRef.current && !loadingRef.current;
    };

    const isClean = () => dirty !== true;

    const isDirty = () => dirty === true;

    const isMounted = (checkReady = false) => {
        if (unMounted(checkReady)) return false;
        return true;
    };

    const isNew = () => String(slug).toLowerCase() === 'new';

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
            message: String(ENUMS.TEXT.SAVING).replace('%type', type),
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

        if (!isNew() && newSlug !== slug) {
            await Reactium.Content.changeSlug({
                objectId: op.get(newValue, 'objectId'),
                newSlug,
                type: contentType,
            });

            op.del(newValue, 'slug');
            op.del(newValue, 'uuid');
        } else {
            if (isNew() && !op.get(newValue, 'slug')) {
                op.set(newValue, 'slug', `${type}-${uuid()}`);
            }
        }

        await dispatch('save', { value: newValue }, onChange);

        return Reactium.Content.save(newValue, [], handle)
            .then(async result => {
                if (unMounted()) return;
                await dispatch(
                    'save-success',
                    { value: result, ignoreChangeEvent: true },
                    _onSuccess,
                );
            })
            .catch(async error => {
                if (unMounted()) return;
                await dispatch('save-fail', { error }, _onFail);
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
            if (unMounted()) return;

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
                Reactium.Routing.history.push(`/admin/content/${type}/${slug}`);
            } else {
                Reactium.Routing.history.push(
                    `/admin/content/${type}/${slug}/branch/${branch}`,
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
            if (unMounted()) return;

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

            if (unMounted()) return;

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

            if (unMounted()) return;

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
                {String(ENUMS.TEXT.SAVE_ERROR).replace('%type', type)}
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
                {String(ENUMS.TEXT.SAVED).replace('%type', type)}
            </span>
        );

        Toast.update('content-save', {
            render: <Msg />,
            autoClose: 1000,
            closeOnClick: true,
            type: Toast.TYPE.SUCCESS,
        });

        setValue(result, true);

        if (isNew() || result.slug !== slug) {
            _.defer(
                Reactium.Routing.history.push,
                `/admin/content/${type}/${result.slug}`,
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
        const currentSlug = op.get(valueRef.current, 'slug');
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

    const isReady = () => ready === true && !isResetNeeded();

    const isInitializing = () =>
        isStatus([STATUSES.INITIALIZING, STATUSES.LOADING_TYPES]);

    // is the editor in a left-over state from a previous load?
    const isResetNeeded = () => {
        console.log('isResetNeeded', {
            alreadyResetting: isStatus(STATUSES.RESETTING),
        });
        if (isStatus(STATUSES.RESETTING)) return false;

        // new but we still have loaded / saved content in the editor
        console.log('isResetNeeded', {
            newButRevise: isNew() && isStatus([STATUSES.CONTENT_REVISE]),
            isNew: isNew(),
            isRevisStatus: isStatus([STATUSES.CONTENT_REVISE]),
        });
        if (isNew() && isStatus([STATUSES.CONTENT_REVISE])) return true;

        // loaded / saved content, but it's the wrong content
        // TODO: figure out if this condition is necessary
        // if (isStatus([STATUSES.CONTENT_REVISE]) && slug !== currentSlug) return true;

        return false;
    };

    // is the editor fetching data needed to render properly
    // Note: When loading, the formRef is completely unavailable!
    const isWaiting = () =>
        !isStatus([STATUSES.CONTENT_DRAFT, STATUSES.CONTENT_REVISE]);

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
        slug,
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
        type,
        types,
        unMounted,
        value: valueRef.current,
    });

    const [handle, setHandle] = useEventHandle(_handle());
    useImperativeHandle(ref, () => handle, [handle]);
    useRegisterHandle(`${id}Editor`, () => handle, [handle]);

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
                type,
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
            if (!isStatus(STATUSES.LOADING_TYPES)) {
                setStatus(STATUSES.LOADING_TYPES);

                if (!type) {
                    EDITOR_ERROR.TYPE_INVALID();
                    return;
                }

                try {
                    const results = await getTypes();

                    if (!_.pluck(results, 'machineName').includes(type)) {
                        EDITOR_ERROR.TYPE_INVALID();
                        return;
                    }

                    setStatus(STATUSES.TYPES_LOADED);
                    if (mounted()) {
                        setTypes(results);
                        const newTitle = properCase(
                            `${type} ${ENUMS.TEXT.EDITOR}`,
                        );
                        if (op.get(state, 'title') === newTitle) return;
                        setState({ title: newTitle });
                    }
                } catch (error) {
                    console.log({ error });
                    EDITOR_ERROR.TYPE_LOAD(error);
                    return;
                }
            }
        },
        [type],
    );

    // get fullfilled handle
    let [ready] = useFulfilledObject(handle, [
        'contentType',
        'type',
        'types',
        'slug',
    ]);

    // slug change
    // useEffect(() => {
    //     if (slug !== currentSlug) {
    //         console.log('useEffect', { slug, currentSlug });
    //         if (isNew()) {
    //             reset();
    //         } else {
    //             loadingStatus.current = undefined;
    //         }
    //     }
    // }, [currentSlug, slug]);

    // update handle
    useEffect(() => {
        const hnd = _handle();
        if (_.isEqual(hnd, handle) === true) return;
        Object.keys(hnd).forEach(key => op.set(handle, key, hnd[key]));
        setHandle(handle);
    });

    // update handle refs
    useEffect(() => {
        handle.AlertBox = alertRef.current;
        handle.EventForm = formRef.current;
        handle.Sidebar = sidebarRef.current;
        handle.value = valueRef.current;
    });

    // dispatch ready
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

    // get content or reset editor
    useAsyncEffect(
        async mounted => {
            // Wait for initialization before loading content
            if (isInitializing()) return;

            // force tear down of existing form
            if (isResetNeeded()) {
                setStatus(STATUSES.RESETTING, true);
                return;
            }

            // fresh load or resetting
            if (isStatus([STATUSES.TYPES_LOADED, STATUSES.RESETTING])) {
                // got straight to daft state
                if (isNew()) {
                    setStatus(STATUSES.CONTENT_DRAFT);
                    setValue({}, true);

                    return;
                }

                setStatus(STATUSES.READY_TO_LOAD, true);
                return;
            }

            if (isStatus(STATUSES.READY_TO_LOAD)) {
                try {
                    setStatus(STATUSES.LOADING_CONTENT);
                    const content = await getContent();

                    console.log({ content, mounted: mounted(), status });
                    // time has gone by, and status may have changed
                    // asynchrounously
                    if (mounted() && isStatus(STATUSES.LOADING_CONTENT)) {
                        setStatus(STATUSES.CONTENT_REVISE, true);
                        _.defer(() =>
                            dispatch('load', { value: content }, onLoad),
                        );
                    }
                } catch (error) {
                    EDITOR_ERROR.CONTENT_LOAD(error);
                    _.delay(() => {
                        Reactium.Routing.history.push(
                            `/admin/content/${type}/new`,
                        );
                    }, 1000);
                }
            }

            if (isStatus(STATUSES.CONTENT_REVISE)) {
                await refPromise(formSubject);
                setClean({ value: result });

                setClean({ value: result });
            }
        },
        [status],
    );

    // create pulse
    // DEBUG
    // useEffect(() => {
    //     if (!ready) return;
    //     Reactium.Pulse.register('content-editor', pulse, { delay: 250 });
    //     return () => Reactium.Pulse.unregister('content-editor');
    // }, [ready]);

    // scroll to top
    useEffect(() => {
        if (isWaiting()) return;
        document.body.scrollTop = 0;
    }, [isWaiting()]);

    const render = () => {
        if (isWaiting()) return <Loading ref={loadingRef} />;

        const { title, value = {} } = state;
        const currentValue = valueRef.current || {};
        const [contentRegions, sidebarRegions] = regions();

        return (
            <>
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
            </>
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
