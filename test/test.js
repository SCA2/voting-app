'use strict';

process.env.NODE_ENV = 'test';

const mongoose = require("mongoose");
const User = require('../app/models/user');

const chai = require('chai');
const chaiHttp = require('chai-http');
const passportStub = require('passport-stub');

const server = require('../server');
const expect = chai.expect;

chai.use(chaiHttp);
passportStub.install(server);

describe('User', () => {

  var user;

  beforeEach(() => {

    user = new User({
      github: {
        id: '1234',
        displayName: 'Joe Tester',
        username: 'username',
        publicRepos: 10
      },
      polls: {
        'poll 1': { 'Clinton':  100,  'Trump':    101 },
        'poll 2': { 'Batman':   2,    'Superman': 3   }
      }
    });

    user.save();
  });

  afterEach(() => {
    user.remove();
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

  describe('/api/:id/polls', () => {
    it('redirects to /login if user not logged in', (done) => {
      chai.request(server)
      .get('/api/' + user.github.id + '/polls')
      .redirects(0)
      .end((err, res) => {
        expect(res).to.redirect;
        expect(res.header.location).to.eql('/login');
        done();
      });
    });

    it('GETs all of the users polls', (done) => {
      passportStub.login(user);
      chai.request(server)
      .get('/api/' + user.github.id + '/polls')
      .end((err, res) => {
        expect(res.text).to.include('poll 1');
        expect(res.text).to.include('poll 2');
        done();
      });
    });
  });

  describe('/api/:id/polls/new', () => {
    it('redirects to /login if user not logged in', (done) => {
      chai.request(server)
      .get('/api/' + user.github.id + '/polls/new')
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
      .get('/api/' + user.github.id + '/polls/new')
      .end((err, res) => {
        expect(res.text).to.include('New Poll');
        done();
      })
    });

    it('POSTs a new poll', (done) => {
      passportStub.login(user);
      chai.request(server)
      .post('/api/' + user.github.id + '/polls/new')
      .send({poll_name: 'Ice Cream', option_1: 'Chocolate', option_2: 'Vanilla'})
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.text).to.include('Ice Cream');
        done();
      });
    });
  });

  describe('/api/:user_id/polls/:id', () => {
    it('redirects to /login if user not logged in', (done) => {
      chai.request(server)
      .get('/api/' + user.github.id + '/polls/' + 'poll 1')
      .redirects(0)
      .end((err, res) => {
        expect(res).to.redirect;
        expect(res.header.location).to.eql('/login');
        done();
      });
    });

    it('GETs :poll_id', (done) => {
      passportStub.login(user);
      chai.request(server)
      .get('/api/' + user.github.id + '/polls/' + 'poll 1')
      .end((err, res) => {
        expect(res.text).to.include('poll 1');
        expect(res.text).to.include('Clinton');
        expect(res.text).to.include('Trump');
        done();
      });
    });

    it('PUTs new option in :poll_id', (done) => {
      var option = { 'Wonder Woman': 0 };
      passportStub.login(user);
      chai.request(server)
      .put('/api/' + user.github.id + '/polls/' + 'poll 2')
      .send(option)
      .end((err, res) => {
        expect(Object.keys(res.body['poll 2'])).to.include('Wonder Woman');
        done();
      });
    });

    it('DELETEs :poll_id', (done) => {
      passportStub.login(user);
      chai.request(server)
      .delete('/api/' + user.github.id + '/polls/' + 'poll 1')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.eql({});
        done();
      });
    });
  });

  describe('/api/:user_id/polls/:poll_id/options/:option_id', () => {
    it('redirects to /login if user not logged in', (done) => {
      chai.request(server)
      .get('/api/' + user.github.id + '/polls/' + 'poll 2' + '/options/' + 'Batman')
      .redirects(0)
      .end((err, res) => {
        expect(res).to.redirect;
        expect(res.header.location).to.eql('/login');
        done();
      });
    });

    it('gets votes for :option_id in :poll_id', (done) => {
      passportStub.login(user);
      chai.request(server)
      .get('/api/' + user.github.id + '/polls/' + 'poll 2' + '/options/' + 'Batman')
      .end((err, res) => {
        expect(res.body).to.equal(2);
        done();
      });
    });

    it('increments votes for :option_id in :poll_id', (done) => {
      passportStub.login(user);
      chai.request(server)
      .put('/api/' + user.github.id + '/polls/' + 'poll 2' + '/options/' + 'Batman')
      .end((err, res) => {
        expect(res.body).to.equal(3);
        done();
      });
    });
  })
});