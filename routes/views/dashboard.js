var keystone = require("keystone");

exports = module.exports = function(req, res) {
	var view = new keystone.View(req, res);
	var locals = res.locals;

	locals.section = "dashboard";
	locals.filters = {
		genres: []
	};

	locals.numberOfItems = [50, 100, 200];
	locals.size = req.query.size || locals.numberOfItems[1];
	locals.currentPage = req.query.page || 1;

	if (!locals.medium) {
		req.flash("warn", "First select a Art medium");
		return res.redirect("/");
	}

	locals.section = locals.medium.slug;

	view.on("init", function(next) {
		let contentQuery = {
			medium: locals.medium._id,
			state: "published",
			isActive: true
		};

		genres = req.query.genres || [];
		if (typeof genres == "string") genres = genres.split(",");

		if (genres.length > 0) {
			var genreIds = [];
			locals.medium.genre.forEach(genre => {
				genres.forEach(filter => {
					if (filter == genre.slug) {
						genreIds.push(genre._id);
						locals.filters.genres.push(genre);
					}
				});
			});
			if (genreIds.length > 0) {
				contentQuery.genre = { $in: genreIds }; // Array $in array matches any() not all()
			} else if (genreIds.length === 1) {
				contentQuery.genre = genreIds[0];
			} else {
				req.flash("warn", "Invalid genre filter");
			}
		}

		//console.log('contentQuery', contentQuery);

		var paginateObj = {
			page: locals.currentPage,
			perPage: locals.size,
			maxPages: 10,
			filters: contentQuery
		};
		console.log(paginateObj);

		var q = keystone
			.list("Content")
			.paginate(paginateObj)
			.sort({ publishedDate: -1 })
			.populate("author medium genre");

		q.exec(function(err, content) {
			locals.content = content;
			if (req.user && req.user._id) {
				content.results.forEach(function(item) {
					item.isLiked = item.likes.indexOf(req.user._id) > -1 ? true : false;
				});
			}
			next(err);
		});

		/* keystone.list('Content').model.find(contentQuery).sort({createdAt:1}).populate('author medium genre').exec().then((content) => {
				locals.content = content;
				// next();
			}); */
	});

	view.render("dashboard");
};
