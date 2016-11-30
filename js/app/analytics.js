(function(angular){
var gitcolonyAnalytics = angular.module('gitcolonyAnalytics', ['angulartics'])
	.config(['$analyticsProvider', function ($analyticsProvider) {

		if ( window.keys.ga ) {
			window.ga('create', window.keys.ga, 'auto');
			add_ga();
		}

		if (window.keys.mixpanel) {
			window.mixpanel.init(window.keys.mixpanel);
			add_mixpanel();
		}

		function add_mixpanel() {

			angulartics.waitForVendorApi('mixpanel', 500, '__loaded', function (mixpanel) {
				$analyticsProvider.registerSetUsername(function (userId) {
					mixpanel.identify(userId);
				});
			});

			angulartics.waitForVendorApi('mixpanel', 500, '__loaded', function (mixpanel) {
				$analyticsProvider.registerSetAlias(function (userId) {
					mixpanel.alias(userId);
				});
			});

			angulartics.waitForVendorApi('mixpanel', 500, '__loaded', function (mixpanel) {
				$analyticsProvider.registerSetSuperPropertiesOnce(function (properties) {
					mixpanel.register_once(properties);
				});
			});

			angulartics.waitForVendorApi('mixpanel', 500, '__loaded', function (mixpanel) {
				$analyticsProvider.registerSetSuperProperties(function (properties) {
					mixpanel.register(properties);
				});
			});

			angulartics.waitForVendorApi('mixpanel', 500, '__loaded', function (mixpanel) {
				$analyticsProvider.registerSetUserPropertiesOnce(function (properties) {
					mixpanel.people.set_once(properties);
				});
			});

			angulartics.waitForVendorApi('mixpanel', 500, '__loaded', function (mixpanel) {
				$analyticsProvider.registerSetUserProperties(function (properties) {
					mixpanel.people.set(properties);
				});
			});

			function customParams(event, params) {
				if(event=="Dashboard") {
					params.type = params.company ? "private" : "public";
				}
			}

			angulartics.waitForVendorApi('mixpanel', 500, '__loaded', function (mixpanel) {
				$analyticsProvider.registerPageTrack(function (path) {

					var $route = getInjector().get('$route');
					var $analytics = getInjector().get('$analytics');
					var params = jQuery.extend(true, {}, $route.current.params);
					var routeEvent = $route.current.$$route.event;

					var r_params = {c: "company", r: "repo", rid: "repo", b: "branch"};
					//rename params
					for(var k in r_params) {
						if(params[k]) {
							var nk = r_params[k];
							params[nk] = params[k];
							delete params[k];
						}
					}

					if(!routeEvent) {
						//only track routes that has an event. (To add an event look into routing.js)
						return;
					}

					customParams(routeEvent, params);


					$analytics.eventTrack(routeEvent, params);
				});
			});

			angulartics.waitForVendorApi('mixpanel', 500, '__loaded', function (mixpanel) {
				$analyticsProvider.registerEventTrack(function (action, properties) {

					var scope = getInfoScope();
					var info = scope.info;


					var send = function() {
						properties.user = !!info.name ? info.name : "";
						var event_type = action[0] == ':' ? 'Event ' : 'Visit ';
						if(action[0] == ':') action = action.substr(1);

						var user_id = info.channel.substr(1);
						identify(user_id);

						mixpanel.track(event_type + action, properties);
					};

					if(!!info.name) {
						send();
					} else {
						//user info not loaded,
						var unwatch = scope.$watch('info', function(){
							if(!info.name)
								return; //still not loaded

							unwatch();

							send();
						});
					}
				});
			});
		}


		function add_ga() {
			$analyticsProvider.settings.trackRelativePath = true;

			$analyticsProvider.registerPageTrack(function (path) {
				if (window._gaq) _gaq.push(['_trackPageview', path]);
				if (window.ga) ga('send', 'pageview', path);
			});
		}

		var $injector = null;
		var $scope = null;
		function getInjector() {
			if(!$injector) {
				$injector = angular.element($('body')).injector();
			}
			return $injector;
		}

		function getInfoScope() {
			if(!$scope) {
				$scope = angular.element($('body')).scope();
			}
			return $scope;
		}

		var identified = null;
		function identify(user_id) {
			if(identified == user_id || !window.keys.mixpanel)
				return;

			var ids = JSON.parse(localStorage.mixpanel_ids || "{}");

			if(!ids[user_id]) {
				mixpanel.alias(user_id);
				ids[user_id] = true;
				localStorage.mixpanel_ids = JSON.stringify(ids);
			}

			identified = user_id;
			mixpanel.identify(user_id);
		}


	}]);

})(angular);




