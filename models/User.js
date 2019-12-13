var keystone = require('keystone');
var Types = keystone.Field.Types;
var validate = require('mongoose-validator');

var isPhone = validate({
	validator: 'isMobilePhone',
	arguments: 'any',
	passIfEmpty: true,
	message: 'Your phone number was invalid'
});
var isUrl = validate({
	validator: 'isURL',
	passIfEmpty: true,
	message: 'Your website is not a valid web address'
});
var isEmail = validate({
	validator: 'isEmail',
	passIfEmpty: false,
	message: 'Please enter a valid E-mail address',
});

/**
 * User Model
 * ==========
 */
var User = new keystone.List('User', {
	map: { name: 'name' }
});

User.add({
	name: { type: Types.Name, required: true, index: true },
	email: { type: Types.Email, initial: true, required: true, unique: true, index: true, validate:[isEmail] },
	showEmail : { type: Types.Select, options: 'onlyme, members, public', default:'onlyme', emptyOption: false  },
	password: { type: Types.Password, initial: true, required: true },
	gender : { type: Types.Select, options: 'not specified, male, female', default:'not specified', emptyOption: false  },
	medium: { type: Types.Relationship, ref: 'Medium', default:null, many:true },
	phone : {type: String, default: null, validate: [isPhone] },
	website: { type: Types.Url, default: null, validate: [isUrl] },
	image: { type: Types.File, storage: keystone.get('storage'), default: null },
	locale: { type: String , default: null },
	followers: {type: Types.Relationship,ref: 'User', many:true},
	skin: {type: Types.Relationship, ref: 'Skin'},
	createdAt: { type: Date, default: Date.now }
}, 'Permissions', {
	isAdmin: { type: Boolean, label: 'Can access Keystone', index: true, default:false },
	isVerified: { type: Boolean, label: 'Has a valid email address', default:false },
	termsAccepted: { type: Boolean, label: 'Has accepted Terms and Conditions', default:false },
	isActive: { type: Boolean, label: 'is account active?', index: true, default:true }
});

// Provide access to Keystone
User.schema.virtual('canAccessKeystone').get(function () {
	return this.isAdmin;
});

// Get member url
User.schema.virtual('url').get(function() {
	return '/artist/' + this.key;
});

User.schema.methods.wasActive = function () {
	this.lastActiveOn = new Date();
	return this;
}

/** Relationships **/
User.relationship({ ref: 'Content', path: 'content', refPath: 'author' });

/*** Registration ***/
User.defaultColumns = 'name, email, medium, isAdmin';
User.register();
