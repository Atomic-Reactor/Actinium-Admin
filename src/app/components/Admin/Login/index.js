import cn from 'classnames';
import op from 'object-path';
import Reactium from 'reactium-core/sdk';
import Logo from 'components/common-ui/Logo';
import { Redirect, Link } from 'react-router-dom';
import React, { useEffect, useRef, useState } from 'react';
import { Button, Spinner, WebForm } from '@atomic-reactor/reactium-ui';

const ENUMS = {
    STATUS: {
        ERROR: 'error',
        SUBMITTING: 'submitting',
        READY: 'ready',
        SUCCESS: 'success',
        COMPLETE: 'complete',
    },
};

/**
 * -----------------------------------------------------------------------------
 * Functional Component: Login
 * -----------------------------------------------------------------------------
 */
const Login = ({ className, forgot, redirect, signup, ...props }) => {
    const stateRef = useRef({
        username: '',
        password: '',
        error: {},
        status: ENUMS.STATUS.READY,
    });

    const [, setNewState] = useState(stateRef.current);

    const setState = (newState = {}) => {
        stateRef.current = { ...stateRef.current, ...newState };
        setNewState(stateRef.current);
    };

    useEffect(() => {
        const { status } = stateRef.current;

        if (status === ENUMS.STATUS.COMPLETE) {
            window.location.href = redirect;
        }
    });

    const onSubmit = ({ value, valid }) => {
        const { username, password } = value;
        const { status } = stateRef.current;
        if (status === ENUMS.STATUS.SUBMITTING) {
            return;
        }

        setState({ ...value, error: {}, status: ENUMS.STATUS.SUBMITTING });

        return Reactium.User.auth(username, password)
            .then(user => {
                setState({ status: ENUMS.STATUS.SUCCESS });
                setTimeout(
                    () => setState({ status: ENUMS.STATUS.COMPLETE }),
                    1000,
                );
            })
            .catch(err => {
                const error = {
                    field: 'password',
                    message: 'invalid username or password',
                };

                setState({ error, status: ENUMS.STATUS.ERROR });
            });
    };

    const onChange = e => {
        const { name, value } = e.target;
        setState({ [name]: value });
    };

    const onError = ({ value, errors }) => {
        const field = op.get(errors, 'fields.0');
        const message = op.get(errors, 'errors.0');

        setState({
            error: {
                field,
                message,
            },
            status: ENUMS.STATUS.ERROR,
        });

        const elm = document.getElementById(field);
        if (elm) {
            elm.focus();
        }
    };

    const render = () => {
        if (Reactium.User.getSessionToken()) {
            return <Redirect to={redirect} />;
        }

        const { username, password, error = {}, status } = stateRef.current;

        if (
            status === ENUMS.STATUS.SUCCESS ||
            status === ENUMS.STATUS.COMPLETE
        ) {
            return (
                <main className={className} role='main'>
                    <Spinner />
                </main>
            );
        }

        return (
            <main className={className} role='main'>
                <WebForm
                    onSubmit={onSubmit}
                    onError={onError}
                    value={{ username, password }}
                    required={['username', 'password']}
                    showError={false}>
                    <div className='flex center mb-xs-40'>
                        <Link to='/'>
                            <Logo width={80} height={80} />
                        </Link>
                    </div>
                    <div
                        className={cn({
                            'form-group': true,
                            error: op.get(error, 'field') === 'username',
                        })}>
                        <input
                            type='text'
                            placeholder='Username'
                            name='username'
                            value={username || ''}
                            onChange={onChange}
                            id='username'
                            disabled={status === ENUMS.STATUS.SUBMITTING}
                        />
                        {op.get(error, 'field') === 'username' && (
                            <small>Enter your email address</small>
                        )}
                    </div>
                    <div
                        className={cn({
                            'form-group': true,
                            error: op.get(error, 'field') === 'password',
                        })}>
                        <input
                            type='password'
                            placeholder='Password'
                            name='password'
                            value={password || ''}
                            onChange={onChange}
                            id='password'
                            disabled={status === ENUMS.STATUS.SUBMITTING}
                        />
                        {op.get(error, 'field') === 'password' && (
                            <small>{error.message}</small>
                        )}
                    </div>
                    <div className='mt-xs-40'>
                        <Button
                            block
                            color='secondary'
                            size='lg'
                            type='submit'
                            appearance='pill'
                            disabled={status === ENUMS.STATUS.SUBMITTING}>
                            {status === ENUMS.STATUS.SUBMITTING ? (
                                <>Signing in...</>
                            ) : (
                                <>Sign In</>
                            )}
                        </Button>
                    </div>
                    <div className='links'>
                        <div className='col-xs-12 col-sm-6 text-xs-center text-sm-left pr-xs-0 pr-sm-8 mt-xs-16'>
                            <Link to={forgot}>Forgot Password</Link>
                        </div>
                        <div className='col-xs-12 col-sm-6 text-xs-center text-sm-right pl-xs-0 pl-sm-8 mt-xs-16'>
                            <Link to={signup}>Create Account</Link>
                        </div>
                    </div>
                </WebForm>
            </main>
        );
    };

    return render();
};

Login.defaultProps = {
    className: 'login',
    redirect: '/admin',
    forgot: '/forgot',
    signup: '/signup',
};

export default Login;
