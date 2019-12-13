const keystone = require('keystone');
const Types = keystone.Field.Types;

const Medium = new keystone.List('Medium',{
    autokey: { from: 'name', path: 'slug', unique: true },
    nocreate:true,
    nodelete:true,
    map: { name: 'name' },
    drilldown: 'genre',
    label:'Medium',
    singular:'Medium',
    plural:'Mediums'
});

Medium.add({
    name: { type: String, initial: true },
    profession: { type: String },
    caption: { type: String },
    icon: { type: Types.File, storage: keystone.get('storage') },
    image: { type: Types.File, storage: keystone.get('storage') },
    mp4: { type: Types.File, storage: keystone.get('storage') },
    logo: { type: Types.File, storage: keystone.get('storage') },
    genre: {type: Types.Relationship,ref: 'Genre', many:true},
    count : { type: Number }
});

Medium.relationship({ ref: 'User', path: 'user', refPath: 'medium' });
Medium.defaultColumns = 'name, icon, genre';
Medium.register();
