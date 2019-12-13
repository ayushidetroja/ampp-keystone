var keystone = require('keystone');

exports = module.exports = function (req, res) {

	var view = new keystone.View(req, res);
	var locals = res.locals;

	// locals.section is used to set the currently selected
	// item in the header navigation.
	locals.section = 'home';

	view.render('index');
	
	/* if (req.user && req.user.isVerified == false) {
		req.flash('error', 'Please verify your account');
		return res.redirect('/verify-account');
	} else {
		// Render the view
		view.render('index');
	} */
};
