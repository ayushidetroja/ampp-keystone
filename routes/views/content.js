var keystone = require("keystone");

exports = module.exports = function(req, res) {
	if (!req.params.content) {
		return next();
	}

	var view = new keystone.View(req, res);
	var locals = res.locals;

	locals.filters = { content: req.params.content };
	locals.section = "contentPage";
	locals.item = {};

	let contentQuery = {
		$or: [{ slug: locals.filters.content }, { _id: locals.filters.content }]
	};

	view.on("init", function(next) {
		var q = keystone
			.list("Content")
			.model.findOne(contentQuery)
			.populate("author genre medium");

		q.exec(async function(err, result) {
			//console.log("resul++++" + result);
			if (err) {
				//
			} else if (!result) {
				req.flash("error", "This item has been deleted");
			} else if (
				result.state != "published" &&
				(!req.user || !result.author._id.equals(req.user._id))
			) {
				req.flash("warn", "This item is not published");
			} else {
				if (!req.user) result.isMine = false;
				else result.isMine = result.author._id.equals(req.user._id);

				await keystone
					.list("User")
					.model.find({
						_id: { $in: result.likes }
					})
					.sort({ _id: -1 })
					.then(users => {
						result.likeUser = users;
						//result.testname = "hemin patel<br/>,mahesh \n pranav";
					});
				//	console.log("====" + result.likeUser);
				locals.item = result;
				//console.log(locals.item.likeUser);

				if (req.user && req.user._id) {
					locals.item.isLiked =
						locals.item.likes.indexOf(req.user._id) > -1 ? true : false;
				}
			}
			next(err);
		});
	});

	// Render the view
	view.render("content");
};
