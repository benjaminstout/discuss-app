/*  Requires jQuery and jQuery UI
    Screening questions tool for Discuss.io SE application
    Supports:
    - adding/removing/editing of screening questions
    - defining the question (textarea)
    - editing/deleting answers and options
    - saving (locally) a current state of the question
    - checkboxes which were mentioned in the video clip
    - dragging/dropping of questions

    Written by: Benjamin Stout | Nov. 4 2016
*/

//-------------OBJECTS-------------
function questionBank() {
  this.qHash = {}; // Hash table mapping question ID to question
  this.curIndex = 0; // Running index of all questions added so far
  this.remove = function(id){ // Function to remove question from hash table by ID
    delete this.qHash[id];
    console.log(this.qHash);
  };
  this.add = function(question){ // Function to add question to hash table under ID
    this.qHash[question.id] = question;
    console.log(this.qHash);
  }
}

// Question object
function question(id, text, answers, allowNone, shuffle) {
  this.id = id; // Unique question ID
  this.text = text; // Question text
  this.type = 'Multiple Select';
  this.answers = answers; // {array} of answers
  this.allowNone = allowNone; // {bool} Allow "none of the above" flag
  this.shuffleOrder = shuffle; // {bool} Shuffle option order flag
}

//Answer object
function answer(text, behavior) {
  this.text = text; // {string} answer text
  this.behavior = behavior; //{string} selection behavior: may, must or terminate
}

// Create new question bank in which to store all current questions
var questions = new questionBank();

// Attach event handlers on DOM ready
$(function() {

  // Make list sortable using jQuery UI
  $('.panel-group').sortable({handle : '.handle'});

  // Turn expand arrows 180deg on bootstrap panel collapse/show event
  $('.panel-container').on('hide.bs.collapse show.bs.collapse', '.panel-collapse', function() {
    $(this).prev().children('.expand').toggleClass('rotated');
  });

  // Edit question
  $('.panel-container').on('click', '.edit', function() {
    $(this).toggleClass('cancel edit').html('<span class="glyphicon glyphicon-remove-circle"></span> CANCEL');
    $(this).next().toggleClass('btn-success save btn-danger delete').html('<span class="glyphicon glyphicon-ok-circle"></span> SAVE');
    $(this).closest('.panel-body').find('.answer-row').each(function(){
      // Mark input/select/icon elements as enabled
      $(this).find('input').prop('disabled', false);
      $(this).find('select').prop('disabled', false);
      $(this).find('span').toggleClass('remove-answer disabled');
    });
    $(this).closest('.panel-body').find('.option-row').each(function (){
      $(this).find('input').prop('disabled', false);
    });
  });

  // Save question
  $('.panel-container').on('click', '.save', function() {
    // Alter question contents here
    $(this).prev().toggleClass('cancel edit').html('<span class="glyphicon glyphicon-pencil"></span> EDIT');
    $(this).toggleClass('btn-success save btn-danger delete').html('<span class="glyphicon glyphicon-remove"></span> DELETE');
    $(this).closest('.panel-body').find('.answer-row').each(function(){
      // Mark input/select/icon elements as disabled
      $(this).find('input').prop('disabled', true);
      $(this).find('select').prop('disabled', true);
      $(this).find('span').toggleClass('disabled remove-answer');
    });
    $(this).closest('.panel-body').find('.option-row').each(function (){
      $(this).find('input').prop('disabled', true);
    });
  });

  // Cancel question edit
  $('.panel-container').on('click', '.cancel', function() {
    $(this).toggleClass('cancel edit').html('<span class="glyphicon glyphicon-pencil"></span> EDIT');
    $(this).next().toggleClass('btn-success save btn-danger delete').html('<span class="glyphicon glyphicon-remove"></span> DELETE');
    $(this).closest('.panel-body').find('.answer-row').each(function(){
      // Mark input/select/icon elements as disabled
      $(this).find('input').prop('disabled', true);
      $(this).find('select').prop('disabled', true);
      $(this).find('span').toggleClass('disabled remove-answer');
    });
    $(this).closest('.panel-body').find('.option-row').each(function (){
      $(this).find('input').prop('disabled', true);
    });
  });

  // Delete question
  $('.panel-container').on('click', '.delete', function() {
    // Remove question from bank by ID
    questions.remove($(this).data('id'));
    // Remove HTML element
    $(this).closest('li').remove();
  });

  // Delete answer
  $(document).on('click', '.remove-answer', function(){
    $(this).closest('.row').remove();
  });

  // Submit new question
  $('.question-form').on('click', '.submit', function(){
    if($('#qText').val() !== ""){
      // String to hold html to add to question element
      var html = '';
      // Array to hold answers
      var answers = [];
      // For each answer element
      $('.question-form').find('.answer-row').each(function(index){
        // Create new answer element
        var ans = new answer($(this).find('input').val(), $(this).find('select').find(":selected").text());
        // Push into answer array
        answers.push(ans);
        // Mark input/select/icon elements as disabled, add selected property
        $(this).find('input').prop('disabled', true);
        $(this).find('select').prop('disabled', true).find(":selected").prop('select', true);
        $(this).find('span').toggleClass('disabled remove-answer');
        // Concatenate to HTML string
        html += $(this).wrap('<p/>').parent().html();
        // Remove answer DOM element
        $(this).parent().remove();
      });
      // Create question
      createQuestion($('#qText').val(), answers, $('#allowNone').is(':checked'), $('#shuffle').is(':checked'), html);
      // --Reset new question form--
      createAnswer();
      $('#allowNone').prop('checked', false).parent().removeClass('active');
      $('#shuffle').prop('checked', false).parent().removeClass('active');
      $('#qText').val('');
    }
    else toggleUI();
  });

  // Trigger new question container
  $('#addNew, .back').click(function() {
    toggleUI();
  });

  // Trigger new question container
  $('#addAnswer').click(function() {
    createAnswer();
  });
});

//Function to toggle UI state to/from adding question
function toggleUI(){
  $('.panel-container').toggleClass('shifted-left');
  $('.question-container').toggleClass('shifted-right');
}

// Function to create a question
// appends to end of  question list and inserts into questionBank hash table
function createQuestion(text, answers, allowNone, shuffle, html){
  var q = new question(questions.curIndex, text, answers, allowNone, shuffle);
  // Append checkboxes to html string
  html += '<div class="row option-row"><div class="col-xs-4"></div><div class="col-xs-8"><div class="checkbox"><label><input class="allow-none" type="checkbox" disabled' + (allowNone ? " checked" : "") + '>Allow "none of the above"</label></div></div></div>';
  html += '<div class="row option-row"><div class="col-xs-4"></div><div class="col-xs-8"><div class="checkbox"><label><input class="shuffle" type="checkbox" disabled' + (shuffle ? " checked" : "") + '>Shuffle option order</label></div></div></div>';
  // Build question HTML
  var markup = '<li class="panel panel-default"><div class="panel-heading" id="heading' + q.id + '" role="button" data-toggle="collapse" data-parent="#questionBank" href="#collapse' + q.id + '" aria-expanded="true" aria-controls="collapse' + q.id + '"><span class="glyphicon glyphicon-th-list handle"></span><h4 class="panel-title">' + q.text + '</h4><span class="glyphicon glyphicon-chevron-down expand collapsed" role="button" data-toggle="collapse" data-parent="#questionBank" href="#collapse' + q.id + '" aria-expanded="true" aria-controls="collapse' + q.id + '"></span></div><div id="collapse' + q.id + '" class="panel-collapse collapse" role="tabpanel" aria-labelledby="heading' + q.id + '"><div class="panel-body">' + html + '<div class="row"></div><div class="row pull-right"><div class="btn-group"><button class="btn btn-info edit" data-id="' + q.id + '"><span class="glyphicon glyphicon-pencil"></span> EDIT</button><button class="btn btn-danger delete" data-id="' + q.id + '"><span class="glyphicon glyphicon-remove"></span> DELETE</button></div></div></div></div></li>';
  // Append HTML as new question
  $('#questionBank').append(markup);
  // Reset UI
  toggleUI();
  // Increment question ID counter
  questions.curIndex++;
  // Add question to question bank
  questions.add(q);
}

function createAnswer(){
  var markup = '<div class="row answer-row"><div class="col-xs-4 answer-option"><select class="form-control"><option>May Select</option><option>Must Select</option><option>Terminate if Selected</option></select></div><div class="col-xs-7 answer-text"><input type="text" class="form-control answer-text" placeholder="Answer Text"></div><div class="col-xs-1"><span class="glyphicon glyphicon-trash remove-answer"></span></div></div>';
  $(markup).insertBefore($('#addAnswer').parent().parent());
}
