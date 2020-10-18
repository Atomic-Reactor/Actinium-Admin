import _ from 'underscore';
import op from 'object-path';
import { useState } from 'react';

const useLocalState = (defaultState = {}) => {
    const [state, updateState] = useState(defaultState);

    const getState = (key, defaultValue) =>
        !key ? state : op.get(state, key, defaultValue);

    const forceUpdate = newState => {
        updateState(newState);
        // _.defer(() => updateState({ ...newState, update: Date.now() }));
    };

    const setState = (newState, newValue) => {
        // clear state
        if (!newState) {
            update({});
            return;
        }

        if (_.isString(newState)) {
            newState = { [newState]: newValue || null };
        }

        newState = newState || {};

        newState = Object.keys(newState).reduce((obj, key) => {
            op.set(obj, key, op.get(newState, key, null));
            return obj;
        }, state);

        forceUpdate(newState);
    };

    return [state, setState, getState];
};

export { useLocalState, useLocalState as default };
