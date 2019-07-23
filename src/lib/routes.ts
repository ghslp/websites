'use strict';

import { ServerRoute, RouteOptionsCache } from '@hapi/hapi';

import { config } from './config';
import { getCssModuleClassNameGetter } from './utils';

const hashedStaticFileCacheOptions: RouteOptionsCache = {
    privacy: 'public',
    expiresIn: 31536000000,
    statuses: [200],
    otherwise: 'no-cache',
};

const unhashedStaticFileCacheOptions: RouteOptionsCache = {
    privacy: 'public',
    expiresIn: 86400000,
    statuses: [200],
    otherwise: 'no-cache',
};

const pathEndingInIndexHtmlRegExp = /(.*\/)index\.html/;

function getCanonicalUrl(request) {
    if (
        typeof config.canonicalHost === 'undefined' ||
        typeof config.canonicalProtocol === 'undefined'
    ) {
        return null;
    } else {
        return `${config.canonicalProtocol}://${config.canonicalHost}${request.url.pathname}`;
    }
}

export const routes: Array<ServerRoute> = [
    {
        method: 'GET',
        path:'/',
        handler: async (request, h) => {
            // TODO: Move canonicalUrl context variable to global context
            // (defined in server.views.context) once vision supports awaiting
            // async factory functions.
            return h.view(
                'index',
                {
                    canonicalUrl: getCanonicalUrl(request),
                    getClassNames: await getCssModuleClassNameGetter('global'),
                },
            );
        },
    },
    {
        method: 'GET',
        path:'/favicon.ico',
        handler: {
            file: {
                etagMethod: 'hash',
                lookupCompressed: false,
                path: 'static/favicons/favicon.ico',
            },
        },
        options: {
            cache: unhashedStaticFileCacheOptions,
        },
    },
    {
        method: 'GET',
        path:'/robots.txt',
        handler: {
            file: {
                etagMethod: 'hash',
                lookupCompressed: false,
                path: 'static/robots.txt',
            },
        },
        options: {
            cache: unhashedStaticFileCacheOptions,
        },
    },
    {
        method: 'GET',
        path: '/static/{fileName*}',
        handler: {
            directory: {
                etagMethod: false,
                index: false,
                lookupCompressed: false,
                path: config.staticDir,
                redirectToSlash: false,
            },
        },
        options: {
            cache: hashedStaticFileCacheOptions,
        },
    },
    {
        method: '*',
        path: '/{unmatchedPath*}',
        handler: async (request, h) => {
            // If request path ends in “/index.html”, redirect to same path
            // without “index.html”
            const pathFollowedByIndexHtmlRegExp = request.path
                .match(pathEndingInIndexHtmlRegExp);

            if (
                Array.isArray(pathFollowedByIndexHtmlRegExp) &&
                pathFollowedByIndexHtmlRegExp.length === 2
            ) {
                const pathWithoutIndexHtml = pathFollowedByIndexHtmlRegExp[1];

                return h
                    .redirect(pathWithoutIndexHtml)
                    .code(301);
            }

            return h.view(
                'error',
                {
                    getClassNames: await getCssModuleClassNameGetter('global'),
                },
            )
                .code(404);
        }
    },
];
