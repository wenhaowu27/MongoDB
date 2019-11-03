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

var PORT =  process.env.PORT || 3000;

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
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI);

// mongoose.connect("mongodb://localhost/hw14PhysScrape", { useNewUrlParser: true });

// Routes

// Data
var articles = [];

// Routes  
app.get("/", function(req, res) {
    res.render("index", { articles: articles });
});
app.get("/articles", function(req, res) {
    res.render("saved", { articles: articles });
});

// app.get("/", function(req, res) {
//     articles = [];
//     res.json(articles);
// });


// A GET route for scraping the echoJS website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with axios
  axios.get("https://phys.org/technology-news/").then(function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);
    articles = [];

    // Now, we grab every h2 within an article tag, and do the following:
    $("article h4").each(function(i, element) {
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
    });
        res.json(articles);        
    // res.render("index", { articles: articles });
       
  });
});

// Route for getting all Articles from the db
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




app.get("/clear", function(req, res) {
  articles = [];
  res.json(articles);
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

app.get("/notes", function(req, res) {
  // Find all Notes
  db.Note.find({})
    .then(function(dbNote) {
      // If all Notes are successfully found, send them back to the client
      res.json(dbNote);
    })
    .catch(function(err) {
      // If an error occurs, send the error back to the client
      res.json(err);
    });
});


app.get("/articles", function(req, res) {
  console.log("This is save article")
  db.Article.create(req.body)
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


//*************************************************************************************

// app.get("/articles/:id", function(req, res) {
//   // TODO
//   // ====
//   // Finish the route so it finds one article using the req.params.id,
//   // and run the populate method with "note",
//   // then responds with the article with the note included
//   db.Article.findOne(req.params.id)
//   .populate("notes")
//   .then(function(dbNote) {
//     // If any Libraries are found, send them to the client with any associated Books
//     res.json(dbNote);
//   })
//   .catch(function(err) {
//     // If an error occurs, send it back to the client
//     res.json(err);
//   });
// });

// Route for saving/updating an Article's associated Note
// app.post("/articles/:id", function(req, res) {
//   // TODO
//   // ====
//   // save the new note that gets posted to the Notes collection
//   // then find an article from the req.params.id
//   // and update it's "note" property with the _id of the new note
//   db.Note.create(req.body)
//     .then(function(dbNote) {
      
//       return db.Article.findOneAndUpdate({
//         _id: req.params.id}, {
//         //  $push: { note: dbNote._id } }, { 
//          note: dbNote._id  }, { 
//            new: true });
//     })
//     .then(function(dbNote) {
//       // If the Library was updated successfully, send it back to the client
//       res.json(dbNote);
//     })
//     .catch(function(err) {
//       // If an error occurs, send it back to the client
//       res.json(err);
//     });
// });

//*************************************************************************************



// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  console.log("POPULATE NOTE HERE")
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  // db.Article.findOne({ _id: req.params.id })
  db.Article.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("notes")
    .then(function(dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
      res.render("saved", { notes: dbNote });
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  console.log("SAVE NOTE HERE")
  // Create a new note and pass the req.body to the entry
  db.Note.create(req.body)
    .then(function(dbNote) {
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Article.findOneAndUpdate({ _id: req.params.id },{ $push: { notes: dbNote._id }}, { new: true });
    })
    .then(function(dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      console.log(dbArticle)
      res.render("saved", { notes: dbNote });
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});





// app.put("/articles/:id", function(req, res) {
//   // TODO: Finish the route so it grabs all of the articles
//   // db.Article.update({})
//   db.Article.findOneAndUpdate({}, { $push: { notes: dbNote._id } }, { new: true })
//   .populate("notes")
//   .then(function(data){
//     res.json(data)
  
//   }).catch(function(err){
//     res.json(err);
//   })
// });

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

app.get("/saved/:id", function(req, res) {
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
        // Otherwise, send the mongojs response to the browser
        // This will fire off the success function of the ajax request
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
