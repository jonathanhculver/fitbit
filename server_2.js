var express = require('express'),
	passport = require('passport'),
	FitbitStrategy = require('passport-fitbit').Strategy,
	config = require('./config/credentials'),
	app = express(),
	session = require('express-session');

passport.use(new FitbitStrategy({
    consumerKey: config.CONSUMER_KEY,
    consumerSecret: config.CONSUMER_SECRET,
    callbackURL: "http://localhost:5000/auth/fitbit/callback"
  },
  function(token, tokenSecret, profile, done) {
      return done(null, profile);
  }
));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

app.use(passport.initialize());
app.use(passport.session());
app.use(session({
  secret: 'nxj',
  resave: false,
  saveUninitialized: false
}));

app.get('/auth/fitbit', passport.authenticate('fitbit'), function(req, res){
    // The request will be redirected to Fitbit for authentication, so this
    // function will not be called.
});

app.get('/auth/fitbit/callback', passport.authenticate('fitbit', { failureRedirect: '/login' }), function(req, res) {
	res.redirect('/');
});

app.get('/', function(req, res){
	res.json(req.user);
});

app.listen(process.env.PORT || 5000, function() {
	console.log("Listening on port "+ this.address().port);
});



