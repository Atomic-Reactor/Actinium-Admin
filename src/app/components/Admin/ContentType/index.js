import React, { useRef, useState, useEffect, memo } from 'react';
import TypeName from './TypeName';
import Fields from './Fields';
import Tools from './Tools';

import Reactium, {
    __,
    useAsyncEffect,
    useRegisterHandle,
    useHandle,
    useHookComponent,
} from 'reactium-core/sdk';
import { WebForm, Icon } from '@atomic-reactor/reactium-ui';
import cn from 'classnames';
import op from 'object-path';
import { DragDropContext } from 'react-beautiful-dnd';
import uuid from 'uuid/v4';
import _ from 'underscore';

export const slugify = name => {
    if (!name) return '';

    return require('slugify')(name, {
        replacement: '_', // replace spaces with replacement
        remove: /[^A-Za-z0-9_\s]/g, // regex to remove characters
        lower: true, // result in lower case
    });
};

const CTCapabilityEditor = props => {
    const { type, collection, machineName, savedRef } = props;
    const CapabilityEditor = useHookComponent('CapabilityEditor');
    const [capabilities, update] = useState([]);

    useEffect(() => {
        const runHook = async () => {
            // set new capRef.current to update CT cap list
            const context = await Reactium.Hook.run(
                'content-type-capabilities',
                [
                    {
                        capability: `${collection}.create`,
                        title: __('%type: Create content').replace(
                            '%type',
                            type,
                        ),
                        tooltip: __(
                            'Able to create content of type %type (%machineName)',
                        )
                            .replace('%type', type)
                            .replace('%machineName', machineName),
                    },
                    {
                        capability: `${collection}.retrieve`,
                        title: __('%type: Retrieve content').replace(
                            '%type',
                            type,
                        ),
                        tooltip: __(
                            'Able to retrieve content of type %type (%machineName), if content ACL permits.',
                        )
                            .replace('%type', type)
                            .replace('%machineName', machineName),
                    },
                    {
                        capability: `${collection}.update`,
                        title: __('%type: Update content').replace(
                            '%type',
                            type,
                        ),
                        tooltip: __(
                            'Able to update any content of type %type (%machineName), if content ACL permits.',
                        )
                            .replace('%type', type)
                            .replace('%machineName', machineName),
                    },
                    {
                        capability: `${collection}.delete`,
                        title: __('%type: Delete content').replace(
                            '%type',
                            type,
                        ),
                        tooltip: __(
                            'Able to delete content of type %type (%machineName), if content ACL permits.',
                        )
                            .replace('%type', type)
                            .replace('%machineName', machineName),
                    },
                    {
                        capability: `${collection}.retrieveAny`,
                        title: __(
                            '%type: Retrieve any content (Caution)',
                        ).replace('%type', type),
                        tooltip: __(
                            'Able to retrieve any content of type %type (%machineName), even if not owned by user.',
                        )
                            .replace('%type', type)
                            .replace('%machineName', machineName),
                    },
                    {
                        capability: `${collection}.updateAny`,
                        title: __(
                            '%type: Update any content (Caution)',
                        ).replace('%type', type),
                        tooltip: __(
                            'Able to update any content of type %type (%machineName), even if not owned by user.',
                        )
                            .replace('%type', type)
                            .replace('%machineName', machineName),
                    },
                    {
                        capability: `${collection}.deleteAny`,
                        title: __(
                            '%type: Delete any content (Caution)',
                        ).replace('%type', type),
                        tooltip: __(
                            'Able to delete any content of type %type (%machineName), even if not owned by user.',
                        )
                            .replace('%type', type)
                            .replace('%machineName', machineName),
                    },
                    {
                        capability: `${collection}.publish`,
                        title: __('%type: Publish Content').replace(
                            '%type',
                            type,
                        ),
                        tooltip: __(
                            'Able to publish content of type %type (%machineName.)',
                        )
                            .replace('%type', type)
                            .replace('%machineName', machineName),
                    },
                    {
                        capability: `${collection}.unpublish`,
                        title: __('%type: Unpublish Content').replace(
                            '%type',
                            type,
                        ),
                        tooltip: __(
                            'Able to unpublish content of type %type (%machineName.)',
                        )
                            .replace('%type', type)
                            .replace('%machineName', machineName),
                    },
                ],
                type,
                collection,
                machineName,
                savedRef,
            );
            update(context.capabilities);
        };

        runHook();
    }, [savedRef.current]);

    return (
        <div className='admin-content-region admin-content-region-type'>
            {!!capabilities.length && (
                <CapabilityEditor capabilities={capabilities} />
            )}
        </div>
    );
};

const noop = () => {};
const getStubRef = () => ({ getValue: () => ({}), update: noop });
const ContentType = memo(
    props => {
        const fieldTypes = Reactium.ContentType.FieldType.list;
        const id = op.get(props, 'params.id', 'new');
        const Enums = op.get(props, 'Enums', {});
        const REQUIRED_REGIONS = op.get(Enums, 'REQUIRED_REGIONS', {});
        const savedRef = useRef(null);
        const stateRef = useRef({ fields: {} });
        const regionRef = useRef({
            regions: REQUIRED_REGIONS,
        });
        const parentFormRef = useRef();
        const formsRef = useRef({});
        const formsErrors = useRef({});
        const nameError = useRef(false);
        const [activeRegion, setActiveRegion] = useState('default');
        const [, setVersion] = useState(uuid());
        const tools = useHandle('AdminTools');
        const Toast = op.get(tools, 'Toast');
        const [types, setTypes] = useState([]);
        const [updated, update] = useState();

        const getTypes = refresh => Reactium.ContentType.types(refresh);

        useEffect(() => {
            clear();
            if (id === 'new') {
                const autoIncludes = fieldTypes.filter(fieldType =>
                    op.get(fieldType, 'autoInclude', false),
                );

                for (const type of autoIncludes) {
                    addField(type.type);
                }
            } else {
                load();
            }

            return () => {
                const components = getComponents();
                components.forEach(component =>
                    Reactium.Zone.removeComponent(component.id),
                );
            };
        }, [id]);

        useAsyncEffect(
            async mounted => {
                const results = await getTypes(true);
                if (mounted()) setTypes(results);

                return Reactium.Cache.subscribe(
                    'content-types',
                    async ({ op }) => {
                        if (['set', 'del'].includes(op) && mounted() === true) {
                            update(Date.now());
                        }
                    },
                );
            },
            [updated],
        );

        const getValue = () => {
            const currentValue = parentFormRef.current.getValue();
            getComponents().map(({ id: fieldId, region }) => {
                const ref = op.get(formsRef.current, [fieldId], getStubRef)();
                op.set(currentValue, ['fields', fieldId], {
                    ...ref.getValue(),
                    region,
                });
            });

            return currentValue;
        };

        const setValue = value => {
            stateRef.current = value;
            parentFormRef.current.update(value);
            Object.entries(
                op.get(value, 'fields', {}),
            ).forEach(([fieldId, value]) => getFormRef(fieldId).update(value));
        };

        const clear = () => {
            nameError.current = false;
            formsErrors.current = {};
            savedRef.current = null;
            regionRef.current = {
                regions: REQUIRED_REGIONS,
            };
            setValue({});
            getComponents().forEach(({ id: fieldId }) =>
                Reactium.Zone.removeComponent(fieldId),
            );
            setVersion(uuid());
        };

        const load = async () => {
            try {
                const contentType = await Reactium.ContentType.retrieve(id);
                const regions = {
                    ...REQUIRED_REGIONS,
                    ...op.get(contentType, 'regions', {}),
                };
                const label = op.get(contentType, 'meta.label');
                op.set(contentType, 'type', label);
                savedRef.current = contentType;

                op.set(regionRef.current, 'regions', regions);

                Object.entries(op.get(contentType, 'fields', {})).forEach(
                    ([fieldId, fieldDefinition], index) => {
                        const { fieldType } = fieldDefinition;
                        if (!fieldType) return;

                        let region = op.get(
                            fieldDefinition,
                            'region',
                            'default',
                        );

                        if (!(region in regions)) region = 'default';

                        const type = fieldTypes.find(
                            ({ type }) => fieldType === type,
                        );

                        if (!type) {
                            return;
                        }

                        Reactium.Zone.addComponent({
                            ...type,
                            id: fieldId,
                            region,
                            zone: Enums.ZONE(region),
                            order: index,
                            component: 'FieldType',
                            fieldTypeComponent: type.component,
                        });
                    },
                );

                setVersion(uuid());
                setTimeout(() => {
                    setValue(contentType);
                }, 1);
            } catch (error) {
                Toast.show({
                    type: Toast.TYPE.ERROR,
                    message: __('Error loading content type.'),
                    icon: (
                        <Icon.Feather.AlertOctagon
                            style={{ marginRight: 12 }}
                        />
                    ),
                    autoClose: 1000,
                });
                console.error(error);
                Reactium.Routing.history.push('/admin/type/new');
            }
        };

        const setRegionLabel = regionId => label => {
            const regions = getRegions();
            if (regionId in regions) {
                const region = regions[regionId];
                region.label = label;
                region.slug = label ? slugify(label) : '';

                setVersion(uuid());
            }
        };

        const getRegions = () => ({
            ...REQUIRED_REGIONS,
            ...op.get(regionRef.current, 'regions', {}),
        });

        const getZones = () => {
            return _.sortBy(
                Object.values(getRegions()).map(region => {
                    // TODO: Make these rearrangable
                    const order = op.get(
                        REQUIRED_REGIONS,
                        [region.id, 'order'],
                        op.get(region, 'order', 0),
                    );
                    return {
                        ...region,
                        order,
                    };
                }),
                'order',
            ).map(region => ({
                region,
                zone: Enums.ZONE(region.id),
            }));
        };

        const getComponents = () => {
            return getZones().reduce((components, { zone }) => {
                return components.concat(Reactium.Zone.getZoneComponents(zone));
            }, []);
        };

        const validator = async (value, valid, errors) => {
            nameError.current = false;
            formsErrors.current = {};

            const responseContext = await Reactium.Hook.run(
                'content-type-validate-fields',
            );

            // type labels that are currently used
            const taken = types
                .filter(({ uuid }) => uuid !== id)
                .reduce((takenLabels, { type, meta }) => {
                    return _.compact(
                        _.uniq(
                            takenLabels.concat([
                                slugify(type),
                                slugify(op.get(meta, 'label', '')),
                            ]),
                        ),
                    );
                }, []);

            const typeSlug = slugify(op.get(value, 'type') || '');
            if (taken.includes(typeSlug)) {
                valid = false;
                op.set(
                    errors,
                    'fields',
                    op.get(errors, 'fields', []).concat(['type']),
                );
                Toast.show({
                    type: Toast.TYPE.ERROR,
                    message: __('Type name taken.'),
                    icon: (
                        <Icon.Feather.AlertOctagon
                            style={{ marginRight: 12 }}
                        />
                    ),
                    autoClose: 1000,
                });
            }

            const fieldNames = {};
            let savedFields = {};
            if (op.has(savedRef.current, ['fields'])) {
                savedFields = op.get(savedRef.current, ['fields']);
                savedFields = _.indexBy(
                    Object.values(savedFields).map(field => ({
                        id: field.id,
                        slug: slugify(field.fieldName),
                        fieldType: field.fieldType,
                    })),
                    'slug',
                );
            }

            for (let { id: fieldId } of getComponents()) {
                const ref = getFormRef(fieldId);

                // collect results of fields hook
                if (
                    op.get(responseContext, [fieldId, 'valid'], true) !== true
                ) {
                    op.set(
                        formsErrors.current,
                        [fieldId],
                        op.get(responseContext, [fieldId]),
                    );

                    ref.setState(op.get(responseContext, [fieldId]));
                    valid = false;
                }

                // make sure all fields are unique
                const { fieldName, fieldType } = ref.getValue();
                const slug = slugify(fieldName || '').toLowerCase();
                const errors = op.get(ref, 'errors') || {
                    focus: null,
                    fields: [],
                    errors: [],
                };

                if (slug in fieldNames) {
                    const error = __('Duplicate field name %fieldName').replace(
                        '%fieldName',
                        fieldName,
                    );
                    Toast.show({
                        type: Toast.TYPE.ERROR,
                        message: error,
                        icon: (
                            <Icon.Feather.AlertOctagon
                                style={{ marginRight: 12 }}
                            />
                        ),
                        autoClose: 1000,
                    });

                    valid = false;
                    const updatedErrors = {
                        ...errors,
                        focus: 'fieldName',
                        fields: _.uniq([
                            ...op.get(errors, 'fields', []),
                            'fieldName',
                        ]),
                        errors: [...op.get(errors, 'errors', []), error],
                    };

                    ref.setState({
                        errors: updatedErrors,
                    });

                    op.set(formsErrors.current, [fieldId], {
                        valid: false,
                        errors: updatedErrors,
                    });
                }

                fieldNames[slug] = fieldId;

                // check to make sure UI version of field type matches saved
                if (
                    op.has(savedFields, slug) &&
                    fieldType !== op.get(savedFields, [slug, 'fieldType'])
                ) {
                    const error = __(
                        'Field name %fieldName type exists.',
                    ).replace('%fieldName', fieldName);
                    Toast.show({
                        type: Toast.TYPE.ERROR,
                        message: error,
                        icon: (
                            <Icon.Feather.AlertOctagon
                                style={{ marginRight: 12 }}
                            />
                        ),
                        autoClose: 2000,
                    });

                    valid = false;
                    const updatedErrors = {
                        ...errors,
                        focus: 'fieldName',
                        fields: _.uniq([
                            ...op.get(errors, 'fields', []),
                            'fieldName',
                        ]),
                        errors: [...op.get(errors, 'errors', []), error],
                    };

                    ref.setState({
                        errors: updatedErrors,
                    });

                    op.set(formsErrors.current, [fieldId], {
                        valid: false,
                        errors: updatedErrors,
                    });
                }
            }

            const regionSlugs = Object.values(getRegions()).reduce(
                (slugs, { id, slug }) => ({ ...slugs, [slug]: id }),
                {},
            );

            if (
                _.compact(Object.keys(regionSlugs)).length !==
                Object.values(getRegions()).length
            )
                valid = false;

            return { valid, errors };
        };

        const onError = async ({ errors }) => {
            if (op.get(errors, 'fields', []).includes('type')) {
                nameError.current = true;
            } else {
                nameError.current = false;
            }

            updateRestore(() => {
                // render errors
                setVersion(uuid());
            });
        };

        const onDragEnd = result => {
            const draggableId = op.get(result, 'draggableId');
            const sourceIndex = op.get(result, 'source.index');
            const sourceRegion = op.get(result, 'source.droppableId');
            const destinationIndex = op.get(result, 'destination.index');
            const destinationRegion = op.get(result, 'destination.droppableId');

            if (
                sourceIndex === destinationIndex &&
                sourceRegion === destinationRegion
            )
                return;

            const moveInRegion = (
                id,
                sourceIndex,
                region,
                destinationIndex,
            ) => {
                const zone = Enums.ZONE(region);
                const fieldIds = Reactium.Zone.getZoneComponents(zone).map(
                    ({ id }) => id,
                );

                fieldIds.splice(sourceIndex, 1);
                fieldIds.splice(destinationIndex, 0, id);
                fieldIds.forEach((id, order) =>
                    Reactium.Zone.updateComponent(id, { order }),
                );
            };

            const moveToRegion = (
                id,
                sourceRegion,
                destinationIndex,
                destinationRegion,
            ) => {
                const destinationZone = Enums.ZONE(destinationRegion);
                const destinationFieldIds = Reactium.Zone.getZoneComponents(
                    destinationZone,
                ).map(({ id }) => id);

                destinationFieldIds.splice(destinationIndex, 0, id);
                destinationFieldIds.forEach((id, order) =>
                    Reactium.Zone.updateComponent(id, {
                        order,
                        region: destinationRegion,
                        zone: destinationZone,
                    }),
                );

                const sourceZone = Enums.ZONE(sourceRegion);
                Reactium.Zone.getZoneComponents(sourceZone).forEach(
                    ({ id }, order) => {
                        Reactium.Zone.updateComponent(id, { order });
                    },
                );
            };

            if (sourceRegion === destinationRegion) {
                moveInRegion(
                    draggableId,
                    sourceIndex,
                    sourceRegion,
                    destinationIndex,
                );
            } else {
                const value = getValue();
                moveToRegion(
                    draggableId,
                    sourceRegion,
                    destinationIndex,
                    destinationRegion,
                );
                setTimeout(() => {
                    setValue(value);
                }, 1);
            }
        };

        const refreshForms = () => {
            // put values back in form without rerender
            parentFormRef.current.refresh();
            getComponents().forEach(({ id }) => {
                const ref = getFormRef(id);
                if (ref && ref.refresh) ref.refresh();
            });
        };

        const updateRestore = async (cb = noop) => {
            // preserve values
            const value = getValue();

            // in case cb caused rerender
            await cb(value);

            // refresh forms in dom
            refreshForms();

            return value;
        };

        const onTypeBeforeSubmit = async ({ value, valid, errors }) => {
            await Reactium.Hook.run('content-type-before-submit', {
                value,
                valid,
                errors,
                handle: getHandle(),
            });
        };

        const onTypeChange = async (e, value) => {
            await Reactium.Hook.run('content-type-form-change', {
                value,
                id,
                handle: getHandle(),
                target: e.target,
            });
        };

        const onTypeUpdate = async ({ value, elements }) => {
            await Reactium.Hook.run('content-type-form-update', {
                value,
                elements,
                handle: getHandle(),
            });
        };

        const onTypeSave = async () => {
            updateRestore(async value => {
                try {
                    op.set(value, 'regions', getRegions());

                    const contentType = await Reactium.ContentType.save(
                        id,
                        value,
                    );
                    savedRef.current = contentType;

                    Toast.show({
                        type: Toast.TYPE.SUCCESS,
                        message: __('Content type saved'),
                        icon: (
                            <Icon.Feather.Check style={{ marginRight: 12 }} />
                        ),
                        autoClose: 1000,
                    });

                    if (id === 'new' && contentType.uuid) {
                        Reactium.Routing.history.push(
                            `/admin/type/${contentType.uuid}`,
                        );
                    }

                    nameError.current = false;
                    formsErrors.current = {};
                    setValue(value);
                    setVersion(uuid());
                } catch (error) {
                    Toast.show({
                        type: Toast.TYPE.ERROR,
                        message: __('Error saving content type.'),
                        icon: (
                            <Icon.Feather.AlertOctagon
                                style={{ marginRight: 12 }}
                            />
                        ),
                        autoClose: 1000,
                    });
                    console.error(error);
                }
            });
        };

        const renderCapabilityEditor = () => {
            if (isNew() || savedRef.current === null) return null;

            const { collection, machineName } = savedRef.current;
            const label = op.get(savedRef.current, 'meta.label');
            return (
                <CTCapabilityEditor
                    type={label}
                    collection={collection}
                    machineName={machineName}
                    savedRef={savedRef}
                />
            );
        };

        //
        // Handle Interface
        //
        const addRegion = () => {
            const regions = { ...getRegions() };
            const region = uuid();
            regions[region] = { id: region, label: region, slug: region };
            regionRef.current = { regions };
            setActiveRegion(region);
            setVersion(uuid());
            setTimeout(() => {
                refreshForms();
            }, 1);
        };

        const removeRegion = region => {
            if (Object.keys(REQUIRED_REGIONS).includes(region)) return;

            updateRestore(async value => {
                let next = Reactium.Zone.getZoneComponents(Enums.ZONE(region))
                    .length;
                op.del(regionRef.current, ['regions', region]);
                const zoneComponents = Reactium.Zone.getZoneComponents(
                    Enums.ZONE(region),
                );

                for (const component of zoneComponents) {
                    Reactium.Zone.updateComponent(component.id, {
                        order: next++,
                        zone: [Enums.ZONE('default')],
                        region: 'default',
                    });
                }

                setTimeout(() => {
                    setActiveRegion('default');
                    setValue(value);
                    setVersion(uuid());
                }, 1);
            });
        };

        const addField = type => {
            const types = _.indexBy(fieldTypes, 'type');
            if (op.has(types, type)) {
                updateRestore(
                    () =>
                        new Promise(resolve => {
                            const existing = getComponents();
                            const fieldType = types[type];
                            const region = op.get(
                                fieldType,
                                'defaultRegion',
                                activeRegion,
                            );

                            const fieldTypeComponent = op.get(
                                fieldType,
                                'component',
                            );

                            if (
                                !op.get(fieldType, 'singular', false) ||
                                !existing.find(t => t.type === type)
                            ) {
                                Reactium.Zone.addComponent({
                                    ...fieldType,
                                    zone: Enums.ZONE(region),
                                    order: existing.length,
                                    component: 'FieldType',
                                    region,
                                    fieldTypeComponent,
                                });

                                setTimeout(() => {
                                    resolve();
                                }, 1);
                            }
                        }),
                );
            }
        };

        const removeField = id => {
            // Make async so dismissable _onHide() reconciles before removing component
            updateRestore(
                () =>
                    new Promise(resolve => {
                        setTimeout(() => {
                            Reactium.Zone.removeComponent(id);
                            op.del(formsRef.current, [id]);
                            resolve();
                        }, 1);
                    }),
            );
        };

        const addFormRef = (id, cb) => {
            formsRef.current[id] = cb;
        };

        const removeFormRef = id => {
            op.del(formsRef.current, [id]);
        };

        const getFormRef = id => op.get(formsRef.current, [id], getStubRef)();

        const getFormErrors = id => op.get(formsErrors.current, [id, 'errors']);

        const clearDelete = async () => {
            clear();

            if (id !== 'new') {
                try {
                    await Reactium.ContentType.delete(id);

                    Toast.show({
                        type: Toast.TYPE.SUCCESS,
                        message: __('Content type deleted.'),
                        icon: (
                            <Icon.Feather.Check style={{ marginRight: 12 }} />
                        ),
                        autoClose: 1000,
                    });

                    Reactium.Routing.history.push('/admin/type/new');
                } catch (error) {
                    Toast.show({
                        type: Toast.TYPE.ERROR,
                        message: __('Error deleting content type.'),
                        icon: (
                            <Icon.Feather.AlertOctagon
                                style={{ marginRight: 12 }}
                            />
                        ),
                        autoClose: 1000,
                    });
                    console.error(error);
                    return;
                }
            }
        };

        const isNew = () => id === 'new';

        const isActiveRegion = region => activeRegion === region;

        const getHandle = () => ({
            addRegion,
            removeRegion,
            addField,
            removeField,
            addFormRef,
            removeFormRef,
            getFormRef,
            getFormErrors,
            clearDelete,
            isActiveRegion,
            isNew,
            id,
            saved: () => savedRef.current,
            setActiveRegion,
        });

        useRegisterHandle('ContentTypeEditor', getHandle, [activeRegion, id]);

        return (
            <div
                className={cn(
                    'type-editor',
                    slugify(`type-editor ${id}`).toLowerCase(),
                )}>
                <WebForm
                    ref={parentFormRef}
                    onSubmit={onTypeSave}
                    onBeforeSubmit={onTypeBeforeSubmit}
                    onChange={onTypeChange}
                    onUpdate={onTypeUpdate}
                    onError={onError}
                    className={'webform webform-content-type'}
                    required={['type']}
                    showError={false}
                    validator={validator}>
                    <TypeName id={id} error={nameError.current} />
                </WebForm>

                <DragDropContext onDragEnd={onDragEnd}>
                    {getZones().map(({ region, zone }) => (
                        <Fields
                            key={region.id}
                            onRegionLabelChange={setRegionLabel(region.id)}
                            onRemoveRegion={() => removeRegion(region.id)}
                            region={region}
                            regions={getRegions()}
                            zone={zone}
                        />
                    ))}
                </DragDropContext>
                <Tools enums={Enums} />
                {renderCapabilityEditor()}
            </div>
        );
    },
    (prev, next) => {
        return op.get(prev, 'params.id') === op.get(next, 'params.id');
    },
);

export default ContentType;
