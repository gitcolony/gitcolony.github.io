$(function(){

  function getSelectVal(form, name) {
    var text = form.find('select[name='+name+'] option:selected').val();
    return text;
  }

  $(".lead-enterprise-form").submit(function(event){
    event.preventDefault();
    var form = $(this);
    var data = {};
    data.name         = form.find('input[name=name]').val();
    data.company      = form.find('input[name=company]').val();
    data.email        = form.find('input[name=email]').val();
    data.message      = form.find('textarea[name=message]').val();
    //data.city         = form.find('input[name=city]').val();
    //data.repo_provider = getSelectVal(form, 'repo_provider');
    //data.country       = getSelectVal(form, 'country');
    //data.seats    = form.find('input[name=seats]').val();
    
    //data.coupon        = form.find('input[name=coupon]').val();
    //data.use_pull      = form.find('input[name=use_pull]:checked').val() || '';
    //data.describe      = form.find('textarea[name=describe]').val();
    //data.code_review   = getSelectVal(form, 'code_review');
    //data.issue_tracker = getSelectVal(form, 'issue_tracker');
    //data.qa_team       = form.find('input[name=qa_team]:checked').val() || '';

    if (data.name==='' || data.company==='' ) { alert("Please complete all the fields.");  return; }
    if (!isValidEmail(data.email)) { alert("We need your email to contact you.");  return; }
    //if (data.country === '') { alert("Please fill the country field."); return; }
    //if (data.repo_provider === '') { alert("Please fill your repo provider."); return; }

    sendEmail("lead enterprise", data)
    .fail(function() {
      $("#subscription-bank").modal('show');
      $(".thank-you").hide();
      alert("There was an error please try again");
    });

    if (window.keys.mixpanel)
        mixpanel.track("Event: Sign up Enterprise", data);

    $("#subscription-bank").modal('hide');
    $('#fullWeb').hide();
    $(".thank-you").show();
  });
});


function isValidEmail(email) {
  if(email.trim() == "")
    return false;

  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email.trim());
};
