//new message form
var keystone = require('keystone');
var Post = keystone.list('Content');
var Medium = keystone.list('Medium');

var nodemailer = require('nodemailer');
var mg = require('nodemailer-mailgun-transport');

function isValidGenre(medium_id, genre_ids, resolve_if_empty) {

  if (resolve_if_empty && (!medium_id || !genre_ids)) {
    return new Promise((resolve, reject) => resolve());
  }

  return new Promise((resolve, reject) => {
    var options = {
      _id: medium_id,
      genre: { $in: genre_ids }
    };
    Medium.model.findOne(options).exec().then(result => {
      result !== null ? resolve() : reject();
    }).catch(err => reject());
  })
}

exports = module.exports = function (req, res, next) {
  var action = req.params.action || 'add';
  let cid = req.params.content || false;
  if (action && ['add', 'edit', 'delete', 'remove-photo'].indexOf(action) == -1) {
    return next(); // invalid verb, maybe just a medium's dashboard or item
  }
  if (cid && ['edit', 'delete', 'remove-photo'].indexOf(action) == -1) {
    return next();
  }

  let locals = res.locals;

  if (!locals.medium) {
    req.flash('warn', 'First select a Art medium');
    return res.redirect('/');
  }

  var view = new keystone.View(req, res),
    Content = keystone.list('Content');
  Medium = keystone.list('Medium');

  view.on('init', function (clb) {
    let desc = req.body['content'];
    if (desc) {
      req.body.content = { 'extended': desc };
    }
    clb();
  });

  if (cid) {
    // get item to update or just prepopulate form
    let contentQuery = {
      $or: [
        { slug: cid },
        { _id: cid }
      ]
    };
    view.on('init', function (next) {
      var q = keystone.list('Content').model.findOne(contentQuery).populate('author medium');
      //dont populate genres. we need to be able to check if genre._id in item.genre for the form

      q.exec(function (err, result) {
        if (!result) {
          req.flash('error', 'This item has been deleted');
        } else if (result.state != 'published' && (!req.user || !result.author._id.equals(req.user._id))) {
          req.flash('warn', 'This item is not published');
        } else {
          result.isMine = result.author._id.equals(req.user._id);
          locals.item = result;
          if (!locals.item.isMine) {
            req.flash('error', "That was not yours to " + action + ". Add yours below");
            return res.redirect('/' + locals.medium.slug + '/add');
          }
        }
        next(err);
      });

    });
  }

  if (action === 'add') {
    view.on('post', function (next) {
      var newContent = new Content.model({ author: req.user, medium: locals.medium._id });

      console.log('POSTING NEW CONTENT', req.body);
      if (typeof req.body.genre == 'undefined') {
        console.log('Genre not set');
        req.flash('error', 'Genre is required');
        return next();
      }

      if (!Array.isArray(req.body.genre)) {
        req.body.genre = [req.body.genre];
      }

      if (req.body.genre.length == 0) {
        req.flash('error', "You must select at least 1 genre");
        return next();
      }

      isValidGenre(locals.medium._id, req.body.genre).then(() => {

        newContent.getUpdateHandler(req, res).process(req.body, {
          fields: 'state, title, genre, image, media, content.extended',
          flashErrors: true,
          logErrors: true
        }, function (err, item) {
          if (err) {
            console.log(err);
            req.flash('error', err);
          } else {
            req.flash('success', { detail: 'Your ' + locals.medium.name + ' was saved.' });
            // return res.redirect('/' + locals.medium.slug + '/' + newContent._id);

            if (req.body.notify_followers) {
              var filterCriteria = { _id: { $in: req.user.followers } };
              keystone.list('User').model.find(filterCriteria).exec(function (err, followers) {
                if (err) {
                  console.log(err);
                } else {
                  var followersEmailList = followers.map(follower => follower.email);
                  var link = req.protocol + '://' + req.hostname + '/' + locals.medium.slug + '/' + newContent._id;

                  var nodemailerMailgun = nodemailer.createTransport(mg({
                    service: 'Mailgun',
                    auth: { api_key: process.env.MAILGUN_API_KEY, domain: process.env.MAILGUN_DOMAIN }
                  }));

                  followers.forEach((follower, index) => {
                    (function (followerUser) {
                      var emailBody = {
                        from: { address: 'postmaster@amppstar.com', name: 'AMPP Star' },
                        to: followerUser.email, //followersEmailList
                        subject: `AMPP - ${req.body.title} by ${req.user.name.first}`,
                        locals: {
                          link,
                          user: req.user,
                        },
                        link: link,
                        html: `<h4>Hello, ${followerUser.name.first}</h4>
                          <p>
                            ${req.user.name.first} has recently added a new ${locals.medium.name} post. <b>'${req.body.title}'</b>.
                            Please take a look. <b><a href="${link}" target="_blank">Click Here</a></b>
                          </p>
                          <p>If you cannot view this link copy-and-paste this URL into your browser: ${link}</p>
                          <p style="vertical-align:middle">
                            <img height="30" src="https://www.amppstar.com/images/logo.png" alt="Instagram"> &copy; AMPP Star 2019 - <a href="https://www.amppstar.com/about/termsandconditions">Terms &amp; Conditions</a>
                          </p>
                          <p style="background:#0a1622; padding:7px;">
                            <a style="margin-right:4px;" href="https://www.instagram.com/ampp_star/" target="_blank"><img src="https://www.amppstar.com/images/iconIG.png" alt="Instagram"></a>
                            <a href="https://www.facebook.com/amppstar/" target="_blank"><img src="https://www.amppstar.com/images/iconFB.png" alt="Facebook"></a>
                          </p>`,
                      }

                      nodemailerMailgun.sendMail(emailBody, function (err, info) {
                        if (err) {
                          console.log('Error: ' + err);
                        } else {
                          console.log('Response: ' + JSON.stringify(info));
                        }
                      });
                    })(follower);
                  });
                }
              });
            }
          }
          next(err);
        });

      })
        .catch((err) => {
          console.log('Invalid genre selected');
          req.flash('error', "Invalid genre selected");
          return next()
        });
    });
  } else if (action === 'remove-photo') {
    view.on('init', function (next) {
      if (!locals.item || !locals.item.isMine) {
        req.flash('error', "This is not yours to " + action);
        return next();
      }

      locals.item.image = null;
      locals.item.save(function (err, result) {
        if (err) next(err);
        else {
          req.flash('success', { detail: 'Your photo was removed' });
          return res.redirect('/' + locals.medium.slug + '/edit/' + locals.item._id);
        }
      });

    });
  } else if (action === 'edit') {

    view.on('post', function (next) {
      if (!locals.item || !locals.item.isMine) {
        req.flash('error', "This is not yours to " + action);
        return next()
      }

      req.body.genre = req.body.genre || [];
      var ignore_missing_genre = true;//for this update, we ignore if genre is missing since it wont affect model.

      if (!Array.isArray(req.body.genre)) {
        req.body.genre = [req.body.genre];
      }

      if (req.body.genre.length == 0) {
        req.flash('error', "You must select at least 1 genre");
        return next();
      }

      isValidGenre(locals.medium._id, req.body.genre, ignore_missing_genre).then(() => {

        locals.item.getUpdateHandler(req, res).process(req.body, {
          fields: 'state, title, genre, image, media, content.extended',
          flashErrors: true,
          logErrors: true
        }, function (err) {
          if (err) {
            console.log(err);
            req.flash('error', err);
          } else {
            req.flash('success', { detail: 'Your ' + locals.medium.name + ' was saved.' });
            // return res.redirect('/' + locals.medium.slug + '/' + locals.item._id);
            if (req.body.notify_followers) {
              var filterCriteria = { _id: { $in: req.user.followers } };
              keystone.list('User').model.find(filterCriteria).exec(function (err, followers) {
                if (err) {
                  console.log(err);
                } else {
                  var followersEmailList = followers.map(follower => follower.email);
                  var link = req.protocol + '://' + req.hostname + '/' + locals.medium.slug + '/' + locals.item._id;

                  var nodemailerMailgun = nodemailer.createTransport(mg({
                    service: 'Mailgun',
                    auth: { api_key: process.env.MAILGUN_API_KEY, domain: process.env.MAILGUN_DOMAIN }
                  }));

                  followers.forEach((follower, index) => {
                    (function (followerUser) {
                      var emailBody = {
                        from: { address: 'postmaster@amppstar.com', name: 'AMPP Star' },
                        to: followerUser.email, //followersEmailList
                        subject: `AMPP - ${req.body.title} by ${req.user.name.first}`,
                        locals: {
                          link,
                          user: req.user,
                        },
                        link: link,
                        html: `<h4>Hello, ${followerUser.name.first}</h4>
                          <p>
                            ${req.user.name.first} has recently updated a ${locals.medium.name} post. <b>'${req.body.title}'</b>.
                            Please take a look. <b><a href="${link}" target="_blank">Click Here</a></b>
                          </p>
                          <p>If you cannot view this link copy-and-paste this URL into your browser: ${link}</p>
                          <p style="vertical-align:middle">
                            <img height="30" src="https://www.amppstar.com/images/logo.png" alt="Instagram"> &copy; AMPP Star 2019 <a href="https://www.amppstar.com/about/termsandconditions">Terms &amp; Conditions</a>
                          </p>
                          <p style="background:#0a1622; padding:7px;">
                            <a style="margin-right:4px;" href="https://www.instagram.com/ampp_star/" target="_blank"><img src="https://www.amppstar.com/images/iconIG.png" alt="Instagram"></a>
                            <a href="https://www.facebook.com/amppstar/" target="_blank"><img src="https://www.amppstar.com/images/iconFB.png" alt="Facebook"></a>
                          </p>`,
                      }

                      nodemailerMailgun.sendMail(emailBody, function (err, info) {
                        if (err) {
                          console.log('Error: ' + err);
                        } else {
                          console.log('Response: ' + JSON.stringify(info));
                        }
                      });
                    })(follower);
                  });
                }
              });
            }
          }
          next(err);
        });

      })
        .catch((err) => {
          req.flash('error', 'Invalid genre selected');
          next(err)
        });

    });
  } else if (action === 'delete') {

    view.on('get', function (next) {
      if (!locals.item || !locals.item.isMine) {
        req.flash('error', "This is not yours to " + action);
        return next()
      }

      locals.item.remove(function (err) {
        req.flash('info', "Delete successful");
        return next()
      });

    });
  }
  view.render('forms/content');
};
