const keystone = require('keystone');
const Types = keystone.Field.Types;

//initialize a list instance with options.
const Skin = keystone.List('Skin',{
  autokey: { from: 'name', path: 'slug', unique: true },
  map: { name: 'name' },
  defaultSort: '-createdAt'
});

//add schema
Skin.add({
    name: { type: String, required: true, index:true },
    backgroundImage: { type: Types.File, storage: keystone.get('storage'), default: null },
    backgroundColor: { type: Types.Color },
    textColor: { type: Types.Color },
    menuBackgroundColor: { type: Types.Color },
    menuTextColor: { type: Types.Color },
    headerBackgroundColor: { type: Types.Color },
    headerTextColor: { type: Types.Color },
    createdAt: { type: Date, default: Date.now },
});

Skin.defaultSort = '-createdAt';
Skin.defaultColumns = 'name, createdAt';
Skin.register();//register with keystone
