import { Server } from 'hapi'
import { createMemoryHistory, useQueries }  from 'history'
import inert  from 'inert'
import _  from 'lodash'
import React  from 'react'
import ReactDOMServer  from 'react-dom/server'
import { RoutingContext, match } from 'react-router'
import pageRoutes  from '../common/pages/routes'
import * as config  from './config'
import routes  from './routes'

const hostname = process.env.HOSTNAME || "localhost";
const externalHostname = process.env.EXTERNAL_HOSTNAME || hostname;
const debug = process.env.NODE_ENV !== 'production';

const serverOpts = {
  // Add Hapi logs to console
  debug: {
    request: debug ? ['error', 'handler'] : ['error'],
    log: debug ? ['error', 'handler'] : ['error'],
  },
};

/**
 * Start Hapi server on port 8000.
 */
const server = new Server(serverOpts);

server.connection({
  host: hostname,
  address: process.env.BIND_ADDRESS,
  port: process.env.PORT || 8000
});

server.register([
    inert
], function (err) {
	if (err) {
		throw err;
	}

	server.start(function () {
		console.info("==> ✅  Server is listening");
		console.info("==> 🌎  Go to " + server.info.uri.toLowerCase());
	});
});

/**
 * Attempt to serve static requests from the public folder.
 */
server.route({
	method:  "GET",
	path:    "/{params*}",
	handler: {
		file: (request) => "static" + request.path
	}
});

/**
 * Serve Material Design Lite's CSS file
 * TODO: webpackify
 */
server.route({
  method: 'GET',
  path: '/material-design-lite/material.min.css',
  handler: {
    file: 'node_modules/material-design-lite/material.min.css'
  }
})

/**
 * Generate Hapi routes from the route data in './routes'.
 */
for (const controllerName of Object.keys(routes)) {
  // The config module exports each pre-configured controller by name
  const controllerInstance = config[controllerName];

  if (!controllerInstance) {
    throw new Error(`Controller instance for ${controllerName} was not provided by config module`);
  }

  for (const [httpMethod, path, ctrlMethodName, routeConfig = {}] of routes[controllerName]) {
    console.log('ROUTE:', httpMethod, path, ctrlMethodName, routeConfig);

    server.route(_.assign({
      method: httpMethod,
      path,
      handler(request, reply) {
        // For convenience, pass the request params object (placeholders from route)
        // to the controller method. Also pass in request and reply so the
        // controller can use them.
        controllerInstance[ctrlMethodName](_.assign({}, request.params, {request, reply}));
      }
    }, routeConfig));
  }
}

/**
 * Catch dynamic requests here to fire-up React Router.
 */
server.ext("onPreResponse", (request, reply) => {
	if (typeof request.response.statusCode !== "undefined" ||
      (request.response.isBoom && request.response.isServer)) {
		return reply.continue();
	}

	const location = useQueries(createMemoryHistory)().createLocation(request.url.path);

	match({routes: pageRoutes, location}, (error, redirectLocation, renderProps) => {
		if (redirectLocation) {
			reply.redirect(redirectLocation.pathname + redirectLocation.search)

		} else if (error || !renderProps) {
			reply.continue();

		} else {
      const reactString = ReactDOMServer.renderToString(React.createElement(RoutingContext, renderProps));
			const webserver = process.env.NODE_ENV === "production" ? "" : "//" + externalHostname + ":8080";

			reply(
				`<!doctype html>
				<html lang="en-us">
					<head>
						<meta charset="utf-8">
						<title>Squareserpent</title>
						<link rel="shortcut icon" href="/favicon.ico">
            <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
            <link rel='stylesheet' href='https://fonts.googleapis.com/css?family=Roboto:300,400,500'>
            <link rel='stylesheet' href='/material-design-lite/material.min.css'>
            <style>
              html, body, #react-root {
                height: 100%;
              }
            </style>
					</head>
					<body>
						<div id="react-root">${reactString}</div>
            <script src="${webserver}/dist/client.js"></script>
					</body>
				</html>`
			);
		}
	});
});

/**
 * Add some basic request logging.
 */
server.on('response', function (request) {
  console.log(request.info.remoteAddress + ': ' + request.method.toUpperCase() + ' ' + request.url.path + ' --> ' + request.response.statusCode);
});
