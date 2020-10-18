import React from 'react';
import _ from 'underscore';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
    }

    componentDidCatch(error, errorInfo) {
        this.props.debug(error, errorInfo);
    }

    static getDerivedStateFromError() {
        return {};
    }

    render() {
        return this.props.children;
    }
}

export default ErrorBoundary;
