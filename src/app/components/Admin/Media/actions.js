import deps from 'dependencies';

export default {
    load: data => dispatch => {
        return dispatch({
            type: deps().actionTypes.MEDIA_LOAD,
            data,
        });
    },
};
