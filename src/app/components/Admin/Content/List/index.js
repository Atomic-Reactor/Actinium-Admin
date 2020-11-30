import _ from 'underscore';
import cn from 'classnames';
import ENUMS from '../enums';
import op from 'object-path';
import pluralize from 'pluralize';
import PropTypes from 'prop-types';
import useProperCase from 'components/Admin/Tools/useProperCase';

import React, { forwardRef, useEffect, useImperativeHandle } from 'react';

import Reactium, {
    __,
    useAsyncEffect,
    useDerivedState,
    useEventHandle,
    useHookComponent,
    useRefs,
    useStatus,
    Zone,
} from 'reactium-core/sdk';

const { STATUS } = ENUMS;

const getColumns = type => {
    if (!type) return [];

    const cx = Reactium.Utils.cxFactory(ContentList.defaultProps.namespace);

    return Reactium.Content.ListColumn.list
        .filter(col => op.get(col, 'types', [type]).includes(type))
        .map(col => {
            const { className, id } = col;

            const newClassName = !className
                ? cn(
                      cx(`column-${id}-${type}`),
                      cx(`column-${id}`),
                      cx('column'),
                  )
                : String(className)
                      .replace(/\%prefix/gi, cx())
                      .replace(/\%column/gi, id)
                      .replace(/\%type/gi, type);

            op.set(col, 'className', newClassName);
            op.set(col, 'zones', [cx(id), cx(`${id}-${type}`)]);

            return col;
        });
};

/**
 * -----------------------------------------------------------------------------
 * Functional Component: ContentList
 * -----------------------------------------------------------------------------
 */
let ContentList = ({ className, id, namespace }, ref) => {
    const route = op.get(Reactium.Routing, 'currentRoute', { params: {} });

    const properCase = useProperCase();

    // Refs
    const refs = useRefs();

    // Components
    const Helmet = useHookComponent('Helmet');
    const ListItem = useHookComponent(`${id}Item`);
    const { Spinner } = useHookComponent('ReactiumUI');
    const ConfirmBox = useHookComponent('ConfirmBox');

    // Status
    const [status, setStatus, isStatus] = useStatus(STATUS.PENDING);

    // State
    const [state, update] = useDerivedState({
        columns: op.get(route, 'params.type')
            ? getColumns(pluralize.singular(route.params.type))
            : [],
        content: {},
        filter: Reactium.Cache.get('contentListFilter'),
        group: op.get(route, 'params.type'),
        page: Number(op.get(route, 'params.page', 1)),
        pagination: null,
        type: op.get(route, 'params.type')
            ? pluralize.singular(route.params.type)
            : null,
    });

    const setState = newState => {
        if (unMounted()) return;
        update(newState);
    };

    // Internal interface
    const cacheKey = key => {
        let str = `contentList.${state.type}`;
        str = key ? `${str}.${key}` : str;
        return str;
    };

    const cx = Reactium.Utils.cxFactory(namespace);

    const deleteContent = objectId => {
        const { Modal } = Reactium.Handle.get('AdminTools').current;

        if (!Modal) return;

        const { contentType } = state;

        const content = Object.values(op.get(state, 'content', {}));

        const index = _.findIndex(content, { objectId });
        const item = content[index];

        if (!item) return;

        const { status } = item;

        const confirmed = async () => {
            // instantly remove from content
            content.splice(index, 1);
            setState({ content });

            Modal.hide();

            // trash the item.
            if (status === 'PUBLISHED') {
                await Reactium.Content.unpublish({
                    type: contentType,
                    objectId,
                });
                await Reactium.Content.trash({ type: contentType, objectId });
            } else if (status !== 'TRASH') {
                await Reactium.Content.trash({ type: contentType, objectId });
            } else {
                await Reactium.Content.delete({ type: contentType, objectId });
            }
        };

        const Message = () => (
            <>
                {status !== 'PUBLISHED' && (
                    <>
                        <p>{__('Are you sure you want to delete')}</p>
                        <strong>{item.title}?</strong>
                    </>
                )}
                {status === 'PUBLISHED' && (
                    <>
                        <p>
                            <strong>{item.title}</strong>
                            <br />
                            {__('is a published item')}
                        </p>
                        <strong>{__('Are you sure?')}</strong>
                    </>
                )}
            </>
        );

        Modal.show(
            <ConfirmBox
                title={__('Confirm Delete')}
                message={<Message />}
                onConfirm={confirmed}
                onCancel={Modal.hide}
            />,
        );
    };

    const fetch = () => {
        const cacheReq =
            Reactium.Cache.get(cacheKey(state.page)) ||
            Promise.all([
                Reactium.Content.list({
                    limit: 20,
                    optimize: false,
                    page: state.page,
                    status: state.filter,
                    type: { machineName: state.type },
                }),
                Reactium.ContentType.retrieve({
                    refresh: true,
                    machineName: state.type,
                }),
            ]);

        Reactium.Cache.set(cacheKey(state.page), cacheReq, 30000);

        return cacheReq;
    };

    const unMounted = () => !refs.get('container');

    const _onFilterChange = () => {
        if (!isStatus(STATUS.COMPLETE)) return;
        Reactium.Cache.del(cacheKey());
        Reactium.Cache.set(cacheKey('filter'), state.filter);
        setStatus(STATUS.PENDING);
        setState({ content: {}, page: 1, pagination: null });
    };

    const _onLoad = async () => {
        if (!isStatus(STATUS.PENDING) || !state.type) return;
        setStatus(STATUS.FETCHING, true);

        const [list, contentType] = await fetch();

        setStatus(STATUS.COMPLETE);
        const { results: content, ...pagination } = list;
        setState({ content, contentType, pagination });
        updateHandle();
    };

    const _onRouteChange = () => {
        const page = Number(op.get(route, 'params.page', 1));

        const type = op.get(route, 'params.type')
            ? pluralize.singular(route.params.type)
            : null;

        if (!type) Reactium.Cache.del(cacheKey('filter'));

        const newState = {};
        if (page && page !== state.page) op.set(newState, 'page', page);
        if (type && type !== state.type) op.set(newState, 'type', type);

        if (Object.keys(newState).length > 0) {
            newState['columns'] = getColumns(type);
            newState['content'] = {};
            newState['group'] = pluralize(type);
            newState['pagination'] = null;
            setStatus(STATUS.PENDING);
            setState(newState);
        }
    };

    // Handle
    const _handle = () => ({
        ...state,
        cx,
        deleteContent,
        id,
        isBusy: () => isStatus(STATUS.FETCHING),
        isMounted: () => !unMounted(),
        unMounted,
        state,
        setState,
    });

    const [handle, setHandle] = useEventHandle(_handle());
    const updateHandle = () => {
        if (unMounted()) return;

        const newHandle = _handle();

        Object.entries(newHandle).forEach(
            ([key, value]) => (handle[key] = value),
        );

        setHandle(handle);
    };

    useImperativeHandle(ref, () => handle);

    // Side Effects

    useAsyncEffect(_onLoad, [status]);

    useEffect(_onFilterChange, [state.filter]);

    useEffect(_onRouteChange, [route]);

    // Render
    return (
        <div
            className={cn(className, cx())}
            ref={elm => refs.set('container', elm)}>
            {state.group && (
                <Helmet>
                    <title>{properCase(state.group)}</title>
                </Helmet>
            )}
            {isStatus(STATUS.COMPLETE) && (
                <div className={cx('heading')}>
                    <h2 className='flex-grow'>
                        <span className={cx('heading-count')}>
                            {pluralize(
                                state.type,
                                state.pagination.count,
                                true,
                            )}
                        </span>
                    </h2>
                    <div className={cx('toolbar')} style={{ flexGrow: 0 }}>
                        <Zone list={handle} zone={cx('toolbar')} />
                    </div>
                </div>
            )}
            <Zone list={handle} zone={cx('top')} />

            {isStatus(STATUS.COMPLETE) &&
                Object.values(state.content).map(item => {
                    return (
                        <ListItem key={item.objectId} list={handle} {...item} />
                    );
                })}

            <Zone list={handle} zone={cx('bottom')} />

            {isStatus(STATUS.FETCHING) && <Spinner className={cx('spinner')} />}
        </div>
    );
};

ContentList = forwardRef(ContentList);

ContentList.propTypes = {
    className: PropTypes.string,
    id: PropTypes.string,
    namespace: PropTypes.string,
};

ContentList.defaultProps = {
    id: 'AdminContentList',
    namespace: 'admin-content-list',
};

export default ContentList;
