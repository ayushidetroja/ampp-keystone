// https://github.com/Milhau5/dreamspace/blob/master/routes/views/signin.js

//generic comment
var keystone = require("keystone");
var async = require("async");

module.exports = function(req, res) {
	if (req.user) {
		req.flash("error", "You're already logged in");
		return res.redirect("/");
	}

	var view = new keystone.View(req, res);
	var locals = res.locals;

	locals.section = "signin"; //?
	locals.form = req.body;

	//eventually, you can only see posts that YOU made
	console.log("query", req);
	// req.flash(
	// 	"error",
	// 	"Facebook not linked with the email. Please login in with email and password"
	// );
	//move error checking into here
	view.on(
		"post",
		{
			action: "signin"
		},
		function(next) {
			if (!req.body.signin_email || !req.body.signin_password) {
				req.flash("error", "Please enter your username and password.");
				return next();
			}

			var onSuccess = function() {
				if (req.query && req.query.from) {
					res.redirect(req.query.from);
				} else if (!req.user.isActive) {
					keystone.session.signout(req, res, function() {
						req.flash(
							"error",
							"Your username or password were incorrect, please try again."
						);
						return next();
					});
				} else {
					if (!req.user.isVerified === true) {
						req.flash(
							"error",
							'Welcome back to AMPP. Please <a href="/verify-account">verify your email</a> to add content.'
						);
					}
					return res.redirect("/artist/" + req.user._id); // per https://github.com/eliataylor/ampp-keystone/issues/94
				}
			};

			var onFail = function() {
				req.flash(
					"error",
					"Your username or password were incorrect, please try again."
				);
				return next();
			};

			keystone.session.signin(
				{
					email: req.body.signin_email,
					password: req.body.signin_password
				},
				req,
				res,
				onSuccess,
				onFail
			);
		}
	);

	view.render("forms/signin"); //no longer 'session' folder
};
