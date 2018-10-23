require('dotenv').config();

process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../index');

chai.should();

chai.use(chaiHttp);

let userId;
let verificationCode;


describe('Authentication TEST SUITE', () => {
  describe('Signup Test Suite', () => {
    it('should return status 200', (done) => {
      const body = {
        title: 'Mr/Mrs',
        firstName: 'Johnson',
        surName: 'Ogwuru',
        email: 'ogwurujohnson@gmail.com',
        password: 'johnsons_password',
        role: 'admin',
      };
      chai.request(app)
        .post('/api/v1/auth/signup')
        .send(body)
        .end((err, res) => {
          if (err) done(err);
          res.should.have.status(200);
          res.body.should.have.property('user');
          res.body.should.have.property('token');
          done();
        });
    });
    it('should return an object body with status 200', (done) => {
      const body = {
        title: 'Mr/Mrs',
        firstName: 'Johnson',
        surName: 'Ogwuru',
        email: 'ogwurujohnson3@gmail.com',
        password: 'johnsons_password',
        role: 'admin',
      };
      chai.request(app)
        .post('/api/v1/auth/signup')
        .send(body)
        .end((err, res) => {
          if (err) done(err);
          res.body.should.be.a('object');
          done();
        });
    });
  });


  describe('Login Test Suite', () => {
    it('should have status 200 and be an object with property token', (done) => {
      const body = {
        email: 'ogwurujohnson@gmail.com',
        password: 'johnsons_password',
      };
      chai.request(app)
        .post('/api/v1/auth/login')
        .send(body)
        .end((err, res) => {
          if (err) done(err);
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('user');
          res.body.user.be.a('array');
          res.body.user.should.have.property('token');
          res.body.user.should.have.property('userId');
          res.body.user.should.have.property('firstname');
          done();
        });
    });
  });
});


describe('Verification and Forgot Password TEST SUITE', () => {
  describe('Verification Test Suite', () => {
    before((done) => {
      const body = {
        title: 'Mr/Mrs',
        firstName: 'Johnson',
        surName: 'Ogwuru',
        email: 'ogwurujohnson1@gmail.com',
        password: 'johnsons_password',
        role: 'admin',
      };
      chai.request(app)
        .post('/api/v1/auth/signup')
        .send(body)
        .end((err, res) => {
          if (err) done(err);
          userId = res.body.user.id;
          verificationCode = res.body.user.activationcode;
          done();
        });
    });

    it('should return status code 201', (done) => {
      const body = {
        userId,
      };
      chai.request(app)
        .put(`/api/v1/verify/${verificationCode}`)
        .send(body)
        .end((err, res) => {
          if (err) done(err);
          res.should.have.status(200);
          done();
        });
    });
  });
});