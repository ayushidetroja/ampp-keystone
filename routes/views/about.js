// https://github.com/Milhau5/dreamspace/blob/master/routes/views/signin.js

// generic comment
var keystone = require('keystone');

module.exports = function(req, res) {
	var view = new keystone.View(req, res);
	if (req.params.info == 'termsandconditions') view.render('termsandconditions');
	else if (req.params.info == 'gettingstarted') view.render('gettingstarted');
	else view.render('about');
};
