'use strict';

var User = require('../models/user.js')

function PollHandler () {

	this.getPolls = function (req, res) {
		User
			.findOne({ 'github.id': req.user.github.id }, { '_id': false })
			.exec(function (err, result) {
				if (err) { throw err; }
        // console.log(result.polls);
        res.render('../views/polls/index.pug', { user_id: req.user.github.id, polls: result.polls });
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
    User
      .findOne({ 'github.id': req.user.github.id}, { '_id': false })
      .exec((err, result) => {
        if(err) throw err;
        let poll = result.polls[req.params.poll_id];
        poll = {[req.params.poll_id]: poll };
        res.render('../views/polls/show.pug', { poll: poll });
      });
  };

  this.createPoll = function (req, res) {
    let polls = req.user.polls || {}
    let form = `{"${req.body.poll_name}":{"${req.body.option_1}":0,"${req.body.option_2}":0}}`
    let poll = JSON.parse(form);
    Object.assign(polls, poll);
    User
      .findOneAndUpdate({ 'github.id': req.user.github.id }, { $set: { 'polls': polls }}, { new: true })
      .exec(function (err, result) {
          if (err) { throw err; }
          res.redirect('/api/' + req.user.github.id + '/polls');
        }
      );
  };

  this.updatePoll = (req, res) => {
    let polls = req.user.polls;
    let poll = polls[req.params.poll_id];
    Object.assign(poll, req.body);
    User
      .findOneAndUpdate({ 'github.id': req.user.github.id }, { $set: { 'polls': polls }}, { new: true })
      .exec((err, result) => {
        if(err) throw err;
        res.json(result.polls);
      })
  };

	this.deletePoll = function (req, res) {
		User
			.findOneAndUpdate({ 'github.id': req.user.github.id }, { $set: { 'polls': {} }}, { new: true })
			.exec(function (err, result) {
					if (err) { throw err; }
					res.json(result.polls);
				}
			);
	};

  this.getVote = (req, res) => {
    User
      .findOne({ 'github.id': req.user.github.id }, { '_id': false })
      .exec((err, result) => {
        if(err) throw err;
        let vote = result.polls[req.params.poll_id][req.params.option_id];
        res.json(vote);
      })
  };

  this.addVote = (req, res) => {
    let polls = req.user.polls;
    let poll = polls[req.params.poll_id];
    let option = req.params.option_id;
    poll[option] += 1;
    User
      .findOneAndUpdate({ 'github.id': req.user.github.id }, { $set: { 'polls': polls }}, { new: true })
      .exec((err, result) => {
        if(err) throw err;
        let vote = result.polls[req.params.poll_id][req.params.option_id];
        res.json(vote);
      })
  }
}

module.exports = PollHandler;
