import React from 'react';
import { __, useHookComponent } from 'reactium-core/sdk';

/**
 * -----------------------------------------------------------------------------
 * Functional Component: Selector
 * -----------------------------------------------------------------------------
 */
const buttons = [
    { icon: 'Linear.Chip', label: __('Hook'), id: 'hook' },
    {
        icon: 'Linear.Typewriter',
        label: __('Content'),
        id: 'content',
    },
    { icon: 'Linear.MagicWand', label: __('JSX'), id: 'jsx' },
];

const Selector = ({ handle }) => {
    const { cx, navTo } = handle;
    const { Icon } = useHookComponent('ReactiumUI');
    const onClick = ({ id }) => navTo(id);

    return (
        <div className={cx('selector')}>
            {buttons.map(btn => (
                <button
                    className={cx('selector-btn')}
                    data-id={btn.id}
                    key={`selector-${btn.id}`}
                    onClick={() => onClick(btn)}>
                    <div className={cx('selector-icon')}>
                        <Icon name={btn.icon} />
                    </div>
                    <div className={cx('selector-label')}>{btn.label}</div>
                </button>
            ))}
        </div>
    );
};

export default Selector;
