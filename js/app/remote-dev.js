window.url_prefix = 'https://staging.gitcolony.com';
gitcolony.run(['$http', function($http) {
	$http.defaults.withCredentials = true;
  $.ajaxSetup({xhrFields: { withCredentials: true } });
  window.EventSourceParams= { withCredentials: true };
}]);
