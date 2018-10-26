var webpack = require("webpack");
var config = require("./webpack.client.js");

var hostname = process.env.HOSTNAME || "localhost";
var externalHostname = process.env.EXTERNAL_HOSTNAME || hostname;

config.cache = true;
config.debug = true;
config.devtool = "eval";

config.entry.unshift(
	"webpack-dev-server/client?http://" + externalHostname + ":8080",
	"webpack/hot/only-dev-server"
);

config.output.publicPath = "http://" + externalHostname + ":8080/dist/";
config.output.hotUpdateMainFilename = "update/[hash]/update.json";
config.output.hotUpdateChunkFilename = "update/[hash]/[id].update.js";

config.plugins = [
	new webpack.DefinePlugin({
		__CLIENT__: true,
		__SERVER__: false,
		"process.env": {
			SQUARESERPENT_DEFAULT_PROJECT: JSON.stringify(process.env.SQUARESERPENT_DEFAULT_PROJECT),
		},
	}),
	new webpack.HotModuleReplacementPlugin(),
	new webpack.NoErrorsPlugin()
];

config.module = {
	loaders: [
		{include: /\.json$/, loaders: ["json-loader"]},
		{include: /\.js$/, loaders: ["react-hot", "babel-loader?stage=0&optional=runtime"], exclude: /node_modules/},
		{test: /(?:^|\/)material.js$/, loaders: ['exports?componentHandler']},
		{test: /\.css$/, loaders: ["style", "css"]} // REVIEW: revisit this
	]
};

config.devServer = {
	publicPath:  "http://" + externalHostname + ":8080/dist/",
	contentBase: "./static",
	hot:         true,
	lazy:        false,
	quiet:       true,
	noInfo:      false,
	headers:     {"Access-Control-Allow-Origin": "*"},
	stats:       {colors: true},
	host:        hostname
};

module.exports = config;
