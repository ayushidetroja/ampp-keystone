/**
 * This file contains the common middleware used by your routes.
 *
 * Extend or replace these functions as your application requires.
 *
 * This structure is not enforced, and just a starting point. If
 * you have more middleware you may want to group it as separate
 * modules in your project's /lib directory.
 */
var _ = require('lodash');
var keystone = require('keystone');

/**
	Initialises the standard view locals

	The included layout depends on the navLinks array to generate
	the navigation in the header, you may wish to change this array
	or replace it with your own templates / logic.
*/
exports.initLocals = function (req, res, next) {
	res.locals.user = req.user;

	res.locals.hostname = req.get('host');
	res.locals.base_url = req.protocol + "://" + res.locals.hostname;
	res.locals.full_url = res.locals.base_url + req.path;
	res.locals.full_path = req.path;

	keystone.list('Medium').model.find({}).populate('genre').exec()
		.then(function (mediums) {
			var segments = req.path.split('/');
			var seg1 = (segments.length > 1) ? segments[1] : req.query.medium;
			if (seg1) {
				for (var m in mediums) {
					if (mediums[m].slug === seg1 || mediums[m]._id === seg1) {
						res.locals.medium = mediums[m];
						break;
					}
				}
			}

			var mediumOrder = ['art', 'music', 'poetry', 'photography'];
			mediums.sort(function (a, b) {
				return mediumOrder.indexOf(a.slug) - mediumOrder.indexOf(b.slug)
			});

			res.locals.mediums = mediums;

			next();
		});

};


/**
	Redirect to URL's in all lowercase
*/
exports.lowercaseUrlMiddleware = function (req, res, next) {
	if (/[A-Z]/.test(req.path)) {
		return res.redirect(req.path.toLowerCase());
	}
	next();
};

/**
	Inits the error handler functions into `res`
*/
exports.initErrorHandlers = function (req, res, next) {

	res.err = function (err, title, message) {
		console.log(err);
		res.status(500).render('errors/500', {
			err: err,
			errorTitle: title,
			errorMsg: message
		});
	};

	res.notfound = function () {
		res.status(404).render('errors/404');
	};

	next();

};


/**
	Redirect to URL's in all lowercase
*/
exports.lowercaseUrlMiddleware = function (req, res, next) {
	if (/[A-Z]/.test(req.path)) {
		return res.redirect(req.path.toLowerCase());
	}
	next();
};

/**
	Inits the error handler functions into `res`
*/
exports.initErrorHandlers = function (req, res, next) {

	res.err = function (err, title, message) {
		res.status(500).render('errors/500', {
			err: err,
			errorTitle: title,
			errorMsg: message
		});
	};

	res.notfound = function () {
		res.status(404).render('errors/404');
	};

	next();

};


/**
	Fetches and clears the flashMessages before a view is rendered
*/

exports.flashMessages = function (req, res, next) {
	var flashMessages = {
		info: req.flash('info'),
		success: req.flash('success'),
		warning: req.flash('warning'),
		error: req.flash('error')
	};

	res.locals.messages = _.some(flashMessages, function (msgs) {
		return msgs.length;
	}) ? flashMessages : false;

	console.log(res.locals.messages);
	next();

};


exports.requireUser = function (req, res, next) {
	if (!req.user) {
		console.log('UNAUTHORIZED');
		req.flash('error', 'Please sign in to access this page.');
		res.redirect('/signin'); //swith to custom view?
	} else {
		next();
	}
};

exports.requireVerifcation = function (req, res, next) {

	if (!req.user) {
		console.log('UNAUTHORIZED');
		req.flash('error', 'Please sign in to access this page.');
		res.redirect('/signin'); //swith to custom view?
	} else if (!req.user.isVerified) {
		console.log('UNVERIFIED');
		req.flash('error', 'Please verify your account by clicking the link from your email. Click on below link to resend the email to ' + req.user.email);
		res.redirect('/verify-account'); //swith to custom view?
	} else {
		next();
	}
};

exports.requiresLogout = function (req, res, next) {
	if (req.user) {
		return res.redirect('/signout'); //other page
	}
	next();
};

exports.requiresSecure = function (req, res, next) {
	if (req.headers['x-forwarded-proto'] != 'https') {
		return res.redirect('https://' + req.host + req.url);
	}
	next();
};

exports.returnJSON = function (req, res, next) {
	if (req.query.json) {
		if (res.locals.user.password) {
			unset(res.locals.user.password);
		}
		return res.json(res.locals);
	} else {
		//			if (res.locals.hostname === 'localhost:3000') {
		//res.locals.base_url = 'https://afternoon-mesa-52732.herokuapp.com';
		//			}
	}
	next();
};


exports.bypassSecure = function (req, res, next) {
	next();
};


/**
from https://github.com/JedWatson/sydjs-site/blob/master/routes/middleware.js
	Returns a closure that can be used within views to change a parameter in the query string
	while preserving the rest.
*/
var qs_set = exports.qs_set = function(req, res) {
	return function qs_set(obj) {
		var params = _.clone(req.query);
		for (var i in obj) {
			if (obj[i] === undefined || obj[i] === null) {
				delete params[i];
			} else if (obj.hasOwnProperty(i)) {
				params[i] = obj[i];
			}
		}
		var qs = querystring.stringify(params);
		return req.path + (qs ? '?' + qs : '');
	}
}
