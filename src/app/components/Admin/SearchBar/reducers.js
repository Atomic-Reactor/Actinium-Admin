import op from 'object-path';
import deps from 'dependencies';

export default (state = {}, action) => {
    switch (action.type) {
        case deps().actionTypes.SEARCH_STATE:
            return { ...state, ...action.state };

        case deps().actionTypes.UPDATE_ROUTE:
            return { ...state, value: null, visible: false };

        default:
            return state;
    }
};
