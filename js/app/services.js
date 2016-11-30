// --- Services ------------------------------------------------------------ //
gitcolony.factory('message', ['$rootScope', '$window', '$timeout', function($rootScope, $window, $timeout) {
	var data = { text: '', show: false, warning: false }
	var tm;
	var message = {
		get:  function() { return data; },
		hide: function() { if (tm) $timeout.cancel(tm); tm = null; data.show = false; },
		show: function(text, warning) {
			if (tm) $timeout.cancel(tm);
			tm = $timeout(function() { data.show = false; tm = null; }, 3000);
			data.text = text;
			data.show = true;
			data.warning = warning;
			$window.scrollTo(0, 0);
		}
	};

	$rootScope.$on('$locationChangeSuccess', function () {
		message.hide();
	});
	return message;
}]);

gitcolony.factory('gcState', [function() {
	var state = { status: { loaded: {} }, notifications: [], repos: [], ranking: [], ranking_all: [], ranking_archives: [], company_stats_details: [], commits: [], };
	var tx = {};

	var gcState = {
		get: function(key) {
			if (!state[key]) state[key] = {};
			return state[key];
		},
		all: function() { return state; },
		update: function(key, value) {
			if (key == 'status') return;
			angular.copy(tx[key] ? tx[key](value) : value, gcState.get(key));
			state.status.loaded[key] = new Date();
		}
	};

	return gcState;
}]);

var COMPANY_ROUTE_REGEXP = /^\/:c\??\/([^:]+)(\/:.*)?$/;

gitcolony.factory('layout', ['$location', '$rootScope', '$route', 'gcState', function($location, $rootScope, $route, gcState) {
	var status = gcState.get('status');

	var company_routes = {};
	$.each($route.routes, function(name) {
		var m = name.match(COMPANY_ROUTE_REGEXP);
		if (m) company_routes[m[1]] = true;
	});

	var data = { show_navbar: true, show_sidebar: true, on_change: [] }

	var layout = {
		get:  function()     { return data; },
		show: function(path, args) {
			if (!args) args = {};
			if (args.company) path = args.company + '/' + path;
			else if (company_routes[path.split('?')[0]] && status.company) path = status.company + '/' + path;
			if (args && args.path) path += '/' + args.path;
			$location.url(path);
		},
		current: function()  {
			var path = $location.path().substring(1);
			if (!$route.current || !$route.current.params.c) return path;
			return path.split('/', 2)[1];
		},
		currentRaw: function() { return $location.path(); },
		change:  function(f) { data.on_change.push(f); },
		params:  function() { return $route.current.params; },
		company: function() { return layout.params()['c']; },
		repo:    function() { return layout.params()['repo']; },
		absUrl:  function() { return $location.absUrl(); }
	};

	$rootScope.$on('$locationChangeSuccess', function () {
		data.path = layout.current();
		data.show_sidebar = data.show_navbar = true;
		switch(data.path) {
			case 'review-commit':
				data.show_sidebar = false;
				break;
		}
		if (layout.currentRaw().indexOf('/create-company' ) ==  0 ||
			layout.currentRaw().match(/\/.+\/setup(\/new)?$/)) {
			data.show_sidebar = false;
		}
		$.each(data.on_change, function() { this(data.path); });
	});

	function setCompany() {
		if (!$route.current) return;
		status.company = $route.current.params.c;
	}

	setCompany();
	layout.change(function() { setCompany(); });

	return layout;
}]);

gitcolony.factory('gcApi', ['$http', '$q', '$timeout', '$window', '$upload', 'gcState', 'message', 'layout', function($http, $q, $timeout, $window, $upload, gcState, message, layout) {
	var status = gcState.get('status');

	var url_prefix = $window.url_prefix || '';

	function requestApi(method, path, original_args) {

		if (!original_args || !original_args.file) return $http[method](path, original_args);

		var args = angular.copy(original_args);
		delete args.file;
		$.each(original_args, function(key, value) { if (key[0] == '$' || value === null) delete args[key]; });

		return $upload.upload({
			url: path,
			method: method,
			withCredentials: true,
			data: args,
			file: original_args.file,
		});

		args = angular.copy(args);
		var file = args.file;
		delete args.file;
		return $upload.upload({
			url: path,
			method: method,
			withCredentials: true,
			data: args,
			file: file
		});
	}

	function request(method, path, args) {
		status.loaded.error = false;
		var company = status.company;
		if (args.with_pull) path = ['pulls',args.with_pull,path].join('/');
		//if (args.with_branch) path = ['branches',args.with_branch,path].join('/');
		if (args.with_repo) path = ['repos',args.with_repo,path].join('/');

		var company = status.company;
		if (args.with_company) { args.company = true; company = args.with_company; }
		if (args.company && company) path = ['companies',company,path].join('/');
		if (args.qs) path += '?'+args.qs;
		var with_loading = (!args.no_loading && !args.silent);
		if (with_loading) {
			status.show_loading = false;
			status.loading      = true;
			$timeout(function() { status.show_loading = with_loading; }, 150);
		}
		return requestApi(method, url_prefix+'/api/'+path, args.args).then(function(result) {
			if (with_loading) { status.loading = false; with_loading = false; }
			var data = result.data;
			if (!data.status || data.status == 'OK') return data;
			if (data.status == 'LOGIN') { $window.location.href = '/?url='+layout.currentRaw(); return $q(function() {}); }
			if (data.status == 'OAUTH') { $window.location.href = data.url+'?url='+layout.currentRaw(); return $q(function() {}); }

			status.loaded.error = true;
			if (!args.silent) message.show((args.error || 'An error has occurred')+': '+data.errors.join(', '), true);
			return $q.reject(data);
		},function(reason) {
			if (with_loading) { status.loading = false; with_loading = false; }
			status.loaded.error = true;
			if (!args.silent) {
				var s = args.error || 'An error has occurred';
				if (reason.data && reason.data.errors) s += ': '+reason.data.errors.join(', ');
				message.show(s, true);
			}
			if (args.redirect_errors && $.inArray(reason.status, args.redirect_errors) != -1) {
				layout.show('dashboard');
			}
			return $q.reject(reason);
		});
	}

	return {
		'request': request
	}
}]);

gitcolony.factory('gcUrl', ['layout', function(layout) {
	function base_url() {
		return layout.absUrl().replace(/[?#].*/, '').replace(/\/$/, '');;
	}

	return {
		reviewCoverageUrl: function(company, repo_id) {
			return [base_url(),'redirect',company,'repos',repo_id].join('/');
		},
		reviewCoverageWidget: function(company, repo_id) {
			return [base_url(),'companies',company,'repos',repo_id].join('/') + '.svg';
		},
	}
}]);

gitcolony.factory('gc', ['$timeout', '$q', 'gcApi', 'gcState', 'message', 'layout', function($timeout, $q, gcApi, gcState, message, layout) {
	var status = gcState.get('status');

	var timeouts = {};

	function updateAll(data) {
		angular.forEach(data, function(value, key) {
			gcState.update(key, data[key]);
			if (timeouts[key]) { $timeout.cancel(timeouts[key]); delete timeouts[key]; }
		});
	}

	function request(path, args) {
		if (!args) args = {};
		var key  = args.key ? args.key : path;
		args.redirect_errors = [ 403 ];
		var call = function() {
			gcApi.request(args.method || 'get', path, args)
			.then(function(data) { updateAll(data); return data; })
			.then(args.callback);
		}
		if (args.timeout) {
			if (timeouts[key]) { $timeout.cancel(timeouts[key]); delete timeouts[key]; }
			timeouts[key] = $timeout(call, args.timeout);
		} else {
			call();
		}
		return gcState.get(key);
	}

	return {
		loading:       function(scope, key, promise) {
			scope[key] = true;
			return promise.then(function(data) {
				scope[key] = false;
				return data;
			}, function(data) { scope[key] = false; return $q.reject(data); });
		},
		get:           function(key) { return gcState.get(key);                              },
		request:       function(path, args) { return request(path, args);                    },
		status:        function() { return status;                                           },
		info:          function() { return request('info', { timeout: 300, no_loading: true }); },
		company:       function() { return request('', { key: 'company', company: true }); },
		profile:       function() { return request('profile');                               },
		badges:        function() { return request('badges');                                },
		repos:         function() { return request('repos', { company: true });              },
		repo:          function(id) { return request('repos/'+id, { key: 'repo', company: true }); },
		notifications: function() { return request('notifications', { timeout: 600, no_loading: true }); },
		rankingArchives: function() { return request('ranking/archives', { company: true }); },
		companyStats:  function() { return request('stats', { key: 'company_stats', company: true }); },
		commit:        function(a,b,c) { return request(['commits',a,b,c].join('/'), { key: 'commit', company: true }); },
		pull:          function(rid,pid,args) { return request(['pulls', rid, pid].join('/'), { key: 'pull', company: true, qs:args }); },
		dashboard:     function() {
			return gcApi.request('get', 'dashboard', {
				company: true,
				error: 'Could not load dashboard'
			});
		},
		updateProfile: function(profile_args, showSave) {
			return gcApi.request('put', 'profile', {
				args: profile_args,
				no_loading: true,
				error: 'Could not save profile'
			}).then(function(data) {
				if(showSave) message.show('Profile updated!');

				var info = gcState.get('info');
				info.name       = data.username;
				info.avatar     = data.avatar;
				info.has_skills = data.has_skills;

				var profile = gcState.get('profile');
				profile.$completion = data.completion;
				profile.$has_avatar = data.has_avatar;
			});
		},
		updateNotifications: function(max_id) {
			return gcApi.request('put', 'notifications/'+max_id, { silent: true, no_loading: true });
		},
		closeIncident: function(id) {
			return gcApi.request('post', ['incident', id, 'close'].join('/'), {
				silent: true,
				no_loading: true,
				company:true
			}).then(function(data){
				gcState.get('info').incidents_count--;
				return data;
			});
		},
		updateIncident: function(id, args) {
			return gcApi.request('post', ['incident', id].join('/'), {
				args:   args,
				silent: true,
				no_loading: true,
				company:true
			});
		},
		incidents: function(show_loading,light) {
			return gcApi.request('get','incidents',
				{
					qs: 'light='+light,
					silent: !show_loading,
					no_loading: !show_loading,
					company:true
				}).then(function(data){
					var open = 0;
					var il = data.incidents || [];
					for (var i = il.length - 1; i >= 0; i--) {
						if(!il[i].closed) open++;
					};
					gcState.get('info').incidents_count = open;
					return data;
				});
		},
		updateTutorial: function(flags) {
			return gcApi.request('put', 'tutorial',
				{
					args: { flags: flags },
					silent: true,
					no_loading: true
				});
		},
		previewCommit: function(company, repo) {
			return request('preview' , {
				with_company: company,
				with_repo:    repo
			});
		},
		skipCommit: function(company, repo) {
			return gcApi.request('post', 'skip', {
				silent:       true,
				no_loading:   true,
				with_company: company,
				with_repo:    repo
			}).then(function(data) {
				gcState.update('preview', data.preview);
			});
		},
		review: function(company, repo, id) {
			return gcApi.request('post', 'review', {
				args:    {'id': id },
				with_company: company,
				with_repo:    repo,
				error:   'Could not load commit'
			}).then(function(data) {
				gcState.update('review', data.review);
			});
		},
		redirectReview: function(id) {
			delete gcState.get('review').id;
			delete status.loaded.review;
			delete status.loaded.commit;
			layout.show('review/commits', { path: id });
		},
		getReview: function() { return gcState.get('review'); },
		reviewCommit: function(company, repo, review_args) {
			return gcApi.request('put', 'review', {
				args:    review_args,
				with_company: company,
				with_repo:    repo,
				error:   'Could not submit review'
			}).then(function(data) {
				gcState.update('reviewFeedback', data.feedback);
				return data;
			});
		},
		commentCommit: function(repo, cid, comment_args) {
			comment_args.id = cid;
			return gcApi.request('put', 'comment', {
				args:    comment_args,
				error:   'Could not submit comment',
				company: true,
				with_repo:    repo,
				no_loading: true
			}).then(function(data) {
				comment_args.id = data.id;
				comment_args.provider_id = data.provider_issue_id;
				return comment_args;
			});
		},
		deleteCommentCommit: function(rid, cid, comment_args) {
			comment_args.id = cid;
			return gcApi.request('delete', ['comment'].join('/'), {
				args:    review_args,
				error:   'Could not delete comment',
				company: true,
				with_repo:    repo,
				no_loading: true
			});
		},
		allRepos: function(company) {
			return gcApi.request('get', 'remote', {
				with_company: company
			});
		},
		syncRepos: function(company, import_args) {
			return gcApi.request('post', 'remote', {
				args:         import_args,
				with_company: company,
				error:        'Could not sync repos'
			});
		},
		collabs: function(page) {
			return gcApi.request('get', 'collabs', {
				qs:         'page='+page,
				company:    true,
				no_loading: (page > 0),
				error:      'Could not load collabs'
			});
		},
		allBranches: function() {
			return gcApi.request('get', 'branches', {
				company: true,
				no_loading: true
			});
		},
		repoBranches: function(repo) {
			return gcApi.request('get', 'branches', {
				company: true,
				with_repo: repo,
				no_loading: true
			});
		},
		companyTeam: function(page) {
			return gcApi.request('get', 'team', {
				qs:         'page='+page,
				company:    true,
				no_loading: (page > 0),
				error:      'Could not load collabs'
			});
		},
		companyRules: function() {
			return gcApi.request('get', 'rules', {
				company:    true,
				error:      'Could not load business rules'
			});
		},
		updateCompanyRules: function(rules) {
			return gcApi.request('put', 'rules', {
				args:       rules,
				company:    true,
				no_loading: true,
				error:      'Could not update business rules'
			});
		},
		updateDefaultReviewers: function(repo_id, reviewers) {
			return gcApi.request('put', 'default_reviewers', {
				args:       {'reviewers': reviewers},
				company:    true,
				with_repo:  repo_id,
				no_loading: true,
				error:      'Could not update default reviewers'
			});
		},
		updateTeam: function(team) {
			return gcApi.request('post', 'team', {
				args:       { collabs: team },
				company:    true,
				no_loading: true,
				error:      'Could not load collabs'
			}).then(function(){
				message.show('Team updated!');
			});
		},
		// === Collab Search Directive ============================= //
		addCollab: function(repo_id, user_id) {
			return gcApi.request('post', ['repos',repo_id,'collabs'].join('/'), {
				args:       {'user_id': user_id },
				no_loading: true,
				company:    true,
				error:      'Could not add collaborator'
			});
		},
		inviteCollab: function(repo_id, email, id) {
			return gcApi.request('post', ['repos',repo_id,'collabs/invite'].join('/'), {
				args:       {'email': email, 'id': id },
				no_loading: true,
				company:    true,
				error:      'Could not send invitation'
			});
		},
		inviteToTeam: function(email, id, roles) {
			return gcApi.request('post', ['team/invite'].join('/'), {
				args:       {email: email, id: id, roles: roles},
				no_loading: true,
				company:    true,
				error:      'Could not send invitation'
			});
		},
		importCollabs: function(repo_id) {
			return gcApi.request('post', ['repos',repo_id,'collabs/import'].join('/'), {
				no_loading: true,
				company:    true,
				error:      'Could not import collaborators'
			});
		},
		importTeam: function() {
			return gcApi.request('post', ['team','import'].join('/'), {
				no_loading: true,
				company:    true,
				error:      'Could not import collaborators'
			});
		},
		// === Collab List Directive =============================== //
		deleteFromTeam: function(user_id) {
			return gcApi.request('delete',['team',user_id].join('/'), {
				no_loading: true,
				company:    true,
				error:      'Could not delete collab'
			});
		},
		deleteCollab: function(repo_id, user_id) {
			return gcApi.request('delete',['repos',repo_id,'collabs',user_id].join('/'), {
				no_loading: true,
				company:    true,
				error:      'Could not delete collab'
			});
		},
		deleteCollabInvite: function(repo_id, invite_id) {
			return gcApi.request('delete', ['repos',repo_id,'collabs/invite',invite_id].join('/'), {
				no_loading: true,
				company:    true,
				error:      'Could not delete invitation'
			});
		},

		file: function(id, path, callback) {
			return gcApi.request('post', 'file', {
				args: {'id': id, path: path },
				no_loading: true,
				error:      'Could not file contents'
			}).then(function(data) { callback(data.lines); });
		},
		predictUsername: function(username) {
			return gcApi.request('get', 'users/predict/'+username, {
				no_loading: true,
				silent: true
			}).then(function(data){ return data.users; });
		},
		ranking: function(qs, key) {
			if (!key) key = 'ranking';
			gcApi.request('get', 'ranking', { company: true, qs: qs }).then(function(data) {
				gcState.update(key, data.ranking);
			});
			return gcState.get(key);
		},
		createCompany: function(company_args) {
			return gcApi.request('post', 'companies', {
				args:  company_args,
				error: 'Could not create company'
			});
		},
		updateCompany: function(company_args) {
			return gcApi.request('put', '', {
				args:       company_args,
				no_loading: true,
				company:    true,
				error:      'Could not save company'
			}).then(function(data) {
				message.show('Company profile updated!');
				gcState.update('info', data.info);
				gcState.get('company').$completion = data.completion;
				gcState.get('company').$avatar     = data.avatar;
				gcState.get('company').$has_avatar = data.has_avatar;
			});
		},
		closeIssue: function(repo_id, issue, args) {
			issue.closing = true;
			return gcApi.request('put', ['issues',issue.id,'close'].join('/'), {
				args: args,
				no_loading: true,
				company:    true,
				with_repo:  repo_id,
				with_pull: issue.parent_id,
				error:      'Could not close the issue'
			}).then(function(data) {
				issue.closing = false;
				issue.state = 'closed';
				issue.status = 'Closed';
				issue.closed = true;
				if(args.resolution) issue.resolution = args.resolution;
				if (data.points.issues) {
					message.show('+'+data.points.issues+' points for closing an issue');
				}
				return data;
			}, function() {
				issue.closing = false;
			});
		},
		openIssue: function(repo_id, issue, args) {
			issue.closing = true;
			return gcApi.request('put', ['issues',issue.id,'open'].join('/'), {
				args: args,
				no_loading: true,
				company:    true,
				with_repo:  repo_id,
				with_pull: issue.parent_id,
				error:      'Could not reopen the issue'
			}).then(function(data) {
				issue.closing = false;
				issue.state = 'open';
				issue.status = 'Open';
				issue.closed = false;
				issue.resolution = null;
				return data;
			}, function() {
				issue.closing = false;
			});
		},
		companyStatsDetails: function(type,page) {
			return gcApi.request('get', 'stats?details='+type+'&page='+page, {
				no_loading: true,
				company:    true
			});
		},
		suggestRepo: function(repo) {
			return gcApi.request('post', 'suggest', {
				args: { repo: repo },
				no_loading: true
			});
		},
		sendFeedback: function(message) {
			return gcApi.request('post', 'feedback', {
				args: { message: message },
				no_loading: true
			});
		},
		remoteRepo: function(company, repo) {
			return gcApi.request('get', 'remote/repos/'+encodeURIComponent(repo), {
				no_loading:   true,
				with_company: company
			});
		},
		pullRequest: function(repo, pull, args) {
			var url_prefix = window.url_prefix || '';
			var company = layout.company();
			var url = url_prefix + ['/api/companies', company, 'repos', repo, 'pulls', pull, 'review'].join('/') + (args ? '?'+args : '');
			var source = new EventSource(url, window.EventSourceParams);
			var deferred = $q.defer();
			var pull = null;

	    source.onmessage = function(e) {
	    	if(!pull) {
	    		//first it's all data except files
	    		var data = JSON.parse(e.data);
	    		pull = data.pull;
	    		deferred.resolve(data);
	    	} else {
	    		//one by one all files
	    		if(!pull.files) pull.files = [];
	    		var file = JSON.parse(e.data);
	    		$timeout(function(){ pull.files.push(file); }); //use timeout to call digest
	    	}
	    };

	    source.onerror=function(e) {
	    	source.close();
	    	if(!pull) deferred.reject('');
	    	if(pull) pull.$loaded=true;
	    }

	    return deferred.promise;
		},
		pullRequest2: function(repo, pull, args) {
			return gcApi.request('get', 'review', {
				qs: args,
				no_loading: !!args,
				company: true,
				with_repo: repo,
				with_pull: pull
			});
		},
		pulls: function(args) {
			return gcApi.request('get', 'pulls', {
				qs: (args || ''),
				company: true,
				no_loading: args && args.match(/page/) && !args.match(/page=0/),
			});
		},
		mergeLinkedPulls: function(from_name) {
			return gcApi.request('post', 'merge_linked_pulls', {
				args: { from_name: from_name },
				company: true,
				no_loading: true,
				error:   'Could not merge pull requests',
			});
		},
		pullRequestSummary: function(repo, pull) {
			return gcApi.request('get', 'summary', {
				no_loading: true,
				silent:     true,
				company:    true,
				with_repo:  repo,
				with_pull: pull
			});
		},
		pullRequestCommits: function(repo, pull, args) {
			return gcApi.request('get', 'commits', {
				qs:         args,
				no_loading: true,
				company:    true,
				with_repo:  repo,
				with_pull: pull
			});
		},
		pullRequestReviews: function(repo, pull) {
			return gcApi.request('get', 'reviews', {
				no_loading: true,
				company:    true,
				with_repo:  repo,
				with_pull: pull
			});
		},
		reviewPullRequest: function(repo, pull, review_args) {
			return gcApi.request('put', 'review', {
				args:    review_args,
				error:   'Could not submit review',
				no_loading: true,
				company: true,
				with_repo: repo,
				with_pull: pull
			});
		},
		pullRequestDone: function(repo, pull, val) {
			return gcApi.request('put', 'done', {
				args:       { done: val },
				error:      'Could mark the pull request as done',
				no_loading: true,
				company:    true,
				with_repo:  repo,
				with_pull: pull
			});
		},
		commentPullRequest: function(repo, pull, comment_args) {
			return gcApi.request('post', 'comment', {
				args:    comment_args,
				error:   'Could not submit comment',
				company: true,
				with_repo: repo,
				with_pull: pull,
				no_loading: true
			}).then(function(data) {
				comment_args.id = data.id;
				comment_args.provider_id = data.provider_issue_id;
				return comment_args;
			});
		},
		updateCommentPullRequest: function(repo, pull, comment_args) {
			return gcApi.request('put', 'comment', {
				args:    comment_args,
				error:   'Could not update comment',
				company: true,
				with_repo: repo,
				with_pull: pull,
				no_loading: true
			});
		},
		resolveCommentPullRequest: function(repo, pull, comment_args) {
			return gcApi.request('post', 'comment/resolve', {
				args:    comment_args,
				error:   'Could not resolve comment',
				company: true,
				with_repo: repo,
				with_pull: pull,
				no_loading: true
			});
		},
		deleteCommentPullRequest: function(repo, pull, comment_id) {
			return gcApi.request('delete', ['comment',""+comment_id].join('/'), {
				error:   'Could not delete comment',
				company: true,
				with_repo: repo,
				with_pull: pull,
				no_loading: true
			});
		},
		repoCollabs: function(repo) {
			return gcApi.request('get', 'collabs', {
				no_loading: true,
				company:    true,
				with_repo:  (repo.id || repo),
				error:      'Could not load repo collabs'
			});
		},
		updateRepo: function(repo, args) {
			return gcApi.request('put', '', {
				args:       args,
				no_loading: true,
				company:    true,
				with_repo:  repo.id,
				error:      'Could not update repo'
			});
		},
		repoFileUrl: function(repo_id, file, company) {
			return '/api/companies/' + (company || status.company) + '/repos/' + repo_id + '/file?file=' + encodeURIComponent(file);
		},
		repoFile: function(repo_id, file) {
			return $.get(this.repoFileUrl(repo_id, file));
		},
		pullRequestFilesTree: function(repo_id, pull) {
			return gcApi.request('get', 'files_tree', {
				no_loading: true,
				company:    true,
				with_repo:  repo_id,
				with_pull: pull,
				error:      'Could get files tree'
			});
		},
		pullRequestConflictFiles: function(repo_id, pull) {
			return gcApi.request('get', 'conflict_files', {
				no_loading: true,
				company:    true,
				with_repo:  repo_id,
				with_pull:  pull,
				error:      'Could get conflict files'
			});
		},
		createPullRequest: function(repo, pull_args) {
			return gcApi.request('post', 'pulls', {
				args:       pull_args,
				error:      'Could not create pull request',
				no_loading: true,
				company:    true,
				with_repo:  repo,
			});
		},
		updatePullRequest: function(repo, pull, pull_args) {
			return gcApi.request('post', '', {
				args:       pull_args,
				error:      'Could not updaet pull request',
				no_loading: true,
				company:    true,
				with_repo:  repo,
				with_pull:  pull,
			});
		},
		predictRepo: function(repo) {
			return gcApi.request('get', ['repos/search',repo].join('/'), {
				error:      'Could not load repositories',
				no_loading: true,
				silent:     true,
				company:    true
			});
		},
		cliToken: function() {
			return gcApi.request('get', 'cli/token', {
				error:      'Could not fetch CLI token',
				no_loading: true,
				silent:     true
			});
		},
		jenkinsRepo: function(repo) {
			return gcApi.request('get', 'jenkins', {
				error:      'Could not load repository',
				no_loading: true,
				silent:     true,
				company:    true,
				with_repo:  repo
			});
		},
		trelloBoards: function() {
			return gcApi.request('get', 'trello', {
				error:      'Could not load trello boards',
				no_loading: true,
				silent:     true,
				company:    true
			});
		},
		trelloUpdate: function(repos) {
			return gcApi.request('post', 'trello', {
				args:       repos,
				error:      'Could not store trello settings',
				no_loading: true,
				silent:     true,
				company:    true
			});
		},
		jira: function() {
			return gcApi.request('get', 'jira', {
				error:      'Could not load jira projects',
				no_loading: true,
				silent:     true,
				company:    true
			});
		},
		jiraUpdate: function(repos) {
			return gcApi.request('post', 'jira', {
				args:       repos,
				error:      'Could not store jira settings',
				no_loading: true,
				silent:     true,
				company:    true
			}).then(function(data){
				message.show('Jira settings updated!');
				return data;
			});
		},
		slack: function() {
			return gcApi.request('get', 'slack', {
				error:      'Could not load slack settings',
				no_loading: true,
				silent:     true,
				company:    true
			});
		},
		slackUpdate: function(slack) {
			return gcApi.request('post', 'slack', {
				args:       slack,
				error:      'Could not store slack settings',
				no_loading: true,
				silent:     true,
				company:    true
			}).then(function(data){
				message.show('Slack settings updated!');
				return data;
			});
		},
		hipchat: function() {
			return gcApi.request('get', 'hipchat', {
				error:      'Could not load Hipchat settings',
				no_loading: true,
				silent:     true,
				company:    true
			});
		},
		hipchatUpdate: function(hipchat) {
			return gcApi.request('post', 'hipchat', {
				args:       hipchat,
				error:      'Could not store Hipchat settings',
				no_loading: true,
				silent:     true,
				company:    true
			}).then(function(data){
				message.show('Hipchat settings updated!');
				return data;
			});
		},
		issue_provider: function(repo) {
			return gcApi.request('get', 'issue_provider', {
				error:      'Could not load issue provider data.',
				no_loading: true,
				silent:     true,
				company:    true,
				with_repo:  repo,
			});
		},
		merge: function(repo, pull, merge_args) {
			return gcApi.request('post', 'merge', {
				args:       merge_args,
				error:      'Could not merge pull request',
				no_loading: true,
				company:    true,
				with_repo:  repo,
				with_pull: pull
			});
		},
		conflictMerge: function(repo, pull, merge_args) {
			return gcApi.request('post', 'conflict_merge', {
				args:       merge_args,
				error:      'Could not merge pull request',
				no_loading: true,
				company:    true,
				with_repo:  repo,
				with_pull: pull
			});
		},
		mergeDest: function(repo, pull, merge_args) {
			return gcApi.request('post', 'merge_dest', {
				args:       merge_args,
				error:      'Could not merge',
				no_loading: true,
				company:    true,
				with_repo:  repo,
				with_pull: pull
			});
		},
		rebase: function(repo, pull, rebase_args) {
			return gcApi.request('post', 'rebase', {
				args:       rebase_args,
				error:      'Could not rebase pull request',
				no_loading: true,
				company:    true,
				with_repo:  repo,
				with_pull: pull
			});
		},
		createTeam: function(team) {
			return gcApi.request('post', 'remote/team', {
				args:       team,
				error:      'Could not create team',
				company:    true
			});
		},
		bookmarkPullRequest: function(repo, pull) {
			return gcApi.request('post', 'bookmark', {
				error:      'Could not bookmark pull request',
				no_loading: true,
				company:    true,
				with_repo:  repo,
				with_pull: pull
			});
		},
		unbookmarkPullRequest: function(repo, pull) {
			return gcApi.request('delete', 'bookmark', {
				error:      'Could not delete pull request bookmark',
				no_loading: true,
				company:    true,
				with_repo:  repo,
				with_pull: pull
			});
		},
		unlinkPullRequest: function(repo, pull) {
			return gcApi.request('post', 'unlink', {
				error:      'Could not unlink pull request',
				no_loading: true,
				company:    true,
				with_repo:  repo,
				with_pull: pull
			});
		},
		setVisibilityPullRequest: function(repo, pulls, visibility) {
			return gcApi.request('post', ['pulls/visibles'].join('/'), {
				args: 		{ pulls: pulls, visibility: visibility },
				error:      'Could change visibility pull requests',
				no_loading: true,
				company:    true,
				with_repo:  repo
			});
		},
		markAsReviewed: function(repo, pulls) {
			return gcApi.request('post', ['pulls/reviewed'].join('/'), {
				args: 		{ pulls: pulls },
				error:      'Could mark as reviewed pull request',
				no_loading: true,
				company:    true,
				with_repo:  repo
			}).then(function(){
				message.show('Marked as reviewed!');
			});
		},
		serverMetrics: function() {
			return gcApi.request('get', 'server/metrics', {
				error:      'Could not get metrics'
			});
		},
		serverUsers: function() {
			return gcApi.request('get', 'server/users', {
				error:      'Could not get users'
			});
		},
		enableServerUser: function(user_id, enable) {
			return gcApi.request('post', ['server/user', user_id, enable ? 'enable' : 'disable'].join('/'), {
				error:      (enable ? 'Could not activate user' : 'Could not deactivate user'),
				no_loading: true,
			});
		},
		serverRepos: function() {
			return gcApi.request('get', 'server/repos', {
				error:      'Could not get repos'
			});
		},
		deleteServerRepo: function(repo_id) {
			return gcApi.request('delete', ['server/repo', repo_id].join('/'), {
				error:      'Could not delete repo',
				no_loading: true,
			});
		},
		deleteServerCompany: function(company_id) {
			return gcApi.request('delete', ['server/company', company_id].join('/'), {
				error:      'Could not delete company',
				no_loading: true,
			});
		},
		serverLicence: function() {
			return gcApi.request('get', 'server/licence', {
				error:      'Could not get licence'
			});
		},
		deleteRepo: function(repo_id) {
			return gcApi.request('delete', '', {
				error:      'Could not delete this repository',
				no_loading: true,
				company:    true,
				with_repo:  repo_id
			});
		},
		deleteUser: function() {
			return gcApi.request('delete', 'profile', {
				error:      'Could not delete this user',
				no_loading: true
			});
		},
		deleteCompany: function() {
			return gcApi.request('delete', '', {
				error:      'Could not delete this company',
				no_loading: true,
				company:    true
			});
		},
	};
}]);

gitcolony.factory('gcTutorial', ['gc', function(gc) {
	var TUTORIAL_FLAGS = {
			intro: 1,
			branches: 2,
			pulls: 4,
			incidents: 8,
			activities: 16,
			loading_repos: 32,
			reviews : 64,
			search: 128,
			navigate: 256,
			files: 512,
			linked_pulls: 1024,
			shortcuts: 2048,
	}

	var info = {};

	var gcTutorial = {
		updateTutorial: function(flag_name) {
			var flag = TUTORIAL_FLAGS[flag_name];
			return gc.updateTutorial(flag).then( function() {
				info.tutorial_flags |= flag;
			});
		},
		tutorialActive: function(flag_name) {
			if(info.tutorial_flags === undefined) return false;
			return (info.tutorial_flags&TUTORIAL_FLAGS[flag_name]) == 0;
		},
		init: function() {
			info = gc.get('info');
		}
	};

	gcTutorial.init();

	return gcTutorial;
}]);
