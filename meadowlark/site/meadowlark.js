var express = require('express');
var fortune = require('./lib/fortune.js');
var credentials = require('./credentials.js');

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

// cookie
app.use(require('cookie-parser')(credentials.cookieSecret))
app.use(require('express-session')({
	resave: false,
	saveUninitialized: false,
	secret: credentials.cookieSecret,
}))

// flash message middleware
app.use(function(req, res, next){
	// if there's a flash message, transfer
	// it to the context, then clear it
	res.locals.flash = req.session.flash;
	delete req.session.flash;
	next();
});

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

app.get('/thank-you', function(req, res){
	res.render('thank-you');
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

app.get('/newsletter', function(req, res){
	res.render('newsletter-new');
});

// for now, we're mocking NewsletterSignup:
function NewsletterSignup(){
}
NewsletterSignup.prototype.save = function(cb){
	cb();
};

var VALID_EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
app.post('/newsletter', function(req, res){
	var name = req.body.name || '', email = req.body.email || '';
	// input validation
	if(!email.match(VALID_EMAIL_REGEX)) {
		if(req.xhr) return res.json({ error: 'Invalid name email address.' });
		req.session.flash = {
			type: 'danger',
			intro: 'Validation error!',
			message: 'The email address you entered was  not valid.',
		};
		return res.redirect(303, '/newsletter/archive');
	}
	new NewsletterSignup({ name: name, email: email }).save(function(err){
		if(err) {
			if(req.xhr) return res.json({ error: 'Database error.' });
			req.session.flash = {
				type: 'danger',
				intro: 'Database error!',
				message: 'There was a database error; please try again later.',
			};
			return res.redirect(303, '/newsletter/archive');
		}
		if(req.xhr) return res.json({ success: true });
		req.session.flash = {
			type: 'success',
			intro: 'Thank you!',
			message: 'You have now been signed up for the newsletter.',
		};
		return res.redirect(303, '/newsletter/archive');
	});
});
app.get('/newsletter/archive', function(req, res){
	res.render('newsletter/archive');
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

// file uploads
var formidable = require('formidable')

app.get('/contest/vacation-photo', function(req, res){
	var now = new Date();
	res.render('contest/vacation-photo', {
		year: now.getFullYear(), month: now.getMonth()
	})
});

app.post('/contest/vacation-photo/:year/:month', function(req, res){
	var form = new formidable.IncomingForm();
	form.parse(req, function(err, fields, files){
		if (err)
		{
			console.log('form.parse err:' + err)
			return res.redirect(303, '/error');
		}
			
		console.log('received fields:');
		console.log(fields);
		console.log('received filed:');
		console.log(files);
		res.redirect(303, '/thank-you');
	});
});

// jquery file upload
var jqupload = require('jquery-file-upload-middleware')
app.use('/upload', function(req, res, next){
	var now = Date.now();
	jqupload.fileHandler({
		uploadDir: function(){
			return __dirname + '/public/uploads/' + now;
		},
		uploadUrl: function(){
			return '/uploads/' + now;
		},
	})(req, res, next);
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

