//generic comment
var keystone = require('keystone');
var async = require('async');

module.exports = function (req, res) {
	var view = new keystone.View(req, res);
	var locals = res.locals;

	locals.section = 'delete-account';

	view.on('init', function (next) {
		if (!req.user) {
			req.flash('error', 'You are not logged in');
			next();
		}

		var tasks = [
			function deleteUserContent(cb) {
				var contentQuery = {'author':  req.user._id };
				keystone.list('Content').model.update(contentQuery, {$set: {isActive: false}}, {multi: true}).exec().then((contents) => {
					cb();
				});
			}
		];

		function handleResponse(err, result) {
			if(err) { return next(err); }
			var query = { email: req.user.email };
			keystone.list('User').model.findOne(query).exec().then((user) => {
				if (user) {
					user.isActive = false;
					user.save(function (err, result) {
						if (err) next(err);
						else {
							req.user = user;
							req.flash('success', 'Your account has deleted.');
							res.redirect('/signout');
						}
					});
				}
			}).catch(next);
		}

		async.waterfall(tasks, handleResponse);        

	});

	// view.render('deleteaccount');
};
