const keystone = require('keystone');
const Types = keystone.Field.Types;
const Promise = require('bluebird');
const Probe = require('probe-image-size');

const Content = new keystone.List('Content', {
	map: { name: 'title' },
	autokey: { path: 'slug', from: 'title', unique: true },
	drilldown: 'author medium',
	defaultSort: '-createdAt',
	//track:true,
});

Content.add({
	medium: { type: Types.Relationship, ref: 'Medium', index: true, initial:true },
	title: { type: String, required: true, initial:true },
	state: { type: Types.Select, options: 'draft, published, archived', default: 'draft', index: true },
	author: { type: Types.Relationship, ref: 'User', index: true },
	publishedDate: { type: Types.Date, index: true, default: Date.now, dependsOn: { state: 'published' } },
  	image: { type: Types.File, storage: keystone.get('storage'), default: null },
  	media: { type: Types.File, storage: keystone.get('storage'), default: null, dependsOn : { medium:['Music', 'music', '_id', '59ab48320bc35c0fe66c79ac']} },
	genre: { type: Types.Relationship, ref: 'Genre', many: true, filters: { medium: ':genre' }},
	likes: {type: Types.Relationship,ref: 'User', many:true},
	isActive: { type: Boolean, index: true, default:true },
	createdAt: { type: Types.Date, default: Date.now },
	// tried medium:':genre'
	// medium:':name' || { medium: ':genre:_id' }
	content: {
		brief: { type: Types.Html, wysiwyg: true, height: 75 },
		extended: { type: Types.Html, wysiwyg: true, height: 200 },
	},
});

Content.schema.methods.isPublished = function() {
    return this.state == 'published';
};

Content.schema.pre('save', function(next) {
    if (this.isModified('state') && this.isPublished() && !this.publishedAt) {
        this.publishedAt = new Date();
    }
		// populate author / validate
    next();
});

Content.schema.post('save',(doc,next)=>{
	//update count on Genre and Medium

	let chains = [], meth = null;
	if (typeof doc.genre == 'string') doc.genre = [doc.genre];
	doc.genre.map(function(gid) {
		meth = keystone.list('Content').model.count({genre: gid,state: 'published'}).exec()
			.then((num) => {
				if (!num) num = 0;
				console.log("UPDATING GENRE: " + gid + ' COUNT == ' + num);
				return keystone.list('Genre').model.update({'_id': gid}, {count: num}).exec()
			});
		chains.push(meth);
	});

	meth = keystone.list('Content').model.count({medium: doc.medium,state: 'published'}).exec()
	.then((num) => {
		if (!num) num = 0;
		console.log("UPDATING MEDIUM: " + doc.medium + ' COUNT == ' + num);
		return keystone.list('Medium').model.update({'_id': doc.medium}, {count: num}).exec()
	});

	chains.push(meth);

	if (doc.image && doc.image.url) {
		//console.log('HANDLE UPDATING IMAGE', doc.image);

		meth = Probe(doc.image.url, function (err, result) {
			if (err) console.log(err);
			doc.image.width = result.width;
			doc.image.height = result.height;
			doc.image.wUnits = result.wUnits;
			doc.image.hUnits = result.hUnits;
			//doc.image = Object.assign(doc.image, result);
			console.log('PROBE UPDATING IMAGE', result);

			return keystone.list('Content').model.update({'_id': doc._id}, {image: doc.image}).exec();
		});
		chains.push(meth);
	}

	Promise.all(chains)
	.then(() => next())
	.catch((err) => {
		console.log('Content.schema.post.save update genre medium counts fails!');
		console.log(err);
		next();
	});

});

Content.schema.virtual('content.full').get(function () {
	return this.content.extended || this.content.brief;
});

Content.defaultColumns = 'title, medium|20%, genre|20%, author|20%';
Content.register();
