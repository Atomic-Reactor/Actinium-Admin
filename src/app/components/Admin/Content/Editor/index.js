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
import { Alert, Icon } from '@atomic-reactor/reactium-ui';
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

    const cx = cls => _.compact([namespace, cls]).join('-');

    const cname = cn({ [cx()]: true, [className]: !!className });

    const dispatch = async (event, detail, callback) => {
        if (unMounted()) return;
        const evt = new CustomEvent(event, { detail });
        handle.dispatchEvent(evt);
        if (typeof callback === 'function') await callback(evt);
        return Reactium.Hook.run(event, detail, handle);
    };

    const getContent = async () => {
        if (isNew()) return Promise.resolve({});

        const content = await Reactium.Content.retrieve({
            type: contentType,
            slug,
        });

        if (content) {
            await dispatch('load', content, onLoad);
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

        console.log({ save: newValue });

        await dispatch('before-content-saved', newValue);

        if (!op.get(newValue, 'slug')) {
            op.set(newValue, 'slug', `${type}-${uuid()}`);
        }
        if (!op.get(newValue, 'type')) {
            op.set(newValue, 'type', contentType);
        }

        await dispatch('content-save', newValue, onChange);

        return Reactium.Content.save(newValue, [], handle);
    };

    const submit = () => formRef.current.submit();

    const _onChange = async e => {
        const newValue = { ...value, ...e.value };
        setValue(newValue, true);
        await dispatch('content-change', newValue, onChange);
    };

    const _onError = async e => {
        await dispatch('content-save-error', e, onError);
        if (isMounted()) setAlert(e);
    };

    const _onFail = async (e, error, next) => {
        await dispatch('content-save-fail', error, onFail);

        const message = String(ENUMS.TEXT.SAVE_ERROR).replace('%type', type);

        Toast.show({
            icon: 'Feather.AlertOctagon',
            message,
            type: Toast.TYPE.ERROR,
        });

        if (isMounted()) setAlert(error);
        next();
    };

    const _onStatus = e => dispatch('status', e, onStatus);

    const _onSubmit = async e =>
        new Promise(async (resolve, reject) => {
            await dispatch('content-submit', e, onSubmit);
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
        await dispatch('content-save-success', result, onSuccess);

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
        await dispatch('content-validate', e, onValidate);
        return e;
    };

    // Handle
    const _handle = () => ({
        EventForm: formRef.current,
        AlertBox: alertRef.current,
        alert: setAlert,
        contentType,
        cx,
        dispatch,
        fieldTypes,
        isMounted,
        isNew,
        properCase,
        regions,
        save,
        state,
        setState,
        setValue,
        submit,
        type,
        types,
        unMounted,
        value,
    });

    const [handle, setHandle] = useEventHandle(_handle());
    useImperativeHandle(ref, () => handle);
    useRegisterHandle('AdminContentEditor', () => handle, [handle]);

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
        const equal = _.isEqual(newHandle, handle);
        if (equal === true) return;
        setHandle(newHandle);
    });

    // dispatch ready
    useEffect(() => {
        if (ready === true) dispatch('ready', { obj, ready, count }, onReady);
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
        if (ready !== true) return null;
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
                                        key={cx(item.slug)}
                                        editor={handle}
                                        {...item}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                    {value && sidebarRegions.length > 0 && (
                        <div className={cx('meta')}>
                            <div className={cx('regions')}>
                                {sidebarRegions.map(item => (
                                    <Region
                                        key={cx(item.slug)}
                                        editor={handle}
                                        {...item}
                                    />
                                ))}
                            </div>
                        </div>
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
