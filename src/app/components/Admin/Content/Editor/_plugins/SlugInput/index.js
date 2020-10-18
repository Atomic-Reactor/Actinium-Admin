import _ from 'underscore';
import cn from 'classnames';
import React, { useRef, useState, useEffect, memo } from 'react';
import {
    __,
    useFocusEffect,
    useHookComponent,
    useEventEffect,
} from 'reactium-core/sdk';
import _slugify from 'slugify';
import { Button, Icon } from '@atomic-reactor/reactium-ui';

export const slugify = str => {
    if (!str) return '';
    str = String(str).replace(/\s/g, '-');
    str = _slugify(str, {
        replacement: '-', // replace spaces with replacement
        remove: /[^\w-+]/g, // regex to remove characters
        lower: true, // result in lower case
    });

    return str;
};

const SlugInput = props => {
    const containerRef = useRef();
    const slugRef = useRef();

    const { editor, errorText } = props;
    const { cx, isNew, properCase, type } = editor;
    const className = cn('form-group', { error: !!errorText });

    const [autoGen, setAutoGen] = useState(isNew());
    const [focused] = useFocusEffect(containerRef);
    const [readOnly, setReadOnly] = useState(true);

    const clean = e => {
        setAutoGen(e.currentTarget.isNew());
    };

    useEventEffect(editor, { clean: reset, 'save-success': clean, reset });

    const titlePlaceholder = String(__('%type Title')).replace('%type', type);

    const titleProps = {
        name: 'title',
        placeholder: properCase(titlePlaceholder),
        type: 'text',
    };
    const slugProps = {
        name: 'slug',
        placeholder: __('slug'),
        readOnly,
        type: 'text',
    };

    const genSlug = e => {
        if (!autoGen || !slugRef.current) return;
        const { value } = e.target;
        slugRef.current.value = slugify(value);
    };

    const onBlur = e => {
        if (!slugRef.current) return;
        let currentSlug = slugRef.current.value;
        slugRef.current.value = String(currentSlug).replace(/-$/g, '');
        setReadOnly(true);
        if (String(currentSlug).length > 0 && autoGen !== false) {
            setAutoGen(false);
        }
    };

    const onSlugChange = e => {
        const value = e.target.value;
        e.target.value = slugify(value);
        const len = String(e.target.value).length;

        if (len < 1) setAutoGen(true);
        if (len > 0 && autoGen !== false) setAuthGen(false);
    };

    const enable = () => {
        setReadOnly(false);
        slugRef.current.select();
    };

    const buttonStyle = {
        position: 'absolute',
        right: 0,
        bottom: 0,
        height: 32,
        width: 32,
        padding: 0,
    };

    return (
        <div
            ref={containerRef}
            className={cx('editor-region', 'editor-region-slug')}>
            <div className={cx('element', 'element-slug')}>
                <div className={className}>
                    <label>
                        <span className='sr-only'>
                            {titleProps.placeholder}
                        </span>
                        <input
                            {...titleProps}
                            className='input-lg'
                            data-focus
                            onChange={genSlug}
                            onBlur={onBlur}
                        />
                    </label>
                    <label>
                        <span className='sr-only'>{slugProps.placeholder}</span>
                        <input
                            {...slugProps}
                            className='input-sm'
                            ref={slugRef}
                            onKeyUp={onSlugChange}
                            onBlur={onBlur}
                            style={{ paddingRight: 32 }}
                        />
                        <Button
                            size='xs'
                            color='clear'
                            onClick={enable}
                            style={buttonStyle}>
                            <Icon name='Feather.Edit2' size={16} />
                        </Button>
                    </label>
                    {errorText && <small>{errorText}</small>}
                </div>
            </div>
        </div>
    );
};

export default memo(SlugInput);
