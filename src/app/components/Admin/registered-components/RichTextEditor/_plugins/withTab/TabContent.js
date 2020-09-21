import _ from 'underscore';
import op from 'object-path';
import React, { useEffect, useState } from 'react';
import Reactium, { __, useHookComponent } from 'reactium-core/sdk';

const TabContent = props => {
    const { state } = props;

    const { Button } = useHookComponent('ReactiumUI');

    const [item, setItem] = useState(state.content[state.active]);

    const cx = Reactium.Utils.cxFactory('rte-tabs-content');

    const isEmpty = () => {
        const items = _.compact(Array.isArray(item) ? item : [item]);
        if (items.length < 1) return true;
        const node = _.first(items);
        return op.get(node, 'type') === 'empty';
    };

    useEffect(() => {
        if (state.updated === null) return;

        const newItem = state.content[state.active];
        setItem(newItem);
        if (newItem && !_.isEqual(newItem, item)) {
            props.setContent(state.active, newItem);
        }
    }, [state.updated]);

    return isEmpty() ? (
        <div className='text-center p-xs-40'>
            <Button
                size='md'
                appearance='pill'
                onClick={props.showEditor}
                children={__('Create Tab Content')}
            />
        </div>
    ) : (
        <div className={cx()}>
            {props.children}
            <div className='blocker' />
            <Button
                size='md'
                className='edit'
                appearance='pill'
                onClick={props.showEditor}
                children={__('Edit Tab Content')}
            />
        </div>
    );
};

export default TabContent;
