import { Link } from 'react-router-dom';
import { App, AppError } from 'reactium-core/app';
import { Button } from '@atomic-reactor/reactium-ui';

Button.ENUMS.LINK = ({ children, ...props }) => (
    <Link {...props}>{children}</Link>
);

let render = App;

/**
 * @description Initialize the app.
 */
if (module.hot) {
    render = () => {
        try {
            App();
        } catch (error) {
            AppError(error);
        }
    };

    // module.hot.decline(
    //     ['../.././.core/dependencies/index.js', '../.././.core/app.js'],
    // );

    module.hot.accept(
        ['../.././.core/dependencies/index.js', '../.././.core/app.js'],
        () => {
            window.location.reload();
        },
    );
}

render();

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/assets/js/sw/sw.js')
            .then(registration => {
                console.log('SW registered.');
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
