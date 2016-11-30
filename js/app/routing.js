gitcolony.config(['$routeProvider', function($routeProvider) {
	$routeProvider.

	when('/rc/:path*', {
		redirectTo:  function() {
			var company = localStorage.current_company;
			return company ? "/"+company+"/" + location.hash.split('/rc/')[1]: "/loading";
		}
	}).
	when('/:c/dashboard/:onboard?', {
		templateUrl: 'partials/dashboard.html',
		controller: 'DashboardCtrl',
		event: 'Dashboard'
	}).
	when('/:c/repos2', {
		templateUrl: 'partials/repos.html',
		controller: 'ReposCtrl',
		event: 'Repos List'
	}).
	when('/:c/repos', {
		templateUrl: 'partials/collab-repo.html',
		controller: 'CollabCtrl',
		event: 'Collaborators'
	}).
	when('/:c/collaborators', {
		templateUrl: 'partials/collaborators.html',
		controller: 'TeamCtrl',
		event: 'Team'
	}).
	when('/:c/gc-instance-users', {
		templateUrl: 'partials/gc-instance-users.html',
		controller: 'InstanceUsersCtrl'
	}).
	when('/:c/gc-instance-repositories', {
		templateUrl: 'partials/gc-instance-repositories.html',
		controller: 'InstanceReposCtrl'
	}).
	when('/:c/gc-internal-metrics', {
		templateUrl: 'partials/gc-internal-metrics.html',
		controller: 'InternalMetricsCtrl'
	}).	
	when('/:c/settings', {
		templateUrl: 'partials/company.html',
		controller: 'CompanyCtrl',
		event: 'Company Settings'
	}).
	when('/:c/business-rules', {
		templateUrl: 'partials/business-rules.html',
		controller: 'BusinessRulesCtrl',
		event: 'Business Rules'
	}).	
	when('/:c/ranking', {
		templateUrl: 'partials/ranking.html',
		controller: 'RankingCtrl'
	}).
	when('/terms-and-conditions', {
		templateUrl: 'partials/terms-and-conditions.html',
		controller: 'TbdCtrl'
	}). 
	when('/:c/loading-repos', {
		templateUrl: 'partials/loading-repos.html',
		controller: 'LoadingReposCtrl'
	}).
	when('/:c/achievements', {
		templateUrl: 'partials/achievements.html',
		controller: 'AchievementsCtrl'
	}). 
	when('/markdown', {
		templateUrl: 'partials/markdown.html',
		controller: 'TbdCtrl'
	}). 
	when('/:c/review-pull/:repo/:pull/:tab?', {
		templateUrl: 'partials/branch.html',
		controller: 'PullReviewCtrl',
		event: "Pull request detail",
		reloadOnSearch: false
	}).
	when('/:c/pulls', {
		templateUrl: 'partials/pulls.html',
		controller: 'PullRequestListCtrl',
		event: 'Pull Request List'
	}).
	when('/:c/stats', {
		templateUrl: 'partials/company-stats.html',
		controller: 'CompanyStatsCtrl',
		event: 'Company Stats'
	}).
	when('/:c/setup/:new?', {
		templateUrl: 'partials/create-company.html',
		controller: 'CompanySetupCtrl'
	}).
	when('/:c/integrations', {
		templateUrl: 'partials/integrations.html',
		controller: 'IntegrationCtrl',
		event: 'Internal integrations page'

	}).
	when('/:c/no-repo', {
		templateUrl: 'partials/no-repo.html',
		controller: 'TbdCtrl'
	}).
	when('/:c:/no-branch', {
		templateUrl: 'partials/no-branch.html',
		controller: 'TbdCtrl'
	}).
	when('/:c/profile', {
		templateUrl: 'partials/profile.html',
		controller: 'ProfileCtrl',
		event: 'Profile'
	}).
	when('/:c/diff-configuration', {
		templateUrl: 'partials/diff-configuration.html',
		controller: 'TbdCtrl'
	}).
	when('/:c/email-notifications', {
		templateUrl: 'partials/email-notifications.html',
		controller: 'EmailPreferencesCtrl',
		event: 'Email Settings'
	}).
	when('/:c/incidents', {
		templateUrl: 'partials/incidents.html',
		controller: 'IncidentsViewCtrl',
		event: 'Incidents'
	}).

	// Routes without company
	when('/loading', {
		controller:  'LoadingCtrl'
	}).
	when('/create-company/:name?/:email?', {
		templateUrl: 'partials/create-company.html',
		controller: 'CompanyCreateCtrl',
		event: 'Create Company Step - 1'
	}).
	when('/no-company', {
		templateUrl: 'partials/no-company.html',
		controller: 'TbdCtrl'
	}).
	when('/', {
		redirectTo:  function() {
			var company = localStorage.current_company;
			return company ? "/"+company+"/dashboard": "/loading";
		}
	}).
	otherwise({ redirectTo: '/' });
}]);
