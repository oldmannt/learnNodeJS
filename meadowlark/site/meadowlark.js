var express = require('express');
var fortune = require('./lib/fortune.js');

// set up handlebars view engine
var handlebars = require('express-handlebars')
		.create({defaultLayout:'main',
		helpers:{
			section: function(name, options){
				if(!this._sections) this._sections = {};
				this._sections[name] = options.fn(this);
				return null;
			}
		}
	});

var app = express();
app.disable('x-powered-by');
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.use(express.static(__dirname + '/public'));
app.use(require('body-parser').urlencoded({extended: true}));

// set 'showTests' context property if the querystring contains test=1
app.use(function(req, res, next){
	res.locals.showTests = app.get('env') !== 'production' &&
	req.query.test === '1';
	next();
});

// mocked weather data
function getWeatherData(){
    return {
        locations: [
            {
                name: 'Portland',
                forecastUrl: 'http://www.wunderground.com/US/OR/Portland.html',
                iconUrl: 'http://icons-ak.wxug.com/i/c/k/cloudy.gif',
                weather: 'Overcast',
                temp: '54.1 F (12.3 C)',
            },
            {
                name: 'Bend',
                forecastUrl: 'http://www.wunderground.com/US/OR/Bend.html',
                iconUrl: 'http://icons-ak.wxug.com/i/c/k/partlycloudy.gif',
                weather: 'Partly Cloudy',
                temp: '55.0 F (12.8 C)',
            },
            {
                name: 'Manzanita',
                forecastUrl: 'http://www.wunderground.com/US/OR/Manzanita.html',
                iconUrl: 'http://icons-ak.wxug.com/i/c/k/rain.gif',
                weather: 'Light Rain',
                temp: '55.0 F (12.8 C)',
            },
        ],
    };
}

// middleware to add weather data to context
app.use(function(req, res, next){
	if(!res.locals.partials) res.locals.partials = {};
 	res.locals.partials.weatherContext = getWeatherData();
 	next();
});

app.set('port', process.env.PORT || 3000);

app.get('/headers', function( req, res){
	res.set('Content-Type','text/plain');
	var s = '';
	for( var name in req.headers)
		s += name + ': ' + req.headers[ name] + '\ n';
	res.send( s);
});

app.get('/test', function(req, res){
	res.type('text/plain');
	res.send('this is a test');
});

app.get('/', function(reg, res){
	//res.type('text/plain');
	//res.send('Meadowlark Travel');
	res.render('home');
});

app.get('/about', function(reg, res){
	//res.type('text/plain');
	//res.send('About Meadowlark Travel');
	res.render('about', {
		fortune: fortune.getFortune(),
		pageTestScript: '/qa/tests-about.js'
	});
});

app.get('/about/contact', function(reg, res){
	res.type('text/plain');
	res.send('About contact');
});

app.get('/about*', function(reg, res){
	res.type('text/plain');
	res.send('About *');
});

app.get('/about/directions', function(reg, res){
	res.type('text/plain');
	res.send('About directions');
});

app.get('/tours/hood-river', function(req, res){
	res.render('tours/hood-river');
});

app.get('/tours/request-group-rate', function(req, res){
	res.render('tours/request-group-rate');
});

app.get('/greeting', function(req, res){
	res.render('about', {
		message: 'welcome',
		style: req.query.style,
		//userid: req.cookie.userid,
		//username: req.session.username,
	});
});

app.get('/no-layout', function(req, res){
	res.render('no-layout', {layout: null});
});

app.get('/jquery-test', function(req, res){
	res.render('jquery-test');
});

app.get('/nursery-rhyme', function(req, res){
	res.render('nursery-rhyme');
});
app.get('/data/nursery-rhyme', function(req, res){
	res.json({
		animal: 'squirrel',
		bodyPart: 'tail',
		adjective: 'bushy',
		noun: 'heck',
	});
});

app.get('/newsletter', function(reg, res) {
	// we will learn about CSRF later... for now we just provide a dummy value
	res.render('newsletter', {csrf: 'CSRF token goes here'});
});

app.post('/process', function(req, res){
	console.log('Form (from querystring): ' + req.query.form);
	console.log('CSRF token (from hidden form field): ' + req.body._csrf);
	console.log('Name (from visible form field): ' + req.body.name);
	console.log('Email (from visible form field): ' + req.body.email);
	if (req.xhr || req.accepts('json,html' === 'json')) {
		// if there were an error, we would send {error: 'error description'}
		res.send({success: true});
	} else {
		// if there were an error, we would redirect to an error page.
		res.redirect(303, '/thank-you');
	}
});

// custom 404 page 
app.use(function(req, res){
	//res.type('text/plain');
	res.status(404);
	//res.send('404 - Not Found'); 
	res.render('404');
});

// custom 500 page 
app.use(function(err, req, res, next){
	console.error( err.stack);
	//res.type('text/plain');
	res.status( 500);
	//res.send('500 - Server Error');
	res.render('500');
}); 

app.listen(app.get('port'), function(){
	console.log('Express started on http:// localhost:' + 
		app.get('port') + '; press Ctrl-C to terminate.' ); 
});

