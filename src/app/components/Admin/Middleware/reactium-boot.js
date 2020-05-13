const SDK = require('@atomic-reactor/reactium-sdk-core').default;
const Enums = SDK.Enums;

const {
    settings,
    routes,
    blueprints,
    plugins,
} = require('./middlewares/config');

const { forceSSL } = require('./middlewares/forceSSL');
const proxy = require('http-proxy-middleware');
const op = require('object-path');
const _ = require('underscore');

const fs = require('fs');
const path = require('path');
const express = require('express');

const isMod = () => {
    const d = path.normalize(
        path.join(
            process.cwd(),
            'reactium_modules',
            '@atomic-reactor',
            'admin',
            'static',
        ),
    );

    if (fs.existsSync(d)) return d;
};

const isSrc = () => {
    const d = path.normalize(
        path.join(process.cwd(), 'src', 'app', 'components', 'Admin', 'static'),
    );

    if (fs.existsSync(d)) return d;
};

SDK.Server.Middleware.register('adminStatic', {
    name: 'adminStatic',
    use: (req, res, next) => {
        const dev = isSrc();
        const prod = isMod();
        const dir = prod || dev;
        const isDir = fs.existsSync(path.resolve(dir));

        if (isDir) return express.static(dir);
        next();
    },
    order: Enums.priority.lowest,
});

SDK.Server.Middleware.register('media-proxy', {
    name: 'media-proxy',
    use: proxy('/media', {
        target: restAPI.replace(/\/api$/, ''),
        changeOrigin: true,
        logLevel: process.env.DEBUG === 'on' ? 'debug' : 'error',
        ws: false,
    }),
    order: Enums.priority.highest,
});

SDK.Server.Middleware.register('forceSSL', {
    name: 'forceSSL',
    use: forceSSL,
    order: Enums.priority.highest,
});

SDK.Server.Middleware.register('settings', {
    name: 'settings',
    use: settings,
    order: Enums.priority.highest,
});

SDK.Server.Middleware.register('blueprints', {
    name: 'blueprints',
    use: blueprints,
    order: Enums.priority.highest,
});

SDK.Server.Middleware.register('frontEndRoutes', {
    name: 'frontEndRoutes',
    use: routes,
    order: Enums.priority.highest,
});

SDK.Server.Middleware.register('plugins', {
    name: 'plugins',
    use: plugins,
    order: Enums.priority.highest,
});

SDK.Hook.registerSync('Server.AppGlobals', req => {
    SDK.Server.AppGlobals.register('settings', {
        value: req.settings,
        order: Enums.priority.highest,
    });
    SDK.Server.AppGlobals.register('blueprints', {
        value: req.blueprints,
        order: Enums.priority.highest,
    });
    SDK.Server.AppGlobals.register('routesConfig', {
        value: req.routesConfig,
        order: Enums.priority.highest,
    });
    SDK.Server.AppGlobals.register('routes', {
        value: req.routes,
        order: Enums.priority.highest,
    });
    SDK.Server.AppGlobals.register('plugins', {
        value: req.plugins,
        order: Enums.priority.highest,
    });
});

SDK.Hook.registerSync(
    'Server.AppScripts',
    req => {
        _.sortBy(op.get(req, 'plugins', []), 'order').forEach(plugin => {
            const script = op.get(plugin, 'meta.scriptURL');
            if (script) {
                const url = !/^http/.test(script) ? '/api' + script : script;
                SDK.Server.AppScripts.register(plugin.ID, {
                    path: url,
                    order: Enums.priority.high,
                });
            }
        });
    },
    Enums.priority.highest,
);

SDK.Hook.registerSync(
    'Server.AppStyleSheets',
    req => {
        _.sortBy(op.get(req, 'plugins', []), 'order').forEach(plugin => {
            const style = op.get(plugin, 'meta.styleURL');
            if (style) {
                const url = !/^http/.test(style) ? '/api' + style : style;
                SDK.Server.AppStyleSheets.register(plugin.ID, {
                    path: url,
                    order: Enums.priority.high,
                });
            }
        });
    },
    Enums.priority.highest,
);

SDK.Hook.registerSync(
    'Server.AppStyleSheets.includes',
    includes => {
        if (!includes.includes('admin.css') && isSrc()) {
            includes.push('admin.css');
        }
    },
    Enums.priority.highest,
);

SDK.Hook.registerSync(
    'Server.AppStyleSheets.excludes',
    excludes => {
        if (!excludes.includes('style.css') && isSrc()) {
            excludes.push('style.css');
        }
    },
    Enums.priority.highest,
);
