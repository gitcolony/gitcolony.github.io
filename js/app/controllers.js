// --- Controllers --------------------------------------------------------- //
var gitcolonyControllers = angular.module('gitcolonyControllers', []);

gitcolonyControllers.run(["$rootScope", function($rootScope) {
    $rootScope.priorityClass= function(priority) {
		return IncidentsHelpers.priorityClass(priority);
	}
}]);

var ROLES = {
	values: [{id: 'owner', name: 'Owner'}, {id: 'admin', name: 'Admin'}, {id: 'qa', name: 'QA'}, {id: 'dev', name: 'Developer'}],
	options: {'dev': {name: 'Developer', roles: ['dev']}, 'qa': {name: 'QA', roles: ['qa']}, 'both': {name: 'Both', roles: ['dev','qa']} },
	from_option: function(opt, admin) {
		var roles = this.options[opt].roles.slice();

		if(admin) roles.push('admin');

		return roles;
	},
	from_roles: function(roles) {
		var opt = null
		var roles_match = [];
		for(var k in this.options) {
			var filter = $.map(this.options[k].roles, function(el){
				return $.inArray(el, roles) < 0 ? null : el;
			})

			if(filter.length == this.options[k].roles.length && roles_match.length < filter.length) {
				opt = k;
				roles_match = filter;
			}
		}

		return !!opt ? opt : 'dev';
	}
}

//websocket helper
if (window.keys.pusher && window.Pusher) {
	window.notifier = new Pusher($window.keys.pusher.key, { cluster: $window.keys.pusher.cluster });
}
if (window.keys.notifier && window.keys.notifier.url) {
	window.notifier = {
		ws: new WebSocket(window.keys.notifier.url),
		subscribe: function(channel) {
			var c = {
				id: channel,
				bind: function(event, callback) {
					this.events[event] = callback;
				},
				onevent: function(event, data) {
					this.events[event](data);
				},
				events: {}
			};

			this.send({channel: channel, operation: "subscribe"});

			var thisObj = this;

			setInterval(function(){thisObj.send({channel: channel, operation: 'ping'});}, 30000);

			this.channels[channel] = c;
			return c;
		},
		send: function(data) {
			var thisObj = this;
			if (this.ws.readyState !== 1) {
                setTimeout(function(){thisObj.send(data);}, 1000);
            } else {
            	this.ws.send(JSON.stringify(data));
            }
		},
		channels: {},
		onmessage: function(evt) {
			var data = JSON.parse(evt.data);
			data.data = JSON.parse(data.data);
			this.channels[data.channel].onevent(data.operation, data.data);
		}
	};
	window.notifier.ws.onmessage = function(evt){notifier.onmessage(evt)};
}

// Layout
gitcolonyControllers.controller('InfoCtrl', ['$scope', '$window', 'layout', 'gc', function($scope, $window, layout, gc) {
	$scope.info   = gc.info();
	$scope.layout = layout.get();
	$scope.status = gc.status();
	$scope.currentPage = function() { return layout.current() || 'dashboard'; }
	var setup_redirect = null;

	function checkCompany() {
		if ($scope.info.active === undefined) return;
		var current = layout.current();
		var company = layout.company();

		if (!$scope.info.companies.length && current.indexOf('create-company') == -1) {
			setup_redirect = layout.currentRaw();
			layout.show('create-company');
			return;
		}
		if (setup_redirect && setup_redirect != '/dashboard' && current.indexOf('/dashboard') != -1) {
			layout.show(setup_redirect);
			setup_redirect = null;
			return;
		}

		if (company && current != 'loading-repos' && current.indexOf('create-company') == -1 && current.indexOf('setup') == -1) {
			for(var i = 0; i < $scope.info.companies.length; i++) {
				var c = $scope.info.companies[i];

				if(c.name != company) continue;

				if(c.importing_size > 0)
					layout.show('loading-repos');
			}
		}

		if (company && current == 'loading-repos') {
			for(var i = 0; i < $scope.info.companies.length; i++) {
				var c = $scope.info.companies[i];

				if(c.name != company) continue;

				if(c.importing_size == 0)
					layout.show('dashboard');
			}
		}
	}

	$scope.$watch('info.active', checkCompany);
	var no_skills = ['create-company', 'setup'];
	layout.change(function() {
		$scope.check_skills = ($.inArray(layout.current(), no_skills) == -1);
		checkCompany();
	});

	$scope.gcIf = function(expr, on_true, on_false) { return expr ? on_true : on_false }
	$scope.splitList = function(l) {
		var half = Math.ceil(l.length/2);
		return [ l.slice(0,half), l.slice(half) ];
	}
	$scope.tutorial_not_active = function(){
		return ($scope.info.tutorial_flags&1)==1;
	}

	$scope.gotoDashboard    = function(){layout.show('dashboard');}
	$scope.gotoPulls        = function(){layout.show('pulls');}
	$scope.gotoProfile      = function(){layout.show('profile');}
	$scope.gotoCollabs      = function(){layout.show('collaborators');}
	$scope.gotoRepositories = function(){layout.show('repos');}
	$scope.gotoSettings     = function(){layout.show('settings');}
	$scope.gotoIncidents    = function(){layout.show('incidents');}
	$scope.gotoRanking      = function(){layout.show('ranking');}

	$scope.isMac = navigator.platform.toUpperCase().indexOf('MAC')>=0;

	$scope.instanceSettingsUrl = "http://"+location.hostname+":8844";

}]);

gitcolonyControllers.controller('SidebarCtrl', ['$scope', 'layout', 'gc', function($scope, layout, gc) {
	$scope.company = gc.get('company');

	$scope.selected = function() {
		if (!$scope.info.companies || !$scope.status.company) return; // not loaded yet / no selection yet
		return $.grep($scope.info.companies, function(c) { return c.name == $scope.status.company})[0];
	}

	$scope.menuClass = function(page, classes) {
		var current = layout.current();
		return (page === current || page === 'dashboard' && current === '') ? classes : "";
	};
	function isCompanyAdmin() {
		return ($scope.selected() || {}).admin;
	};
	layout.change(function() {
		$scope.status.company_admin  = isCompanyAdmin();
		$scope.status.private_scope  = ($scope.selected() || {}).private_scope;
	});
	$scope.$watch('info.companies', function(companies, old) {
		if (!companies) return;

		if (!$scope.selected()) {
			var c = $scope.info.companies[0];
			if (c) $scope.selectCompany(c.name);
			return;
		}

		$scope.status.company_admin  = isCompanyAdmin();
	});
	$scope.companyClass = function(id)  { return ($scope.status.company == id) ? 'active' : ''; }
	$scope.selectCompany = function(id) {
		if (id == $scope.status.company) return;
		$scope.status.company = id;
		$scope.status.company_admin = isCompanyAdmin();
		localStorage.current_company = $scope.status.company || "";
		layout.show('dashboard');
	};
	var delWatch = $scope.$watch('info.companies', function(valid) {
		if(!valid) return;
		$scope.$watch('status.company', function(newVal, oldVal){
			if(!newVal) return;
			gc.incidents(false, true);
		});
		delWatch();
	});
}]);

var icon_equiv = {
	'branch_review': 'vote-dev',
	'issue_created': 'issue-create',
	'new_comment': 'comments',
	'comment_mention': 'comments',
	'comment_issue': 'comments',
	'issue_close': 'issue-close',
	'live_branch_merged': 'merge',
	'incident': 'incident-create',
	//'incident_create': 'incident-create',
	//'incident_close': 'incident-close',
}

gitcolonyControllers.controller('NotificationsCtrl', ['$scope', '$window', 'gc', 'layout', function($scope, $window, gc, layout) {
	$scope.notifications = [];
	$scope.raw_notifications = gc.notifications();
	$scope.status        = gc.status();
	$scope.news = function(notifications) {
		if (!notifications) return 0;
		return $.grep(notifications, function(i) { return !i.read; }).length;
	}
	$scope.newsClass = function(n, css) {
		return n.is_new ? css : '';
	}
	$scope.notificationClass = function(n) {
		if (n.event.indexOf('badge_') == 0) return 'badge '+n.event.replace('badge_', '');

		var ico = n.event.replace('notify_','').replace('email_','');
		if(ico.indexOf('incident_') == 0) ico = 'incident';
		ico = icon_equiv[ico];

		return ico || 'generic';
	}

	if ($window.notifier) {
		var notifier = $window.notifier;
		$scope.$watch('info.channel', function(channel_id, old) {
			if (!channel_id || channel_id == old) return;
			var channel = notifier.subscribe(channel_id);
			channel.bind('update', function(data) {
				$scope.$apply(function() {
					gc.notifications();
				});
			});
			channel.bind('update_incidents', function(data) {
				$scope.$apply(function() {
					gc.incidents();
				});
			});
		});
	}

	// Backup the 'read' flag in is_new to prevent the updateNotifications below
	// from resetting the 'new' class.

	$scope.$watch('status.loaded.notifications', function(newVal, oldVal) {
		if (!newVal) return;
		$scope.notifications = $.map($scope.raw_notifications, function(n) {
			n.is_new = !n.read;
			if (n.event.match(/^badge_/) && !n.path) n.path = 'achievements';
			n.date += ' ago';
			n.click = function() { if (n.path) layout.show(n.path); };
			return n;
		}).reverse();
	});
	$scope.toggled = function() {
		if (!$scope.news($scope.notifications)) return;
		$.each($scope.notifications, function() { this.read = true; });
		gc.updateNotifications($scope.notifications[0].id);
	}
}]);

var IncidentsHelpers = {
	tooltipMessage: function(incident) {
		var messages = {
			'blocker': 	 'Blocker severity',
			'critical' : 'Critical severity',
			'major' : 	 'Major severity',
			'minor' : 	 'Minor severity',
			'trivial' :  'Trivial severity'
		}
		return messages[incident.priority];
	},
	severities: [
		{name: 'Blocker', id: 4, css:'icon-severity-blocker red', tooltip: 'Blocker severity'},
		{name: 'Critical', id: 3, css:'icon-severity-critical red', tooltip: 'Critical severity'},
		{name: 'Major', id: 2, css:'icon-severity-major red', tooltip: 'Major severity'},
		{name: 'Minor', id: 1, css:'icon-severity-minor green', tooltip: 'Minor severity'},
		{name: 'Trivial', id: 0, css:'icon-severity-trivial green', tooltip: 'Trivial severity'},
		{name: 'None', id: 9, css:'ico-severity none', tooltip: ''}
	],
	byPriority: function(priority) {
		var index = {
			4: 0,
			3: 1,
			2: 2,
			1: 3,
			0: 4,
			9: 5
		}
		return this.severities[index[priority]];
	},
	priorityClass: function(priority) {
		return priority!=null && priority!==undefined ? this.byPriority(priority).css : '';
	},
	priorityLabel: function(priority) {
		var classes = {
			4: "icon-severity-blocker red",
			3: "icon-severity-critical red",
			2: "icon-severity-major red",
			1: "icon-severity-minor green",
			0: "icon-severity-trivial green",
			9: "ico-severity none"
		}
		return classes[priority];
	}
}

gitcolonyControllers.controller('IncidentsCtrl', ['$scope', '$window', 'gc', 'layout', '$analytics', function($scope, $window, gc, layout, $analytics) {

	$scope.showIncidents = function() {
		layout.show('/'+layout.company()+'/incidents');
	}

	//Pusher channer is binded in NotificationsCtrl
}]);

gitcolonyControllers.controller('IncidentsViewCtrl', ['$scope', '$window', 'gc', 'layout', '$analytics',function($scope, $window, gc, layout, $analytics) {

	$scope.tooltipMessage = IncidentsHelpers.tooltipMessage;

	$scope.filters = JSON.parse(localStorage.incident_filters || '{"mine": true, "others": true, "unassigned": true, "rule_broken": true, "important": true, "recomendation": true, "open": true, "closed": false}');

	$scope.review = function(incident){
		if (incident.path) {
			$analytics.eventTrack(':Click incident', {company: layout.company() });
			layout.show(incident.path);
		}
	}

	$scope.close = function(incident){
		var info = gc.get('info');
		incident.$closing=true;
		gc.closeIncident(incident.id).then(function() {
			incident.closed = true;
			incident.updated_at = new Date();
			incident.closed_by = {username: info.name, avatar: info.avatar};
			incident.$closing=false;
			$scope.filter_incidents();
		}, function(){ incident.$closing=false; });
	}

	$scope.assign = function(incident, collab) {
    var new_collab = {
      avatar: collab.avatar,
      username: collab.username,
      id: collab.id
    }
    incident.$data.assignees.push(new_collab);
  }

  $scope.unassign = function(incident, index) {
    incident.$data.assignees.splice(index, 1);
  }

  $scope.edit = function(incident) {
  	incident.$editing = true;
  	incident.$data = {priority: incident.priority, assignees: incident.assignees.slice()};
  	incident.$collabs = getCollabs(incident.repository_id);
  }

  $scope.cancel = function(incident) {
  	incident.$editing = false;
  }

  $scope.save = function(incident) {
    incident.$sending = true;
    gc.updateIncident(incident.id, incident.$data).then(function(data) {
      incident.$sending = false;
      incident.$editing = false;
      for(var k in incident.$data) {
      	incident[k] = incident.$data[k];
      }
      $scope.filter_incidents();
    }, function(){incident.$sending = false;})
  }

  $scope.filterCollabs = function(incident){
    return function(collab) {
      if(!incident.$data || !incident.$data.assignees) return true;

      for(var i = 0; i < incident.$data.assignees.length; i++) {
        if(incident.$data.assignees[i].id == collab.id) {
          return false;
        }
      }

      return true;
    }
  }

  var collabs_by_repo = {};
	function getCollabs(repo_id) {
		if(collabs_by_repo[repo_id]) return collabs_by_repo[repo_id];

		var collabs = [];
		collabs_by_repo[repo_id] = collabs;
		gc.repoCollabs(repo_id).then(function(data) {
			for(var k in data) {
				collabs.push(data[k]);
			}
		});
		return collabs;
	}

	$scope.filter_incidents = function() {
		if(!$scope.incidents) return null;

		localStorage.incident_filters = JSON.stringify($scope.filters);

		var il = $scope.incidents;
		var l = il.length;
		var f = $scope.filters;
		for(var i = 0; i < l; ++i) {
			var p = il[i];
			p.$visible = 	((f.mine && p.assigned) ||
										(f.others && !p.assigned && p.assignees && p.assignees.length>0 ) ||
										(f.unassigned && (!p.assignees || p.assignees.length==0))) &&

										((f.important && p.priority > 1) ||
										(f.recomendation && p.priority <= 1)) &&

										((f.open && !p.closed) ||
										(f.closed && p.closed));
		}
	};

	gc.incidents(true).then(function(data) {
		$scope.incidents = data.incidents;
		$scope.filter_incidents();
	});

}]);

gitcolonyControllers.controller('MessageCtrl', ['$scope', 'message', function($scope, message) {
	$scope.message = message.get();
}]);

// Partials
gitcolonyControllers.controller('LoadingCtrl', ['$scope', function($scope) {
	// wait for the sidebar to pick a company and redirect!
}]);

var branchHelpers = {
	statusClass: function(branch) {
		var diff = branch.reviewable_count - branch.review_count;
		var color = 'green';
		if (diff > 30) color = 'red';
		else if (diff > 10) color = 'orange';
		return color;
	}
}

gitcolonyControllers.controller('DashboardCtrl', ['$scope', 'gc', 'layout', '$analytics', 'gcTutorial', function($scope, gc, layout, $analytics, gcTutorial) {

	$scope.status = gc.status();

	$scope.prTab = localStorage.dashboard_pr_tab || 'assigned';

	$scope.updateTutorial = function(flag_name) {
		gcTutorial.updateTutorial(flag_name).then(function() {
			if(flag_name=='intro') $scope.tutorial_step=null;
		});
	}

	$scope.getAuth = function(provider) {
		window.location="/users/auth/"+provider+"?path=dashboard&company_id=" + layout.company();
	}

	$scope.tutorialActive = gcTutorial.tutorialActive;
	gcTutorial.init();

	gc.dashboard().then(function(data) {
		$scope.dashboard = data;
		refreshPulls();
		if(data.lacking_access_providers.length) $scope.lacking_provider=data.lacking_access_providers[0];
	});

	$scope.statusClass = pullRequestHelpers.statusClass;
	$scope.statusTooltip = pullRequestHelpers.statusTooltip;

	$scope.statusBranchClass = branchHelpers.statusClass;

	$scope.incidentTooltipMessage = IncidentsHelpers.tooltipMessage;

	$scope.navigate = function(path){
		layout.show(path);
	};

	$scope.review = function(review) {
		layout.show('review-pull', { company: layout.company(), path: [review.repository_id, review.id].join('/') });
	}

	$scope.eventTrack = function(event,args) {
		args = $.extend({company: layout.company() }, args || {} );

		$analytics.eventTrack(event, args);
	}

	function refreshPulls() {
		if(!$scope.dashboard) return;
		$scope.pulls = $scope.prTab == 'assigned' ? $scope.dashboard.pulls : $scope.dashboard.author_pulls;
	}

	$scope.$watch('tutorial_step', function(){
		if($scope.tutorial_step=='step3') {
			$scope.status.showBackdrop=true;
		}else {
			$scope.status.showBackdrop=false;
		}
	})

	$scope.$watch('prTab', function(valid){
		if(!valid) return;
		localStorage.dashboard_pr_tab = $scope.prTab;

		refreshPulls();
	})

	$scope.onboard = (layout.params()['onboard'] == 'onboard');
	$scope.onboard_step = 0;
	$scope.step = function(s) { $scope.onboard_step = s; }
}]);

gitcolonyControllers.controller('ProfileCtrl', ['$scope', '$timeout', 'gc', function($scope, $timeout, gc) {
	$scope.profile = gc.profile();
	$scope.status  = gc.status();
	delete $scope.status.loaded.profile;

	$scope.$watch('status.loaded.profile', function(newVal, oldVal) {
		if (!newVal) return;
		var bd = $scope.profile.birthday;
		if (bd) bd = bd.split('-');
		$scope.profile.$birthday_year  = bd ? bd[0] : '';
		$scope.profile.$birthday_month = bd ? bd[1] : '';
		$scope.profile.$birthday_day   = bd ? bd[2] : '';
		$('#profile_skills').select2();
		$timeout(function() { $('#profile_skills').select2('val', $scope.profile.skills); }, 100);
	});
	var validateBirthday = function() {
		var valid = [!!$scope.profile.$birthday_year, !!$scope.profile.$birthday_month, !!$scope.profile.$birthday_day].join('-');
		return (valid == 'true-true-true' || valid == 'false-false-false');
	}

	$scope.$watch('profile.$birthday_year', function() {
		$scope.form.year.$setValidity('birthday', validateBirthday());
	});
	$scope.$watch('profile.$birthday_month', function() {
		$scope.form.year.$setValidity('birthday', validateBirthday());
	});
	$scope.$watch('profile.$birthday_day', function() {
		$scope.form.year.$setValidity('birthday', validateBirthday());
	});

	$scope.show_days = function(day, month, year) {
		if (day < 31) return month != 2;
		return $.inArray(parseInt(month), [1,3,5,7,8,10,12]) != -1;
	}
	$scope.submitProfile = function(showSave) {
		if(showSave == undefined) showSave = true;
		if ($scope.profile.$birthday_year && $scope.profile.$birthday_month && $scope.profile.$birthday_day) {
			$scope.profile.birthday = [
				$scope.profile.$birthday_year,
				$scope.profile.$birthday_month,
				$scope.profile.$birthday_day
			].join('-')
		} else {
			$scope.profile.birthday = null;
		}
		$scope.profile.skills = angular.toJson($.map($('#profile_skills').select2('val'), function(s) { return parseInt(s); }));
		$scope.saving = true;

		var args = JSON.parse(JSON.stringify($scope.profile));
		delete args.email_preferences;

		return gc.updateProfile(args, showSave).then(function(){
			$scope.saving=false;
		},function(){$scope.saving=false;});
	}

	$scope.deleteUser = function() {
		$scope.deleting = true;
		gc.deleteUser().then(function(){
			location.reload(); //refresh
			$scope.deleting = false;
		}, function(){$scope.deleting=false;});
	}
}]);

gitcolonyControllers.controller('EmailPreferencesCtrl', ['$scope', 'gc', function($scope, gc) {
	$scope.profile = gc.profile();
	$scope.status  = gc.status();
	delete $scope.status.loaded.profile;

	$scope.submitProfile = function() {
		return gc.updateProfile($scope.profile, false).then(function(){
			$scope.saving=false;
		},function(){$scope.saving=false;});
	}

	$scope.$watch('profile.email_preferences', function(newVal, oldVal) {
		if(oldVal === undefined) return;
		$scope.submitProfile();
	})
}]);

gitcolonyControllers.controller('AchievementsCtrl', ['$scope', 'gc', function($scope, gc) {
	$scope.badges = gc.badges();
	$scope.status = gc.status();
	delete $scope.status.loaded.badges;

	$scope.$watch('badges.$badge_list', function(newVal, old) {
		if (!$scope.badges.$badge_list || $scope.badges.all) return;
		var all = {};
		var mine = {};
		$.each($scope.badges.$badge_list, function(cat, list) {
			all[cat] = $.map(list, function(b,n) {
				return {
					name: n,
					badge: b,
					css: $.inArray(n, ($scope.badges.awarded[cat] || [])) != -1 ? 'have' : ''
				};
			});
			mine[cat] = $.grep(all[cat], function(b) { return b.css == 'have'; });
		});
		$scope.badges.mine = mine;
		$scope.badges.all  = all;
	});
}]);

gitcolonyControllers.controller('ReposCtrl', ['$scope', '$timeout', 'gc', 'layout', 'message', function($scope, $timeout, gc, layout, message) {
	$scope.repos = gc.repos();
	$scope.branches = [];

	$scope.status_map = {
		A: { css: 'analyzing'      , text: 'Analyzing'   },
		P: { css: 'in-progress'    , text: 'Uploading'   },
		U: { css: 'uploaded'       , text: 'Done'        },
		E: { css: 'uploaded-failed', text: 'Error'       }
	};
	$scope.runningAnalysis = function() {
		return $.grep($scope.repos || [], function(r) {
			return $.grep(r.branches, function(b) { return b.status == 'A';  }).length > 0;
		}).length > 0;
	}
	$scope.runningImport = function() {
		return $.grep($scope.repos || [], function(r) {
			return $.grep(r.branches, function(b) { return b.status == 'A' || b.status == 'P';  }).length > 0;
		}).length > 0;
	}
	$scope.showDetails = function(repo) {
		layout.show('repos', { path: repo.id });
	}
	$scope.loadCollabs = function(repo) {
		repo.$processing = true;
		gc.repoCollabs(repo).then(function(data) {
			angular.copy(data, repo.collabs);
			repo.$processing = false;
			repo.$in_settings = true;
			var owner_id;
			$.each(repo.collabs, function(k,v) { if (v.owner) owner_id = k; });
			repo.$critical_user_id = repo.critical_user_id || owner_id;
			repo.$critical_path    = repo.critical_path;
			if (repo.$critical_user_id) repo.$critical_user_id = repo.$critical_user_id.toString();
		}, function() {
			repo.$processing = false;
		});
	}
	$scope.selectedCollab = function(repo) {
		return repo.collabs[repo.$critical_user_id];
	}
	$scope.updateSettings = function(repo) {

		try {
			new RegExp(repo.$critical_path);
		}catch(e) {
			message.show('Invalid critical path. Must be a valid regex!');
			return;
		}

		repo.$processing = true;
		gc.updateRepo(repo, {
			critical_path:    repo.$critical_path,
			critical_user_id: parseInt(repo.$critical_user_id)
		}).then(function() {
			repo.critical_path    = repo.$critical_path;
			repo.critical_user_id = parseInt(repo.$critical_user_id);
			repo.$processing = false;
			repo.$in_settings = false;
		}, function() {
			repo.$processing = false;
		});
	}

	$scope.$watch('status.loaded.repos', function(repos) {
		if (!repos) return;
		$.each($scope.repos, function() { this.collabs = {}; });
		if ($scope.runningImport()) $timeout(function() { gc.repos(); }, 4000);
	});
}]);

gitcolonyControllers.controller('CollabCtrl', ['$scope', 'gc', 'message', function($scope, gc, message) {
	var page = 0;
	$scope.company = gc.company();

	$scope.selected = function() {
		if (!$scope.info.companies || !$scope.status.company) return; // not loaded yet / no selection yet
		return $.grep($scope.info.companies, function(c) { return c.name == $scope.status.company})[0];
	}

	$scope.load = function() {
		$scope.loading_more = true;
		gc.collabs(page).then(function(data) {
			$scope.loading_more = false;
			if ($scope.repos) {
				$scope.repos = $scope.repos.concat(data.repos);
			} else {
				$scope.repos = data.repos;
			}
			$scope.more  = data.more;
			++page;
		}, function() { $scope.loading_more = false; });
	}

	$scope.collabs = [];
	gc.companyTeam(0).then(function(data) {
		$scope.collabs = data;
	});

	$scope.syncPrivateRepos = function() {
		window.location = '/users/auth/github?scope=repo&url=' + encodeURIComponent(window.location)+'';
	}

	$scope.deleteRepo = function(repo) {
		repo.deleting = true;
		gc.deleteRepo(repo.id).then(function() {
			repo.deleting = false;
			$scope.repos.splice($.inArray(repo, $scope.repos),1);
		}, function() { repo.deleting = false; });
	}

	$scope.load();
}]);

gitcolonyControllers.controller('TeamCtrl', ['$scope', 'gc', 'message', function($scope, gc, message) {
	$scope.ROLES = ROLES.options;

	$scope.clearCollab = function() {
		$scope.collab = {role: 'dev'};
	}

	$scope.importTeam = function() {
		$scope.importing = true;
		gc.importTeam().then(function(data) {
			$scope.importing = false;
			//angular.extend(repo.current, data.collabs);
			page = 0;
			$scope.load();
		}, function() { $scope.importing = false; });
	}

	var page = 0;
	$scope.load = function() {
		$scope.loading_more = true;
		gc.companyTeam(page).then(function(data) {
			$scope.loading_more = false;

			$.each(data.collabs.current, function(){ this.role = ROLES.from_roles(this.roles); $scope.checkEmail(this) });

			if ($scope.collabs && page != 0) {
				$scope.collabs.current = $scope.collabs.current.concat(data.collabs.current);
				$scope.collabs.pending = $scope.collabs.pending.concat(data.collabs.pending);
			} else {
				$scope.collabs = data.collabs;
			}
			$scope.more  = data.more;
			++page;
		}, function() { $scope.loading_more = false; });
	}

	$scope.left  = [];
	$scope.right = [];
	$scope.is_empty = true;

	function hashToArray(hash, type) {
		var list = [];
		for (var id in hash) {
			if (id.indexOf('$') == 0) continue;
			list.push(hash[id]);
		}
		return list;
	}

	function splitList() {
		if(!$scope.collabs) return;

		var current = hashToArray($scope.collabs.current);
		//var pending = hashToArray($scope.collabs.pending, 'pending');

		current.sort(function(a,b) {
			return a.username < b.username ? -1 : 1;
		});
		//pending.sort(function(a,b) {
		//	return a.val < b.val ? -1 : 1;
		//});

		var list = current;//.concat(pending);
		var half = Math.ceil(list.length/2);
		angular.copy(list.slice(0,half), $scope.left );
		angular.copy(list.slice(half)  , $scope.right);
		$scope.is_empty = (list.length == 0);
	}

	$scope.$watchCollection('collabs.current', function() { splitList(); });
	//$scope.$watchCollection('collabs.pending', function() { splitList(); });

	$scope.deleteFromTeam = function(collab) {
		gc.deleteFromTeam(collab.id).then(function(data) {
			delete $scope.collabs.current[collab.id];
		});
	}
	$scope.deleteCollabInvite = function(id) {
		gc.deleteCollabInvite(id).then(function(data) {
			delete $scope.collabs.pending[id];
		});
	}

	$scope.checkEmail = function(collab) {
		if(!collab)return;
		collab.allow_invite = EMAIL_REGEXP.test(collab.email||'');
	}

	$scope.inviteCollab = function(collab) {
		$scope.checkEmail(collab);
		if (!collab.allow_invite) return;
		collab.inviting = true;
		gc.inviteToTeam( collab.email, collab.id, ROLES.from_option(collab.role,collab.admin) ).then(function(data) {
			collab.username = collab.email;
			collab.id = data.id;
			collab.inviting = false;
			collab.invited  = true;
			collab.active   = true;
			collab.avatar = "/img/avatar-default.jpg";
			if(collab.id) {
				$scope.collabs.current[collab.id] = collab;
			}
			$scope.display = '';
			$scope.clearCollab();
		}, function() {
		});
	}

	$scope.sendInvitation = function(collab) {
		$scope.checkEmail(collab);
		if (collab.active) return;
		collab.inviting = true;
		gc.inviteToTeam( collab.email, collab.id, null ).then(function(data) {
			collab.inviting = false;
			collab.invited  = true;
			collab.$showInviteForm = false;
		}, function() {
			collab.inviting = false;
		});
	}

	$scope.save = function() {
		var current = $scope.left.concat($scope.right);

		var toUpdate = $.grep(current, function(c, i) { return c.$modified; });

		if(toUpdate.length == 0)
			return;

		$.each(toUpdate, function(){ this.roles = ROLES.from_option(this.role, this.admin ); })
		gc.updateTeam(toUpdate).then(function() {

		});

	}

	$scope.clearCollab();
	$scope.load();

}]);

gitcolonyControllers.controller('RankingCtrl', ['$scope', 'gc', function($scope, gc) {
	$scope.ranking_archives = gc.rankingArchives();
	$scope.ranking = gc.ranking('limit=10');
	$scope.ranking_all = gc.get('ranking_all');
	$scope.loadAll = function() {
		gc.ranking('limit=100&offset=10'+($scope.archive ? ("&archive_id="+$scope.archive.id) : ''), 'ranking_all');
	};
	$scope.$watch('status.loaded.ranking_all', function(ranking) {
		$scope.ranking_all_half = parseInt(Math.ceil($scope.ranking_all.length / 2));
	});
	$scope.$watch('archive', function(archive, old) {
		if (!archive && !old) return;
		$scope.ranking_all.splice(0, $scope.ranking_all.length);
		gc.ranking('limit=10'+(archive ? ("&archive_id="+archive.id) : null));
	});
}]);

gitcolonyControllers.controller('CompanyCtrl', ['$scope', '$timeout', 'gc', function($scope, $timeout, gc) {
	$scope.company = gc.company();
	$scope.tz = [
		{ value: -12, label: '(GMT -12:00) Eniwetok, Kwajalein' },
		{ value: -11, label: '(GMT -11:00) Midway Island, Samoa' },
		{ value: -10, label: '(GMT -10:00) Hawaii' },
		{ value:  -9, label: '(GMT -9:00) Alaska' },
		{ value:  -8, label: '(GMT -8:00) Pacific Time (US and Canada)' },
		{ value:  -7, label: '(GMT -7:00) Mountain Time (US and Canada)' },
		{ value:  -6, label: '(GMT -6:00) Central Time (US and Canada), Mexico City' },
		{ value:  -5, label: '(GMT -5:00) Eastern Time (US and Canada), Bogota, Lima' },
		{ value:  -4, label: '(GMT -4:00) Atlantic Time (Canada), Caracas, La Paz' },
		{ value:  -3, label: '(GMT -3:00) Brazil, Buenos Aires, Georgetown' },
		{ value:  -2, label: '(GMT -2:00) Mid-Atlantic' },
		{ value:  -1, label: '(GMT -1:00) Azores, Cape Verde Islands' },
		{ value:   0, label: '(GMT) Western Europe Time, London, Lisbon, Casablanca' },
		{ value:   1, label: '(GMT +1:00) Brussels, Copenhagen, Madrid, Paris' },
		{ value:   2, label: '(GMT +2:00) Kaliningrad, South Africa' },
		{ value:   3, label: '(GMT +3:00) Baghdad, Riyadh, Moscow, St. Petersburg' },
		{ value:   4, label: '(GMT +4:00) Abu Dhabi, Muscat, Baku, Tbilisi' },
		{ value:   5, label: '(GMT +5:00) Ekaterinburg, Islamabad, Karachi, Tashkent' },
		{ value:   6, label: '(GMT +6:00) Almaty, Dhaka, Colombo' },
		{ value:   7, label: '(GMT +7:00) Bangkok, Hanoi, Jakarta' },
		{ value:   8, label: '(GMT +8:00) Beijing, Perth, Singapore, Hong Kong' },
		{ value:   9, label: '(GMT +9:00) Tokyo, Seoul, Osaka, Sapporo, Yakutsk' },
		{ value:  10, label: '(GMT +10:00) Eastern Australia, Guam, Vladivostok' },
		{ value:  11, label: '(GMT +11:00) Magadan, Solomon Islands, New Caledonia' },
		{ value:  12, label: '(GMT +12:00) Auckland, Wellington, Fiji, Kamchatka' }
	];

	$scope.submitCompany = function() {
		gc.updateCompany($scope.company);
	}

	$scope.deleteCompany = function() {
		$scope.deleting = true;
		gc.deleteCompany().then(function(){
			location.reload(); //refresh
			$scope.deleting = false;
		}, function(){$scope.deleting=false;});
	}
}]);

gitcolonyControllers.controller('BusinessRulesCtrl', ['$scope', '$timeout', '$location', 'gc', 'layout', function($scope, $timeout, $location, gc, layout) {
	$scope.rules = {}
	$scope.repos = gc.repos();
	$scope.severities = IncidentsHelpers.severities;
	$scope.display = layout.params()['tab'] || 'branches';

	function serverData() {
		var rules = angular.copy($scope.rules);
		rules.branches = rules.branches.slice();//clone array
		rules.default_branches = rules.default_branches.slice();//clone array

		for(var i = 0; i < $scope.ant_branches.length; i++) {
			var b1 = $scope.ant_branches[i];

			var exists = false;
			for(var j = 0; j < $scope.rules.branches.length ; j++) {
				var b2 = $scope.rules.branches[j];
				if(b1.repo_id == b2.repo_id && b1.branch_id == b2.branch_id) {
					exists = true;
					break;
				}
			}

			if(!exists) {
				//branch was deleted
				b1.rollback = false;
				b1.rollback_email = false;
				rules.branches.push(b1);
			}
		}

		for(var i = 0; i < $scope.ant_default_branches.length; i++) {
			var b1 = $scope.ant_default_branches[i];

			var exists = false;
			for(var j = 0; j < $scope.rules.default_branches.length ; j++) {
				var b2 = $scope.rules.default_branches[j];
				if(b1.repo_id == b2.repo_id && b1.branch_id == b2.branch_id) {
					exists = true;
					break;
				}
			}

			if(!exists) {
				//branch was deleted
				b1.branch_id = null;
				rules.branches.push(b1);
			}
		}

		//deep clone
		$scope.ant_branches = JSON.parse(JSON.stringify($scope.rules.branches));
		$scope.ant_default_branches = JSON.parse(JSON.stringify($scope.rules.default_branches));

		rules.issues_flags = 0;
		var flag = 1;
		for(var i = 0; i < 8; i++) {
			var f = $scope["issues_flags_"+i];
			if(f !== undefined) {
				rules.issues_flags |= f ? flag : 0;
			}
			flag = flag << 1;
		}

		return rules;
	}

	$scope.save = function() {
		if(!$scope.rules.branches) return; //not loaded yet

		$scope.$saving = true;
		gc.updateCompanyRules(serverData()).then(function() {
			$scope.$saving = false;
		},function() { $scope.$saving = false; } );
	}

	$scope.delayedSaving = false;
	$scope.delayedSave = function() {
		if($scope.delayedSaving) return;
		$scope.$saving = true;

		$timeout(function(){
			$scope.delayedSaving = false;
			$scope.save();
		}, 500);
	}

	$scope.addRule = function() {
		$scope.rules.branches.push({repo_id: null, branch_id: null, rollback: false, rollback_email:true});
	}

	$scope.deleteRule = function(rule) {
		var i = $.inArray(rule, $scope.rules.branches);
		if(i !== -1) {
			$scope.rules.branches.splice(i, 1);
		}
		$scope.save();
	}

	$scope.addDefaultBranch = function() {
		$scope.rules.default_branches.push({repo_id: null, branch_id: null});
	}

	$scope.deleteDefaultBranch = function(branch) {
		var i = $.inArray(branch, $scope.rules.default_branches);
		if(i !== -1) {
			$scope.rules.default_branches.splice(i, 1);
		}
		$scope.save();
	}

	$scope.getBranches = function(repo_id) {
		for(var i = 0; i < $scope.repos.length ; i++) {
			if($scope.repos[i].id == repo_id)
				return $scope.repos[i].branches;
		}
	};

	$scope.editReviewers = function(repo) {
		var reviewers = [];
		var mergers = [];

		for(var i = 0; i < repo.reviewers.length; ++i){
			var a = repo.reviewers[i];
			if(a.task=='merger') mergers.push(a); else reviewers.push(a);
		}

		gc.repoCollabs(repo.id).then(function(data){
			$scope.collabs = [];
			for(var k in data) $scope.collabs.push(data[k]);
		})

		$scope.$repo_edit = {
			reviewers: reviewers,
			mergers: mergers,
			repo: repo,
		};

		$('#edit-reviewers').modal('show');
	}

	$scope.saveReviewers = function() {
		var repo = $scope.$repo_edit.repo;
		var args = JSON.parse(JSON.stringify($scope.$repo_edit));
		var assignees = args.reviewers.concat(args.mergers);
		$scope.$saving = true;
		$('#edit-reviewers').modal('hide');
		gc.updateDefaultReviewers(repo.id, assignees).then(function(){
			repo.reviewers = assignees;
			$scope.$saving = false;
		},function(){$scope.$saving = false;})
	}

	gc.companyRules().then(function(data){
		$scope.rules = data;
		$scope.ant_branches = JSON.parse(JSON.stringify(data.branches));//deep clone
		if(data.branches.length == 0)
			$scope.addRule();

		$scope.ant_default_branches = JSON.parse(JSON.stringify(data.default_branches));//deep clone
		if(data.default_branches.length == 0)
			$scope.addDefaultBranch();

		var flag = 1;
		for(var i = 0; i < 8; i++) {
			$scope["issues_flags_"+i] = ($scope.rules.issues_flags&flag) == flag;
			flag = flag << 1;
		}
	});

	$scope.$watch('display', function(tab) {
		if (!tab) return;
		var search = ($location.search() || {});
		if(search.tab != tab) {
			search.tab = tab;
			$location.search(search);
		}

		if (tab == 'reviewers' && !$scope.repo_reviewers) {
			gc.allBranches().then(function(data) {
				$scope.repo_reviewers = data;
			});
		}
	});

}]);

gitcolonyControllers.controller('CompanyStatsCtrl', ['$scope', 'gc', function($scope, gc) {
	$scope.stats = gc.companyStats();

	$scope.$watch('stats', function() {
		if(!$scope.stats.pulls) return;

		var tot = $scope.stats.reviews.total;
		if(tot <= 0) tot = 1;
		$scope.stats.reviews.reviewed_per = Math.round($scope.stats.reviews.reviewed/tot * 100) | 0;
		$scope.stats.reviews.not_reviewed_per = Math.round($scope.stats.reviews.not_reviewed/tot * 100) | 0;
		$scope.stats.reviews.not_reviewed_merged_per = Math.round($scope.stats.reviews.not_reviewed_merged/tot * 100) | 0;

		$scope.stats.pulls.$chart = [parseInt($scope.stats.pulls.open), parseInt($scope.stats.pulls.accepted), parseInt($scope.stats.pulls.rejected)];
		$scope.stats.virtuals.$chart = [parseInt($scope.stats.virtuals.open), parseInt($scope.stats.virtuals.accepted), parseInt($scope.stats.virtuals.rejected)];
		$scope.stats.reviews.$chart = [parseInt($scope.stats.reviews.reviewed), parseInt($scope.stats.reviews.not_reviewed), parseInt($scope.stats.reviews.not_reviewed_merged)];
	}, true);


	$scope.relTime = function(hours) {
		return hours < 24 ? hours : (hours/24)|0;
	}

	$scope.relTimeUnit = function(hours) {
		return hours < 24 ? 'HOURS' : 'Day'
	}

	$scope.shortRelTimeUnit = function(hours) {
		return hours < 24 ? 'H' : 'D'
	}

	$scope.abs = Math.abs;

}]);

var pullRequestHelpers = {
	dayDiff: function(date) {
		return (new Date()-new Date(date))/(1000*60*60*24);
	},
	statusClass: function(pull,css) {
		var diff = pullRequestHelpers.dayDiff(pull.date || pull.created_at);
		var color = 'green';
		if (diff >= 7) color = 'red';
		else if (diff >= 3) color = 'orange';
		return css+' '+color;
	},
	statusTooltip: function(pull,css) {
		var diff = pullRequestHelpers.dayDiff(pull.date || pull.created_at);
		var tooltip = 'Less than 3 days old';
		if (diff >= 7) tooltip = '+ 7 days old';
		else if (diff >= 3) tooltip = '3 to 7 days old';
		return tooltip;
	}
}

gitcolonyControllers.controller('PullRequestListCtrl', ['$scope', 'gc', 'layout', '$analytics', '$timeout', function($scope, gc, layout, $analytics, $timeout) {
	$scope.feedback = gc.get('reviewFeedback');
	$scope.statusClass   = pullRequestHelpers.statusClass;
	$scope.statusTooltip = pullRequestHelpers.statusTooltip;
	$scope.statusCommitClass   = branchHelpers.statusClass;
	delete $scope.status.loaded.pulls;
	$scope.repos = {};
	$scope.collabs = [];
  $scope.display = localStorage.pull_display || '';
  $scope.closed_pulls = {items: [], page: 0};

	//low priority
	$timeout( function() {
		gc.allBranches().then(function(data){$scope.repos = data;});
	}, 4000 );

	var fdef = {author: true, not_author: true, mine: true, others: true, unassigned: true, can_merge: true, cant_merge: true, virtual: true, not_virtual: true, reviewed: true, not_reviewed: true, in_progress: true, not_in_progress: true};
	$scope.filters = JSON.parse(localStorage.pull_filters || '{}');

	for(var k in fdef) {
		if($scope.filters[k]===undefined) $scope.filters[k]=fdef[k];
	}


	$scope.newPullRequest = function(){
		$scope.new_pull = {reviewers: [], mergers: [], done: true, $tab: 'write'};
		$scope.createPullForm = true;
	}

	$scope.createPullRequest = function() {
		if(!$scope.new_pull.title || !$scope.new_pull.title.length || !$scope.new_pull.source || !$scope.new_pull.target || $scope.new_pull.source==$scope.new_pull.target) return;
		var args = {
			title: $scope.new_pull.title,
			description: $scope.new_pull.description,
			virtual: $scope.new_pull.virtual,
			source: $scope.new_pull.source,
			target: $scope.new_pull.target,
			duedate: $scope.new_pull.duedate,
			done:   $scope.new_pull.done,
			assignees: $scope.new_pull.reviewers.concat($scope.new_pull.mergers),
		}
		var repo_id = $scope.new_pull.repo.id;
		$scope.$creating_pull = true;
		$scope.createPullForm = false;
		gc.createPullRequest($scope.new_pull.repo.id, args).then(function(pull) {
			var added = false;
			for(var i = 0; i < $scope.pulls.length; ++i) {
				var item = $scope.pulls[i];
				if(item.repo.id == repo_id) {
					item.pulls.unshift(pull);
					added = true;
					break;
				}
			}
			if(!added) {
				//repo don't exists
				$scope.pulls.unshift({
					repo: {name: pull.repo, id: pull.repository_id},
					pulls: [pull]
				})
			}
			$scope.filter_pulls();
			$scope.$creating_pull = false;
		}, function(){$scope.$creating_pull = false;$scope.createPullForm = true;})
	}

	$scope.review = function(repo, pull) {
		layout.show('review-pull', { company: layout.company(), path: [pull.repository_id,pull.id].join('/') });
	}

	$scope.filter_pulls = function() {
		if(!$scope.pulls) return null;

		localStorage.pull_filters = JSON.stringify($scope.filters);

		var l = $scope.pulls.length;
		var f = $scope.filters;
		for(var j = 0; j < l; ++j) {
			var it = $scope.pulls[j];
			var l1 = it.pulls.length;

			for(var i = 0; i < l1; ++i) {
				var p = it.pulls[i];
				p.$visible = 	((f.mine && p.assigned) ||
											(f.others && !p.assigned && !!p.assignee && p.assignee.username!='Unassigned') ||
											(f.unassigned && (!p.assignee || p.assignee.username=='Unassigned'))) &&

											((f.author && p.is_author) ||
											(f.not_author && !p.is_author)) &&

											((f.can_merge && p.business_rules_ok) ||
											(f.cant_merge && !p.business_rules_ok)) &&

											((f.in_progress && !p.done) ||
											(f.not_in_progress && p.done)) &&

											((f.virtual && p.virtual) ||
											(f.not_virtual && !p.virtual)) &&

											((f.reviewed && p.review_count==p.reviewable_count) ||
											(f.not_reviewed && p.review_count!=p.reviewable_count));
			}
		}
	};

	$scope.pullsSelected = function(repo) {
		return $.grep(repo.pulls, function(p){ return p.$selected; });
	}

	$scope.setVisibility = function(item, visibility) {
		var pulls = $scope.pullsSelected(item);

		if(pulls.lenght == 0) return;

		item.$sending=true;
		var pull_ids = $.map( pulls, function(p) { return p.id; } );
		gc.setVisibilityPullRequest(item.repo.id, pull_ids, visibility).then(function() {
			item.$sending=false;
			$.each(pulls, function() {
				var index = $.inArray(this, item.pulls);
				if (index > -1) {
					item.pulls.splice(index, 1);
				}
			});
		}, function(){ item.$sending=false; });
	}

	$scope.markAsReviewed = function(item) {
		var pulls = $scope.pullsSelected(item);

		if(pulls.lenght == 0) return;

		item.$sending=true;
		var pull_ids = $.map( pulls, function(p) { return p.id; } );
		gc.markAsReviewed(item.repo.id, pull_ids).then(function() {
			item.$sending=false;
			$.each(pulls, function() {
				this.review_count=this.reviewable_count;
			});
		},function(){ item.$sending=false; });
	}

	$scope.unlink = function(item) {
		var pulls = $scope.pullsSelected(item);

		if(pulls.lenght == 0) return;

		item.$sending=true;

		for(var i = pulls.length - 1; i >= 0; i--) {
			(function(p) {
				gc.unlinkPullRequest(p.repository_id, p.id).then(function(){
					var index = $.inArray(p, item.pulls);
					if (index > -1) {
						item.pulls.splice(index, 1);
					}
					item.$sending=false;
				}, function(){item.$sending=false;})
			})(pulls[i])
		}
	}

	$scope.mergeLinkedPulls = function(item) {
		item.$merging=true;
		gc.mergeLinkedPulls(item.from_name).then(function(){
			var index = $.inArray(item, $scope.linked_pulls);
			if (index > -1) {
				$scope.linked_pulls.splice(index, 1);
			}
			item.$merging = false;
		}, function(){ item.$merging = false; })
	}

	$scope.$watch('pulls', function(){
		$scope.filter_pulls();
	}, true)

	// Bookmarks
	$scope.bookmark = function(repo, pull) {
		gc.bookmarkPullRequest(pull.repository_id, pull.id).then(function() {
			pull.bookmarked = true;
		});
	}
	$scope.unbookmark = function(repo, pull) {
		gc.unbookmarkPullRequest(pull.repository_id, pull.id).then(function() {
			pull.bookmarked = false;
		});
	}

	$scope.editPullRequest = function(pull) {
		var reviewers = [];
		var mergers = [];
		for(var i = 0; i < pull.assignees.length; ++i){
			var a = pull.assignees[i];
			if(a.task=='merger') mergers.push(a); else reviewers.push(a);
		}

		gc.repoCollabs(pull.repository_id).then(function(data){
			$scope.collabs = [];
			for(var k in data) $scope.collabs.push(data[k]);
		})

		$scope.$pull_edit = {
			title: pull.title,
			description: pull.description,
			duedate: pull.duedate,
			reviewers: reviewers,
			mergers: mergers,
			virtual: pull.virtual,
			done: pull.done,
			pull: pull
		};
		$('#edit-pr').modal('show');
	}

	$scope.updatePullRequest = function() {
		var pull = $scope.$pull_edit.pull;
		var args = JSON.parse(JSON.stringify($scope.$pull_edit));
		args.assignees = args.reviewers.concat(args.mergers);
		delete args.reviewers;
		delete args.mergers;
		delete args.pull;
		$scope.$updating = true;
		$('#edit-pr').modal('hide');
		gc.updatePullRequest(pull.repository_id, pull.id, args).then(function(){
			for(var k in args) {
				pull[k] = args[k];
			}
			for(var i = 0; i < pull.assignees.length; ++i) {
				var a = pull.assignees[i];
				if(a.task=='mandatory' && !a.reviewed) pull.business_rules_ok = false;
			}
			$scope.$updating = false;
		},function(){$scope.$updating = false;})
	}

	$scope.$watch('new_pull.repo', function(newVal, oldVal){
		if(!newVal || !newVal.id) return;
		$scope.new_pull.target = null;
		$scope.new_pull.source = null;
		gc.repoBranches(newVal.id).then(function(data){
			$scope.new_pull.target = null;
			$scope.new_pull.source = null;
			$scope.branches=data;
		})
		gc.repoCollabs(newVal).then(function(data) {
			$scope.collabs = [];
			$scope.new_pull.mergers = newVal.reviewers.filter(function(r) { return r.task === 'merger' });
			$scope.new_pull.reviewers = newVal.reviewers.filter(function(r) { return r.task !== 'merger' });;
			for(var k in data) $scope.collabs.push(data[k]);
		})
	})

  $scope.setRepoFilter = function(repo) {
    $scope.repoFilter = repo;
    $scope.closed_pulls.items.splice(0);
    $scope.closed_pulls.page = 0;
  }

  $scope.loadClosed = function(page) {
    return gc.pulls('closed=true&page='+page+ ($scope.repoFilter ? '&repo_id=' + $scope.repoFilter.id : '' ));
  }

	$scope.$watch('display', function() {
    localStorage.pull_display = $scope.display;
		if($scope.display == 'linked') {
			$analytics.eventTrack("linked pull requests", { company: layout.company() })
		}
    if($scope.display == 'closed') {
			$analytics.eventTrack("closed pull requests", { company: layout.company() })
		}
    if($scope.display == '' && !$scope.pulls) {
			gc.pulls().then(function(data) {
				$scope.pulls = data.pulls;
			});
		}
		if($scope.display == 'linked' && !$scope.linked_pulls) {
			gc.pulls('linked=true').then(function(data) {
				$scope.linked_pulls = data.linked_pulls;
			});
		}
	})

}]);

gitcolonyControllers.controller('CompanyCreateCtrl', ['$scope', 'gc', 'layout', '$analytics', function($scope, gc, layout, $analytics) {
	$scope.step = 'info';
	var params = layout.params();
	if (params['name'] != 'new') $scope.name  = params['name'];
	if (params['email']) $scope.email = params['email'];

	$scope.canCreate = function() {
		return !$scope.info_form.name.$invalid &&
			(!info_form.name.$dirty ||!info_form.name.unique) &&
			(!info_form.email.$invalid || info.active);
	}

	$scope.createCompany = function() {
		if (!$scope.canCreate()) return;
		$analytics.eventTrack("Create Company - Step 1 - Named", {company: $scope.name });
		$scope.sendCreateCompany();
	}

	$scope.sendCreateCompany = function() {
		gc.createCompany({ name: $scope.name, email: $scope.email }).then(function() {
			$scope.info.companies.push({name: $scope.name, admin: true, avatar: 'img/avatar-company.jpg', plan: $scope.plan});
			layout.show('setup', { company: $scope.name, path: 'new' });
		});
	}

	$scope.cancel = function() {
		layout.show('dashboard');
	}

	var primera = true;
	$scope.$watch('info.companies', function(){
		if ($scope.email && $scope.name && primera && $scope.info.companies){
			primera = false;
			$scope.sendCreateCompany();
		}
	})

}]);
gitcolonyControllers.controller('CompanySetupCtrl', ['$scope', '$timeout', 'gc', 'gcUrl', 'layout', '$analytics', function($scope, $timeout, gc, gcUrl, layout, $analytics) {
	$scope.ROLES = ROLES.options;
	var params  = layout.params();
	var company = params['c'];
	$scope.is_new  = (params['new'] == 'new');
	$scope.company = company;
	$scope.step = 'sync';
	$scope.inviteLater=true; //remove to reenable invite later

	$scope.repos = [{},{},{}];
	$scope.collabs = [];
	var imported_repos;

	// Sync
	function selectedRepos() {
		return $.grep($scope.repos, function(r) { return r.url && r.status == 'ok'; });
	}
	$scope.checkRepo = function(repo) {
		if (!repo.url) { repo.status = repo.status_info = null; return; }
		//if (!repo.url.match(/https:\/\/github.com\/[^\/]+\/[^\/]+/)) { repo.status = 'invalid'; repo.status_info = $scope.getStatusInfo(repo.status); return; }
		gc.loading(repo, 'loading', gc.remoteRepo(company, repo.url)).then(function(data) {
			repo.status = data.sync_status;
			repo.status_info = $scope.getStatusInfo(repo.status);
		});
		$analytics.eventTrack("New repo url added", {company: $scope.company, repo_url: repo.url });
	}
	$scope.getStatusInfo = function(status) {
		var messages = {
			'ok': 		  { level: 'ok',      message: "ok" },
			'invalid': 	  { level: 'error',   message: "The url is invalid" },
			'existing':   { level: 'warning', message: "This repo was already imported" },
			'not_collab': { level: 'error',   message: "you don't have access to this repo" },
			'not_admin':  { level: 'warning', message: "you don't have admin access to this repo" },
			'not_found':  { level: 'error',   message: "We couldn't find this repo" }
		}

		return messages[status];
	}
	$scope.addRepo = function() {
		$scope.repos.push({});
		$analytics.eventTrack("More repos needed", {company: $scope.company });
	}
	$scope.canSync = function() {
		var repos = selectedRepos();
		return repos.length > 0;
	}
	$scope.canSyncCount = function() {
		var repos = selectedRepos();
		return repos.length;
	}
	$scope.syncRepos = function() {
		var repos = $.map(selectedRepos(), function(r) { return r.url; });
		gc.syncRepos(company, { repos: repos }).then(function(data) {
			$analytics.eventTrack("Create Company - Step 2 - Repos imported", {company: $scope.company, repos_added: repos.length});
			angular.copy(data.collabs, $scope.collabs);
			$.each($scope.collabs, function(c) { this.role='dev'; this.admin=false; } );
			imported_repos = data.repos;
			if($scope.collabs.length) {
				$scope.step = 'team';
			} else {
				showDone();
			}
		});
	}

	// Team
	function selectedCollabs() {
		return $scope.collabs || []; //$.grep($scope.collabs, function(c) { return c.email; }) || [];
	}
	function getCollabsWithEmail() { return  $.grep($scope.collabs, function(c) { return c.email;} ); }

	$scope.canCreateTeam = function() {
		return $scope.inviteLater || getCollabsWithEmail().length == selectedCollabs().length;
	}

	$scope.createTeam = function() {
		var collabs = selectedCollabs();
		var collabsWithEmail = getCollabsWithEmail();

		$scope.submited=true;
		/*if(collabsWithEmail.length != collabs.length && !$scope.inviteLater) {
			return;
		}

		if($scope.inviteLater) {
			$analytics.eventTrack(":Skip invites now", {
				company: $scope.company,
				collabs_count: collabs.length,
				collabs_invites: collabsWithEmail.length
			});
		}*/

		if (!collabs.length) {
			showDone();
			return;
		}
		$.each(collabs, function(){ this.roles = ROLES.from_option(this.role, this.admin ); })
		gc.createTeam({
			repos: imported_repos,
			collabs: collabs
		}).then(function() {
			showDone();
		});
		$analytics.eventTrack("Create Company - Step 3 - Team Created", {company: $scope.company, collabs_count: collabs.length, collabs_invites: collabsWithEmail.length, skip_invites: $scope.inviteLater });
	}

	// Done
	function showDone() {
		layout.show('dashboard');
	}

	// Tracking
	$scope.$watch('step', function(step) {

		if(step=="sync") {
			var plan = gc.company().plan || "";
		}

		if(step=="done") {
			$analytics.eventTrack("Visit Thank you - Step 5", {
				company: $scope.company,
				imported_repos: selectedRepos().length
			});
		}
	});

}]);

gitcolonyControllers.controller('LiveBranchesCtrl', ['$scope', '$timeout', 'gc', 'layout', '$analytics', 'message', function($scope, $timeout, gc, layout, $analytics, message) {
	$scope.repos = [];

	function sortBranches(a,b) {
		return a.is_main || (a.name < b.name && !b.is_main) ? -1 : 1;
	}

	$scope.statusClass = branchHelpers.statusClass;

	$scope.loadPage = function(page) {
		var promise = gc.liveBranches(page);

		promise.then(function(data) {
			$.each(data.repos, function () {
				var repo = this;
				repo.collabs = {};
				$.each(repo.branches, function() {
					if (!this.commit_count && this.sync) {
						refreshBranch(repo, this);
					}
				});
				repo.branches.sort(sortBranches);
			});
		});

		return promise;
	}
	$scope.howItWorks = function() {
		$scope.showExplanation = !$scope.showExplanation;
		if($scope.showExplanation)
			$analytics.eventTrack("how live branches work", {company: layout.company()});
	}


	$scope.review = function(repo, branch) {
		if(branch.in_main) return;

		layout.show('review-pull', { company: layout.company(), path: [pull.repository_id,pull.id].join('/') });
	}
	$scope.loadCollabs = function(repo) {
		repo.$processing = true;
		gc.repoCollabs(repo).then(function(data) {
			angular.copy(data, repo.collabs);
			repo.$processing = false;
			repo.$in_settings = true;
			var owner_id;
			$.each(repo.collabs, function(k,v) {  if (v.owner) owner_id = k; });
			repo.$critical_user_id = repo.critical_user_id || owner_id;
			repo.$critical_path    = repo.critical_path;
			if (repo.$critical_user_id) repo.$critical_user_id = repo.$critical_user_id.toString();
		}, function() {
			repo.$processing = false;
		});
	}
	$scope.selectedCollab = function(repo) {
		return repo.collabs[repo.$critical_user_id];
	}
	$scope.updateSettings = function(repo) {

		try {
			new RegExp(repo.$critical_path);
		}catch(e) {
			message.show('Invalid critical path. Must be a valid regex!');
			return;
		}

		repo.$processing = true;
		gc.updateRepo(repo, {
			critical_path:    repo.$critical_path,
			critical_user_id: parseInt(repo.$critical_user_id)
		}).then(function() {
			repo.critical_path    = repo.$critical_path;
			repo.critical_user_id = parseInt(repo.$critical_user_id);
			repo.$processing = false;
			repo.$in_settings = false;
		}, function() {
			repo.$processing = false;
		});
	}

	function refreshBranch(repo, pull) {
		branch.loading = true;
		$timeout(function() {
			gc.pullSummary(repo.id, pull.id).then(function(data) {
				if (data.branch.commit_count || !data.branch.sync) {
					branch.commit_count = data.branch.commit_count;
					branch.loading = false;
				} else {
					refreshBranch(repo, branch);
				}
			}, function() { branch.loading = false; });
		}, 1000);
	}

	// Add live branches
	$scope.showAddBranch = function() {
		$scope.add_branch_form = !$scope.add_branch_form;
		if ($scope.add_branch_form) {
			$timeout(function() { $('[ng-model=branch_repo]').focus(); }, 0);
			$analytics.eventTrack("Add new live branch", {company: layout.company()});
		}
	}
	$scope.addBranch = function() {
		if (!$scope.branch_name) return;

		$scope.adding_branch = true;
		$scope.branch_not_found = false;
		gc.addLiveBranch($scope.branch_repo.id, $scope.branch_name).then(function(data) {
			$scope.adding_branch = false;
			$scope.add_branch_form = false;

			var repo = $.grep($scope.repos, function(r) { return r.id == $scope.branch_repo.id })[0];
			if (!repo) {
				repo = data.repo;
				repo.branches = [];
				repo.collabs = {};
				repo.$in_settings = false;
				$scope.repos.push(repo);
			}
			repo.branches.push(data.branch);
			repo.branches.sort(sortBranches);
			if (!data.branch.commit_count && data.branch.sync) {
				refreshBranch(repo, data.branch);
			}
		}, function() { $scope.adding_branch = false; $scope.branch_not_found = true; });
	}

	// Bookmarks
	$scope.bookmark = function(repo, branch) {
		gc.bookmarkLiveBranch(repo.id, branch.id).then(function() {
			branch.bookmarked = true;
		});
	}
	$scope.unbookmark = function(repo, branch) {
		gc.unbookmarkLiveBranch(repo.id, branch.id).then(function() {
			branch.bookmarked = false;
		});
	}

	$scope.branchesSelected = function(repo) {
		return $.grep(repo.branches, function(c){ return c.$selected; });
	}

	$scope.setVisibility = function(repo, visibility) {
		var branches = $scope.branchesSelected(repo);

		if(branches.lenght == 0) return;

		repo.$sending=true;
		var branch_ids = $.map( branches, function(b) { return b.id; } );
		gc.setVisibilityLiveBranch(repo.id, branch_ids, visibility).then(function() {
			repo.$sending=false;
			$.each(branches, function() {
				var index = $.inArray(this, repo.branches);
				if (index > -1) {
					repo.branches.splice(index, 1);
				}
			});
		}, function(){ repo.$sending=false; });
	}

	$scope.markAsReviewed = function(repo) {
		var branches = $scope.branchesSelected(repo);

		if(branches.lenght == 0) return;

		repo.$sending=true;
		var branch_ids = $.map( branches, function(b) { return b.id; } );
		gc.markAsReviewed(repo.id, branch_ids).then(function() {
			repo.$sending=false;
		},function(){ repo.$sending=false; });
	}

}]);

gitcolonyControllers.controller('PullReviewCtrl', ['$scope', '$timeout', 'gc', 'layout', 'message', 'gcSliderStatus',
	'$sce', 'gcHighlight', '$analytics', '$location', '$window', '$document',
	function($scope, $timeout, gc, layout, message, gcSliderStatus, $sce, gcHighlight, $analytics, $location, $window, $document) {

	$scope.repo   = {};
	$scope.pull = {};
	$scope.tab    = $location.search().tab || 'review';
	var searchFrom  = $location.search().from;
	var searchTo    = $location.search().to;
	$scope.slider = gcSliderStatus;
	var pull_id = layout.params()['pull'];
	var repo_id = layout.params()['repo'];
	$scope.comment_id = $location.search().comment_id;
	$scope.reply_comment = $location.search().reply_comment;
	$scope.company = gc.company();
	var status = gc.status();

	$scope.diffUnified = localStorage.diffUnified == 't';

	$scope.statusClass = pullRequestHelpers.statusClass;
	$scope.statusTooltip = pullRequestHelpers.statusTooltip;

	$scope.merge_settings = JSON.parse(localStorage.merge_settings || '{"panes": 3, "collapse": false, "highlight": false, "connect": "align"}');
	$scope.delete_branch = JSON.parse(localStorage.delete_branch || 'false');
	$scope.merge_with_rebase = JSON.parse(localStorage.merge_with_rebase || 'false');
	$scope.update_with_rebase = JSON.parse(localStorage.update_with_rebase || 'false');
	$scope.force_merge = false;

	$scope.load = function(from, to) {
		var args = [];
		if (from !== undefined) args.push('from='+from);
		if (to   !== undefined) args.push('to='+to);
		if ($scope.pull && $scope.pull.ignore_white !== undefined) args.push('ignore_white='+$scope.pull.ignore_white);
		$scope.reloading = true;
		$scope.reloading_tab = args.length > 0;
		status.manual_loading = true;
		gc.pullRequest(layout.repo(), pull_id, args.join('&')).then(function(data) {
			if(data.pull.files.length == 0) status.manual_loading = false;

			$timeout(function refreshLoading() {
				if(data.pull.files.length == 0) {
					if(data.pull.$loaded) {
						status.manual_loading = false;
					} else {
						$timeout(refreshLoading, 100);
					}
				}
			},100)


			$scope.reloading = false;
			$scope.reloading_tab = false;

			data.pull.hideCards=true;

			//Use the same comments for files and pull requests
			for(var f = 0; f < data.pull.files.length; f++) {
				var file = data.pull.files[f];
				//add file.name
				file.name = file.path.split('/').pop();
				for(var i = 0; i < file.comments.length; i++) {
					var c = file.comments[i];
					file.comments[i] = $.grep(data.pull.comments, function (c2) {
						return c2.id == c.id;
					})[0];
				}
			}

			data.pull.tasks= data.pull.tasks || [];
			var t = {};
			for(var i = 0; i < data.pull.comments.length; i++) {
				var c = data.pull.comments[i];
				if(c.is_card) {
					data.pull.tasks.push(c);
					t[c.provider_id]=c;
					c.subtasks=[];
					c.issues=[];
					c.issues_count=0;
					c.tasks_count=0;
					if(!c.is_issue) {
						data.pull.comments.splice(i,1);
						i--;
					}
				}
			}

			for(var i = 0; i < data.pull.comments.length; i++) {
				var c = data.pull.comments[i];
				if(!c.is_card && c.provider_parent && t[c.provider_parent]) {
					var p = t[c.provider_parent];
					if(c.is_issue){
						p.issues_count++;
						p.issues.push(c);
					} else {
						p.tasks_count++;
						p.subtasks.push(c);
					}
				}
			}

			data.pull.issues=[];
			data.pull.open_issues=0;
			for(var i = 0; i < data.pull.comments.length; i++) {
				var c = data.pull.comments[i];
				if(c.is_issue) {
					data.pull.issues.push(c);
					if(!c.closed) data.pull.open_issues++;
				}
			}

			for(var i = 0; i < data.pull.comments.length; i++) {
				var c = data.pull.comments[i];
				if(c.children.length == 0 || c.closed) {
					c.$compressed = true;
				}
				removeCodeBlock(c);
			}

			data.pull.versions.reverse();

			//angular.copy(data.repo  , $scope.repo);
			//angular.copy(data.pull, $scope.pull);
			$scope.repo = data.repo;
			$scope.pull = data.pull;
			$scope.pull_target = $scope.pull.to_name;
			$scope.pull_title  = 'Merge ' + $scope.pull.name + ' into ' + $scope.pull_target;
			$scope.merge_target = $scope.pull.to_name;
			$scope.merge_title  = $scope.pull.title;
			$scope.from = from || $scope.pull.commits.from;
			$scope.to   = to   || $scope.pull.commits.to;
			$scope.slider.reviewed = $scope.pull.commits.reviewed;
			$scope.slider.setTo($scope.to);
			$scope.slider.setFrom($scope.from);

			for(var i = 0; i < data.pull.versions.length ; i++) {
				var v = data.pull.versions[i];
				var pushed = 0, rebased = 0, amended = 0;
				for(var j = 0; j < v.commits.length; j++) {
					var c = v.commits[j];
					if(c.status == 'rebased') rebased++;
					else if(c.status == 'amended') amended++;

					pushed++;
				}
				v.status = "Pushed " + pushed + " commits" + (rebased ? ", rebased " + rebased + " commits": '') + (amended ? ", amended " + amended + " commits": '');
				v.date = v.commits && v.commits.length ? v.commits[0].date : null;
			}

			$scope.pull.status_success = true;
			for (var i = $scope.pull.statuses.length - 1; i >= 0; i--) {
				if($scope.pull.statuses[i].state != 'success') $scope.pull.status_success = false;
			}


			gc.issue_provider(layout.repo()).then(function(data) {
				$scope.pull.issue_provider = data;
			});
			//$scope.pull.highlightEnabled = localStorage.highlightEnabled != 'f';
			$scope.pull.highlightEnabled = true;
		}, function() { $scope.reloading = false; $scope.reloading_tab = false; status.manual_loading = false;});
	}

	$scope.$watch('pull.files.length', function(){
		if($scope.pull.files && $scope.pull.files.length) {
			//Use the same comments for files and pull requests
			for(var f = 0; f < $scope.pull.files.length; f++) {
				var file = $scope.pull.files[f];
				if(file.name) continue;
				//add file.name
				file.name = file.path.split('/').pop();
				for(var i = 0; i < file.comments.length; i++) {
					var c = file.comments[i];
					file.comments[i] = $.grep($scope.pull.comments, function (c2) {
						return c2.id == c.id;
					})[0];
				}
			}
		}
	});

	function removeCodeBlock(comment) {
		if(!!comment.ftext) return;

		if(comment.text.match(/```$/)) {
	    var blocks = comment.text.split('```');
	    comment.ftext = blocks.length >= 2 ? blocks.slice(0, blocks.length - 2).join('```') : comment.text;
	  } else {
    	comment.ftext = comment.text;
	  }
	}

	$timeout(function(){$scope.load(searchFrom, searchTo);},100);


	$scope.reviewProgressClass = function() {
		if (!$scope.pull.commits || !$scope.pull.commits.total) return '';
		return branchHelpers.statusClass({commit_count: $scope.pull.commits.total, review_count: $scope.pull.commits.reviewed});
	}
	$scope.submitReview = function(type) {
		gc.reviewPullRequest(layout.repo(), pull_id, {
			type:     type,
			comments: $scope.pull.$new_comments,
			from:     $scope.from,
			to:       $scope.to,
			pull_id:  pull_id
		}).then(function() {
			layout.show('pulls');
		});
	}

	$scope.closeIssue = function(issue, resolution) {
		var args = resolution ? {resolution: resolution} : {};
		gc.closeIssue($scope.pull.repo_id, issue, args).then(function(data) {
			$scope.issueClosed(issue, data);
		});
	}
  $scope.openIssue = function(issue) {
		gc.openIssue($scope.pull.repo_id, issue).then(function(data) {
			$scope.issueReopened(issue, data);
		});
	}

  $scope.issueReopened = function(issue, data) {
		$scope.pull.issue_count++;
		if (!$scope.commits.length) return;
		var commit = $.grep($scope.commits, function(c) { return c.id == data.commit_id })[0];
		if (!commit) return;
		++commit.open_issue_count;
	}

	$scope.issueClosed = function(issue, data) {
		$scope.pull.issue_count--;
		if (!$scope.commits.length) return;
		var commit = $.grep($scope.commits, function(c) { return c.id == data.commit_id })[0];
		if (!commit) return;
		--commit.open_issue_count;
	}

	$scope.closeIncident = function(){
		if(!$scope.pull.incident || $scope.pull.incident.closed) return;

		$scope.pull.incident.$closing=true;
		gc.closeIncident($scope.pull.incident.id).then(function() {
			$scope.pull.incident.closed = true;
			$scope.pull.incident.$show_closed=true;
			$scope.pull.incident.$closing=false;
			$timeout(function(){
				$scope.pull.incident.$show_closed=false;
			},5000);
		}, function(){ $scope.pull.incident.$closing=false; });
	}

	// Bookmarks
	$scope.bookmark = function() {
		gc.bookmarkPullRequest(layout.repo(), pull_id).then(function() {
			$scope.pull.bookmarked = true;
		});
	}
	$scope.unbookmark = function() {
		gc.unbookmarkPullRequest(layout.repo(), pull_id).then(function() {
			$scope.pull.bookmarked = false;
		});
	}

	$scope.editPullRequest = function() {
		var reviewers = [];
		var mergers = [];
		for(var i = 0; i < $scope.pull.assignees.length; ++i){
			var a = $scope.pull.assignees[i];
			if(a.task=='merger') mergers.push(a); else reviewers.push(a);
		}

		$scope.$pull_edit = {
			title: $scope.pull.title,
			duedate: $scope.pull.duedate,
			reviewers: reviewers,
			mergers: mergers,
			virtual: $scope.pull.virtual,
			done: $scope.pull.done
		};
		$('#edit-pr').modal('show');
	}

	$scope.updatePullRequest = function() {
		var args = JSON.parse(JSON.stringify($scope.$pull_edit));
		args.assignees = args.reviewers.concat(args.mergers);
		delete args.reviewers;
		delete args.mergers;
		$scope.$updating = true;
		$('#edit-pr').modal('hide');
		gc.updatePullRequest(layout.repo(), pull_id, args).then(function(){
			for(var k in args) {
				$scope.pull[k] = args[k];
			}
			for(var i = 0; i < $scope.pull.assignees.length; ++i) {
				var a = $scope.pull.assignees[i];
				if(a.task=='mandatory' && !a.reviewed) $scope.pull.business_rules_ok = false;
			}
			$scope.$updating = false;
		},function(){$scope.$updating = false;})
	}

	$scope.editDescription = function() {
		$scope.newDescription = $scope.pull.description;
		$scope.editingDescription = true;
		$scope.editDescriptionTab = 'write';
	}

	$scope.cancelEditDescription = function() {
		$scope.editingDescription = false;
	}

	$scope.updateDescription = function() {
		$scope.updatingDescription = true;
		gc.updatePullRequest(layout.repo(), pull_id, { description: $scope.newDescription } ).then(function() {
			$scope.editingDescription = false;
			$scope.updatingDescription = false;
			$scope.pull.description = $scope.newDescription;
		},function() {
			$scope.updatingDescription = false;
		})
	}

	// Merge
	$document.bind('keydown', function(e){
		if(e.shiftKey) $timeout(function(){$scope.force_merge_pressed = true});
	});

	$document.bind('keyup', function(e){
		if(!e.shiftKey) $timeout(function(){$scope.force_merge_pressed = false});
	});

	$scope.canMerge = function() {
		return $scope.pull && ( $scope.force_merge_pressed ||
			$scope.pull.$openIssues && $scope.pull.$openIssues()  < $scope.pull.min_issues_blocker &&
			$scope.pull.build_status != 'failed' && $scope.pull.can_merge &&
			$scope.pull.linked_can_merge);
	}
	$scope.showMergeForm = function() {
		if (!$scope.canMerge() || $scope.force_merge) return;
		$scope.force_merge = $scope.force_merge || $scope.force_merge_pressed;
		$scope.showCommitDlg();
	}

	$scope.merge = function() {
		$scope.merging = true;
		localStorage.delete_branch = JSON.stringify($scope.delete_branch);
		if($scope.pull.mergeable) {
			var pro = gc.merge(layout.repo(), pull_id, {
				title:  $scope.merge_title,
				delete_branch: $scope.delete_branch,
				force:   $scope.force_merge
			});
		} else {
			var files = getMergedFiles();

			if(!files) return;

			var pro = gc.conflictMerge(layout.repo(), pull_id, {
				title:  $scope.merge_title,
				from: $scope.conflict_files.head,
				to: $scope.conflict_files.base,
				files: files,
				delete_branch: $scope.delete_branch,
				is_update: !!$scope.conflict_files.is_update,
				force:   $scope.force_merge
			})
		}

		pro.then(function(data) {
			$scope.merging = false;
			$scope.hideCommitDlg();
			if(!$scope.conflict_files || !$scope.conflict_files.is_update) {
				message.show('Pull request merged!');
				layout.show('pulls');
			} else {
				$scope.reload();
			}
		}, function() {
			$scope.merging = false;
			$scope.hideCommitDlg();
		});
	}

	function getMergedFiles() {
		if(!$scope.conflict_files || !$scope.conflict_files.files) return [];
		var files = [];
		var cf = $scope.conflict_files.files;
		for(var i = 0; i < cf.length; i++) {
			var f = cf[i];
			var nf = {name: f.name};
			if(f.use) nf.use = f.use;
			if(f.content) nf.use = f.content;

			if(!nf.use && !nf.content) {
				message.show('Resolve all conflicts before merge!');
				return;
			}

			files.push({name: f.name, use: f.use, content: f.content});
		}
		return files;
	}

	$scope.reload = function(){
		var search = ($location.search() || {});
		delete search.from;
		delete search.to;
		$location.search(search);
		location.reload();
	}

	$scope.commentUrl = function(comment_id) {
		return location.href.split('?')[0] + '?tab=conversation&comment_id='+comment_id;
	}

	$scope.revisionUrl = function() {
		return location.href.split('?')[0] + '?from='+$scope.pull.branch_from+'&to='+$scope.pull.branch_to;
	}

	$scope.changeMerge = function() {
		$scope.merge_with_rebase = !$scope.merge_with_rebase;
		localStorage.merge_with_rebase = JSON.stringify($scope.merge_with_rebase);
	}
	$scope.changeUpdate = function() {
		$scope.update_with_rebase = !$scope.update_with_rebase;
		localStorage.update_with_rebase = JSON.stringify($scope.update_with_rebase);
	}

	$scope.rebase = function(update) {
		$scope.force_merge = $scope.force_merge || $scope.force_merge_pressed;
		$scope.merging = true;
		//TODO: add delete_branch
		//localStorage.delete_branch = JSON.stringify($scope.delete_branch);
		if(!$scope.rebase_data) {
			$scope.conflict_files = null;
			$scope.rebase_data = {is_update: update, steps: []};
		}

		var files = getMergedFiles();
		if(!files) return;

		if(files.length) $scope.rebase_data.steps.push({files: files});
		if($scope.force_merge) $scope.rebase_data.force = true;

		gc.rebase(repo_id, pull_id, $scope.rebase_data).then(function(data) {
			if(data.length == 0) {
				//suceess
				$scope.merging = false;
				$scope.hideCommitDlg();
				if(!$scope.rebase_data.is_update) {
					message.show('Pull request merged!');
					layout.show('pulls');
				} else {
					$scope.reload();
				}
				$scope.rebase_data=null;

			} else {
				//more conflicts to be merged
				setConfictFiles(data);
			}
		}, function() {
			$scope.merging = false;
			$scope.hideCommitDlg();
			$scope.rebase_data=null;
		});
	}

	$scope.showCommitDlg = function() {
		$scope.merge_title = !$scope.conflict_files || !$scope.conflict_files.is_update  ? $scope.pull.title : 'Merge branch ' + "'" + $scope.pull.to_name + "' into " + $scope.pull.from_name;
		$('#commit_dlg').modal('show');
	}

	$scope.hideCommitDlg = function() {
		$('#commit_dlg').modal('hide');
	}

	$scope.mergeDestIntoBranch = function() {
		$analytics.eventTrack(":click manual update pr", { company: layout.company() });
		if($scope.pull.mergeable) {
			$scope.updating_pr = true;
			gc.mergeDest(layout.repo(), pull_id).then(function(data) {
				$scope.updating_pr = false;
				$scope.reload();
			}, function() { $scope.updating_pr = false; });
		} else {
			$scope.getConflictFiles(true);
		}
	}

	function setConfictFiles(files, is_update) {
		$scope.conflict_files = files;
		$scope.loading_conflicts = false;
		$scope.conflict_files.current_index = 0;
		$scope.conflict_files.loaded_files = [];
		$scope.conflict_files.is_update = is_update;
		$scope.loadFiles();
		$('#merge').modal('show');
	}

	$scope.getConflictFiles = function(is_update) {
		if(!is_update) $analytics.eventTrack(":click merge pr", { company: layout.company() });
		$scope.force_merge = $scope.force_merge || $scope.force_merge_pressed;

		$scope.loading_conflicts = true;
		gc.pullRequestConflictFiles(layout.repo(), pull_id).then(function(data){
			setConfictFiles(data, is_update);
		},function() { $scope.loading_conflicts = false; });
	}

	$scope.loadFiles = function() {
		var index = $scope.conflict_files.current_index;
		if($scope.conflict_files.loaded_files[index]) {
			$scope.conflict_files.current = $scope.conflict_files.loaded_files[index];
			$scope.refreshMerge();
			return;
		}
		var current = $scope.conflict_files.loaded_files[index] = $scope.conflict_files.files[index];
		current.loaded = 0;

		var head = $scope.conflict_files.head;
		var base = $scope.conflict_files.base;
		var merge_base = $scope.conflict_files.merge_base;
		var repo = layout.repo();

		current.head_url = gc.repoFileUrl(repo, head+":"+current.name);
		current.base_url = gc.repoFileUrl(repo, base+":"+current.name);
		current.merge_base_url = gc.repoFileUrl(repo, merge_base+":"+current.name);

		current.is_image = !!current.name.match(/(jpg|jpeg|png|gif)$/i)

		if(!current.binary) {
			gc.repoFile(repo, head+":"+current.name).then(function(body) {
				current.loaded++;
				current.head_file = body;
				$timeout(function() {current.loaded=current.loaded});
				if(current.loaded == 3)  $scope.refreshMerge();
			});

			gc.repoFile(repo, base+":"+current.name).then(function(body) {
				current.loaded++;
				current.base_file = body;
				$timeout(function() {current.loaded=current.loaded});
				if(current.loaded == 3)  $scope.refreshMerge();
			});

			gc.repoFile(repo, merge_base+":"+current.name).then(function(body) {
				current.loaded++;
				current.merge_base_file = body;
				$timeout(function() {current.loaded=current.loaded});
				if(current.loaded == 3)  $scope.refreshMerge();
			});
		}

		$scope.conflict_files.current = current;
	}

	$scope.strFileSize = function(size) {
		var i = -1;
    var byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
    do {
        size = size / 1024.0;
        i++;
    } while (size > 1024);

    return Math.max(size, 0.1).toFixed(1) + byteUnits[i];
	}

	$scope.conflictNext = function() {
		$scope.conflict_files.current_index++;
		$('#view').html('');
		if($scope.conflict_files.current_index < $scope.conflict_files.files.length) {
			$scope.loadFiles();
		} else {
			if(!$scope.rebase_data) {
				$('#merge').modal('hide');
				$scope.showCommitDlg();
				$analytics.eventTrack(":merge ready", { company: layout.company() });
			} else {
				//rebase
				$('#merge').modal('hide');
				$scope.rebase();
			}
		}
	}

	$scope.conflictPrev = function() {
		$scope.conflict_files.current_index--;
		$('#view').html('');
		$scope.loadFiles();
	}

	$scope.refreshMerge = function() {
		var current = $scope.conflict_files.current

		if(current.binary) return;

		localStorage.merge_settings = JSON.stringify($scope.merge_settings);
	  var target = document.getElementById("view");
	  target.innerHTML = "";

	  var dv = CodeMirror.MergeView(target, {
	    value: $scope.merge_settings.panes == 3 ? current.merge_base_file : current.base_file,
	    origLeft: $scope.merge_settings.panes == 3 ? current.base_file : null,
	    orig: current.head_file,
	    lineNumbers: true,
	    //mode: "text/html",
	    mode: "text/plain",
	    highlightDifferences: $scope.merge_settings.highlight,
	    connect: $scope.merge_settings.connect,
	    collapseIdentical: $scope.merge_settings.collapse
	  });

	  dv.edit.on("change", function(cm) {
	  		$timeout(function(){
	    		current.content = cm.getValue();
	  		})
	  });
	  //dv.edit.getValue();
	}

	$scope.has_mergers = function() {
		if(!$scope.pull.assignees) return false;
		for(var i = 0; i < $scope.pull.assignees.length; ++i) {
			if($scope.pull.assignees[i].task=='merger') return true;
		}
		return false;
	}

	$scope.has_reviewers = function() {
		if(!$scope.pull.assignees) return false;
		for(var i = 0; i < $scope.pull.assignees.length; ++i) {
			if($scope.pull.assignees[i].task!='merger') return true;
		}
		return false;
	}

	// Timeline
	var timeline_loaded = false;
	$scope.commits = [];
	$scope.commit_branches = {};
	function loadTimeline() {
		$scope.toggleReviews(true);

		return;
		if (timeline_loaded) return;
		$scope.reloading_tab = true;
		gc.pullRequestCommits(layout.repo(), pull_id, "").then(function(data) {
			$scope.reloading_tab = false;
			timeline_loaded = true;
			angular.copy(data.commits, $scope.commits);
			$.each(data.pulls, function() { $scope.commit_branches[this.id] = this; }); // TODO: Review
			mergeCommitMetadata();
			//$scope.slider.to   = $scope.commits.length;
			//$scope.slider.from = $scope.branch.commits.from;
			if ($scope.slider.from == $scope.slider.to) --$scope.slider.from;
			$scope.toggleReviews(true);
		}, function() { $scope.reloading_tab = false; });
	}
	function mergeCommitMetadata() { //TODO: review
		var last_branch = null;
		$.each($scope.commits, function() {
			if (!this.branch || this.branch == $scope.pull.from_name) { last_branch = null; return; }

			if (!last_branch || last_branch.name != this.branch) {
				this.branch_metadata = last_branch = { name: this.branch, commits: [this], branch: $scope.commit_branches[this.branch_id] };
				return;
			}
			last_branch.commits.push(this);
		});
	}
	$scope.isSelected = function(index) {
		return ($scope.slider.listFrom - 1 <= index && index < $scope.slider.listTo);
	}
	$scope.updateReview = function() {
		$scope.tab = 'review';
		$scope.load($scope.slider.from, $scope.slider.to);
		$analytics.eventTrack("change commit selection", { company: layout.company() });
	}
	var reviews_loaded = false;
	$scope.reviews = [];
	$scope.toggleReviews = function(val) {
		if (reviews_loaded) return $scope.show_reviews = val || !$scope.show_reviews;
		$scope.loading_reviews = true;
		gc.pullRequestReviews(layout.repo(), pull_id).then(function(data) {
			reviews_loaded = true;
			angular.copy(data, $scope.reviews);
			$scope.loading_reviews = false;
			$scope.show_reviews = true;
		}, function() { $scope.loading_reviews = false; });
	}
	$scope.showSelector = function() {
		return ($scope.to != $scope.slider.to || $scope.from != $scope.slider.from);
	}

	$scope.setDone = function(val) {
		$scope.setting_done = true;
		gc.pullRequestDone(layout.repo(), pull_id, val).then(function(data) {
			$scope.setting_done = false;
			$scope.pull.done = val;
		}, function() { $scope.setting_done = false; });
	}

	$scope.gotoComment = function(comment) {
		if(!comment.offset) return;

		$scope.tab = null;
		$timeout(function(){
			var sel = '#fcomment_' + comment.id;
			$("html, body").animate({ scrollTop: $(sel).offset().top - 120 } );
		});
	}

	// Tabs
	$scope.$watch('tab', function(tab) {

		//create the new uri with the selected tab
		var tabs = {commits: "commits", conversation: "conversation", review: null, source: 'source', tests: "tests", issues: 'issues'};
		var search = ($location.search() || {});

		if(search.tab != tabs[tab]) {
			search.tab = tabs[tab];
			$location.search(search);
		}

		if (tab == 'commits') loadTimeline();
		var evt = {commits: "Tab Timeline", review: "Tab Review", conversation: "Tab Conversation", source: "Tab Source Tree", tests: "Tab Tests", issues: "Tab Issues"};
		if(evt[tab])
			$analytics.eventTrack(evt[tab], { company: layout.company() });
	});

	$scope.$watch(function(){ return $location.search() }, function(){
		var tab = $location.search().tab || 'review';
		var comment_id = $location.search().comment_id;
		$scope.reply_comment = $location.search().reply_comment;
		if(tab != $scope.tab) {
			$scope.tab = tab;
		}

		if(comment_id && comment_id != $scope.comment_id) {
			$scope.comment_id = comment_id;
		}

	}, true);

	$scope.$watch('diffUnified', function(newVal, oldVal) {
		localStorage.diffUnified = $scope.diffUnified ? 't' : 'f';
	});
	$scope.$watch('pull.highlightEnabled', function(newVal, oldVal) {
		if(newVal === true || newVal === false)
			localStorage.highlightEnabled = $scope.pull.highlightEnabled ? 't' : 'f';
	});

	$scope.$watch('pull.ignore_white', function(newVal, oldVal) {
		if(oldVal === false || oldVal===true) {
			$scope.load();
		}

	});

	// TODO: refactor extract to directive conversations
	$scope.collabs = [];
	$scope.loadCollabs = function(repo) {
		gc.repoCollabs(repo).then(function(data) {
			//angular.copy(data, $scope.collabs);
			for(var k in data) {
				data[k].label=data[k].username;
				$scope.collabs.push(data[k]);
			}
		});
	}
	$scope.loadCollabs({id:repo_id});

	$scope.resolveComment = function(comment) {
		gc.resolveCommentPullRequest($scope.pull.repo_id, $scope.pull.id, {comment_id: comment.id, resolved: !comment.closed}).then(function(data) {
			comment.closed = !comment.closed;
		});
	}

	$scope.issue_count = function() {
		return !!$scope.pull.comments ? $.grep($scope.pull.comments, function(c) { return !!c.issue; }).length : 0;
	}
	$scope.add_comment = function(new_comment, parent) {

		if(!/\S/.test(new_comment.text)) {
			return;
		}

		var is_thread = !parent;

		if(parent && !isNaN(parent)) {
			//its parents id
			parent = $.grep($scope.pull.comments, function (c) {
				return c.id == parent;
			})[0];
		}

		var comment = {
			text:     new_comment.text,
			author: {
				username: $scope.info.name,
				avatar:   $scope.info.avatar
			},
			time:     'now',
			date:     new Date()
		};

		if(!is_thread) {
			comment.comment_parent_id = parent.id;
		}

		new_comment.text = "";
		new_comment.$sending = true;

		removeCodeBlock(new_comment);


		return gc.commentPullRequest(layout.repo(), pull_id, comment).then(function(comment) {
			comment.children=[];
			comment.is_author=true;
			if(is_thread) {
				$scope.pull.comments.unshift(comment);
				$scope.pull.thread_count++;
				removeCodeBlock(comment);
			} else {
				parent.children.push(comment);
			}

			$scope.pull.comment_count++;
		}).finally(function(){
			new_comment.$sending = false;
			parent.$replying=false;
		});
	};

	$scope.update_comment_by_id = function(diffComment) {
		//var comment = $.grep($scope.branch.comments, function (c) {
		//	return c.id == diffComment.id;
		//})[0];
		var comment = diffComment;
		comment.$text = diffComment.text;
		comment.$title = diffComment.title;
		comment.$severity = diffComment.severity;
		comment.$editing=false;
		$scope.update_comment(comment);
	};

	$scope.update_comment = function(comment, args) {

		args = args || {
			comment_id: comment.id,
			text: comment.$text,
			title: comment.$title,
			severity: comment.$severity
		};

		if(!args.comment_id) args.comment_id = comment.id;

		return gc.updateCommentPullRequest(layout.repo(), pull_id, args).then(function() {
			comment.$editing=false;
			comment.text = comment.$text || comment.text;
			comment.title = comment.$title || comment.title;
			comment.severity = comment.$severity || comment.severity;

			var is_thread = !comment.comment_parent_id;
			if(is_thread) {
				//thread comment, issue or file comment
				if(comment.issue) {
					$.each($.grep($scope.pull.issues, function (issue) {return issue.id == comment.id;}), function(k, com) {
						com.text = comment.text;
					});
				}

				if(comment.is_new) {
					$.each($scope.pull.$new_comments, function(key, val) {
						if(!$.isArray(val))
							return true;

						$.each($.grep(val, function (issue) { return issue.id == comment.id;}), function(k, com) {
							com.text = comment.text;
						});
					});
				}

				if(!comment.is_new && !!comment.path && comment.path != "") {
					$.each($scope.pull.files, function(key, val) {
						$.each($.grep(val, function (issue) { return issue.id == comment.id;}) , function(k, com) {
							com.text = comment.text;
						});
					});
				}
			}
		}).finally(function(){comment.$sending = false; });
	};

	$scope.delete_comment_by_id = function(diffComment) {
		/*var comment = $.grep($scope.branch.comments, function (c) {
			return c.id == diffComment.id;
		})[0];*/
		return $scope.delete_comment(diffComment);
	};

	$scope.delete_comment = function(comment) {

		return gc.deleteCommentPullRequest(layout.repo(), pull_id, comment.id).then(function() {

			function deleteFromArray(arr, obj) {
				var i = $.inArray(obj, arr);
				if(i !== -1) {
					arr.splice(i, 1);
				}
			}

			if(comment.has_test) {
				deleteFromArray($scope.pull.tests, comment);
				return;
			}

			$scope.pull.comment_count--;

			var is_thread = !comment.comment_parent_id;
			if(is_thread) {
				//thread comment, issue or file comment
				deleteFromArray($scope.pull.comments, comment);
				$scope.pull.thread_count--;

				if(comment.issue) {
					deleteFromArray($scope.pull.issues, $.grep($scope.pull.issues, function (issue) {
						return issue.id == comment.id;
					})[0]);
					$scope.pull.issue_count--;
				}

				if(comment.is_new) {
					$.each($scope.pull.$new_comments, function(key, val) {
						if(!$.isArray(val))
							return true;

						deleteFromArray(val, $.grep(val, function (issue) {
							return issue.id == comment.id;
						})[0]);
					});
					--$scope.pull.$new_comments.$count;
				}

				if(!!comment.path && comment.path != "") {
					$.each($scope.pull.files, function(key, val) {
						deleteFromArray(val.comments, $.grep(val.comments, function (issue) {
							return issue.id == comment.id;
						})[0]);
					});
				}

			} else {
				//child comment

				$.each($.grep($scope.pull.comments, function(c){return c.id == comment.comment_parent_id;}), function(i, parent) {
					deleteFromArray(parent.children, comment);
				});
			}
		});
	};

	if (!$scope.pull.$new_comments) $scope.pull.$new_comments = {'$count': 0};
	$scope.$watch('pull.$new_comments.$count',function(new_comments) {
		var new_comments = $scope.pull.$new_comments;
		for(var path in new_comments) {
			var comments = new_comments[path];
			if(!$.isArray(comments))
				continue;

			$.each(comments, function(index, c){
				if(c.id!==undefined || !c.text)
				//already created comment or not a comment
					return;

				c.from = $scope.from;
				c.to = $scope.to;
				c.parent_id = $scope.pull.id;

				removeCodeBlock(c);

				gc.commentPullRequest(layout.repo(), pull_id, c).then(function(comment) {

					var ncomment= $.extend({},comment);
					ncomment.offset = c.offset;
					ncomment.children = [];
					ncomment.is_author=true;
					ncomment.provider_id = comment.provider_id;
					removeCodeBlock(ncomment);

					var file = $.grep($scope.pull.files, function(f){return f.path == path;})[0]

					var i = $.inArray(c, file.comments);
					if(i!==-1) file.comments[i] = ncomment;


					$scope.pull.comments.unshift(ncomment);
					$scope.pull.comment_count++;
					$scope.pull.thread_count++;

					if(c.issue) {
						var issue = JSON.parse(JSON.stringify(ncomment));
						issue.text = issue.text.split(/\n/, 2)[0].replace(/^#### /,'');
    					if(issue.text.length > 100) issue.text = issue.text.substring(0,97) + "...";

						$scope.pull.issues.push(issue);
						$scope.pull.issue_count++;
					}
					comment.issue = issue;
					comment.provider_id = comment.provider_id;
				});
			});
		}
	});

	function comment_by_id() {

	}
	$scope.$watch('comment_id', function(){
		if($scope.reply_comment){
			var editFunc = function(){
				var elem = $('#comment_'+$scope.comment_id);

				if(!$scope.pull || !$scope.pull.comments || !elem.length) {
					$timeout(editFunc, 1000);
					return;
				}

				var comment = $.grep($scope.pull.comments, function (c) {
					return c.id == $scope.comment_id;
				})[0];
				comment.$replying=true;
				$timeout(function(){
					var textArea = elem.find('textarea[placeholder="Reply"]');
					textArea.focus().click();
					window.scrollTo(0, textArea.offset().top-200);
				},500);
			}
			editFunc();
		} else {
			if(!$scope.comment_id) return;
			var scroll = function(){
				var query = $scope.tab != 'conversation' ? '#fcomment_'+$scope.comment_id : '#comment_'+$scope.comment_id;
				var elem = $(query);
				if(!$scope.pull || !$scope.pull.comments || !elem.length || elem.hasClass('ng-hide')) {
					$timeout(scroll, 1000);
					return;
				}
				var comment = $.grep($scope.pull.comments, function (c) {
					return c.id == $scope.comment_id;
				})[0];
				$timeout(function(){
					window.scrollTo(0, elem.offset().top-200);
				},500);
			}
			scroll();
		}
	})

	$scope.assignIssue = function(issue, user) {
		$scope.update_comment(issue,{assignee: user}).then(function(){
			issue.assignee = user;
		});
	}

   var removeEvent = $scope.$on('$locationChangeStart', function (event, next, current) {
    return;
    var n = next.split('#');
    var c = current.split('#');
    var cq = current.split('?')[0];
    var nq = next.split('?')[0];

    if(c[0] == n[0] && cq != nq) {
    	if(!$scope.pull || !$scope.pull.files) return;

    	var lines = 0;
			for(var i = $scope.pull.files.length - 1; i >= 0; i--) {
			  lines += $scope.pull.files[i].diff.length;
			}
    	if(lines < 1000) return;

    	//force reload improve performance on big diffs
	    event.preventDefault();
	    removeEvent();
	    var base = n[0];
	    if(base[base.length - 2] == '/') {
	    	//double // at the end
	    	base = base.substr(0, base.length - 1) + '#';
	    } else {
	    	//single / at the end
	    	base += '/#';
	    }
	    location.href = base + n[1];
	  }
	});

   $scope.changeTabReview = function(){$scope.tab='review'}
   $scope.changeTabIssues = function(){$scope.tab='issues';}
   $scope.changeTabTimeline = function(){$scope.tab='commits';}
   $scope.changeTabConversation = function(){$scope.tab='conversation';}

}]);

gitcolonyControllers.controller('IntegrationCtrl', ['$scope', 'gc', '$location', '$analytics', '$timeout', function($scope, gc, $location, $analytics, $timeout) {
	$scope.display = $location.search().display || 'cli';
	$scope.company = gc.company();
	$scope.repos = gc.repos();

	$scope.loadToken = function() {
		if ($scope.token) return;
		gc.cliToken().then(function(data) { $scope.token = data.token; });
	}

	$scope.loadRepo = function(id) {
		gc.loading($scope, 'loading_repo', gc.jenkinsRepo(id)).then(function(data) {
			$scope.repo_url = data.url;
		});
	}

	$scope.trello = {};
	$scope.loadBoards = function() {
		gc.loading($scope, 'loading_boards', gc.trelloBoards()).then(function(data) {
			$scope.trello = data;

			var ps = $scope.trello.projects;
			var ls = $scope.trello.lists;
			$scope.trello.boards = $scope.trello.boards || {};
			$scope.trello.bug_tag = $scope.trello.bug_tag || '[BUG]';
			for (var i = ps.length - 1; i >= 0; i--) {
				p = ps[i];
				p.lists = ls[p.id];
				$scope.trello.boards[p.id] = $scope.trello.boards[p.id] || {};
				p.config = $scope.trello.boards[p.id];
			};
		});
	}

	$scope.saveBoards = function() {
		var args = {
			repos: $.map($scope.trello.repos, function(val, i){ return {id: val.id, issue_project: val.issue_project }}),
			boards: $scope.trello.boards,
			bug_tag: $scope.trello.bug_tag
		}
		gc.loading($scope, 'loading_boards', gc.trelloUpdate(args));
	}

	$scope.eventTrack = function(event,args) {
		args = $.extend({company: $scope.company.name }, args || {} );

		$analytics.eventTrack(event, args);
	}

	$scope.hrefTrack = function(href, event, args) {
		$scope.eventTrack(event, args);
		window.open(href, '_blank');
	}

	function itemByValue(arr, attr, value) {
		if(!arr) return null;

		for(var i = 0; i < arr.length;++i)
			if(arr[i][attr]==value) return arr[i];

		return null;
	}

	$scope.loadJira = function() {
		gc.loading($scope, 'loading_jira', gc.jira()).then(function(data) {
			data = data || {};
			$scope.jira = data;
			if(data.enabled) {
				for(var i = 0; i < data.issuetypes.length; ++i) {
					var it = data.issuetypes[i];
					it.value = it.name;
				}
				data.$subIssuetypes = $.grep(data.issuetypes, function(i){return i.subtask});
				data.$issuetypes = $.grep(data.issuetypes, function(i){return !i.subtask});
				//default values
				data.card_types = data.card_types || [itemByValue(data.issuetypes,'name','Story') ? 'Story' : 'Task'];
				data.issue_types = data.issue_types || ['Bug'];
				data.issuetype = data.issuetype  || itemByValue(data.issuetypes,'name','Bug');
				data.sub_issuetype = data.sub_issuetype || itemByValue(data.issuetypes,'name','Sub-task');
				data.default_resolution = data.default_resolution  || itemByValue(data.resolutions,'name','Fixed') || itemByValue(data.resolutions,'name','Done');
				data.close_status = data.close_status || itemByValue(data.statuses,'name','Closed') || itemByValue(data.statuses,'name','Done');
			}
		});
	}

	$scope.syncJira = function() {
		gc.loading($scope, 'loading_jira', gc.jiraUpdate($scope.jira)).then(function(data) {
			$scope.jira = data;
			window.location="/users/auth/jira?company_id=" + $scope.company.name;
		});
	}

	$scope.saveJira = function() {
		gc.loading($scope, 'loading_jira', gc.jiraUpdate($scope.jira));
	}

	$scope.loadSlack = function() {
		gc.loading($scope, 'loading_slack', gc.slack()).then(function(data) {
			$scope.slack = data;
		});
	}

	$scope.saveSlack = function() {
		gc.loading($scope, 'loading_slack', gc.slackUpdate($scope.slack));
	}

	$scope.addSlackMapping = function() {
		$scope.slack.channel_mappings.push({repo_id: null, channel: null});
	}

	$scope.deleteSlackMapping = function(mapping) {
		var i = $.inArray(mapping, $scope.slack.channel_mappings);
		if(i !== -1) {
			$scope.slack.channel_mappings.splice(i, 1);
		}
	}

	$scope.loadHipchat = function() {
		gc.loading($scope, 'loading_hipchat', gc.hipchat()).then(function(data) {
			$scope.hipchat = data;
		});
	}

	$scope.saveHipchat = function() {
		gc.loading($scope, 'loading_hipchat', gc.hipchatUpdate($scope.hipchat));
	}

	$scope.addHipchatMapping = function() {
		$scope.hipchat.channel_mappings.push({repo_id: null, channel: null});
	}

	$scope.deleteHipchatMapping = function(mapping) {
		var i = $.inArray(mapping, $scope.hipchat.channel_mappings);
		if(i !== -1) {
			$scope.hipchat.channel_mappings.splice(i, 1);
		}
	}

}]);

gitcolonyControllers.controller('LoadingReposCtrl', ['$scope', 'gc', 'gcTutorial', '$analytics', 'layout', function($scope, gc, gcTutorial, $analytics, layout) {
	$scope.updateTutorial = gcTutorial.updateTutorial;
	$scope.tutorialActive = gcTutorial.tutorialActive;
	gcTutorial.init();

	$scope.slide = 0;
	$scope.repos = gc.repos();

	$scope.eventTrack = function(event,args) {
		args = $.extend({company: layout.company() }, args || {} );

		$analytics.eventTrack(event, args);
	}

	$scope.tutoDone = function() {
		updateTutorial('loading_repos');
		$scope.eventTrack(":click done tutorial item", {type: 'loading-repos'});
	}

	$scope.tutoDismiss = function() {
		updateTutorial('loading_repos');
		$scope.eventTrack(":dismiss tips", {type: 'loading-repos'});
	}

	$scope.$watch('status.loaded.repos', function(repos) {
		if (!repos) return;
		var filtered = [];
		for(var i = 0; i < $scope.repos.length ; i ++) {
			var r = $scope.repos[i];
			if(r.status == 'cloning')
				filtered.push(r);
		}
		$scope.repos = filtered;

		$scope.eventTrack('Visit Repo Loading', { count_repos: filtered.length })
	});
}]);

var scopeExec = function(event, f) {
	//pass the event to the current scope of the elemente
	var scope = $(event.target).scope();
	scope.$eval(f);
}

gitcolonyControllers.controller('InstanceUsersCtrl', ['$scope', 'gc', 'message', '$sce', function($scope, gc, message, $sce) {

	gc.serverUsers().then(function(data){
		$scope.users = data.users;
		$scope.licence = data.licence;
	});

	$scope.enableUser = function(index) {
		var user = $scope.users[index];
		if(!user.enable && $scope.licence.used_seats >= $scope.licence.total_seats) {
			message.show('Your team has reached the maximum number of seats available!');
			return;
		}

		user.$working = true;
		gc.enableServerUser(user.id, !user.enabled).then(function() {
			user.enabled = !user.enabled;
			if(user.enabled) {
				++$scope.licence.used_seats;
			} else {
				--$scope.licence.used_seats;
			}
			user.$working = false;
			user.$update();
		}, function() {
			user.$working = false;
			user.$update();
		});
		user.$update();
	}
}]);

gitcolonyControllers.controller('InstanceReposCtrl', ['$scope', 'gc', function($scope, gc) {
	$scope.active_index=0;

	$scope.setActive = function(index) {
		$scope.active_index = index;
	}

	gc.serverRepos().then(function(data){
		$scope.companies = data.companies;
	});

	$scope.deleteRepo = function(company, repo) {
		repo.$working = true;
		gc.deleteServerRepo(repo.id).then(function() {
			company.repos.splice($.inArray(repo, company.repos), 1);
			--company.repos_count;
			repo.$working = false;
		}, function() {
			repo.$working = false;
		});
	}

	$scope.deleteCompany = function(company) {
		company.$working = true;
		gc.deleteServerCompany(company.id).then(function() {
			$scope.companies.splice($.inArray(company, $scope.companies), 1);
			company.$working = false;
		}, function() {
			company.$working = false;
		});
	}
}]);

gitcolonyControllers.controller('InternalMetricsCtrl', ['$scope', 'gc', function($scope, gc) {
	gc.serverMetrics().then(function(data){
		for(var k in data) {
			$scope[k]=data[k];
		}
		$scope.now=moment(new Date()).format('MM/DD/YYYY');
	});
}]);


gitcolonyControllers.controller('TbdCtrl', ['$scope', 'gc', function($scope, gc) {
	// TBD!
}]);
