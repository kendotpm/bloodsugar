$(document).ready(function(){
  // Online?
  if(!navigator.onLine) {
    offline();
    return false;
  }

  document.addEventListener("touchstart", function(){}, true);

  $('#feelingWrapper a').on('click',function(){
    $('#feelingWrapper a').removeClass('on');
    $(this).toggleClass('on');
  });

  $('#feelingWrapper a').on('touchstart',function(){
    $('#feelingWrapper a').removeClass('on');
    $(this).toggleClass('on');
  });

  $('button').click(function(){

    var bp = $('#bp').val();
    var feel = $('#feelingWrapper a.on').text();

    if(bp.length > 0 && feel.length > 0){
      saveAndReset();
    } else {
      submitError(bp, feel);
    }
  });
});

function saveAndReset(){
  mixpanel.track('Log', {
    'Glucose' : $('#bp').val(),
    'Feel' : $('#feelingWrapper a.on').text()
  });

  $('#bp').val('');
  $('#feelingWrapper a').removeClass('on');
  $('button').text('Saved It!').animate({'opacity' : 1}, 1500, function(){
    $('button').text('Save It');
  });

  $('button').removeClass('shake');
  $('.error').removeClass('error');
}

function offline(){
  alert('You are not currently connected to the internet. Check your connection and try again!');
}

function submitError(bp, feel){
  if(bp.length < 1){
    $('label[for="blood_pressure"]').addClass('error');
    $('input#bp').addClass('error');
  } else {
    $('label[for="blood_pressure"]').removeClass('error');
    $('input#bp').removeClass('error');
  }

  if(feel.length < 1){
    $('label[for="how_you_feel"]').addClass('error');
  } else {
    $('label[for="how_you_feel"]').removeClass('error');
  }

  $('button').addClass('shake').animate({'opacity' : 1}, 1000, function(){
    $('button').removeClass('shake');
  });
}



// LOGBOOK

var dateTemplate = '<li class="dateSeparator">'+
            '<div class="dateBox">'+
              '<span>28</span>'+
              '<span>APR</span>'+
            '</div>'+

            '<div class="dayBox">Thursday</div>'+
            '<div class="records">3 Records</div>'+
          '</li>';

var logTemplate = '<li class="log worse">' +
            '<div class="emotion worse"></div>'+
            '<div class="sugar">129</div>'+
            '<div class="time">12:29pm</div>'+
          '</li>';


function fetchLogs(){
  $.ajax({
    url: 'https://mixpanel.com/api/2.0/jql',
    method: 'POST',
    data: {
      params: '{"from_date":"2016-01-01", "to_date": "2016-05-26"}',
      script: 'function main(){ return Events(params) }'
    },
    headers: {
      "Authorization": "Basic " + btoa('ce44e8b63b0c33c9aa2465808128d8b0')
    },
  }).done(function(resp){

    var filtered = _.filter(resp, function(mixEvent){
      if(mixEvent.name === 'Log'){
        return true;
      }
    });

    _.each(filtered, function(mixEvent){
      var m = moment.utc(mixEvent.time);
      var groupBy = m.format('MMM D');
      var dayNum = m.format('D');
      var month = m.format('MMM');
      var day = m.format('dddd');
      var time = m.format('h:m a');

      mixEvent.groupBy = groupBy;
      mixEvent.dayNum = dayNum;
      mixEvent.month = month;
      mixEvent.day = day;
      mixEvent.clock = time;
    });

    var grouped = _.groupBy(filtered, 'groupBy');

    render(grouped);
  });
}

function render(eventsByDay){
  $('ul').empty();

  _.each(eventsByDay, function(eventGroup){
    $('ul').append(dateTemplate);
    var $dateChild = $('ul li:last-child');
    var day = eventGroup[0];
    $dateChild.find('.dateBox span:first-child').text(day.dayNum);
    $dateChild.find('.dateBox span:last-child').text(day.month);
    $dateChild.find('.dayBox').text(day.day);
    $dateChild.find('.records').text(eventGroup.length + ' Records');

    _.each(eventGroup, function(mixEvent){
      $('ul').append(logTemplate);

      var $lastChild = $('ul li:last-child');

      $lastChild.removeClass('worse').addClass(mixEvent.properties.Feel.toLowerCase());
      $lastChild.find('.emotion').removeClass('worse').addClass(mixEvent.properties.Feel.toLowerCase());
      $lastChild.find('.sugar').text(mixEvent.properties.Glucose);
      $lastChild.find('.time').text(mixEvent.clock);
    });

  });
}