var webpack = require("webpack");
var path = require("path");

module.exports = {
	target:  "web",
	cache:   false,
	context: __dirname,
	devtool: false,
	entry:   ["./src/client"],
	output:  {
		path:          path.join(__dirname, "static/dist"),
		filename:      "client.js",
		chunkFilename: "[name].[id].js",
		publicPath:    "dist/"
	},
	plugins: [
		new webpack.DefinePlugin({
			__CLIENT__: true,
			__SERVER__: false,
			"process.env": {
				NODE_ENV: '"production"',
				SQUARESERPENT_DEFAULT_PROJECT: JSON.stringify(process.env.SQUARESERPENT_DEFAULT_PROJECT),
			},
		}),
		new webpack.optimize.DedupePlugin(),
		new webpack.optimize.OccurenceOrderPlugin(),
		new webpack.optimize.UglifyJsPlugin()
	],
	module:  {
		loaders: [
			{include: /\.json$/, loaders: ["json-loader"]},
			{include: /\.js$/, loaders: ["babel-loader?stage=0&optional=runtime"], exclude: /node_modules/},
			{test: /(?:^|\/)material.js$/, loaders: ['exports?componentHandler']},
			{test: /\.css$/, loaders: ["style", "css"]} // REVIEW: revisit this
		]
	},
	resolve: {
		alias: {
			react: path.join(__dirname, "node_modules/react")
		},
		modulesDirectories: [
			"src",
			"node_modules",
			"web_modules"
		],
		extensions: ["", ".json", ".js"]
	},
	node:    {
		__dirname: true,
		fs:        'empty'
	}
};
