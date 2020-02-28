import uuid from 'uuid/v4';
import _ from 'underscore';
import cn from 'classnames';
import op from 'object-path';
import Region from './Region';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import useProperCase from '../_utils/useProperCase';
import useRouteParams from '../_utils/useRouteParams';
import { slugify } from 'components/Admin/ContentType';
import { Alert, Icon, Spinner } from '@atomic-reactor/reactium-ui';
import DEFAULT_ENUMS from 'components/Admin/Content/enums';

// import { EventForm } from '@atomic-reactor/reactium-ui';
import EventForm from 'components/EventForm';

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
    useDerivedState,
    useEventHandle,
    useFulfilledObject,
    useHandle,
    useHookComponent,
    useRegisterHandle,
    useSelect,
    Zone,
} from 'reactium-core/sdk';

/**
 * -----------------------------------------------------------------------------
 * Functional Component: ContentEditor
 * -----------------------------------------------------------------------------
 */
const noop = () => {};

let ContentEditor = (
    {
        ENUMS,
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
        ...props
    },
    ref,
) => {
    const alertRef = useRef();
    const formRef = useRef();
    const sidebarRef = useRef();

    const Loading = useHookComponent(`${id}Loading`);
    const Sidebar = useHookComponent(`${id}Sidebar`);
    const SlugInput = useHookComponent('SlugInput');

    const tools = useHandle('AdminTools');

    const Toast = op.get(tools, 'Toast');

    let { path, type, slug } = useRouteParams(['type', 'slug']);

    const alertDefault = {
        color: Alert.ENUMS.COLOR.INFO,
        icon: 'Feather.Flag',
    };

    const [contentType, setContentType] = useState();
    const [alert, setNewAlert] = useState(alertDefault);
    const [fieldTypes] = useState(Reactium.ContentType.FieldType.list);
    const [currentSlug, setCurrentSlug] = useState(slug);
    const [status, setStatus] = useState('pending');
    const [state, setState] = useDerivedState(props, ['title', 'sidebar']);
    const [types, setTypes] = useState();
    const [updated, update] = useState();
    const [value, setNewValue] = useState();

    // Aliases prevent memory leaks
    const setValue = (newValue = {}, checkReady = false) => {
        if (unMounted(checkReady)) return;
        newValue = { ...value, ...newValue };
        setNewValue(newValue);
    };

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

    // Functions

    const cx = Reactium.Utils.cxFactory(namespace);

    const cname = cn(cx(), { [className]: !!className });

    const dispatch = async (event, detail, callback) => {
        if (unMounted()) return;
        const evt = new CustomEvent(event, { detail });

        if (event !== 'status') {
            // dispatch exact event
            handle.dispatchEvent(evt);

            // dispatch status event
            const statusEvt = new CustomEvent('status', {
                type: event,
                detail,
            });
            handle.dispatchEvent(statusEvt);
        } else {
            // dispatch status event
            const statusEvt = new CustomEvent('status', {
                type: event,
                detail,
            });
            handle.dispatchEvent(statusEvt);
        }

        // dispatch exact reactium hook
        await Reactium.Hook.run(`form-${type}-${event}`, { detail });

        // dispatch status reactium hook
        await Reactium.Hook.run(`form-${type}-status`, {
            type: event,
            detail,
        });

        // execute basic callback
        if (typeof callback === 'function') await callback(evt);
    };

    const getContent = async () => {
        if (isNew()) return Promise.resolve({});

        const content = await Reactium.Content.retrieve({
            type: contentType,
            slug,
        });

        if (content) {
            await dispatch('status', { type: 'load', detail: content }, onLoad);
            return Promise.resolve(content);
        } else {
            const message = (
                <span>
                    Unable to find {properCase(type)}:{' '}
                    <span className='red strong'>{slug}</span>
                </span>
            );
            _onError({ message });
            return Promise.reject(message);
        }
    };

    const getContentType = () => _.findWhere(types, { type });

    const getTypes = refresh => Reactium.ContentType.types(refresh);

    const unMounted = (checkReady = false) => {
        if (checkReady === true && !ready) return true;
        return !formRef.current;
    };

    const isMounted = (checkReady = false) => {
        if (unMounted(checkReady)) return false;
        return true;
    };

    const isNew = () => {
        const val = String(slug).toLowerCase() === 'new' ? true : null;
        return val === true ? true : null;
    };

    const properCase = useProperCase();

    const regions = () => {
        const { sidebar } = state;

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

    const save = async (mergeValue = {}) => {
        setAlert();

        const newValue = { ...value, ...mergeValue };

        await dispatch('before-save', newValue);

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
            } else {
                op.del(newValue, 'slug');
                op.del(newValue, 'uuid');
            }
        }

        await dispatch('save', newValue, onChange);

        return Reactium.Content.save(newValue, [], handle);
    };

    const setContentStatus = async status => {
        if (isNew()) return;

        setAlert();

        const newValue = { ...value, status };

        if (!op.get(newValue, 'type')) {
            op.set(newValue, 'type', contentType);
        }

        await dispatch('before-content-set-status', newValue);

        try {
            const contentObj = await Reactium.Content.setStatus(
                newValue,
                handle,
            );
            if (unMounted()) return;

            await dispatch(
                'content-set-status',
                { value: contentObj },
                _onChange,
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

    const publish = async (action = 'publish') => {
        if (isNew()) return;

        setAlert();

        const newValue = { ...value, status };

        if (!op.get(newValue, 'type')) {
            op.set(newValue, 'type', contentType);
        }

        await dispatch(`before-${action}`, newValue);
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

            await dispatch(action, { value: contentObj }, _onChange);
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

    const submit = () => formRef.current.submit();

    const _onChange = async e => {
        if (op.has(e, 'value')) {
            const newValue = { ...value, ...e.value };
            setValue(newValue, true);
            await dispatch('change', newValue, onChange);
        }
    };

    const _onError = async e => {
        await dispatch('save-error', e, onError);
        if (isMounted()) setAlert(e);
    };

    const _onFail = async (e, error, next) => {
        await dispatch('save-fail', error, onFail);

        const message = String(ENUMS.TEXT.SAVE_ERROR).replace('%type', type);

        Toast.show({
            icon: 'Feather.AlertOctagon',
            message,
            type: Toast.TYPE.ERROR,
        });

        if (isMounted()) setAlert(error);
        next();
    };

    const _onStatus = e => {
        const { type, detail } = e;
        dispatch('status', { type: detail }, onStatus);
    };

    const _onSubmit = async e =>
        new Promise(async (resolve, reject) => {
            await dispatch('submit', e, onSubmit);
            save(e.value)
                .then(async result => {
                    if (unMounted()) return;
                    await _onSuccess(e, result, resolve);
                })
                .catch(async error => {
                    if (unMounted()) return;
                    await _onFail(e, error, reject);
                });
        });

    const _onSuccess = async (e, result, next) => {
        await dispatch('save-success', result, onSuccess);

        const message = String(ENUMS.TEXT.SAVED).replace('%type', type);

        Toast.show({
            icon: 'Feather.Check',
            message,
            type: Toast.TYPE.INFO,
        });

        if (unMounted()) return;

        setValue(result);
        next();

        const newSlug = result.slug;
        if (isNew() || newSlug !== slug) {
            setTimeout(
                () =>
                    Reactium.Routing.history.push(
                        `/admin/content/${type}/${newSlug}`,
                    ),
                1,
            );
        }
    };

    const _onValidate = async e => {
        await dispatch('validate', e, onValidate);
        return e;
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
        fieldTypes,
        id,
        isMounted,
        isNew,
        properCase,
        regions,
        save,
        state,
        setContentStatus,
        publish,
        setState,
        setValue,
        submit,
        type,
        types,
        unMounted,
        value,
    });

    const [handle, setHandle] = useEventHandle(_handle());
    useImperativeHandle(ref, () => handle, [handle]);
    useRegisterHandle(`${id}Editor`, () => handle, [handle]);

    // get content types
    useAsyncEffect(
        async mounted => {
            if (!type) return;
            const results = await getTypes(true);
            if (mounted()) setTypes(results);
            return () => {};
        },
        [type],
    );

    // get fullfilled handle
    const [obj, ready, count] = useFulfilledObject(handle, [
        'contentType',
        'type',
        'types',
    ]);

    // slug change
    useEffect(() => {
        if (!slug) return;
        if (currentSlug !== slug) {
            setNewValue();
            setCurrentSlug(slug);
        }
    }, [currentSlug, slug]);

    // get content
    useEffect(() => {
        if (!formRef.current || !slug || value) return;
        getContent()
            .then(result => {
                if (unMounted()) return;
                setValue(result);
            })
            .catch(() => {
                Reactium.Routing.history.push(`/admin/content/${type}/new`);
            });
    });

    // set content type
    useEffect(() => {
        if (!type) return;
        const t = _.findWhere(types, { type });
        if (!t) return;
        setContentType(t);
    }, [type, types]);

    // update title
    useEffect(() => {
        if (!type) return;
        const newTitle = properCase(`${type} ${ENUMS.TEXT.EDITOR}`);
        if (op.get(state, 'title') === newTitle) return;
        setState({ title: newTitle });
    }, [type]);

    // update handle
    useEffect(() => {
        const newHandle = _handle();
        let equal = _.isEqual(newHandle, handle);
        if (equal === true) return;
        setHandle(newHandle);
    });

    // update handle refs
    useEffect(() => {
        handle.AlertBox = alertRef.current;
        handle.EventForm = formRef.current;
        handle.Sidebar = sidebarRef.current;
    });

    // dispatch ready
    useEffect(() => {
        if (ready === true)
            dispatch('status', { type: 'ready', obj, ready, count }, onReady);
    }, [ready]);

    // dispatch status
    useEffect(() => {
        if (ready !== true || !formRef.current) return;
        formRef.current.addEventListener('status', _onStatus);
        return () => {
            formRef.current.removeEventListener('status', _onStatus);
        };
    }, [ready]);

    const render = () => {
        if (ready !== true) return <Loading />;
        const { sidebar, title } = state;
        const currentValue = value || {};
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
                    onError={_onError}
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
    ENUMS: PropTypes.object,
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
};

ContentEditor.defaultProps = {
    ENUMS: DEFAULT_ENUMS,
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
};

export default ContentEditor;
