var keystone = require('keystone');

var User = keystone.list('User');

var async = require('async');

var _ = require('lodash');

module.exports = function(req, res) {

	var view = new keystone.View(req, res);
	var locals = res.locals;

	locals.section = 'my-profile';
	locals.show_edit_fields = true;
	locals.form = req.user;



	view.on('post', (next) => {

			if (!req.body['name.first'] || !req.body.email) {
				console.log(req.body);
				req.flash('error', 'Please enter a first name and email');
				return cb(true);
			}

			req.body.name = {
				'first': req.body['name.first'],
				'last': req.body['name.last']
			};

			let fieldList = ['email']; // you don't need to reset these, and cannot erase them
			for (var i = 0; i < fieldList.length; i++) {
				if (typeof req.body[fieldList[i]] == 'string' || req.body[fieldList[i]].length == 0) {
					fieldList.splice(i, 1);
				}
			}

			if (req.body.password != req.body.passwordConfirm || (req.body.password.length > 0 && req.body.password.length < 4)) {
				req.flash('error', 'Passwords must match and be longer than 3 characters.');
				return next();
			} else if (req.body.password.length > 0) {
				fieldList.push('password');
			}

			fieldList = fieldList.concat(['name', 'phone', 'gender', 'skin', 'medium', 'locale', 'website']);

			if (req.body.removeProfilePic && req.body.removeProfilePic == 1) {
				delete req.body.removeProfilePic;
				req.body.image = null;
				fieldList.push("image");
			} else if (req.files.image_upload) {
				fieldList.push("image");
			}

			var tasks = [
				function emailInUse(cb) {
					if (req.body.email == '') {
						return cb('Email cant be empty');
					}
					if (req.body.email === req.user.email) {
						return cb();
					}
					User.model.findOne({
						email: req.body.email
					}, function(err, item) {
						if (item != null) {
							cb('Email address in use by another account');
						} else {
							console.log('email not in use');
							cb();
						}
					})
				}
			];

			function handleUpdate(err) {

				if (err) {
					locals.form = req.body;
					req.flash('error', err);
					return next();
				}

				if (keystone.get('env') == 'development') {
					console.log('request  body ----' + "\r\n");
					console.log(req.body);
					console.log('user ----' + "\r\n");
					console.log(req.user);
					console.log('fields to update ----' + "\r\n");
					console.log(fieldList);
				}

				req.user.getUpdateHandler(req, res).process(req.body, {
					fields: fieldList.join(', '),
					flashErrors: true,
					logErrors: true
				}, (err) => {
					if (err) {
						console.log('USER UPDATE ERROR', err);
						req.flash('error', err);
					} else {
						req.flash('success', 'Profile updated!');
						User.model.findOne({
							_id: req.user._id
						}).exec().then((user) => {
							req.user = locals.form = user;
							next();
						})
					}
					next();
				});
			}
		async.waterfall(tasks, handleUpdate);
	});

	view.on('init', function(next) {
		var q = keystone.list('Skin').model.find();
		q.exec(function (err, result) {
			if (err) {
			} else {
				locals.skins = result;
			}
			next(err);
		});
	});

	view.render('forms/join'); // in templates/views/site

};
