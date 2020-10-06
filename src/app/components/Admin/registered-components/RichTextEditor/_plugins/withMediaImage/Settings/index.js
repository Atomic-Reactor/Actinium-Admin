import React from 'react';
import _ from 'underscore';
import cn from 'classnames';
import op from 'object-path';
import { Transforms } from 'slate';
import { useEditor } from 'slate-react';

import Reactium, {
    __,
    useDerivedState,
    useFocusEffect,
    useHookComponent,
    useRefs,
} from 'reactium-core/sdk';

const Panel = props => {
    const editor = useEditor();

    const refs = useRefs();

    const [state, update] = useDerivedState({
        borderStyleValues: [
            'solid',
            'dotted',
            'dashed',
            'double',
            'groove',
            'ridge',
            'inset',
            'outset',
            'none',
        ],
        nodeProps: op.get(props, 'nodeProps', { float: 'none' }),
    });

    const setState = newState =>
        new Promise(resolve => {
            update(newState);
            _.defer(() => resolve());
        });

    const {
        BackgroundColor,
        BorderColors,
        BorderRadius,
        BorderSizes,
        BorderStyles,
        MarginStyles,
        Opacity,
        PaddingStyles,
        Position,
        Settings,
        Sizing,
    } = useHookComponent('RichTextEditorSettings');

    const { Dialog } = useHookComponent('ReactiumUI');

    const cx = Reactium.Utils.cxFactory('rte-settings');

    const heading = title => ({ title });

    const pref = suffix => `admin.rte.settings.image.${suffix}`;

    const onSubmit = ({ value }) => {
        Reactium.Hook.runSync('rte-settings-apply', value);

        const node = Reactium.RTE.getNode(editor, props.id);
        Transforms.select(editor, node.path);
        Transforms.collapse(editor, { edge: 'end' });
        Transforms.setNodes(editor, { nodeProps: value }, { at: node.path });
    };

    const onChange = ({ value }) => {
        let nodeProps = JSON.parse(JSON.stringify(state.nodeProps));
        nodeProps.style = !nodeProps.style ? {} : nodeProps.style;

        nodeProps = { ...nodeProps, ...value };

        Reactium.Hook.runSync('rte-settings-value', nodeProps);

        setState({ nodeProps });
        onSubmit({ value: nodeProps });
    };

    const setValue = newValue => {
        const form = refs.get('settings');
        if (!form) return;
        form.setValue(newValue);
    };

    const setBorderStyle = e => {
        const key = e.currentTarget.dataset.key;

        const val = String(
            op.get(state, ['nodeProps', 'style', key], 'solid'),
        ).toLowerCase();

        let i = state.borderStyleValues.indexOf(val) + 1;
        i = i === state.borderStyleValues.length ? 0 : i;

        const value = state.borderStyleValues[i];

        updateStyle({ key, value });
    };

    const setBorderColor = ({ key, value }) => updateStyle({ key, value });

    const setBackgroundColor = e =>
        updateStyle({ key: 'backgroundColor', value: e.target.value });

    const setPosition = ({ key, value }) => updateStyle({ key, value });

    const setOpacity = ({ value }) => updateStyle({ key: 'opacity', value });

    const updateStyle = ({ key, value }) => {
        const nodeProps = JSON.parse(JSON.stringify(state.nodeProps));
        nodeProps.style = !nodeProps.style ? {} : nodeProps.style;

        if (Array.isArray(key) && _.isObject(value)) {
            key.forEach(k => op.set(nodeProps.style, k, op.get(value, k)));
        } else {
            op.set(nodeProps.style, key, value);
        }
        setValue(nodeProps);
        onChange({ value: nodeProps });
    };

    useFocusEffect(editor.panel.container);

    return (
        <Settings
            className={cx()}
            id='rte-image-settings'
            onSubmit={onSubmit}
            onChange={onChange}
            ref={elm => refs.set('settings', elm)}
            title={__('Image Properties')}
            footer={{}}
            value={op.get(state, 'nodeProps', {})}>
            <Dialog
                className='sub'
                header={heading(__('CSS Class'))}
                pref={pref('classname')}>
                <div className={cx('row')}>
                    <div className='col-xs-12 form-group'>
                        <input
                            data-focus
                            type='text'
                            name='className'
                            title={__('css class')}
                        />
                    </div>
                </div>
            </Dialog>

            <Dialog
                className='sub'
                header={heading(__('Position'))}
                pref={pref('align')}>
                <div className={cn(cx('row'), 'pb-xs-0')}>
                    <Position
                        styles={state.nodeProps.style}
                        onChange={setPosition}
                        className='col-xs-12'
                    />
                </div>
            </Dialog>

            <Dialog
                className='sub'
                header={heading(__('Size'))}
                pref={pref('sizing')}>
                <div className={cx('row')}>
                    <Sizing />
                </div>
            </Dialog>

            <Dialog
                className='sub'
                header={heading(__('Opacity'))}
                pref={pref('opacity')}>
                <div className={cx('row')}>
                    <Opacity
                        styles={state.nodeProps.style}
                        onChange={setOpacity}
                    />
                </div>
            </Dialog>

            <Dialog
                className='sub'
                header={heading(__('Margin'))}
                pref={pref('spacing.margin')}>
                <div className={cx('row')}>
                    <MarginStyles styles={state.nodeProps.style} />
                </div>
            </Dialog>

            <Dialog
                className='sub'
                header={heading(__('Padding'))}
                pref={pref('spacing.padding')}>
                <div className={cx('row')}>
                    <PaddingStyles styles={state.nodeProps.style} />
                </div>
            </Dialog>

            <Dialog
                className='sub'
                header={heading(__('Background Color'))}
                pref={pref('spacing.backgroundColor')}>
                <div style={{ marginTop: -1 }}>
                    <BackgroundColor
                        styles={state.nodeProps.style}
                        onChange={setBackgroundColor}
                    />
                </div>
            </Dialog>

            <Dialog
                className='sub'
                header={heading(__('Borders'))}
                pref={pref('borders')}>
                <div className={cx('row')}>
                    <BorderSizes styles={state.nodeProps.style} />
                    <BorderRadius
                        styles={state.nodeProps.style}
                        className='mt-xs-8'
                    />
                    <BorderStyles
                        styles={state.nodeProps.style}
                        onChange={setBorderStyle}
                    />
                    <BorderColors
                        styles={state.nodeProps.style}
                        onChange={setBorderColor}
                    />
                </div>
            </Dialog>
        </Settings>
    );
};

export default props => {
    const editor = useEditor();
    const { Button, Icon } = useHookComponent('ReactiumUI');
    const showPanel = () =>
        editor.panel
            .setID('rte-image-settings')
            .setContent(<Panel {...props} />)
            .show();

    return (
        <Button color={Button.ENUMS.COLOR.SECONDARY} onClick={showPanel}>
            <Icon name='Feather.Camera' size={12} />
        </Button>
    );
};