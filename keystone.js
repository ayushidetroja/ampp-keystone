// Simulate config options from your production environment by
// customising the .env file in your project's root folder.

require('dotenv').config();

// Require keystone
var keystone = require('keystone');
var Twig = require('twig');

if(process.env.NODE_ENV == 'development'){
	Twig.cache(false);
}

// Initialise Keystone with your project's configuration.
// See http://keystonejs.com/guide/config for available options
// and documentation.

keystone.init({
	'name': 'AMPP',
	'brand': 'AMPP',

	'sass': 'public',
	'static': 'public',
	'favicon': 'public/favicon.ico',
	'views': 'templates/views',
	'view engine': 'twig',

	'twig options': { method: 'fs' },
	'custom engine': Twig.render,

	'emails': 'templates/emails',
	'cookie secret' : process.env.COOKIE_SECRET,
	'mongo': process.env.MONGODB_URI,

	'auto update': true,
	'session': true,
	'session store': 'connect-mongo',
	'auth': true,
	'user model': 'User',

	'basedir': __dirname,

	'frame guard' : 'deny'
});

keystone.set('s3 config', {
	bucket: process.env.S3_BUCKET,
	key:  process.env.S3_KEY,
	secret: process.env.S3_SECRET,
	region: process.env.S3_REGION
	/*,
	headers: {
		'x-amz-acl': 'public-read',
	},
	defaultHeaders: {
		'x-amz-acl': 'public-read',
	}*/
});


var storage = new keystone.Storage({
	adapter: require('./custom/S3CustomStorage'), // copies normal and adds SCHEMA_FIELD_DEFAULTS to width/height
//  adapter: require('keystone-storage-adapter-s3'),
  s3: {
		bucket: process.env.S3_BUCKET,
		key:  process.env.S3_KEY,
		secret: process.env.S3_SECRET,
		region: process.env.S3_REGION,
    path: '/uploads/'
		/*,
    headers: {
      'x-amz-acl': 'public-read',
    },
		defaultHeaders: {
			'x-amz-acl': 'public-read',
		}*/
  },
  schema: {
//    bucket: true, // optional; store the bucket the file was uploaded to in your db
    etag: true, // optional; store the etag for the resource
//    path: true, // optional; store the path of the file in your db
    url: true, // optional; generate & store a public URL
		filename: true,
		size: true,
		mimetype: true,
//		originalname: true
		width:false,
		height:false,
		wUnits:false,
		hUnits:false
  }
});

/*
storage.pre('upload', function (next, localSrc) {
	console.log('pre upload', localSrc)
	next();
});
*/

keystone.set('storage',storage);

// Load your project's Models
keystone.import('models');

// Setup common locals for your templates. The following are required for the
// bundled templates and layouts. Any runtime locals (that should be set uniquely
// for each request) should be added to ./routes/middleware.js
keystone.set('locals', {
	_: require('lodash'),
	env: keystone.get('env'),
	utils: keystone.utils,
	editable: keystone.content.editable,
});

// Load your project's Routes
keystone.set('routes', require('./routes'));


// Configure the navigation bar in Keystone's Admin UI
keystone.set('nav', {
	Content: ['Content','Medium','Genre'],
	Users:['User', 'Enquiry'],
});

// Start Keystone to connect to your database and initialise the web server


if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
	console.log('----------------------------------------\
	\n WARNING: MISSING MAILGUN CREDENTIALS\
	\n ----------------------------------------\
	\n You have opted into email sending but have not provided\
	\n mailgun credentials. Attempts to send will fail.\
	\n Create a mailgun account and add the credentials to the .env file to\
	\n set up your mailgun integration');
}


keystone.start(function(){
    console.log('keystone started');
});
