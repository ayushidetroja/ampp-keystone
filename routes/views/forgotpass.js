// https://github.com/Milhau5/dreamspace/blob/master/routes/views/signin.js

//generic comment
var keystone = require('keystone');
var async = require('async');

var nodemailer = require('nodemailer');
var mg = require('nodemailer-mailgun-transport');


module.exports = function (req, res) {

	if (req.user) {
		req.flash('error', 'You\'re already logged in');
		return res.redirect('/');
	}

	var view = new keystone.View(req, res);
	var locals = res.locals;

	locals.section = 'forgotpass'; //?
	locals.form = req.body;

	//eventually, you can only see posts that YOU made

	//move error checking into here
	view.on('post', {
		action: 'forgotpass'
	}, function (next) {

		if (!req.body.forgotpass_email) {
			req.flash('error', 'Please enter your email.');
			return next();
		}
		keystone.list('User').model.findOne({
			email: req.body.forgotpass_email
		}).exec().then((user) => {
      console.log(JSON.stringify(user));
			if (user) {
				user.password = Math.random().toString(36).slice(-8);
				locals.tempPassword = user.password;
				console.log('new password for ' + user.email + ' is ' + locals.tempPassword);
				user.save(function (err, result) {

          /* new keystone.Email({
						templateName: 'forgot-password',
						transport: 'mailgun',
					}).send({
						to: {email:req.body.forgotpass_email, name:user.first},
						from: {email: 'postmaster@amppstar.com', name:'Postmaster'},
						subject: 'Password Reset',
						password: locals.tempPassword,
					}, function (err, result) {
						req.flash('success', 'Password reset request received, you will receive an email shortly');
						next();
          }); */


          // This is your API key that you retrieve from www.mailgun.com/cp (free up to 10K monthly emails)
          var auth = {
            auth: {
              api_key: process.env.MAILGUN_API_KEY || 'key-96ea6acf354482e585baf2c0887bb5fc',
              domain: process.env.MAILGUN_DOMAIN || 'amppstar.com'
            }
          }

          var nodemailerMailgun = nodemailer.createTransport(mg(auth));

					var link = req.protocol + '://' + req.get('host') + '/signin';

          const html = `<h5>Hi ${user.name.first},</h5>
          <p class="text-larger">We have receieved a password reset request from your account. Please use the new password below to <a href="${link}" target="_blank">login</a>.</p>
          <p class="text-larger"><strong>${locals.tempPassword}</strong></p>`;

          nodemailerMailgun.sendMail({
            from: 'postmaster@amppstar.com',
            to: user.email, // An array if you have multiple recipients.
            subject: 'Password Reset',
            html: html,
          }, function (err, info) {
            if (err) {
              console.log('Error: ' + err);
            }
            else {
              console.log('Response: ' + JSON.stringify(info));
			}
			req.flash('success', 'Password reset request received, you will receive an email shortly');
  			next();
          });


        });

			} else {
				req.flash('error', 'User not found');
				next();
			}
		}).catch(error => {
			req.flash('error', error.message || 'User not found');
		});


	});


	view.render('forms/forgotpass'); //no longer 'session' folder

};
