var async = require("async"),
	keystone = require("keystone");
var _ = require("lodash");

module.exports = {
	likeContent: function(req, res, next) {
		var updateQuery = {};
		return keystone
			.list("Content")
			.model.findOne({
				_id: req.params.content_id
			})
			.then(content => {
				if (content && _.find(content.likes, req.user._id)) {
					updateQuery = {
						$pull: {
							likes: req.user._id
						}
					};
				} else {
					updateQuery = {
						$addToSet: {
							likes: req.user._id
						}
					};
				}

				return keystone
					.list("Content")
					.model.update(
						{
							_id: req.params.content_id
						},
						updateQuery
					)
					.exec()
					.then(() => {
						var likeCount = content.likes.length;
						if (updateQuery.$pull) {
							--likeCount;
						} else {
							++likeCount;
						}
						res.send({
							likeCount
						});
					});
			})
			.catch(next);
	}
};
