const keystone = require('keystone');
const Types = keystone.Field.Types;

//initialize a list instance with options.
const Genre = keystone.List('Genre',{
  autokey: { from: 'name', path: 'slug', unique:true },
  nodelete:true
});

//add schema
Genre.add({
    name: { type: String, initial: true, index:true },
    icon: { type: Types.File, storage: keystone.get('storage') },
    count : { type: Number }
});


Genre.relationship({ ref: 'Medium', path: 'medium', refPath: 'genre' });
Genre.defaultColumns = 'name, icon';
Genre.register();//register with keystone
