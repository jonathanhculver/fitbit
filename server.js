var express = require("express"),
	app = express(),
	Fitbit = require('fitbit'),
	config = require('./config/credentials'),
	session = require('express-session'),
	jade = require('jade');

app.use(session({
  secret: 'nxj',
  resave: false,
  saveUninitialized: false
}));

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

var isAuthenticated = function(req, res, next) {
    if(req.session.oauth != undefined) {
        return next();
    }
    res.redirect('/login/fail');
};

// OAuth flow
app.get('/', function (req, res) {
  // Create an API client and start authentication via OAuth
  var client = new Fitbit(config.CONSUMER_KEY, config.CONSUMER_SECRET);

  client.getRequestToken(function (err, token, tokenSecret) {

    req.session.oauth = {
        requestToken: token
      , requestTokenSecret: tokenSecret
    };
    res.redirect(client.authorizeUrl(token));
  });
});

// On return from the authorization
app.get('/oauth_callback', function (req, res) {
  var verifier = req.query.oauth_verifier
    , oauthSettings = req.session.oauth
    , client = new Fitbit(config.CONSUMER_KEY, config.CONSUMER_SECRET);

  // Request an access token
  client.getAccessToken(
      oauthSettings.requestToken
    , oauthSettings.requestTokenSecret
    , verifier
    , function (err, token, secret) {

        oauthSettings.accessToken = token;
        oauthSettings.accessTokenSecret = secret;

        res.redirect('/login');
      }
  );
});

app.get('/login', isAuthenticated, function(req, res) {
	res.send('logged in');
});

app.get('/login/fail', function(req, res) {
	res.render('login');
});

app.get('/api/stats', isAuthenticated, function(req, res) {
	var client = authenticate(req.session.oauth.accessToken, req.session.oauth.accessTokenSecret);
	// Fetch todays activities
	client.getActivities(function (err, activities) {
		res.json(activities);
	});
});

app.get('/api/sleep', isAuthenticated, function(req, res) {
	var client = authenticate(req.session.oauth.accessToken, req.session.oauth.accessTokenSecret);
	client.getSleep(function (err, sleep) {
		res.json(sleep);
	});
});

app.listen(process.env.PORT || 5000, function() {
	console.log("Listening on port "+ this.address().port);
});

var authenticate = function(accessToken, accessTokenSecret) {
	client = new Fitbit(
		      config.CONSUMER_KEY
		    , config.CONSUMER_SECRET
		    , { // Now set with access tokens
		          accessToken: accessToken
		        , accessTokenSecret: accessTokenSecret
		        , unitMeasure: 'en_GB'
		      }
		  );
	return client;
};