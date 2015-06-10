var express = require("express"),
	app = express(),
	Fitbit = require('fitbit'),
	config = require('./config/credentials'),
	session = require('express-session');

app.use(session({
  secret: 'nxj',
  resave: false,
  saveUninitialized: false
}));

app.use(function(req, res, next){
  req.foo = Math.random().toString();
  //console.log(req.session.oauth);
  next();
});

// OAuth flow
app.get('/', function (req, res) {
  // Create an API client and start authentication via OAuth
  var client = new Fitbit(config.CONSUMER_KEY, config.CONSUMER_SECRET);

  client.getRequestToken(function (err, token, tokenSecret) {
    if (err) {
      // Take action
      return;
    }

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
        if (err) {
          // Take action
          return;
        }

        oauthSettings.accessToken = token;
        oauthSettings.accessTokenSecret = secret;

        res.redirect('/login');
      }
  );
});

app.get('/login', function(req, res) {
	res.send('logged in');
});

app.get('/api/stats', function(req, res) {
	client = authenticate(req);
	// Fetch todays activities
	client.getActivities(function (err, activities) {
		res.json(activities);
	});
});

app.get('/api/sleep', function(req, res) {
	client = authenticate(req);
	// Fetch todays activities
	client.getSleep(function (err, sleep) {
		res.json(sleep);
	});
});

app.listen(process.env.PORT || 5000, function() {
	console.log("Listening on port "+ this.address().port);
});

var authenticate = function(req) {
	client = new Fitbit(
		      config.CONSUMER_KEY
		    , config.CONSUMER_SECRET
		    , { // Now set with access tokens
		          accessToken: req.session.oauth.accessToken
		        , accessTokenSecret: req.session.oauth.accessTokenSecret
		        , unitMeasure: 'en_GB'
		      }
		  );
	return client;
};