var keystone = require('keystone');
var async = require('async');

var encryptor = require('../../utils/encrypt');
var nodemailer = require('nodemailer');
var mg = require('nodemailer-mailgun-transport');


module.exports = function(req, res) {

  if (req.user) {
    req.flash('error', 'You are already logged in');
    return res.redirect('/my-profile');
  }

  var view = new keystone.View(req, res);
  var locals = res.locals;

  locals.section = 'join';
  locals.form = req.body;

	view.on('post', { action: 'join' }, function(next) {

		async.series([

			function(cb) {

				if (!req.body['name.first'] || !req.body.email || !req.body.password) {
          console.log(req.body);
					req.flash('error', 'Please enter a first name, email and password.');
					return cb(true);
				}
        req.body.name = {
  				'first': req.body['name.first'],
  				'last': req.body['name.last']
  			};

        if (req.body.password != req.body.passwordConfirm || (req.body.password.length > 0 && req.body.password.length < 4)) {
          req.flash('error', 'Passwords must match and be longer than 3 characters.');
					return cb(true);
				}

				return cb();

			},

			function(cb) {

				keystone.list('User').model.findOne({ email: req.body.email }, function(err, user) {

					if (err || user) {
						req.flash('error', 'User already exists with that email address.');
						return cb(true);
					}

					return cb();

				});

			},

			function(cb) {

				var userData = {
					name: req.body.name,
					email: req.body.email,
					password: req.body.password // auto encrypted
				};
        userData.isAdmin = false;
        userData.isVerified = false;

        ['gender','medium','phone','locale'].forEach(function(item){
            if(typeof req.body[item] != 'undefined' && req.body['item'] != ''){
                userData[item] = req.body[item];
            }
        });

        //console.log(userData);
        var User = keystone.list('User').model;
                var newUser = new User(userData);


        newUser.save(function(err) {

          if (err) {
              console.log('Error Inserting New Data');
              if (err.name == 'ValidationError') {
                  for (field in err.errors) {
                    req.flash('error', err.errors[field].message);
                  }
              } else {
                console.log(err);
              }
          }


          res.locals.newUser = newUser;
          req.user = newUser;
          return cb(err);
				});

			},

      function (cb) {
        // @TODO: re-query user from DB?
        var link = req.protocol + '://' + req.get('host') + '/verify-account/' + encryptor.encrypt(req.user.email);

        var nodemailerMailgun = nodemailer.createTransport(mg({
          service:  'Mailgun',
          auth: { api_key: process.env.MAILGUN_API_KEY, domain: process.env.MAILGUN_DOMAIN }
        }));

        nodemailerMailgun.sendMail({
          from: {address:'postmaster@amppstar.com', name:'AMPP Star'},
          to: {address: req.user.email, name : req.user.name.first + ' ' + req.user.name.last},
          subject: 'AMPP Account Verfication',
          link : link,
          text : `Hi ${req.user.name.first}. Go here to verify your account: ${link}`,
          html: `<h4>Hi ${req.user.name.first},</h4>
    						<p>Please click on below link to get your account verified.</p>
    						<h4><a href="${link}" target="_blank">Click Here</a></h4>
    						<p>If you cannot view this link copy-and-paste this URL into your browser: ${link}</p>
    						<p style="vertical-align:middle">
    							<img height="30" src="https://www.amppstar.com/images/logo.png" alt="Instagram"> &copy; AMPP Star 2019 <a href="https://www.amppstar.com/about/termsandconditions">Terms &amp; Conditions</a>
    						</p>
    						<p style="background:#0a1622; padding:7px;">
    							<a style="margin-right:4px;" href="https://www.instagram.com/ampp_star/" target="_blank"><img src="https://www.amppstar.com/images/iconIG.png" alt="Instagram"></a>
    							<a href="https://www.facebook.com/amppstar/" target="_blank"><img src="https://www.amppstar.com/images/iconFB.png" alt="Facebook"></a>
    						</p>`,
        }, function (err, info) {
          if (err) {
            console.log('Error: ' + err);
          } else {
            console.log('Response: ' + JSON.stringify(info));
          }
          req.flash('success', 'Welcome to AMPP Star. To post content please verify your account from the email we just sent you ' + req.user.email);
          return cb(err);
         });
       }


		], function(err){

			if (err) return next();

			var onSuccess = function() {
        return res.redirect('/'); // per https://github.com/eliataylor/ampp-keystone/issues/37
        // return res.redirect('/artist/' + res.locals.newUser._id); //CHECK where to redirect to
			};

			var onFail = function(e) {
				req.flash('error', 'There was a problem automatically signing you in, please try again.');
				return next();
			};

			keystone.session.signin({ email: req.body.email, password: req.body.password }, req, res, onSuccess, onFail);

		});

	});

  view.render('forms/join'); //in templates/views/site

};
