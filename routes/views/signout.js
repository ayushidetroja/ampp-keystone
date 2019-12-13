var keystone = require('keystone');

module.exports = function(req, res) {

	var view = new keystone.View(req, res);
	var locals = res.locals;

	locals.section = 'signout sigin';

	keystone.session.signout(req, res, function() {
		//res.redirect('/');
		view.render('forms/signout'); //new page
	});

};
