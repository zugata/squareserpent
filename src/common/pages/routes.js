import React from "react";
import {Router, Route, Redirect} from "react-router";
import TemplatePage from './TemplatePage';
import SampleDataPage from './SampleDataPage';
import DocumentResolutionPage from './DocumentResolutionPage';
import NotFoundPage from './NotFoundPage';

const DEFAULT_PROJECT = process.env.SQUARESERPENT_DEFAULT_PROJECT;

/**
 * The React Router 1.0 routes for both the server and the client.
 */
export default (
	<Router>
		<Route path="/templates/:action/:projectName/*"
				component={TemplatePage} />

		<Route path="/sample-data/editor/:projectName/*"
				component={({history, location, params: {projectName, splat}}) =>
					location.query && location.query.name ?
						<SampleDataPage
							history={history}
							projectName={projectName}
							templateName={splat}
							sampleDataName={location.query.name} />

					: <DocumentResolutionPage
							type='sample-data'
							history={history}
							projectName={projectName}
							templateName={splat} />
				} />

		<Route path="/templates/:action/:projectName"
			component={({history, params: {projectName}}) =>
				<DocumentResolutionPage
					type='templates'
					history={history}
					projectName={projectName} />} />

		<Route path="/sample-data/editor/:projectName"
			component={({history, params: {projectName}}) =>
				<DocumentResolutionPage
					type='sample-data'
					history={history}
					projectName={projectName} />} />

		<Redirect from="/" to={`/templates/editor/${DEFAULT_PROJECT}`} />
		<Redirect from="/templates" to={`/templates/editor/${DEFAULT_PROJECT}`} />
		<Redirect from="/templates/:action" to={`/templates/:action/${DEFAULT_PROJECT}`} />
		<Redirect from="/sample-data" to={`/sample-data/editor/${DEFAULT_PROJECT}`} />
		<Redirect from="/sample-data/editor" to={`/sample-data/editor/${DEFAULT_PROJECT}`} />

		<Route path="*" component={NotFoundPage} />
	</Router>);
