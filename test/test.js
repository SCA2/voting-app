'use strict';

process.env.NODE_ENV = 'test';

const mongoose = require("mongoose");
const User = require('../app/models/user');
const Poll = require('../app/models/poll');

const chai = require('chai');
const chaiHttp = require('chai-http');
const passportStub = require('passport-stub');

const server = require('../server');
const expect = chai.expect;

chai.use(chaiHttp);
passportStub.install(server);

describe('Poll', () => {

  var user, poll_1, poll_2;

  beforeEach(() => {

    user = new User({
      github: {
        id: '1234',
        displayName: 'Joe Tester',
        username: 'username',
        publicRepos: 10
      },
      polls: []
    });

    poll_1 = new Poll({
      poll: { 'President':    { 'Clinton':  100,  'Trump':    101 }},
      _author: user.github.id
    });

    poll_2 = new Poll({
      poll: { 'Superheroes':  { 'Batman':   2,    'Superman': 3   }},
      _author: null
    });

    poll_1.save(err => { if(err) console.log(err) });
    poll_2.save(err => { if(err) console.log(err) });
    user.polls.push(poll_1._id);
    user.save(err => { if(err) console.log(err) });
  });

  afterEach(() => {
    user.remove();
    poll_1.remove();
    poll_2.remove();
    passportStub.logout();
  });

  describe('/profile', () => {
    it('redirects to /login if user not logged in', (done) => {
      chai.request(server)
      .get('/profile')
      .redirects(0)
      .end((err, res) => {
        expect(res).to.redirect;
        expect(res.header.location).to.eql('/login');
        done();
      });
    });

    it('GETs a logged-in user profile', (done) => {
      passportStub.login( user );
      chai.request(server)
      .get('/profile')
      .end((err, res) => {
        expect(res.status).to.eql(200);
        expect(res.type).to.eql('text/html');
        done();
      });
    });
  });

  describe('/api/polls', () => {
    it('GETs all of the polls', (done) => {
      chai.request(server)
      .get('/api/polls')
      .end((err, res) => {
        expect(res.text).to.include('President');
        expect(res.text).to.include('Superheroes');
        done();
      });
    });

    it('redirects on POST if not logged in', (done) => {
      chai.request(server)
      .post('/api/polls')
      .redirects(0)
      .end((err, res) => {
        expect(res).to.redirect;
        expect(res.header.location).to.eql('/login');
        done();
      });
    });

    it('POSTs a new poll', (done) => {
      passportStub.login(user);
      chai.request(server)
      .post('/api/polls')
      .send({poll_name: 'Ice Cream', option_1: 'Chocolate', option_2: 'Vanilla'})
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.text).to.include('Ice Cream');
        done();
      });
    });
  });

  describe('/api/polls/new', () => {
    it('redirects to /login if user not logged in', (done) => {
      chai.request(server)
      .get('/api/polls/new')
      .redirects(0)
      .end((err, res) => {
        expect(res).to.redirect;
        expect(res.header.location).to.eql('/login');
        done();
      });
    });

    it('GETs new poll form', (done) => {
      passportStub.login(user);
      chai.request(server)
      .get('/api/polls/new')
      .end((err, res) => {
        expect(res.text).to.include('New Poll');
        done();
      })
    });
  });

  describe('/api/polls/:id', () => {
    it('GETs :poll_id', (done) => {
      passportStub.login(user);
      chai.request(server)
      .get('/api/polls/' + poll_1._id)
      .end((err, res) => {
        expect(res.text).to.include('President');
        expect(res.text).to.include('Clinton');
        expect(res.text).to.include('Trump');
        done();
      });
    });

    it('redirects on PUT if user not logged in', (done) => {
      chai.request(server)
      .put('/api/polls/' + 'President')
      .redirects(0)
      .end((err, res) => {
        expect(res).to.redirect;
        expect(res.header.location).to.eql('/login');
        done();
      });
    });

    it('PUTs update to :poll_id', (done) => {
      passportStub.login(user);
      chai.request(server)
      .put('/api/polls/' + poll_1._id)
      .send({poll: {'President': {'Sanders':0, 'Trump':0}}})
      .end((err, res) => {
        expect(res.text).to.include('President');
        expect(res.text).to.include('Sanders');
        expect(res.text).to.include('Trump');
        done();
      });
    });

    it('redirects on DELETE if user not logged in', (done) => {
      chai.request(server)
      .delete('/api/polls/' + 'President')
      .redirects(0)
      .end((err, res) => {
        expect(res).to.redirect;
        expect(res.header.location).to.eql('/login');
        done();
      });
    });

    it('DELETEs :poll_id', (done) => {
      passportStub.login(user);
      chai.request(server)
      .delete('/api/polls/' + poll_1._id)
      .end((err, res) => {
        expect(res.text).not.to.include('President');
        expect(res.text).to.include('Superheroes');
        done();
      });
    });
  });

  describe('/api/polls/:poll_id/options', () => {
    it('redirects on POST if user not logged in', (done) => {
      chai.request(server)
      .post('/api/polls/' + poll_2.id + '/options')
      .redirects(0)
      .end((err, res) => {
        expect(res).to.redirect;
        expect(res.header.location).to.eql('/login');
        done();
      });
    });

    it('POSTs new option to :poll_id', (done) => {
      var option = { new_option: 'Wonder Woman' };
      passportStub.login(user);
      chai.request(server)
      .post('/api/polls/' + poll_2._id + '/options')
      .send(option)
      .end((err, res) => {
        // console.log(res.text)
        expect(res.text).to.include('Wonder Woman');
        // expect(res.text).to.include('Batman');
        done();
      });
    });
  });

  describe('/api/:user_id/polls/:poll_id/options/:option_id', () => {
    it('gets votes for :option_id in :poll_id', (done) => {
      passportStub.login(user);
      chai.request(server)
      .get('/api/polls/' + poll_2._id + '/options/' + 'Batman')
      .end((err, res) => {
        expect(res.body).to.equal(2);
        done();
      });
    });

    it('increments votes for :option_id in :poll_id', (done) => {
      passportStub.login(user);
      chai.request(server)
      .put('/api/polls/' + poll_2._id + '/options/' + 'Batman')
      .end((err, res) => {
        expect(res.body).to.equal(3);
        done();
      });
    });

    it('redirects on DELETE if user not logged in', (done) => {
      chai.request(server)
      .delete('/api/polls/' + poll_2._id + '/options/' + 'Batman')
      .redirects(0)
      .end((err, res) => {
        expect(res).to.redirect;
        expect(res.header.location).to.eql('/login');
        done();
      });
    });

    it('DELETEs :option_id from :poll_id', (done) => {
      passportStub.login(user);
      chai.request(server)
      .delete('/api/polls/' + poll_2._id + '/options/' + 'Batman')
      .end((err, res) => {
        expect(res.text).to.include('Superheroes');
        expect(res.text).to.not.include('Batman');
        expect(res.text).to.include('Superman');
        done();
      });
    });
  });
});