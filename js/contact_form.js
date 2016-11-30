function getParams() {
  var query = window.location.href.split('?')[1] || '';
  var params = {};
  $.each(query.split('&'), function() {
    var kv = this.split('=');
    if(kv.length == 2)
      params[kv[0]] = kv[1];
  });
  return params;
}

var hashes = {};
function onHash(tag, f) {
  var callbacks = hashes[tag] || [];
  callbacks.push(f)
  hashes[tag] = callbacks;
}

$(function () {
    var url = document.location.toString();
    var tag = url.split('#')[1];
    if (!tag || !hashes[tag]) return;
    var callbacks = hashes[tag];
    for(var i = 0; i < callbacks.length; i++) {
      callbacks[i]();
    }
});

function openChat() {
  if($('#habla_window_state_div').hasClass('olrk-state-expanded')) {
    //already expanded
    //close the chat and open it with some delay
    $('#habla_sizebutton_a').click();
    setTimeout(openChat, 500);
  } else {
    $('#habla_sizebutton_a').click();
  }
}

$(document).ready(function(){
    $('[gc-tooltip]').each(function(){
       $(this).attr('title',$(this).attr('gc-tooltip'));
    }).tooltip();   
});

function isValidEmail(email) {
  if(email.trim() == "")
    return false;

  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email.trim());
}

$(function(){
  $("#contact form").submit(function(event){
    event.preventDefault();
    var form = $(this);
    var name    = form.find('input[name=name]').val();
    var email   = form.find('input[name=email]').val();
    var company = form.find('input[name=company]').val();
    var message = form.find('textarea[name=message]').val();

    if (!isValidEmail(email)) { alert("We need your email to contact you.");  return; }
    if (company === '') { alert("We need your company name."); return; }
    if (name    === '') { alert("We need your name."); return; }
    if (message === '') { alert("Please include some message."); return; }

    $.ajax({
      type: "POST",
      url: "/lead",
      data: { lead: {
        'email':   email,
        'company': company,
        'name':    name,
        'message': message,
        'type':    form.attr('lead-type'),
        'plan':    window.plan
      } },
      dataType: 'json',
      error: function() {
        form.find(".form-wrapper").show();
        form.find(".thanks-msg").hide();
        alert("There was an error please try again");
      }
    });

    form.find(".lead-form").hide();
    form.find(".thanks-msg").show();
    form.parents('.modal').modal('hide');
  });

  $("#demo form").submit(function(event){
    event.preventDefault();
    var form = $(this);
    var name    = form.find('input[name=name]').val();
    var email   = form.find('input[name=email]').val();
    var company = form.find('input[name=company]').val();
    var country = form.find('input[name=country]').val();

    if (!isValidEmail(email)) { alert("We need your email to contact you.");  return; }
    if (name === '') { alert("We need your name."); return; }
    if (company === '') { alert("We need your company name."); return; }

    $.ajax({
      type: "POST",
      url: "/request-demo",
      data: { lead: {
        'email':   email,
        'name':    name,
        'company': company,
        'country': country
      } },
      dataType: 'json',
      error: function() {
        form.find(".form-wrapper").show();
        form.find(".thanks-msg").hide();
        alert("There was an error please try again");
      }
    });

    form.find(".lead-form").hide();
    form.find(".thanks-msg").show();
    form.parents('.modal').modal('hide');
  });


  //sign in
  $('#signUpClick').click(function() {
    if (window.keys.mixpanel)
      mixpanel.track("Event: click sign up");

    $('#github').removeClass('hide');
    $('#signUpStep1').removeClass('hide');
    $('#signUpStep2').addClass('hide');

    $('#gitlab').addClass('hide');
  });

  $('[plan]').click(function(event) {
    var plan = $(event.target).attr('plan');
    window.plan = plan;
    if (window.keys.mixpanel)
      mixpanel.track("Event: plan click", {plan: plan});
    $('#pop-signin').modal('show');
    $('#github').removeClass('hide');
    $('#signUpStep1').removeClass('hide');
    $('#signUpStep2').addClass('hide');

    $('#gitlab').addClass('hide');
  });

  $('#signUpStep1Btn').click(function() {
    var email = validateEmail();
    var provider = $(this).attr('provider') || 'github';

    if(!email) return;

    validateCompany(function(company){
      if(!company) return;
      $('#signUpStep1').addClass('hide');
      $('#signUpStep2').removeClass('hide');
    });
  });

  $('#signUp, .sign-up').click(function() {
    var email = validateEmail();
    var provider = $(this).attr('provider') || 'github';

    if(!email) return;

    validateCompany(function(company){
      if(!company) return;
      var url;
      if(provider == 'github') {
        url = !window.scope ? '/create-company?company='+company+'&email='+email+"&provider="+provider :
              "/users/auth/github?url=/create-company/" + company + "/" + email + "&scope="+window.scope;
      } else {
        url = "/users/auth/bitbucket?url=/create-company/" + company + "/" + email;
      }

      if (window.keys.mixpanel && mixpanel && mixpanel.track) {
        mixpanel.track("Event: sign up", {company: company, email: email, plan: window.plan || 'none', provider: provider});
      }

      window.location.href = url;
    });
  });

  $('#requestBitbucket').click(function() {
    event.preventDefault();
    var company = $('#bitbucketCompany').val();
    var email   = $('#bitbucketEmail').val();

    if (!isValidEmail(email)) { alert("We need your email to contact you.");  return; }
    if (company === '') { alert("We need your company name."); return; }

    $.ajax({
      type: "POST",
      url: "/request-bitbucket",
      data: { lead: {
        'email':   email,
        'company':    company
      } },
      dataType: 'json',
      error: function() {
        alert("There was an error please try again");
      }
    });

    $('#pop-signin').modal('hide');
  });

  $('#usingGitlab').click(function(){
    event.preventDefault();
    $('#github').addClass('hide');
    $('#bitbucket').addClass('hide');
    $('#gitlab').removeClass('hide');
    if (window.keys.mixpanel && mixpanel && mixpanel.track) {
      mixpanel.track("Event: gitlab click", {});
    }
  });

  $('#requestGitlab').click(function() {
    event.preventDefault();
    var company = $('#gitlabCompany').val();
    var email   = $('#gitlabEmail').val();

    if (!isValidEmail(email)) { alert("We need your email to contact you.");  return; }
    if (company === '') { alert("We need your company name."); return; }

    $.ajax({
      type: "POST",
      url: "/request-gitlab",
      data: { lead: {
        'email':   email,
        'company':    company
      } },
      dataType: 'json',
      error: function() {
        alert("There was an error please try again");
      }
    });

    $('#pop-signin').modal('hide');
  });

  function getCompany() {
    return $('#companyInput');
  }

  function getEmail() {
    return $('#emailInput');
  }

  getCompany().blur(function(){
    validateCompany();
  }).keyup(function(){
    var elm = $(this);
    var val = elm.val();

    if(val.indexOf(' ') != -1)
      elm.val(val.replace(/\s/g, '-'));
  });

  getEmail().blur(function(){
    validateEmail();
  });

  var COMPANY_REGEXP = /^[A-Z0-9\-]{3,}$/i;
  function validateCompany(callback) {
    var companyElem = getCompany();
    var company = companyElem.val();

    if(!COMPANY_REGEXP.test(company)) {
      companyElem.next().text('It is not a valid name');
      if (callback) callback(false);
      return;
    }

    var url = '/api/companies/new/check/' + company;
    $.getJSON(url, function(data){
      companyElem.next().text(data.taken ?  'This company name already exists' : '');
      if(callback) callback(!data.taken ?  company : null);
    })
  }

  function validateEmail(){
    var emailElem = getEmail();
    var email = emailElem.val();
    var valid = isValidEmail(email);
    emailElem.next().text(!valid ? 'It is not a valid email' : '');
    return valid ? email : null;
  }

  var params = getParams();

  if(params.error == 'not_found') {
    //user press sign in an does not have a company yet
    $('#pop-signin').modal('show');
    $('#signInError').removeClass('hide');
    $('#signInErrorHide').addClass('hide');
  }

  if(params.error == 'not_enabled') {
    //user press sign in an does not have a company yet
    $('#pop-signin').modal('show');
    $('#notEnabledError').removeClass('hide');
    $('#signInErrorHide').addClass('hide');
  }

  if(params.plan) {
    if(params.plan=='free')
      $('#freePlanMessage').removeClass('hide');
    else
      $('#paidPlanMessage').removeClass('hide');
  }

});

$(function () {
    var url = document.location.toString();
    var sel = url.split('#')[1];
    if (sel && sel.length > 0) {
        var elem = $('a[href=#'+sel+']');
        elem.click();

        if(elem.length) {
          $('html, body').animate({
            scrollTop: elem.offset().top - 250 // 70 topbar height
          }, 1200);
        }
    } 
});

$(function () {
    var url = document.location.toString();
    var tag = url.split('#')[1];
    if (!tag || !hashes[tag]) return;
    var callbacks = hashes[tag];
    for(var i = 0; i < callbacks.length; i++) {
      callbacks[i]();
    }
});


onHash('bitbucket', function(){
  $('#pop-signin').modal('show');
})

onHash('gitlab', function(){
  $('#pop-signin').modal('show');
  $('#usingGitlab').click();
})


