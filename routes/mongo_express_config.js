'use strict';
require('dotenv').config();
const keystone = require('keystone');

module.exports = {
  mongodb: {
    connectionString: keystone.get('mongo'),

    //ssl: connect to the server using secure SSL
    ssl: false,

    //sslValidate: validate mongod server certificate against CA
    sslValidate: process.env.ME_CONFIG_MONGODB_SSLVALIDATE || true,

    //sslCA: array of valid CA certificates
    sslCA:  [],

    //autoReconnect: automatically reconnect if connection is lost
    autoReconnect: true,

    //poolSize: size of connection pool (number of connections to use)
    poolSize: 4,

    //set admin to true if you want to turn on admin features
    //if admin is true, the auth list below will be ignored
    //if admin is true, you will need to enter an admin username/password below (if it is needed)
    admin: false,//bc keystone
    // >>>>  If you are using regular accounts, fill out auth details in the section below
    // >>>>  If you have admin auth, leave this section empty and skip to the next section
    auth: [

    ],

    //  >>>>  If you are using an admin mongodb account, or no admin account exists, fill out section below
    //  >>>>  Using an admin account allows you to view and edit all databases, and view stats

    //leave username and password empty if no admin account exists
    adminUsername: '',
    adminPassword: '',

    //whitelist: hide all databases except the ones in this list  (empty list for no whitelist)
    whitelist: [],

    //blacklist: hide databases listed in the blacklist (empty list for no blacklist)
    blacklist: [],
  },

  site: {
    // baseUrl: the URL that mongo express will be located at - Remember to add the forward slash at the start and end!
    baseUrl: process.env.ME_CONFIG_SITE_BASEURL || '/',
    cookieKeyName: 'mongo-express',
    cookieSecret:     process.env.ME_CONFIG_SITE_COOKIESECRET   || 'cookiesecret',
    host:             process.env.VCAP_APP_HOST                 || 'localhost',
    port:             process.env.VCAP_APP_PORT                 || 8081,
    requestSizeLimit: process.env.ME_CONFIG_REQUEST_SIZE        || '50mb',
    sessionSecret:    process.env.ME_CONFIG_SITE_SESSIONSECRET  || 'sessionsecret',
    sslCert:          process.env.ME_CONFIG_SITE_SSL_CRT_PATH   || '',
    sslEnabled:       process.env.ME_CONFIG_SITE_SSL_ENABLED    || false,
    sslKey:           process.env.ME_CONFIG_SITE_SSL_KEY_PATH   || '',
  },

  //set useBasicAuth to true if you want to authenticate mongo-express loggins
  //if admin is false, the basicAuthInfo list below will be ignored
  //this will be true unless ME_CONFIG_BASICAUTH_USERNAME is set and is the empty string
  useBasicAuth: false,

  basicAuth: {
    username: process.env.ME_CONFIG_BASICAUTH_USERNAME || 'admin',
    password: process.env.ME_CONFIG_BASICAUTH_PASSWORD || 'pass',
  },

  options: {
    // Display startup text on console
    console: true,

    //documentsPerPage: how many documents you want to see at once in collection view
    documentsPerPage: 10,

    //editorTheme: Name of the theme you want to use for displaying documents
    //See http://codemirror.net/demo/theme.html for all examples
    editorTheme: process.env.ME_CONFIG_OPTIONS_EDITORTHEME || 'rubyblue',

    // Maximum size of a single property & single row
    // Reduces the risk of sending a huge amount of data when viewing collections
    maxPropSize: (100 * 1000),  // default 100KB
    maxRowSize: (1000 * 1000),  // default 1MB

    //The options below aren't being used yet

    //cmdType: the type of command line you want mongo express to run
    //values: eval, subprocess
    //  eval - uses db.eval. commands block, so only use this if you have to
    //  subprocess - spawns a mongo command line as a subprocess and pipes output to mongo express
    cmdType: 'eval',

    //subprocessTimeout: number of seconds of non-interaction before a subprocess is shut down
    subprocessTimeout: 300,

    //readOnly: if readOnly is true, components of writing are not visible.
    readOnly: false,

    //collapsibleJSON: if set to true, jsons will be displayed collapsible
    collapsibleJSON: true,

    //collapsibleJSONDefaultUnfold: if collapsibleJSON is set to `true`, this defines default level
    //  to which JSONs are displayed unfolded; use number or "all" to unfold all levels
    collapsibleJSONDefaultUnfold: 1,

    //gridFSEnabled: if gridFSEnabled is set to 'true', you will be able to manage uploaded files ( ak. grids, gridFS )
    gridFSEnabled: process.env.ME_CONFIG_SITE_GRIDFS_ENABLED || false,

    // logger: this object will be used to initialize router logger (morgan)
    logger: {},
  },

  // Specify the default keyname that should be picked from a document to display in collections list.
  // Keynames can be specified for every database and collection.
  // If no keyname is specified, it defaults to '_id', which is a mandatory field.
  // For Example :
  // defaultKeyNames{
  //   "world_db":{  //Database Name
  //     "continent":"cont_name", // collection:field
  //     "country":"country_name",
  //     "city":"name"
  //   }
  // }
  defaultKeyNames: {

  },
};
