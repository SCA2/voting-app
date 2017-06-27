'use strict';

var User = require('../models/user');
var Poll = require('../models/poll');

function PollHandler () {

  this.getPolls = function (req, res) {
    Poll
      .find({})
      .exec(function (err, polls) {
        if (err) { throw err; }
        let user_id = req.user ? req.user.github.id : 'guest';
        res.render('../views/polls/index.pug', { polls: polls, user_id: user_id });
      });
  };

  this.newPoll = function (req, res) {
    User
      .findOne({ 'github.id': req.user.github.id}, { '_id': false })
      .exec((err, result) => {
        if(err) throw err;
        let poll = { 'Poll Title': {'Option 1': 0, 'Option 2': 0}};
        res.render('../views/polls/new.pug', { poll: poll });
      });
  };

  this.getPoll = function (req, res) {
    Poll.findById(req.params.poll_id, (err, poll) => {
      if(err) throw err;
      User.findOne({ 'github.id': poll.author }, (err, user) => {
        if(err) throw err;
        let name = user ? user.github.displayName : 'Guest';
        let editable = req.isAuthenticated() && req.user && (req.user.github.id == poll.author);
        res.render('../views/polls/show.pug', { poll: poll, authorName: name, editable: editable, path: req.path });
      })
    });
  };

  this.createPoll = function (req, res) {
    let polls = req.user.polls || []
    let form = `{"${req.body.poll_name}":{"${req.body.option_1}":0,"${req.body.option_2}":0}}`
    let poll = new Poll({poll: JSON.parse(form), author: req.user.github.id});
    polls.push(poll._id);
    User
      .findOneAndUpdate({ 'github.id': req.user.github.id }, { $set: { 'polls': polls }}, { new: true })
      .exec(function (err, result) {
          if (err) { throw err; }
          poll.save(err => { if(err) throw err });
          res.redirect('/api/polls');
        }
      );
  };

  this.updatePoll = (req, res) => {
    let polls = req.user.polls || [];
    let poll = req.body.poll;
    User
      .findOne({ 'github.id': req.user.github.id })
      .exec((err, user) => {
        if(err) throw err;
        Poll
          .findOneAndUpdate({ '_id': req.params.poll_id}, { $set: { 'poll': poll }}, { new: true })
          .exec((err, poll) => {
            if(err) throw err;
            res.json(poll);
          })
      })
  };

  this.deletePoll = function (req, res) {
    User
      .findOne({ 'github.id': req.user.github.id })
      .exec(function (err, user) {
        if (err) { throw err; }
        Poll
          .findById(req.params.poll_id)  
          .exec((err, poll) => {
            if (err) { throw err; }
            user.polls.splice(user.polls.indexOf(req.params.poll_id), 1);
            poll.remove();
            user.save();
            res.redirect('/api/polls');
          })
        }
      );
  };

  this.createOption = (req, res) => {
    Poll
      .findById(req.params.poll_id)
      .exec((err, result) => {
        if(err) throw err;
        let innerPoll = result.poll;
        let title = Object.keys(innerPoll)[0];
        let ballot = innerPoll[title];
        ballot[req.body.new_option] = 0;
        result.markModified('poll');
        result.save();
        res.redirect('/api/polls/' + req.params.poll_id);
      })
  };

  this.deleteOption = (req, res) => {
    Poll
      .findById(req.params.poll_id)
      .exec((err, result) => {
        if(err) throw err;
        let innerPoll = result.poll;
        let title = Object.keys(innerPoll)[0];
        let ballot = innerPoll[title];
        delete ballot[req.params.option_id];
        result.markModified('poll');
        result.save();
        res.redirect('/api/polls/' + req.params.poll_id);
      })
  };

  this.getVote = (req, res) => {
    Poll
      .findOne({'_id': req.params.poll_id})
      .exec((err, result) => {
        if(err) throw err;
        let innerPoll = result.poll;
        let title = Object.keys(innerPoll)[0];
        let ballot = innerPoll[title];
        let votes = ballot[req.params.option_id];
        res.json(votes);
      })
  };

  this.addVote = (req, res) => {
    Poll
      .findById(req.params.poll_id, (err, result) => {
        if(err) throw err;
        let innerPoll = result.poll;
        let title = Object.keys(innerPoll)[0]
        let ballot = innerPoll[title];
        let votes = ballot[req.params.option_id] + 1;
        ballot[req.params.option_id] = votes;
        result.markModified('poll');
        result.save(err => {
          if(err) throw err;
          res.json(votes);
        });
      })
  }
}

module.exports = PollHandler;
