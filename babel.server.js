require("babel/register")({
	stage: 0
});

/**
 * Define isomorphic constants.
 */
global.__CLIENT__ = false;
global.__SERVER__ = true;

if (process.env.NODE_ENV === "production" || require("piping")({hook: true, includeModules: true})) {
	require("./src/server");
}
