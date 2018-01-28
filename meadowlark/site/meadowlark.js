var express = require('express');

// set up handlebars view engine
var handlebars = require('express-handlebars')
		.create({defaultLayout:'main'});

var fortunes = [
	"Conquer your fears or they will conquer you.", 
	"Rivers need springs.", "Do not fear what you don't know.", 
	"You will have a pleasant surprise.", 
	"Whenever possible, keep it simple.",
]

var app = express();
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.use(express.static(__dirname + '/public'));
app.set('port', process.env.PORT || 3000);

app.get('/', function(reg, res){
	//res.type('text/plain');
	//res.send('Meadowlark Travel');
	res.render('home');
})

app.get('/about', function(reg, res){
	//res.type('text/plain');
	//res.send('About Meadowlark Travel');
	var randomFortune = fortunes[
		Math.floor(Math.random()*fortunes.length)
	]
	res.render('about', {fortune: randomFortune});
})

app.get('/about/contact', function(reg, res){
	res.type('text/plain');
	res.send('About contact');
})

app.get('/about*', function(reg, res){
	res.type('text/plain');
	res.send('About *');
})

app.get('/about/directions', function(reg, res){
	res.type('text/plain');
	res.send('About directions');
})

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

