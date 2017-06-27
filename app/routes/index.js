'use strict';

var path = process.cwd();
var PollHandler = require(path + '/app/controllers/pollHandler.server.js');

module.exports = function (app, passport) {

	function isLoggedIn (req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    } else {
      res.redirect('/login');
    }
  }

  var pollHandler = new PollHandler();

  app.route('/')
    .get(function (req, res) {
      res.redirect('/api/polls');
    });

  app.route('/login')
    .get(function (req, res) {
      res.redirect('/auth/github');
    });

  app.route('/logout')
    .get(function (req, res) {
      req.logout();
      res.redirect('/api/polls');
    });

  app.route('/profile')
    .get(isLoggedIn, function (req, res) {
      res.render(path + '/app/views/users/profile.pug');
    });

  app.route('/auth/github/callback')
    .get(passport.authenticate('github', {
      successRedirect: '/',
      failureRedirect: '/login'
    }));

  app.route('/auth/github')
    .get(passport.authenticate('github'));

  app.route('/api/polls')
    .get(pollHandler.getPolls)
    .post(isLoggedIn, pollHandler.createPoll);

  app.route('/api/polls/new')
    .get(isLoggedIn, pollHandler.newPoll);

  app.route('/api/polls/:poll_id')
    .get(pollHandler.getPoll)
    .put(isLoggedIn, pollHandler.updatePoll)
    .delete(isLoggedIn, pollHandler.deletePoll);

  app.route('/api/polls/:poll_id/options')
    .post(isLoggedIn, pollHandler.createOption);

  app.route('/api/polls/:poll_id/options/:option_id')
    .get(pollHandler.getVote)
    .put(pollHandler.addVote)
    .delete(isLoggedIn, pollHandler.deleteOption);

  app.route('/api/:id')
    .get(isLoggedIn, function (req, res) {
      res.json(req.user.github);
    });
};
