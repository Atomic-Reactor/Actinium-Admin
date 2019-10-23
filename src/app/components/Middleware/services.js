import Parse from 'appdir/api';
import op from 'object-path';

const getRoutes = async () => {
    const { routes } = await Parse.Cloud.run('routes');
    return routes;
};

const blueprints = async () => {
    const limit = 1;
    let skip = 0;
    let allBlueprints = [];

    try {
        const { total, blueprints } = await Parse.Cloud.run(
            'blueprint-retrieve',
            {
                limit,
                skip,
            },
        );
        if (blueprints.length === total) return blueprints;

        allBlueprints = blueprints;
        const pages = Math.ceil(total / limit);
        for (let page = 1; page < pages; page++) {
            skip = limit * page;
            const { blueprints } = await Parse.Cloud.run('blueprint-retrieve', {
                limit,
                skip,
            });
            allBlueprints = allBlueprints.concat(blueprints);
        }

        return allBlueprints;
    } catch (error) {
        return allBlueprints;
    }
};

export default {
    getDynamicRoutes: async () => {
        const routes = await getRoutes();

        return {
            routesConfig: routes.reduce(
                (routesConfig, { route, blueprint, meta, capabilities }) => {
                    routesConfig[route] = {
                        meta,
                        capabilities,
                        blueprint: blueprint.ID,
                    };

                    return routesConfig;
                },
                {},
            ),
            routes: routes.map(({ route, meta }) => ({
                path: route,
                exact: op.get(meta, 'exact', true),
                order: op.get(meta, 'order', 0),
                component: 'Blueprint',
            })),
        };
    },

    getBlueprints: async () => {
        const allBlueprints = await blueprints();
        return allBlueprints
            .map(blueprint => blueprint.toJSON())
            .reduce((allById, blueprint) => {
                allById[blueprint.ID] = blueprint;
                return allById;
            }, {});
    },
};
