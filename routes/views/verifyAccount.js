// https://github.com/Milhau5/dreamspace/blob/master/routes/views/signin.js

//generic comment
var keystone = require('keystone');
var async = require('async');
var encryptor = require('../../utils/encrypt');

var nodemailer = require('nodemailer');
var mg = require('nodemailer-mailgun-transport');

module.exports = function (req, res) {
	var view = new keystone.View(req, res);
	var locals = res.locals;

	locals.section = 'Verfiy Account';
	locals.form = req.body;
	locals.isAccountVerified = false;

	view.on('init', function (next) {
		if (!req.user) {
			req.flash('error', 'You are not logged in');
			return res.redirect('/signin');
		} else if (req.user.isVerified === true) {
			req.flash('error', 'Your email is already verified');
			return res.redirect('/artist/' + req.user._id);
		}

		console.log(req.user);
		if (req.params.token) {
			keystone.list('User').model.findOne({
				email: encryptor.decrypt(req.params.token)
			}).exec().then((user) => {
				if (user) {
					user.isVerified = true;
					user.save(function (err, result) {
						if (err) next(err);
						else {
							req.user = user;
							req.flash('success', 'Your account has been verified.');
							locals.isAccountVerified = true;
							next();
						}
					});
				}
			}).catch(next);
		} else {

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
						req.flash('success', 'Welcome to AMPP. To post content please verify your account from the email we just sent you ' + req.user.email);
			  		next();
			     });
				 }
	});



	view.on('post', {
		action: 'resendLink'
	}, function (next) {
		if (!req.user) {
			req.flash('error', 'You are not logged in');
			return next();
		}
		console.log('req.user', req.user);

		var link = req.protocol + '://' + req.get('host') + '/verify-account/' + encryptor.encrypt(req.user.email);

		var nodemailerMailgun = nodemailer.createTransport(mg({
			service:  'Mailgun',
			auth: { api_key: process.env.MAILGUN_API_KEY, domain: process.env.MAILGUN_DOMAIN }
		}));

		nodemailerMailgun.sendMail({
			from: {address:'postmaster@amppstar.com', name:'AMPP Star'},
			to: {address: req.user.email, name : req.user.name.first + ' ' + req.user.name.last},
			subject: 'AMPP Account Verfication retry',
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
			req.flash('success', 'We just resent your link to ' + req.user.email + '. You may want to check your Spam folder');
			next();
		 });
	});

	view.render('forms/verifyAccount'); //no longer 'session' folder

};


/* new keystone.Email({
	templateName: 'verify-account',
	transport: 'mailgun',
}).send({
	to: {
		name: user.name.first,
		email: user.email,
	},
	from: {
		name: 'AMPP',
		email: 'postmaster@amppstar.com',
	},
	subject: 'Verfiy Account',
	link: link,
}, function (err, result) {
	req.flash('success', 'Request received, you will receive an email shortly');
	next();
}); */
/* const html = `<h5>Hi ${user.name.first},</h5>
<p class="text-larger">Please click on below link to get your account verfified.</p>
<p class="text-larger"><a href="${link}">Click Here</a></p>`;
nodemailer.createTestAccount((err, account) => {
	var transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			 user: 'jahanzaibaslam156@gmail.com',
			 pass: 'password'
		 }
	 });

	const mailOptions = {
		from: 'jahanzaibaslam156@email.com', // sender address
		to: req.body.forgotpass_email, //'to@email.com', // list of receivers
		subject: 'Verfiy Account', // Subject line
		html: html // plain text body
	};

	// send mail with defined transport object
	transporter.sendMail(mailOptions, (error, info) => {
		if (error) {
			return console.log(error);
		}
		console.log('Message sent: %s', info.messageId);
		// Preview only available when sending through an Ethereal account
		console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
		next();
	});
}); */
