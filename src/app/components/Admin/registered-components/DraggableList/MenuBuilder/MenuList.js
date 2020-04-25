import React, { useState, useEffect, useRef } from 'react';
import DraggableList from '../index';
import op from 'object-path';

const noop = () => {};
const MenuList = props => {
    const { items, defaultItemHeight, menuIndent, onReorder } = props;
    const listRef = useRef();
    const indent = Math.max(10, menuIndent);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
    }, [items]);

    useEffect(() => {
        setLoading(false);
    }, [loading === true]);

    if (loading) return null;

    const tx = (index, dragContext, next) => {
        const { x, selected, originalIndex, items: newOrder } = dragContext;

        const newIndex = newOrder.findIndex(({ idx }) => index === idx);
        const depth = op.get(newOrder, [newIndex, 'depth'], 0);
        const newX = depth * indent;
        next.x = newX;
        const immediate =
            typeof next.immediate === 'function'
                ? next.immediate
                : () => next.immediate;

        next.immediate = n => n === 'x' || immediate(n);

        if (selected && index === originalIndex && newIndex > 0) {
            next.x = x;
        }

        return next;
    };

    const onDrag = (state, tx, { items: newOrder }) => {
        const {
            args: [originalIndex],
            down,
            movement: [x],
        } = state;

        const curIndex = newOrder.findIndex(item => originalIndex === item.idx);
        const current = newOrder[curIndex];

        let depth = op.get(current, 'depth', 0);
        const parentDepth = op.get(newOrder, [curIndex - 1, 'depth'], 0);
        if (curIndex > 0) {
            const depthOffset = Math.floor(x / indent);
            depth = op.get(current, 'depth', parentDepth);
            depth = Math.max(0, Math.min(parentDepth + 1, depthOffset));
        }
        current.depth = depth;
    };

    return (
        <div>
            <DraggableList
                ref={listRef}
                defaultItemHeight={defaultItemHeight}
                onReorder={onReorder}
                onDrag={onDrag}
                dragTx={tx}>
                {items.map(item => (
                    <div
                        key={item.id}
                        depth={item.depth}
                        style={{ height: 50 }}>
                        {item.id}
                    </div>
                ))}
            </DraggableList>
        </div>
    );
};

MenuList.defaultProps = {
    items: [],
    defaultItemHeight: 50,
    onReorder: noop,
    menuIndent: 20,
};

export default MenuList;
