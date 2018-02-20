var express = require('express');
var fortune = require('./lib/fortune.js');

// set up handlebars view engine
var handlebars = require('express-handlebars')
		.create({defaultLayout:'main'});

var app = express();
app.disable('x-powered-by');
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.use(express.static(__dirname + '/public'));
app.use(function(req, res, next){
	res.locals.showTests = app.get('env') !== 'production' &&
	req.query.test === '1';
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

