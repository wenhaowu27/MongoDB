var express = require("express");
var exphbs = require("express-handlebars");
var logger = require("morgan");
var mongoose = require("mongoose");
var mongojs = require("mongojs");
var axios = require("axios");
var cheerio = require("cheerio");
var db = require("./models");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/hw14PhysScrape", { useNewUrlParser: true });

// Routes

// Data
var articles = [];

// Routes  
app.get("/", function(req, res) {
    res.render("index", { articles: articles });
});

app.get("/", function(req, res) {
    articles = [];
    res.json(articles);
});


// A GET route for scraping the echoJS website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with axios
  axios.get("https://phys.org/physics-news/").then(function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);
    articles = [];

    // Now, we grab every h2 within an article tag, and do the following:
    $("article h3").each(function(i, element) {
      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this)
        .children("a")
        .text();
      result.link = $(this)
        .children("a")
        .attr("href");
        result.body = $(this)
        .children("div").children("p")
        .text();
      if(result.title){
        articles.push(result)
      }

      db.Article.create(result)
        .then(function(dbArticle) {
          // View the added result in the console
          console.log(dbArticle);
        })
        .catch(function(err) {
          // If an error occurred, log it
          console.log(err);
        });
    });

    // Send a message to the client
    // res.render("index", { articles: articles });
        res.json(articles);
  });
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  // TODO: Finish the route so it grabs all of the articles
  db.Article.find({}).then(function(data){
    res.json(data)
  }).catch(function(err){
    res.json(err);
  })
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  db.Article.FindOne({
    _id:mongojs.ObjectId(req.params.id),
  }).populate("notes").then(function(dbArticle){   
      res.json(dbArticle)    
  }).catch(function(err){
    res.json(err)
  })
});

app.post("/articles", function(req, res) {
  // console.log("req.body inside server    ", req.body);
  db.Article.create(req.body)
      .then(function(dbArticle) {
          // View the added result in the console
          console.log(dbArticle);
      })
      .catch(function(err) {
          // If an error occurred, log it
          console.log(err);
      });
      res.render("index", { articles: articles });
});

app.get("/saved", function(req, res) {
  db.Article.find({})
      .then(function(dbarticle) {
          // If all Notes are successfully found, send them back to the client
          // res.json(dbarticle);            
          res.render("saved", { articles: dbarticle });
      })
      .catch(function(err) {
          // If an error occurs, send the error back to the client
          res.json(err);
      });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  db.Note.create(req.body).then(function(dbNote){   
      db.Article.update({
        _id: req.params.id
      },{
        note:dbNote._id
      })  
  }).then(function(dbArticle){
    res.json(err)
  }).catch(function(err){
    res.json(err);
  })
});

app.put("/articles", function(req, res) {
  // TODO: Finish the route so it grabs all of the articles
  db.Article.update({}).then(function(data){
    res.json(data)
  }).catch(function(err){
    res.json(err);
  })
});

// Delete One article from the DB
app.get("/articles/:id", function(req, res) {
  // Remove a note using the objectID
  db.Article.remove(
    {
      _id: mongojs.ObjectID(req.params.id)
    },
    function(error, removed) {
      // Log any errors from mongojs
      if (error) {
        console.log(error);
        res.send(error);
      }
      else {

        console.log(removed);
        res.send(removed);
      }
    }
  );
});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
