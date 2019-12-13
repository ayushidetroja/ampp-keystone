module.exports = {
	options: {
		reporter: require('jshint-stylish'),
		force: true
	},
	esversion:6,
	ignores :[
		'node_modules'
	],
	all: [ 'routes/**/*.js',
				 'models/**/*.js'
	],
	server: [
		'./keystone.js'
	]
}
