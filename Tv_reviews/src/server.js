// Load the modules
var express = require('express'); //Express - a web application framework that provides useful utility functions like 'http'
var app = express();
var bodyParser = require('body-parser'); // Body-parser -- a library that provides functions for parsing incoming requests
app.use(bodyParser.json());              // Support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // Support encoded bodies
const axios = require('axios');
var pgp = require('pg-promise')();
const dev_dbConfig = {
	host: 'db',
	port: 5432,
	database: process.env.POSTGRES_DB,
	user:  process.env.POSTGRES_USER,
	password: process.env.POSTGRES_PASSWORD
};

/** If we're running in production mode (on heroku), the we use DATABASE_URL
 * to connect to Heroku Postgres.
 */
const isProduction = process.env.NODE_ENV === 'production';
const dbConfig = isProduction ? process.env.DATABASE_URL : dev_dbConfig;

var db = pgp(dbConfig);

// Heroku Postgres patch for v10
// fixes: https://github.com/vitaly-t/pg-promise/issues/711
if (isProduction) {
  pgp.pg.defaults.ssl = {rejectUnauthorized: false};
}

// Set the view engine to ejs
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/'));//This line is necessary for us to use relative paths and access our resources directory

// Home page - DON'T CHANGE
app.get('/', function(req, res) {
  res.render('pages/main', {
    my_title: "Search for TV show",
    items: '',
    error: false,
    message: ''
  });
});
//review page
app.get('/reviews', function(req, res) {
  var query_statement = 'SELECT * FROM tv_reviews;';
  db.task('get-everything', task =>{
    return task.batch([
      task.any(query_statement)
    ]);
  })
  .then(info => {
    console.log(info[0]);
    res.render('pages/reviews',{
      my_title: "Reviews",
      items: info[0]
    });
  })
  .catch(err => {
    console.log('error', err);
    res.render('pages/reviews', {
      my_title: 'Error',
      items: ''
    })
  });
});

//to request data from API for given search criteria
//TODO: You need to edit the code for this route to search for movie reviews and return them to the front-end
app.post('/get_feed', function(req, res) {
  var title = req.body.title; //TODO: Remove null and fetch the param (e.g, req.body.param_name); Check the NYTimes_home.ejs file or console.log("request parameters: ", req) to determine the parameter names
  var api_key = 'jblMqpc3hYhRVjpH3eAYi0f1dJUoB6xM'; // TOOD: Remove null and replace with your API key you received at the setup

  if(title) {
    axios({
      url: `https://api.tvmaze.com/search/shows?q=${title}`,
      // url: `https://api.nytimes.com/svc/movies/v2/reviews/search.json?query=${title}&api-key=${api_key}`,
        method: 'GET',
        dataType:'json',
      })
        .then(items => {
          // TODO: Return the reviews to the front-end (e.g., res.render(...);); Try printing 'items' to the console to see what the GET request to the Twitter API returned.
          // Did console.log(items) return anything useful? How about console.log(items.data.results)?
          // Stuck? Look at the '/' route above
          console.log(items.data);
          res.render('pages/main',{
            my_title: "Tv Show Info",
            items: items.data,
            error: false,
            message: ''
          })
        })
        .catch(error => {
          console.log(error);
          res.render('pages/main',{
            my_title: "Tv Show Info",
            items: '',
            error: true,
            message: error
          })
        });


  }
  else {
    // TODO: Render the home page and include an error message (e.g., res.render(...);); Why was there an error? When does this code get executed? Look at the if statement above
    // Stuck? On the web page, try submitting a search query without a search term
    res.render('pages/main',{
      my_title: "Tv Show Info",
      items: '',
      error: true,
      message: 'No Tv shows to search'
    })
  }
});

app.post('/Review', async (req, res) =>{
  var tv_title = req.body.tv_name;
  var tv_review = req.body.tv_review;
  var insert_statement = 'INSERT INTO tv_reviews (tv_name, review, review_date) VALUES(\'' + tv_title + '\', \'' + tv_review + '\', CURRENT_TIMESTAMP);';

  db.task('get-everything', task => {
    return task.batch([
      task.any(insert_statement)
    ]);

  })
  .then(info =>{
    res.redirect('/reviews')
  })
  .catch(err =>{
    console.log('error', err);
    res.redirect('pages/reviews')
  });

});
//biswas-individual-project
app.get('/filter', function(req, res) {
  var tv_title = req.query.movie_name;
  var query_statement = 'SELECT * FROM tv_reviews WHERE tv_name = \'' + tv_title + '\';';
  console.log(tv_title);
  db.task('get-everything', task =>{
    return task.batch([
      task.any(query_statement)
    ]);
  })
  .then(info => {
    console.log(info[0]);
    res.render('pages/reviews',{
      my_title: "Reviews",
      items: info[0]
    });
  })
  .catch(err => {
    console.log('error', err);
    res.render('pages/reviews', {
      my_title: 'Error',
      items: ''
    })
  });
  
});

// app.listen(3000);
module.exports = app.listen(process.env.PORT || 3000);
console.log('3000 is the magic port');