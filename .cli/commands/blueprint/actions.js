const path = require('path');
const chalk = require('chalk');
const fs = require('fs-extra');
const _ = require('underscore');
const op = require('object-path');
const Parse = require('parse/node');
const defaultTemplate = require('./template/default');

const configUpdate = require(path.normalize(
    process.cwd() + '/.cli/utils/parse-config-update',
));

const parseInit = require(path.normalize(
    process.cwd() + '/.cli/utils/parse-init',
));

module.exports = spinner => {
    const message = text => {
        if (spinner) {
            spinner.text = text;
        }
    };

    const fail = text => {
        if (spinner) {
            spinner.fail(text);
            console.log('');
            process.exit();
        }
    };

    return {
        init: ({ params }) => parseInit({ params, Parse }),

        config: configUpdate,

        options: ({ context, params }) => {
            const { auth } = params;
            return { sessionToken: auth };
        },

        blueprints: async ({ context, params, props }) => {
            let { name, overwrite } = params;

            const { prompt } = props;
            const { options = {} } = context;
            const { blueprints = [] } = await Parse.Cloud.run(
                'blueprint-retrieve',
                {
                    ID: name,
                },
                options,
            );

            if (blueprints.length > 0 && overwrite !== true) {
                fail(
                    `Blueprint ${name} already exists. Overwrite by setting the ${chalk.cyan(
                        '-o',
                    )} or ${chalk.cyan('--overwrite')} flag.`,
                );
            }

            if (blueprints.length > 0 && overwrite === true) {
                await Parse.Object.destroyAll(blueprints, options).catch(
                    err => {
                        fail(err.message);
                    },
                );
            }

            return blueprints.length;
        },

        template: async ({ context }) => {
            message(`Retrieving ${chalk.cyan('template')}...`);
            const { options = {} } = context;

            const tmp = await new Parse.Query('Blueprint')
                .equalTo('ID', 'Admin')
                .first(options);

            return tmp ? tmp.toJSON() : defaultTemplate;
        },

        blueprint: ({ context, params, props }) => {
            message(`Creating ${chalk.cyan('blueprint')}...`);

            const { options = {}, template } = context;
            const { name, description, header, sidebar, zones } = params;

            const blueprint = {
                meta: op.get(template, 'meta', {}),
                sections: op.get(template, 'sections', {}),
                ID: name,
                description: description,
            };

            op.set(blueprint, 'sections.main.zones', zones);

            if (header !== true) {
                op.del(blueprint, 'sections.header');
            }

            if (sidebar !== true) {
                op.del(blueprint, 'sections.sidebar');
            }

            return Parse.Cloud.run('blueprint-create', blueprint, options);
        },

        route: async ({ context, params }) => {
            const { capabilities, route } = params;
            if (!route) {
                return;
            }

            const { blueprint, options } = context;

            if (!blueprint) {
                fail('Unable to create route');
            } else {
                let routeObj = await new Parse.Query('Route')
                    .equalTo('route', route)
                    .descending('updatedAt')
                    .first(options);

                routeObj = routeObj || new Parse.Object('Route');
                routeObj
                    .set('route', route)
                    .set('blueprint', blueprint)
                    .set('capabilities', capabilities);

                return routeObj.save(null, options);
            }
        },
    };
};
