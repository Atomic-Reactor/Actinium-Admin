import React from 'react';
import cn from 'classnames';
import op from 'object-path';
import { __, useHookComponent } from 'reactium-core/sdk';

const noop = () => {};

const KEYS = [
    'borderTopStyle',
    'borderRightStyle',
    'borderBottomStyle',
    'borderLeftStyle',
];

const BorderStyleButton = ({
    borderColor,
    borderSize,
    prop,
    value,
    ...props
}) => {
    const { Button, Icon } = useHookComponent('ReactiumUI');

    const style = {
        borderColor,
        borderSize,
        borderStyle: value,
    };

    const label =
        value === 'none' ? (
            <Icon
                name='Feather.Slash'
                size={10}
                className='red'
                style={{ marginTop: -1 }}
            />
        ) : (
            value
        );
    return (
        prop && (
            <Button color={Button.ENUMS.COLOR.CLEAR} {...props} data-key={prop}>
                <input
                    defaultValue={value || 'solid'}
                    name={`style.${prop}`}
                    type='hidden'
                />
                <div style={style} />
                <small>{label}</small>
            </Button>
        )
    );
};

BorderStyleButton.defaultProps = {
    borderSize: 4,
};

const BorderStyles = ({ className, onChange, styles, ...props }) => (
    <div {...props} className={cn('borderStyles btn-group', className)}>
        {KEYS.map((prop, i) => {
            // prettier-ignore
            const borderColor = op.get(styles, String(prop).replace(/Style/g, 'Color'));
            const borderStyle = op.get(styles, prop, 'solid');

            return (
                <BorderStyleButton
                    borderColor={borderColor}
                    prop={prop}
                    key={`bs-${i}`}
                    onClick={onChange}
                    title={__('border style')}
                    value={borderStyle}
                />
            );
        })}
    </div>
);

BorderStyles.defaultProps = {
    onChange: noop,
    styles: {},
};

export { BorderStyleButton, BorderStyles, BorderStyles as default };
