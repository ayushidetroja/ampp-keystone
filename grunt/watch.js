module.exports = {
	js: {
		files: [
			'models/**/*.js', //originally model, did they get it wrong?
			'routes/**/*.js'
		],
		tasks: ['jshint:all']
	},
	express: {
		files: [
			'keystone.js',
			'public/js/lib/**/*.{js,json}'
		],
		tasks: ['jshint:server', 'concurrent:dev']
	},
	sass: {
		files: ['public/styles/**/*.scss'],
		tasks: ['sass']
	},
	html: { 
		files: ['templates/**/*.html'],
		tasks: ['html']
	},
	livereload: {
		files: [
			'public/styles/**/*.css',
			'templates/**/*.html'
		],
		options: {
			livereload: true
		}
	}
};
