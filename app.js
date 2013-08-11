var express = require('express')
    , util = require('util')
    , path = require('path')
    , passport = require('passport')
    , FitbitStrategy = require('passport-fitbit').Strategy;
var FITBIT_CONSUMER_KEY = '';
var FITBIT_CONSUMER_SECRET = '';
var Country = require('./public/country.json').countries;
var baseURI = 'http://api.fitbit.com/1';

var querystring = require('querystring');
var Serializer = require('serializer');
var baseURI = 'http://api.fitbit.com/1';
var serializer = Serializer.createSecureSerializer(FITBIT_CONSUMER_KEY, FITBIT_CONSUMER_SECRET);

// ------------- redis

var redis = require("redis"),
    client = redis.createClient();

// ------------- passport

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

var fitbit = new FitbitStrategy({
        consumerKey: FITBIT_CONSUMER_KEY,
        consumerSecret: FITBIT_CONSUMER_SECRET,
        callbackURL: "http://journey.yzgw.info/auth/fitbit/callback"
    },
    function(token, tokenSecret, profile, done) {
        profile.fitbit_token = token;
        profile.fitbit_token_secret = tokenSecret;
            
        process.nextTick(function () {            
            return done(null, profile);
    });
});

passport.use(fitbit);

// ------------- express

var app = express();

app.configure(function(){
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.use(express.logger());
    app.use(express.cookieParser());
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.session({ secret: 'keyboard 234a4s37hog8ehog1ehgea098dfsczwe04' }));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(express.errorHandler());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(function(req, res) {
        res.send('404: Page not Found', 404);
    });
    app.use(function(error, req, res, next) {
        res.send('500: Internal Server Error', 500);
    });
});

// app.get('/steps', function(req, res){
//     console.log(fitbit._oauth);
//     console.log(req.user.fitbit_token + " - " + req.user.fitbit_token_secret)
// 
//     apiCall('GET', '/user/-/activities/date/2013-06-12.json',
//         {token: {oauth_token_secret: req.user.fitbit_token_secret, oauth_token: req.user.fitbit_token}},
//         function(err, resp, json) {
//           if (err) return res.send(err, 500);
//           res.json(json);
//       });
// 
// })

app.get('/', function(req, res){
    // console.log(req.user)
    
    if(req.user){
        var today = new Date();
        apiCall('GET', '/user/-/activities/date/' + getFormattedDate(today) +'.json',
            {token: {oauth_token_secret: req.user.fitbit_token_secret, oauth_token: req.user.fitbit_token}},
            function(err, resp, json) {
                if (err) return res.send(err, 500);
                var key = req.user.id;
                var steps = json.summary.steps;
                console.log(json.summary.steps);
                client.lrange(key, 0, -1, function(err, reply) {
                    var countries = getVisitedCountry(reply, steps/2);
                    console.log(key + " : " + reply + " ^ " + err);
                    // console.log(countries.visited);
                    // console.log(countries.unvisited);
                    res.render('index', { 
                        layout: true, user: req.user, 
                        countries : countries, steps:steps, mile : steps
                    });          
                });
            }
        );
    }else{
        res.render('index', { layout: true, user: req.user });        
    }
});

app.get('/country/:country_code', function(req, res){
    // redis [user.id:country_code : true]    
	try{
    	var key = req.user.id;
	}catch(e){
        res.redirect('/');
        return;
	}

    client.lrange(key, 0, -1, function(err, visitedList){
        var _country_code = req.params.country_code;
        var country_data = getCountry(_country_code);
        if(getCountry == null){
	        res.redirect('/');
	        return;	        
        }
        
        var timekey = key + ":last_visited";
        
        if(isContain(visitedList, _country_code)){
            res.render('country', { layout: true, user: req.user, country: country_data });
        }else{
            client.get(timekey, function(err, timestamp){
                var now = new Date().getTime();
                if(timestamp === null || isDifferentDay(parseInt(timestamp), now) ){
                    console.log("first access or different day access");
                    client.set(timekey, now, function(err, ts){
                        console.log(" => normal render")
                        client.rpush(key, _country_code, function(err, res){
                            console.log(key + " : " + res);
                        });
                            
                        res.render('country', { layout: true, user: req.user, country: country_data });
                    });
                }else{
                    console.log("you can use mile onc time per day");
                    res.redirect('/');
                }
            });
        }        
    })
});

function getCountry(name){
    for(var i = 0; i < Country.length; i++){
        if(Country[i].jp_name == name)
            return Country[i];
    }
    return null;
}

function isContain(list, item){
    for(var i = 0; i < list.length; i++){
        if(list[i] == item)
            return true;
    }
    return false;
}

function isDifferentDay(ts1, ts2){
    var d1 = new Date( ts1 * 1000 );
    var d2 = new Date( ts2 * 1000 );
    var diff= Math.abs(Math.floor( (ts1 - ts2)/(1000*60*60*24) ));
    console.log(d1 + "->" + d2)
    if(d1.getDate() == d2.getDate() && d1.getMonth() == d2.getMonth() && d1.getFullYear() == d2.getFullYear())
        return false;
    return true;
}

app.get('/auth/fitbit',
    passport.authenticate('fitbit'), function(){        
});

app.get('/auth/fitbit/callback', 
    passport.authenticate('fitbit', { failureRedirect: '/login' }),
    function(req, res) {
        res.redirect('/');
    }
);

app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
});

app.get('/resetDBgabage', function(req, res){
     var key = req.user.id;
     var timekey = key + ":last_visited";
     client.del(key, timekey, function(){
         console.log("reseted");
     });
});

// ------------- util

function getVisitedCountry(visited, threshold){
    // console.log("visited " + visited[0] + " (len:" + visited.length + ")");

    var visitedList = new Array();
    var unVisitedList = new Array();
    var invisibleList = new Array();
        
    for(var i = 0; i < Country.length; i++){
        // console.log(Country[i].three_digit_id + " vs. " + visited[j]);
        var pushed = false;
        for(var j = 0; j < visited.length; j++){
            if(Country[i].jp_name == visited[j]){
                visitedList.push(Country[i]);
                pushed = true;
                // console.log("visited " + Country[i].jp_name);
            }
        }
        
        if(!pushed){
            if(Country[i].mile < threshold)
                unVisitedList.push(Country[i]);
            else
                invisibleList.push(Country[i]);
        }
    }

    // console.log("search end");
    return { 'visited' : visitedList, 'unvisited' : unVisitedList, 'invisible' : invisibleList};
}

function getFormattedDate(now){
    var y = now.getFullYear(), m = now.getMonth() + 1, d = now.getDate(), w = now.getDay();

    if (m < 10) m = '0' + m;
    if (d < 10) d = '0' + d;

    return y + '-' + m + '-' + d;
}

// ------------- fitbit API

function requestCallback(callback) {
  return function (err, data, response) {
    if (err) return callback(err, data);
    var exception = null;
    try {
      data = JSON.parse(data);
    } catch (e) { exception = e; }
    callback(exception, response, data);
  };
}

function get(path, params, token, callback) {
  fitbit._oauth.get(baseURI + path + '?' + querystring.stringify(params),
            token.oauth_token, token.oauth_token_secret, requestCallback(callback));
}

function post(path, params, token, callback) {
  fitbit._oauth.post(baseURI + path, token.oauth_token, token.oauth_token_secret,
             params, null, requestCallback(callback));
}

// PUBLIC
function apiCall(method, path, params, callback) {
  var token = params.token;
  delete params.token;
  if (method === 'GET') get(path, params, token, callback);
  else if (method === 'POST') post(path, params, token, callback);
}

// ------------- start listening

app.listen(3000);