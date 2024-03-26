const request = require('supertest');
const { app, db } = require('./app')
const http = require('http');
const session = require('supertest-session');

let apptest

beforeAll(async () => {
  apptest = request(http.createServer(app));

})
// const { fireEvent, getByText } = require('@testing-library/dom')
// const { JSDOM } = require('jsdom')

// //const fs = require('fs')
// const path = require('path')
// const sth = require('@testing-library/jest-dom');
// const ejs = require('ejs')


//  const { getMockReq, getMockRes } = require('@jest-mock/express')





describe('UC1: register', function () {
  it('return 302', function (done) {
    apptest
      .post("/register")
      .send({ username: 'chee13', password: 'chee13', email: 'chee13@chee.com' })
      .expect(302, done);

  });
  it('redirect to /campgrounds', function (done) {
    apptest
      .post("/register")
      .send({ username: 'chee14', password: 'chee14', email: 'chee14@chee.com' })

      .expect('Location', '/campgrounds', done);
  });
});


describe('UC2: login', function () {
  it('log in chee2', function (done) {
    apptest
      .post("/login")
      .send({ username: 'chee2', password: 'chee2' })
      .expect(200, done);
  });

});


beforeEach(function () {
  testSession = session(app);
});

describe('UC3: grant access of host page to host user', () => {
  let authenticatedSession;

  beforeEach(function (done) {
    testSession.post('/login').type('form')
      .send({ username: 'chee2', password: 'chee2' })
      .expect(200)
      .end(function (err) {
        if (err) return done(err);
        authenticatedSession = testSession;
        return done();
      });
  });

  it('should be able to access hostpage', function (done) {
    authenticatedSession.get('/host')
      .expect(200) // <------ still get a 302 (redirect if user !logged
      .end(done)

  });

});

describe('UC3: Non-host user denied access to hostpage', () => {
  beforeEach(function (done) {
    testSession.post('/login').type('form')
      .send({ username: 'chee13', password: 'chee13' })
      .expect(200)
      .end(function (err) {
        if (err) return done(err);
        authenticatedSession = testSession;
        return done();
      });
  });

  it('should be denied access to hostpage', function (done) {
    authenticatedSession.get('/host')
      .expect(302)
      .end(done);
  });

});

describe('UC4: access user page as a user', () => {
  beforeEach(function (done) {
    testSession.post('/login').type('form')
      .send({ username: 'chee3', password: 'chee3' })
      .expect(200)
      .end(function (err) {
        if (err) return done(err);
        authenticatedSession = testSession;
        return done();
      });
  });

  it('should be able to access user page', function (done) {
    authenticatedSession.get('/user')
      .expect(200)
      .end(done);
  });

});

describe('UC4: denied access of user page as a non-registered user', () => {
  beforeEach(function (done) {
    testSession.post('/login').type('form')
      .send({ username: 'chee15', password: 'chee15' })
      .expect(302)
      .end(function (err) {
        if (err) return done(err);
        authenticatedSession = testSession;
        return done();
      });
  });

  it('should not be able to access user page', function (done) {
    authenticatedSession.get('/user')
      .expect(302)
      .end(done);
  });

});

// const targetFile = path.resolve(__dirname, "./views/campgrounds/index.ejs")
// describe('index.ejs', () => {
//   test('button click', () => {
//     ejs.renderFile(targetFile, function (err, str) {
//       if (err) {
//         console.log(err)
//       }
//       if (str) {
//         let dom
//         let container
//         beforeEach(() => {
//           dom = new JSDOM(str, { runScripts: 'dangerously' })
//           container = dom.window.document.body
//         })
//         it('button is clicked', async () => {
//           const button = getByText(container, 'View chee camp')//.closest('a').toHaveAttribute
//           await fireEvent.click(button)

//           expect(global.window.location.href).toContain('/campgrounds/652e45985fe060f49564806e');

//         })
//       }
//     })
//   })
// })

// const Campground = require('./models/campground')
// jest.mock('./models/campground')
// jest.mock('/campgrounds/652e45985fe060f49564806e')
// const campgroundController = require('./controllers/campgrounds');
// const middleware=require('./middleware')

// describe('delete a campground', () => {

//   test('delete campground', async () => {


//     let req = getMockReq({
//       params:{id:'652e45985fe060f49564806e'}
//     })
//     let {res,next} = getMockRes(

//     )
//     await middleware.paginateReviews(req, res,next);
//   })
// })



afterAll(() => db.close())
