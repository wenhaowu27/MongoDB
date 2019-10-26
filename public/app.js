
$(document).on("click", ".scrape", function() {
     $.ajax({
        method: "GET",
        url: "/scrape"
    }).then(function(res) {
             location.reload();            
    })
})


$(document).on("click", ".clear", function() {
  $.ajax({
      method: "GET",
      url: "/clear"
  }).then(function(res) {
      location.reload();
  })
})



$(document).on("click", "#save", function() {
  $.ajax({
      method: "POST",
      url: "/articles",
      data: {
          title: $(this).attr("data-title"),
          link: $(this).attr("data-link"),
          body: $(this).attr("data-body")
      }
  }).then(function(res) {
      location.reload();
  })
})



// Whenever someone clicks a p tag
$(document).on("click", "p", function() {
  // Empty the notes from the note section
  $("#notes").empty();
  // Save the id from the p tag
  var thisId = $(this).attr("data-id");

  // Now make an ajax call for the Article
  $.ajax({
    method: "GET",
    url: "/articles/" + thisId
  })
    // With that done, add the note information to the page
    .then(function(data) {
      console.log(data);
      // The title of the article
      $("#notes").append("<h2>" + data.title + "</h2>");
      // An input to enter a new title
      $("#notes").append("<input id='titleinput' name='title' >");
      // A textarea to add a new note body
      $("#notes").append("<textarea id='bodyinput' name='body'></textarea>");
      // A button to submit a new note, with the id of the article saved to it
      $("#notes").append("<button data-id='" + data._id + "' id='savenote'>Save Note</button>");

      // If there's a note in the article
      if (data.note) {
        // Place the title of the note in the title input
        $("#titleinput").val(data.note.title);
        // Place the body of the note in the body textarea
        $("#bodyinput").val(data.note.body);
      }
    });
});


$(document).on("click", ".delete", function(){
  console.log(this)

  var id = ($(this).attr("data-id"));
  $.ajax({
    method: "GET",
    url: "/saved/" + id
    
  }).then(function(data) {
    // Log the response
    console.log("hello")
    console.log(data);

   // remove the article (from the saved page)
    $("#" + id).remove();
    location.reload();
  });
});
