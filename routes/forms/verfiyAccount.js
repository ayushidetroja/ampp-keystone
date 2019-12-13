var async = require('async'),
	keystone = require('keystone');

/**
 * List Posts
 */

var encryptor = require('../../utils/encrypt');

exports = module.exports = function (req, res, next) {

	keystone.list('User').model.findOne({
		email: encryptor.decrypt(req.params.token)
	}).exec().then((user) => {
		if (user) {
			user.isVerified = true;
			user.save(function (err, result) {
				if (err) next(err);
				else {
					res.send('Your account is verified');
				}
			});
		}

	}).catch(next);


}
