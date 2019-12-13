var async = require("async"),
	keystone = require("keystone");
var _ = require("lodash");

module.exports = {
	followUser: function(req, res, next) {
		var updateQuery = {};
		return keystone
			.list("User")
			.model.findOne({
				_id: req.params.user_id
			})
			.then(user => {
				if (user && _.find(user.followers, req.user._id)) {
					updateQuery = {
						$pull: {
							followers: req.user._id
						}
					};
				} else {
					updateQuery = {
						$addToSet: {
							followers: req.user._id
						}
					};
				}
				return keystone
					.list("User")
					.model.update(
						{
							_id: req.params.user_id
						},
						updateQuery
					)
					.exec()
					.then(result => {
						if (result)
							return res.json({
								isFollowed: true
							});
						else
							return res.json({
								isFollowed: true
							});
					});
			})
			.catch(next);
	},
	//@ get all user api
	allUsers: function(req, res, next) {
		var view = new keystone.View(req, res);
		var locals = res.locals;
		var updateQuery = {};

		keystone
			.list("User")
			.model.find({
				isAdmin: false
			})
			.collation({ locale: "en" })
			.sort({ "name.first": 1 })
			.then(users => {
				locals.users = users;

				view.render("allUser");
			})
			.catch(next);
	},
	//@ get following user api
	followingUser: function(req, res, next) {
		var view = new keystone.View(req, res);
		var updateQuery = {};
		var locals = res.locals;

		keystone
			.list("User")
			.model.find({
				followers: req.user._id
			})
			.collation({ locale: "en" })
			.sort({ "name.first": 1 })
			.then(users => {
				locals.users = users;
				view.render("followingUser");
			})
			.catch(next);
	}
};
