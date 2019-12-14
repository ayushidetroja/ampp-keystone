/**
 * This file is where you define your application routes and controllers.
 *
 * Start by including the middleware you want to run for every request;
 * you can attach middleware to the pre('routes') and pre('render') events.
 *
 * For simplicity, the default setup for route controllers is for each to be
 * in its own file, and we import all the files in the /routes/views directory.
 *
 * Each of these files is a route controller, and is responsible for all the
 * processing that needs to happen for the route (e.g. loading data, handling
 * form submissions, rendering the view template, etc).
 *
 * Bind each route pattern your application should respond to in the function
 * that is exported from this module, following the examples below.
 *
 * See the Express application routing documentation for more information:
 * http://expressjs.com/api.html#app.VERB
 */
const passport = require("passport");
const FacebookStrategy = require("passport-facebook");
const session = require("express-session");
var keystone = require("keystone");
var middleware = require("./middleware");
var importRoutes = keystone.importer(__dirname);
var contentApi = require("./api/content");
var userApi = require("./api/user");
const User = keystone.list("User").model;
// Common Middleware
keystone.pre("routes", middleware.initLocals);
keystone.pre("routes", middleware.lowercaseUrlMiddleware);
keystone.pre("routes", middleware.initErrorHandlers);
keystone.pre("render", middleware.flashMessages);
keystone.pre("render", middleware.returnJSON);

// sign in with facebook
passport.serializeUser(function(user, done) {
	done(null, user.id);
});

passport.deserializeUser(function(id, done) {
	// User.findById(id, function(err, user) {
	// 	done(err, user);
	// });
});
// console.log("session", keystone.session.signin);
var profileData;
passport.use(
	new FacebookStrategy(
		{
			clientID: process.env.FACEBOOK_APP_ID,
			clientSecret: process.env.FACEBOOK_APP_SECRET,
			callbackURL: "http://localhost:3000/auth/facebook/callback",
			profileFields: ["id", "emails", "name", "gender"]
		},
		function(accessToken, refreshToken, profile, cb) {
			// console.log("PROFILE", profile);
			profileData = profile;
			return cb(null, profile);
		}
	)
);
keystone.pre("routes", passport.initialize());
keystone.pre("routes", passport.session());

// Import Route Controllers
var routes = {
	views: importRoutes("./views"),
	forms: importRoutes("./forms"),
	api: importRoutes("./api")
};

// Setup Route Bindings
exports = module.exports = function(app) {
	app.use(
		session({
			secret: "our little secret.",
			resave: false,
			saveUninitialized: true
		})
	);
	//app.use(passport.initialize());
	//app.use(passport.session());

	app.get("/", routes.views.index);

	/**** BE CAREFUL OF THIS ORDER!!!! (since the first segment is a parameter next() must be called in the route controller ) ***/
	app.all(
		"/delete-account",
		middleware.requireUser,
		routes.views.deleteAccount
	);
	app.all("/verify-account", routes.views.verifyAccount);
	app.get("/verify-account/:token", routes.views.verifyAccount);
	app.get("/artist/:user", routes.views.profile);
	app.post("/artist/:user", routes.views.profile);
	app.all("/contact", routes.views.contact);
	app.all("/signin", routes.views.signin);
	app.all("/forgot-password", routes.views.forgotpass);
	app.all("/join", routes.views.join);
	app.all("/my-profile", middleware.requireUser, routes.views.myprofile);
	app.all("/about/:info", routes.views.about);
	app.all("/about", routes.views.about);
	app.get("/signout", middleware.requireUser, routes.views.signout);
	// sign in with facebook
	app.get(
		"/auth/facebook",
		passport.authenticate("facebook", {
			scope: ["email"]
		})
	);
	app.get(
		"/auth/facebook/callback",
		passport.authenticate("facebook", {
			failureRedirect: "/signin"
		}),
		function(req, res) {
			var view = new keystone.View(req, res);
			var locals = res.locals;
			const email = profileData._json.email;
			const password = profileData._json.id;
			const q = keystone.list("User").model.find({
				email: email
			});

			const onSuccess = function() {
				console.log("success");
				return res.redirect("/"); // per https://github.com/eliataylor/ampp-keystone/issues/37
				// return res.redirect('/artist/' + res.locals.newUser._id); //CHECK where to redirect to
			};

			const onFail = function(e) {
				console.log("error", e);
				res.redirect("/signin");
			};

			q.exec((err, result) => {
				if (result.length > 0) {
					keystone.session.signin(
						{ email: email, password: password },
						req,
						res,
						onSuccess,
						onFail
					);
				} else {
					const userData = {
						name: {
							first: profileData._json.first_name,
							last: profileData._json.last_name
						},
						email: profileData._json.email,
						isAdmin: false,
						isVerified: false,
						gender: profileData.gender ? profileData.gender : "",
						medium: [],
						phone: "",
						locale: "",
						password: profileData._json.id
					};
					const newUser = new User(userData);

					newUser.save(function(err) {
						if (err) {
							console.log("Error Inserting New Data");
							if (err.name == "ValidationError") {
								for (field in err.errors) {
									req.flash("error", err.errors[field].message);
								}
							} else {
								console.log(err);
							}
						}
						// console.log("here");
						// res.locals.newUser = newUser;
						// req.user = newUser;

						// console.log("profileData._json.email", profileData._json.email);
						keystone.session.signin(
							{
								email: email,
								password: password
							},
							req,
							res,
							onSuccess,
							onFail
						);
						return console.log("-------------", err);
					});
				}
			});
		}
	);

	app.all(
		"/:medium/:action/:content",
		middleware.requireVerifcation,
		routes.forms.content
	); // edit/delete
	app.all("/:medium/add", middleware.requireVerifcation, routes.forms.content); // add
	app.get("/:medium/:content", routes.views.content); // get item
	//app.get('/:medium', routes.views.dashboard); // dashboards

	// more secure, less error prone
	app.get("/art", routes.views.dashboard); // dashboards
	app.get("/music", routes.views.dashboard); // dashboards
	app.get("/poetry", routes.views.dashboard); // dashboards
	app.get("/photography", routes.views.dashboard); // dashboards

	app.put(
		"/contents/:content_id/like",
		middleware.requireVerifcation,
		contentApi.likeContent
	);
	app.put(
		"/users/:user_id/follow",
		middleware.requireVerifcation,
		userApi.followUser
	);

	app.get("/users", middleware.requireVerifcation, userApi.allUsers);
	app.get(
		"/subscription",
		middleware.requireVerifcation,
		userApi.followingUser
	);

	// app.put('/users/', middleware.requireVerifcation, userApi.followUser);

	if (keystone.get("env") == "development") {
		console.log("loading mongo_express");
		var mongo_express = require("mongo-express/lib/middleware");
		//var mongo_express_config = require(__dirname + '/mongo_express_config.js');
		var mongo_express_config = require("./mongo_express_config");
		app.all("/mongo_express", mongo_express(mongo_express_config));

		console.log("------------------------------------------------");
		console.log("Notice: Enabling CORS for development.");
		console.log("------------------------------------------------");
		app.all("*", function(req, res, next) {
			res.header("Access-Control-Allow-Origin", "*");
			res.header("Access-Control-Allow-Methods", "GET, POST");
			res.header("Access-Control-Allow-Headers", "Content-Type");
			next();
		});
	}
};

// Handle 404 errors
keystone.set("404", function(req, res, next) {
	res.notfound();
});

// Handle other errors
keystone.set("500", function(err, req, res, next) {
	console.log(err);
	var title, message;
	if (err instanceof Error) {
		message = err.message;
		err = err.stack;
	}
	res.err(err, title, message);
});
