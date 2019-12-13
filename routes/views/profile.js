var keystone = require('keystone');
var async = require('async');
var _ = require('lodash');

module.exports = function(req, res) {

	var view = new keystone.View(req, res);
	var locals = res.locals;

	locals.section = 'dashboard';
	locals.filters = {
		'medium': req.query.medium,
		genres  : [], // only push validated objects here
		userGenres : {}
	};
	genres = req.query.genres || []
	if (typeof genres == 'string') genres = genres.split(',');
	let contentQuery = {};

	view.on('post', function(next) {
		var updateData = req.body.skin ? { skin: req.body.skin } : { skin: null }
		keystone.list('User').model.update({ '_id': req.user._id}, updateData, function(err) {
			if (err) {
				if (err.name == 'ValidationError') {
					for (field in err.errors) {
						req.flash('error', err.errors[field].message);
					}
				} else {
					console.log(err);
				}
				next(err);
			} else {
				return res.redirect(`/artist/${req.user._id.toString()}`);
			}
		});
	});

	view.on('init', function(next) {
		keystone.list('User').model.findOne({
			_id: req.params.user
		}).populate('medium').exec().then((author) => {
			if (author && author.website && author.website.indexOf('http') != 0) {
				author.website = (author.website.indexOf('//') != 0) ? 'http://' + author.website : 'http:' + author.website;
			}
			locals.author = author;

			author.isFollowed = false;
			if(req.user && req.user._id) {
				console.log('followers:' + author.followers.length, typeof author.followers);
				if(author.followers.indexOf(req.user._id) > -1) {
					author.isFollowed = true;
				}
			}

			contentQuery = {'author':  locals.author._id };

			if (locals.filters.medium) {
				locals.mediums.forEach((medium) => {
					if (medium.slug == locals.filters.medium) {
						contentQuery.medium = medium._id;
						locals.medium = medium;
					}
				});
			}

			if (!req.user || (req.user && !locals.author._id.equals(req.user._id))) {
				contentQuery.state = 'published';
			} else if (req.user && locals.author._id.equals(req.user._id)) {
				locals.author.isMe = true;
			}

			if (genres.length > 0) {
				var genreIds = {};
				genres.forEach((filter) => { // all this simply changes slug to _id for contentQuery
					locals.mediums.forEach((medium) => {
						if (!locals.medium || medium.slug == locals.medium.slug) {
							medium.genre.forEach((genre) => {
								if (filter == genre.slug) {
									genreIds[genre._id] = genre;
								}
							});
						}
					});
					locals.filters.genres = genreIds;
					genreIds = Object.keys(genreIds);
				});
				if (genreIds.length > 0) {
					contentQuery.genre = {$in: genreIds}
				} else if (genreIds.length === 1) {
					contentQuery.genre = genreIds[0];
				} else {
					req.flash('warn', 'Invalid genre filter');
				}
			}

			if(req.user) { // all user users see the users skin
				keystone.list('Skin').model.find().exec(function (err, result) {
					if (err) {
						console.log(err);
						next();
					} else {
						locals.skins = result;
						locals.author.skin = _.find(locals.skins, {_id: locals.author.skin});
						next();
					}
				});
			} else {
				//console.log('not my profile');
				next();
			}

		});
	});

	view.on('init', function(next) {
		if (!locals.author) {
			req.flash('error', 'Invalid User');
			return next();
		}
		console.log('contentQuery', contentQuery);

		keystone.list('Content').model.find(contentQuery).sort({publishedDate:-1}).populate('medium genre').exec().then((contents) => {
			console.log('Contents', contents);

			contents.forEach((content) => { // won't work with pagination
				content.genre.forEach((genre) => { // won't work with pagination
					locals.filters.userGenres[genre.slug] = genre;
				});
			});

			if(req.user && req.user._id) {
				contents.forEach((item) => {
					item.isLiked = item.likes.indexOf(req.user._id) > -1 ? true: false;
				});
			}
			locals.contents = contents;
			// return res.json(contents);
			next();
		});

	});

	view.on('init', function(next) {
		if (!locals.author) {
			req.flash('error', 'Invalid User');
			return next();
		}
		keystone.list('Content').model.aggregate([
			{ $match: { author: locals.author._id} },
		  	{ $project: { likes: 1 } },
		  	{ $unwind: '$likes' },
		  	{ $group: {
				  _id: null
				, count: { $sum: 1 }
			  }
			}
		], function(err, totalLikes) {
				locals.author.totalLikes = (totalLikes && totalLikes.length)? totalLikes[0].count : 0;
		  	next()
		});
	});

	view.render('user');
};
