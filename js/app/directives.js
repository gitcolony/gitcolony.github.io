// --- Filters ------------------------------------------------------------- //
gitcolony.filter('capitalize', function() {
    return function(input, all) {
      return (!!input) ? (input.charAt(0).toUpperCase() + input.substr(1).toLowerCase()) : '';
    }
});
// --- Directives ---------------------------------------------------------- //
gitcolony.directive("repeatComplete", ['$rootScope', function( $rootScope ) {
	var uuid = 0;
	function compile( tElement, tAttributes ) {
		var id = ++uuid;
		tElement.attr( "repeat-complete-id", id );
		tElement.removeAttr( "repeat-complete" );
		var completeExpression = tAttributes.repeatComplete;
		var parent = tElement.parent();
		var parentScope = ( parent.scope() || $rootScope );
		var unbindWatcher = parentScope.$watch(function() {
			var lastItem = parent.children( "*[ repeat-complete-id = '" + id + "' ]:last" );
			if (!lastItem.length ) return;
			var itemScope = lastItem.scope();
			if ( itemScope.$last ) {
				unbindWatcher();
				itemScope.$eval( completeExpression );
			}
		});
	}
	return({
		compile: compile,
		priority: 1001,
		restrict: "A"
	});
}]);

gitcolony.directive("gcSkillsItem", function() {
	return({
		link: function(scope, element, attrs) {
			if (scope.skill.has) element.addClass('have');
			element.attr("title", "You "+(scope.skill.has ? "" : "don't ")+"have this skill");
			element.tooltip();
		}
	});
});

gitcolony.directive("gcTooltip", function() {
	return({
		restrict: 'A',
		scope: { tooltip: '@gcTooltip', observe: "@observe" },
		link: function(scope, element, attrs) {

			var initialized = false;
			element.hover(function(){
				if(initialized) return;
				initialized = true;
				if (!attrs.placement) element.attr("data-placement","bottom");

				if(!element.attr("data-toggle"))
					element.attr("data-toggle","tooltip");

				element.attr("title",scope.tooltip).tooltip('show');
				if(scope.observe=="true"){
					attrs.$observe('gcTooltip', function(tooltip){
		        if (!tooltip) return;
						element.attr("data-original-title",tooltip).tooltip('fixTitle').tooltip();
		      });
				}
			});
		}
	});
});

gitcolony.directive("gcSkills", function() {
	return({
		restrict: "A",
		template: '<span ng-repeat="skill in skills" gc-skills-item class="skill tag" data-toggle="tooltip" data-placement="bottom">{{skill.name}}</span> ',
		scope: { skills: '=gcSkills' },
		priority: 1001
	});
});

gitcolony.directive("gcTimezone", function() {
	return({
		restrict: "A",
		scope: { tz: '=gcTimezone', id: '=' },
		template: '<select id="{{id}}" class="form-control" ng-model="tz" ng-options="o.value as o.label for o in zones"></select>',
		link: function(scope, element, attrs) {
			if (scope.tz == undefined) scope.tz = 0;
			scope.zones = [
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
		}
	});
});

gitcolony.directive("gcDate", function() {
	return({
		restrict: 'A',
		scope: { gcDate: '=' },
		link: function(scope, element, attrs) {
			function displayDate() { return moment(scope.gcDate).format('YYYY-MM-DD'); }
			function displayName2() { return moment(scope.gcDate).format('DD/MMM/YYYY'); }
			function displayName() { return moment(scope.gcDate).format('MMM DD YYYY'); }
			function displayRel()  { return moment(scope.gcDate).fromNow(); }
			function displayBoth() { return [displayDate(),displayRel()].join(' - '); }
			var f = displayBoth;
			switch (attrs.display) {
				case 'date': f = displayDate; break;
				case 'rel':  f = displayRel;  break;
				case 'name':  f = displayName;  break;
				case 'name2':  f = displayName2;  break;
			}
			scope.$watch('gcDate', function() {
				element.text(scope.gcDate ? f() : (attrs.na || ''));
			});
		}
	});
});

gitcolony.directive("gcLineComment", function() {
	return({
		link: function(scope, element, attrs) {
			var target_class = element.hasClass('comment') ? '.diff-line' : '.comment';
			function target() { return element.parents('.file').find(target_class+'[data-line="'+attrs.offset+'"]'); }
			element.hover(function() { target().addClass('comment-hover'); }, function() { target().removeClass('comment-hover'); });
			element.bind('$destroy', function() { target().removeClass('comment-hover'); });
		},
		priority: 900
	});
});

gitcolony.directive("gcDiffSpacer", function() {
	return({
		scope: {
			gcDiffSpacer: '='
		},
		link: function(scope, element, attrs) {
			scope.$watch('gcDiffSpacer', function(spacer) {
				if (!spacer) {
					if (element.spacer) element.spacer.remove();
					return;
				}
				element.spacer = $("<tr class='diff-spacer'><td colspan='"+element.find('td').length+"'> </td></tr>");
				element.after(element.spacer);
			});
		},
		priority: 900
	});
});

var EMAIL_REGEXP = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
gitcolony.directive('gcEmail', function() {
	return {
		require: 'ngModel',
		link: function(scope, elm, attrs, ctrl) {
			ctrl.$parsers.unshift(function(viewValue) {
				if (!viewValue || EMAIL_REGEXP.test(viewValue)) {
					ctrl.$setValidity('gcEmail', true);
					return viewValue;
				} else {
					ctrl.$setValidity('gcEmail', false);
					return undefined;
				}
			});
		}
	};
});

var USERNAME_REGEXP = /^[A-Z0-9\-]{3,}$/i;
gitcolony.directive('gcUsername', ['gcState','gc', 'gcApi', function(gcState, gc, gcApi) {
	return {
		require: 'ngModel',
		scope: { gcUsername: '=' },
		link: function(scope, elm, attrs, ctrl) {
			ctrl.$parsers.unshift(function(viewValue) {
				if (USERNAME_REGEXP.test(viewValue)) {
					ctrl.unique = null;
					ctrl.$setValidity('gcUsername', true);
					return viewValue;
				} else {
					ctrl.$setValidity('gcUsername', false);
					return undefined;
				}
			});
			elm.bind('blur', function (e) {
				var currentValue = elm.val();
				if (!ctrl || !currentValue || ctrl.unique) return;
				var path = 'users';
				var company = gcState.get('status').company || 'new';
				if (attrs.company) path = ['companies',company,'check'].join('/');
				gc.loading(scope, 'gcUsername', gcApi.request('get', path + '/'+currentValue, { no_loading: true }))
				.then(function(data) {
					ctrl.unique = !data.taken;
					ctrl.$setValidity('gcUsernameUnique', ctrl.unique);
				});
			});
			elm.bind('keyup', function (e) {
				var val = elm.val();
				if(val.indexOf(' ') != -1)
					elm.val(val.replace(/\s/g, '-'));
			});
		}
	};
}]);

gitcolony.directive("gcFeedback", ['$modal', 'gc', function($modal, gc) {
	return({
		restrict: 'A',
		scope: {},
		link: function(scope, element, attrs) {
			element.bind('click', function(e) {
				e.stopImmediatePropagation();
				e.preventDefault();
				scope.$apply(function() {
					var ctx = {};
					$modal.open({
						templateUrl: 'feedbackModal.html',
						controller: 'GcFeedbackModalCtrl',
						resolve: { ctx: function() { return ctx; } }
					}).result.then(function () {
						gc.sendFeedback(ctx.message);
					});
				});
			});
		}
	});
}]);
gitcolony.controller('GcFeedbackModalCtrl', ['$scope', '$modalInstance', 'ctx', function($scope, $modalInstance, ctx) {
	$scope.ok     = function () { ctx.message = $scope.message; $modalInstance.close(); };
	$scope.cancel = function () { $modalInstance.dismiss('cancel'); };
}]);

gitcolony.directive("gcConfirm", ['$modal', function($modal) {
	return({
		restrict: 'A',
		scope: { gcConfirm: '&', confirmIf: '&' },
		link: function(scope, element, attrs) {
			element.bind('click', function(e) {

				e.stopImmediatePropagation();
				e.preventDefault();

				if(attrs.confirmIf && !scope.confirmIf()) {
					return scope.gcConfirm(); //no confirmation needed same as ng-click
				}

				scope.$apply(function() {
					$modal.open({
						templateUrl: 'confirmModal.html',
						controller: 'ConfirmModalCtrl',
						resolve: {
							message: function() { return attrs.confirm; },
							yesClass: function() { return attrs.yesClass; }
						}
					}).result.then(function () {
						scope.gcConfirm();
					});
				});
			});
		}
	});
}]);

gitcolony.controller('ConfirmModalCtrl', ['$scope', '$modalInstance', 'message', 'yesClass', function($scope, $modalInstance, message, yesClass) {
	$scope.message  = message;
	$scope.yesClass = yesClass;
	$scope.ok     = function () { $modalInstance.close(); };
	$scope.cancel = function () { $modalInstance.dismiss('cancel'); };
}]);

gitcolony.directive("gcAlert", ['$modal', function($modal) {
	return({
		restrict: 'A',
		scope: { gcAlert: '&' },
		link: function(scope, element, attrs) {
			element.bind('click', function(e) {
				e.stopImmediatePropagation();
				e.preventDefault();

				scope.$apply(function() {
					$modal.open({
						templateUrl: 'alertModal.html',
						controller: 'AlertModalCtrl',
						resolve: {
							message: function() { return attrs.message; },
							yesClass: function() { return attrs.yesClass; }
						}
					}).result.then(function () {
							scope.gcAlert();
						});
				});
			});
		}
	});
}]);

gitcolony.controller('AlertModalCtrl', ['$scope', '$modalInstance', 'message', 'yesClass', function($scope, $modalInstance, message, yesClass) {
	$scope.message  = message;
	$scope.yesClass = yesClass;
	$scope.ok     = function () { $modalInstance.close(); };
}]);

gitcolony.directive("gcLink", ['layout', function(layout) {
	return({
		restrict: 'A',
		scope: { gcLink: '@gcLink', company: '=' },
		link: function(scope, element, attrs) {
			element.attr('href', '#'+attrs.gcLink)
			element.bind('click', function(e) {
				e.stopImmediatePropagation();
				e.preventDefault();
				scope.$apply(function() {
					layout.show(scope.gcLink, {company: scope.company});
				});
			});
		}
	});
}]);

gitcolony.directive("gcAvatar", [function() {
	return({
		restrict: 'A',
		scope: {
			gcAvatar: '=',
			defaultAvatar: '@',
			currentAvatar: '=',
			gcAction: '@'
		},
		controller: 'AvatarCtrl',
		templateUrl: 'widgets/gc-avatar.html',
		link: function(scope, element, attrs) {
			element.addClass('picture-holder fileinput fileinput-new').attr('data-provides', 'fileinput');
			element.fileinput();
			scope.element = element;
		}
	});
}]);
gitcolony.controller('AvatarCtrl', ['$scope', '$timeout', 'gc', function($scope, $timeout, gc) {
	$scope.selectFile = function(file) {
		if (!file) return;
		gc[$scope.gcAction]({'file': file, has_avatar: true }).then(function() {
			$scope.gcAvatar.$has_avatar = true;
		});
		$timeout(function() {
			var img = $scope.element.find('.fileinput-preview img');
			$scope.element.toggleClass('landscape', img.width() > img.height());
			$scope.element.toggleClass('portrait' , img.width() < img.height());
		},100);
	}
	$scope.remove = function() {
		$scope.gcAvatar.$has_avatar = false;
		$scope.element.fileinput('clear');
		gc[$scope.gcAction]({has_avatar: false });
	}
}]);

gitcolony.directive("gcPoints", [function() {
	return({
		restrict: 'A',
		scope: { points: '=gcPoints', noPlus: '=' },
		templateUrl: 'gcPoints.html'
	});
}]);

gitcolony.directive("gcPointsProgress", ['$timeout', function($timeout) {
	return({
		restrict: "A",
		scope: { points: '=gcPointsProgress' },
		link: function(scope, element, attrs) {
			function delayedSetup() {
				$timeout(function() { setup(); }, 50);
			}
			function setup() {
				if (!$(element).is(':visible')) {
					delayedSetup();
					return;
				}
				var progress = scope.points.progress;
				var color;
				if      (progress <  50) color = '#96d9e6';
				else if (progress < 100) color = '#53b8d4';
				else if (progress < 150) color = '#1481b0';
				else                     color = '#003250';
				$(element).val(scope.points.total).attr('data-fgColor', color).knob({
					"width":'40%',
					"skin":'tron',
					"thickness":'0.3',
					"max": scope.points.next,
					"displayPrevious":true,
					"readOnly":true
				}).trigger('change');
			}
			scope.$watch('points', function() {
				if (!scope.points) return;
				delayedSetup();
			});
		}
	});
}]);


gitcolony.directive("gcUser", [function() {
	return({
		restrict: 'A',
		scope: { user: '=gcUser' },
		templateUrl: 'gcUser.html',
		controller: 'GcUserCtrl',
		link: function(scope, element, attrs) {
			scope.size = attrs.size || 45;
			switch (scope.size) {
				case 'large': scope.size = 80; break;
				case 'mid':   scope.size = 45; break;
				case 'small': scope.size = 27; break;
				case 'tiny':  scope.size = 18; break;
			}
			scope.display = {};
			scope.avatarClass = attrs.avatarClass;
			scope.usernameClass = attrs.usernameClass;
			$.each((attrs.display || 'avatar username').split(' '), function() {
				scope.display[this] = true;
			});
			if(scope.display['avatar'] && scope.display['username']) scope.display['notooltip']=true;
			scope.link = !scope.display['nolink'];
			if (scope.link) {
				scope.$watch('user.link', function() {
					scope.link = ((scope.user||{}).link !== false);
				});
			}
		}
	});
}]);
gitcolony.controller('GcUserCtrl', ['$scope', function($scope) {
	$scope.url = function() {
		var url = ($scope.user ||{}).avatar || '/img/avatar-default.jpg';
		var s = $scope.size;
		if (s > 80) return url;
		if (s > 45) s = 'large_';
		else if (s > 27) s = 'mid_';
		else s = 'small_';
		return url.replace(/\/(avatar\.[^\/]+)$/, '/'+s+'$1');
	}

	$scope.$watch('user',function() {
		if(!$scope.user) return;
		$scope.displayName = $scope.user.username;
	})
}]);

gitcolony.directive("gcDiff", [function() {
	return({
		restrict: 'A',
		scope: {
			review:   '=',
			commit:   '=gcDiff',
			info:     '=',
			onCloseIssue: '&',
      onOpenIssue: '&',
			collabs: '=',
			unified: '=',
			onDeleteComment: '&',
			onUpdateComment: '&',
			onReplyComment: '&',
		},
		controller: 'GcDiffCtrl',
		templateUrl: 'widgets/gc-diff.html'
	});
}]);
gitcolony.directive("gcDiffChange", [function() {
	return({
		restrict: 'A',
		scope: { change: '=gcDiffChange' },
		link: function(scope, element, attrs) {
			function update() {
				if (!scope.change) return;
				if (scope.change.html) element.html(scope.change.html);
				else element.text(scope.change.text);
			}
			scope.$watch('change.text', function() { update() });
			scope.$watch('change.html', function() { update() });
		}
	});
}]);
gitcolony.controller('GcDiffCtrl', ['$scope', '$timeout', '$location', 'gc', 'gcHighlight', '$document', '$q', 'layout', function($scope, $timeout, $location,gc, gcHighlight, $document, $q, layout) {
	function mergeDiff(current_diff, lines) {
		// <lines> is the full modified file
		var diff = [];
		var o_index = 0;
		var m_index = 0;
		$.each(current_diff.concat([null]), function(i, change) {
			var m_line = change ? ((change.modified.line || 1)-1) : (lines.length - 1);
			if (m_line > m_index) {
				// lines[m_index..m_line] must be inserted before <change>
				diff = diff.concat($.map(lines.slice(m_index, m_line), function(v, i) {
					return {
						type: 'none',
						original: { line: o_index+i+1, text: v },
						modified: { line: m_index+i+1, text: v },
						extra: true
					};
				}));
				m_index += m_line;
				o_index += m_line;
			}
			if (!change) return;

			diff.push(angular.copy(change));

			switch (change.type) {
				case 'add': m_index = change.modified.line; break;
				case 'del': o_index = change.original.line; break;
				default:
					m_index = change.modified.line;
					o_index = change.original.line;
			}
		});

		// Recompute gaps after merge
		if (diff.length > 1) {
			var current = diff[0];
			$.each(diff.slice(1), function() {
				if (abs(this.modified.line - current.modified.line) <= 1 ||
					abs(this.original.line - current.original.line) <= 1) {
					delete current.gap;
				} else {
					current.gap = true;
				}
				current = this;
			});
			delete diff[diff.length-1].gap;
		}
		return diff;
	}

	$scope.getFile = function(file) {
		if (file.full_diff) return;
		gc.file($scope.commit.id, file.path, function(lines) {
			file.full_diff = mergeDiff(file.diff, lines);
		});
	}
	$scope.toggleFileDiff = function(file) {
		file.show_full = !file.show_full;
		if (file.show_full) $scope.getFile(file);
	}

	$scope.openFileDiff = function(file) {
		$scope.commit.fileCommands.openFile(file.path);
	}

	function highlightLine(file, lang, line) {
		if(line.html || (line.parts && line.parts.length > 0 && line.parts[0].html)) return;
		if (line.parts) {
			$.each(line.parts, function() { highlightLine(file, lang, this); });
		} else if (line.text) {
			line.html = gcHighlight.highlight(file.path, line.text, lang);
		}
	}

	function highlightChange(file, lang, change) {
		highlightLine(file, lang, change.original);
		highlightLine(file, lang, change.modified);
	}

	function highlightChunk(file, lang, chunk) {
		var current = chunk.splice(0, 2000);
		$.each(current, function() { highlightChange(file, lang, this); });
		if (chunk.length) setTimeout(function() { highlightChunk(file, lang, chunk); }, 500);
	}

	function highlight(file, diff) {
		if (diff.highlight) return;
		diff.highlight = true;
		var lang = file.skills[0] && file.skills[0].name || file.path.split('.').pop();
		if (!lang) return;
		highlightChunk(file, lang, diff.slice()); // shallow copy
	}

	function fileDiff(file) {
		if (!file.diff_with_offset) {
			for(var i = 0; i < file.diff.length; ++i) {
				file.diff[i].offset = i;;
			}
			file.diff_with_offset = true;
		}
		var diff = (file.show_full && file.full_diff) ? file.full_diff : file.diff;
		if($scope.commit.highlightEnabled){
			highlight(file, diff);
		}
		return diff;
	}

	var entityMap = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': '&quot;',
		"'": '&#39;',
		"/": '&#x2F;'
	};

	function escapeHtml(string) {
		return String(string).replace(/[&<>"'\/]/g, function (s) {
			return entityMap[s];
		});
	}

	function diffLineTr(line, file, file_index, type) {
		return '<tr class="' + (type || line.type) + ' diff-line ' + lineClass(file, line) + '" data-offset="'+ line.offset + '" data-line="'+ line.modified.line +'" data-file="' + file_index + '">';;
	}

	function renderCodeLine(code, css) {
		var he = $scope.commit.highlightEnabled || code.image;
		var buf = '';
		var spanClass = code.image ? 'bg-img' : '';
		if(code.text !== null) {
			buf+= '<td class="text ' + css + '" colspan="'+ ($scope.unified ? 3 : 1 )+'">';
			if(code.parts) {
				for(var j = 0; j < code.parts.length; j++) {
					var part = code.parts[j] || {text:''};
					buf += '<span class="part ' + part.type + '">' + (part.html&&he ? part.html : escapeHtml(part.text)) + '</span>';
				}
			} else {
				buf += '<span class="' + spanClass + '">' + (code.html&&he ? code.html : escapeHtml(code.text)) + '</span>';
			}
			buf += '</td>';
		}
		return buf
	}

	function splitDiffLine(line, file, file_index) {
		var imageUpd = line.image && line.type == 'upd';

		var oriCss = imageUpd ? ' del' : '';
		var modCss = imageUpd ? ' add' : '';

		return diffLineTr(line, file, file_index, !imageUpd ? line.type : ' ') +

			'<td class="line">' + (line.original.text !== null ? line.original.line : '&nbsp;') + '</td>' +
			(line.original.text !== null ? renderCodeLine(line.original, 'original' + oriCss ) : '<td class="text blank">&nbsp;</td>')+

			'<td class="spacer"></td>' +

			'<td class="line">' + (line.modified.text !== null ? line.modified.line : '&nbsp;') + '</td>' +
		    (line.modified.text !== null ? renderCodeLine(line.modified, 'modified' + modCss) : '<td class="text blank">&nbsp;</td>')+

			'</tr>';
	}

	function unifiedDiffLine(line, file, file_index) {
		var buf = '';

		if(line.type == 'none' || line.type == 'del' || line.type == 'upd') {
			buf +=
			diffLineTr(line, file, file_index, line.type=='upd' ? 'del' : line.type) +

			'<td class="line">' + (line.original.text !== null ? line.original.line : '&nbsp;') + '</td>' +
			'<td class="line">' + (line.type == 'none' ? line.modified.line : '&nbsp;') + '</td>' +
			(line.original.text !== null ? renderCodeLine(line.original, 'original') : '') +

			'</tr>';
		}

		if(line.type == 'add' || line.type == 'upd') {
			buf +=
				diffLineTr(line, file, file_index, line.type=='upd' ? 'add' : line.type) +

				'<td class="line">&nbsp;</td>' +
				'<td class="line">' + line.modified.line  + '</td>' +
				(line.modified.text !== null ? renderCodeLine(line.modified, 'modified') : '') +

				'</tr>';
		}
		return buf;
	}

	$scope.moreLines= function(file_index, offset) {
		var file = $scope.commit.files[file_index];

		var diff = file.diff;
		var prev_line = offset > 0 ? diff[offset-1] : {modified: {line: 0}} ;
		var line = diff[offset] || {modified: {line:  prev_line.modified.line + 20}, original: {line: prev_line.original.line + 20}};
		var lines_count = Math.min(line.modified.line - prev_line.modified.line - 1, 20);
		var gap = lines_count > 20;
		lines_count = Math.min(line.modified.line - prev_line.modified.line - 1, 20);

		var first = line.modified.line - lines_count - 1;
		var o = line.original.line - lines_count;
		var m = line.modified.line - lines_count;

		var fname = $scope.commit.head_sha+':'+file.path;
		gc.repoFile($scope.commit.repo_id, fname).then(function(body) {
			body = body.split('\n');
			file.eof = file.eof || body.length < first + lines_count + 1;
			var body = body.slice(first, first + lines_count);
			var newLines = [];
			lines_count = Math.min(lines_count, body.length);

			for(var i = 0; i < lines_count; i++, m++, o++) {
				var text = body[i];
				newLines.push({original:{line: o, text: text}, modified:{line: m, text: text}, type:'none', gap: gap && i==0});
			}
			var args = [offset, 0].concat(newLines);
			Array.prototype.splice.apply(diff, args);

			file.$rendered=false;
			diff.highlight = false;
			file.diff_with_offset = false;

			for (var i = file.comments.length - 1; i >= 0; i--) {
				file.comments[i].gap = null;
			}

			$('tbody[data-file="'+file_index+'"]').each(function() {
				var table = $(this);
				$scope.scrollTop = $(window).scrollTop();
				$scope.renderDiff(file_index, true);
			});
		});
	}


	function fileHtml(file, file_index) {
		var lineRenderer = $scope.unified ? unifiedDiffLine : splitDiffLine;
		var buf = "";
		var fdiff = fileDiff(file);
		var prev_line = null;
		var lines_length = fdiff.length;
		var gap = 0;

		//if the first row is a gap destroys the width of the columns
		//add an empty row to mantain widths
		buf += $scope.unified ?
										('<tr class="expand-line" style="height: 1px">'+
											'<td class="line"></td>'+
											'<td class="line"></td>'+
											'<td class="text"></td>'+
											'<td class="text"></td>'+
										'</tr>')
							:
										('<tr class="expand-line" style="height: 1px">'+
											'<td class="line"></td>'+
											'<td class="text"></td>'+
											'<td class="spacer"></td>'+
											'<td class="line"></td>'+
											'<td class="text"></td>'+
										'</tr>');

		for(var i = 0; i < lines_length; i++) {
			var line = fdiff[i];

			if((!prev_line && line.modified && line.modified.line > 1) || ( prev_line && prev_line.gap )) {

					prev_line = prev_line || {modified: {line: 0}};
					var lines_count = line.modified.line - prev_line.modified.line - 1;
					if(lines_count > 0) {
						gap++;
						var opened_comments = 0;
						var closed_comments = 0;
						var fline = line.modified.line - lines_count;
						for (var j = file.comments.length - 1; j >= 0; j--) {
							var c = file.comments[j];
							var o = file.comments[j].offset - fline;
							if( o >= 0 && o < lines_count) {
								c.gap = gap;
								if(c.closed) {
									closed_comments++;
								} else {
									opened_comments++
								}
							}
						}
						var g = file_index + '-' + gap;
						buf +=
									'<tr class="expand-line"><td colspan="5"><table class="diff review" width="100%">' +
										'<tbody gap="'+ g +'">' +
											'<tr class="expand-line">' +
												'<td colspan="'+ ($scope.unified ? 2 : 1) +'" rowspan="'+ (opened_comments+1) +'" class="text-center line" onclick="scopeExec(event, \'moreLines(' + file_index + ','+ i + ','+ file_index  + ')\')"><i class="icon-unfold"></i></td>' +
												'<td colspan="'+ ($scope.unified ? 3 : 4) +'"><div class="txt-summary"><strong>'+ lines_count +'</strong> more lines'+(closed_comments > 0 ? ' and <strong>'+ closed_comments + '</strong> resolved comments' : '')+'</div></td>' +
											'</tr>' +
										'</tbody>' +
									'</table></td></tr>';
					}
			}

			buf += lineRenderer(line, file, file_index);

			prev_line = line;

		}

		if(lines_length && prev_line && prev_line.modified && file.metadata){
			file.eof = file.eof || prev_line.modified.line >= file.metadata.lines -1; // -1 is a hack. It is common that the last line is blank.
		}

		if(lines_length && !file.eof) {
			//final lines expand
			prev_line = prev_line || {modified: {line: 0}};
			gap++;
			var opened_comments = 0;
			var closed_comments = 0;
			var fline = prev_line.modified.line;
			for (var j = file.comments.length - 1; j >= 0; j--) {
				var c = file.comments[j];
				var o = file.comments[j].offset - fline;
				if( o > 0) {
					c.gap = gap;
					if(c.closed) {
						closed_comments++;
					} else {
						opened_comments++
					}
				}
			}
			var g = file_index + '-' + gap;
			buf +=
						'<tr class="expand-line"><td colspan="5"><table class="diff review" width="100%">' +
							'<tbody gap="'+ g +'">' +
								'<tr class="expand-line">' +
									'<td colspan="'+ ($scope.unified ? 2 : 1) +'" rowspan="'+ (opened_comments+1) +'" class="text-center line" onclick="scopeExec(event, \'moreLines(' + file_index + ','+ i + ','+ file_index  + ')\')"><i class="icon-unfold"></i></td>' +
									'<td colspan="'+ ($scope.unified ? 3 : 4) +'"><div class="txt-summary">more lines'+(closed_comments > 0 ? ' and <strong>'+ closed_comments + '</strong> resolved comments' : '')+'</div></td>' +
								'</tr>' +
							'</tbody>' +
						'</table></td></tr>';
		}

		if(fdiff.length == 0 && (file.mod_path || file.ori_path) ) {
			//image diff
			var mod_html = file.mod_path ? '<img class="img-responsive" src="' + gc.repoFileUrl($scope.commit.repo_id, file.mod_path, company) + '">' : '';
			var ori_html = file.ori_path ? '<img class="img-responsive" src="' + gc.repoFileUrl($scope.commit.repo_id, file.ori_path, company) + '">' : '';
			var type = file.mod_path && file.ori_path ? 'upd' : ( file.mod_path ? 'add' : 'del' )
			buf += lineRenderer({
				type: type,
				original: { line: '', text: '', html: ori_html, image: true},
				modified: { line: '', text: '', html: mod_html, image: true},
				image: true
			}, file, file_index);
		}

		return buf;
	}

	function workerCaller(data) {
		for(var k in data.globals) {
			eval('self["'+ k + '"] = ' + JSON.stringify(data.globals[k]));
		}
		var rta = eval(data.fn).apply(null, data.params);
		postMessage( rta );
	}

	function each(ls, fn) {
		for(var i = 0; i < ls.length; i++){
			fn.apply(ls[i], [ls[i], i]);
		}
	}

	//worker scope
	var fileRenderScope = [fileHtml, fileDiff, unifiedDiffLine, splitDiffLine,
	 renderCodeLine, diffLineTr, escapeHtml, fileDiff, highlight, lineClass,
	 highlightChunk, highlightChange, highlightLine, workerCaller,
	 {gcHighlight: gcHighlight, entityMap: entityMap, $: {each: each}, gc: gc, company: layout.company() }]

	function scriptFromScope(workerScope) {
		var script = '(function(){\n'
		for(var i = 0; i < workerScope.length; ++i) {
			var val = workerScope[i];
			if(val instanceof Function || typeof val === 'function'){
				script += val.toString() + ";\n";
			} else if(val instanceof Object) {
				for(var k in val) {
					script += 'var ' + k + ' = ' + JSONfn.stringify(val[k]) + ";\n";
				}
			} else {
				script += JSONfn.stringify(val) + ";\n";
			}
		}
		script += 'onmessage = function(event){' +
			          'workerCaller( JSON.parse(event.data) );'+
			        '}\n' +
			        'var _self="undefined"!=typeof window?window:"undefined"!=typeof WorkerGlobalScope&&self instanceof WorkerGlobalScope?self:{},Prism=function(){var e=/\\blang(?:uage)?-(\\w+)\\b/i,t=0,n=_self.Prism={util:{encode:function(e){return e instanceof a?new a(e.type,n.util.encode(e.content),e.alias):"Array"===n.util.type(e)?e.map(n.util.encode):e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/\\u00a0/g," ")},type:function(e){return Object.prototype.toString.call(e).match(/\\[object (\\w+)\\]/)[1]},objId:function(e){return e.__id||Object.defineProperty(e,"__id",{value:++t}),e.__id},clone:function(e){var t=n.util.type(e);switch(t){case"Object":var a={};for(var r in e)e.hasOwnProperty(r)&&(a[r]=n.util.clone(e[r]));return a;case"Array":return e.map&&e.map(function(e){return n.util.clone(e)})}return e}},languages:{extend:function(e,t){var a=n.util.clone(n.languages[e]);for(var r in t)a[r]=t[r];return a},insertBefore:function(e,t,a,r){r=r||n.languages;var l=r[e];if(2==arguments.length){a=arguments[1];for(var i in a)a.hasOwnProperty(i)&&(l[i]=a[i]);return l}var o={};for(var s in l)if(l.hasOwnProperty(s)){if(s==t)for(var i in a)a.hasOwnProperty(i)&&(o[i]=a[i]);o[s]=l[s]}return n.languages.DFS(n.languages,function(t,n){n===r[e]&&t!=e&&(this[t]=o)}),r[e]=o},DFS:function(e,t,a,r){r=r||{};for(var l in e)e.hasOwnProperty(l)&&(t.call(e,l,e[l],a||l),"Object"!==n.util.type(e[l])||r[n.util.objId(e[l])]?"Array"!==n.util.type(e[l])||r[n.util.objId(e[l])]||(r[n.util.objId(e[l])]=!0,n.languages.DFS(e[l],t,l,r)):(r[n.util.objId(e[l])]=!0,n.languages.DFS(e[l],t,null,r)))}},plugins:{},highlightAll:function(e,t){var a={callback:t,selector:\'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code\'};n.hooks.run("before-highlightall",a);for(var r,l=a.elements||document.querySelectorAll(a.selector),i=0;r=l[i++];)n.highlightElement(r,e===!0,a.callback)},highlightElement:function(t,a,r){for(var l,i,o=t;o&&!e.test(o.className);)o=o.parentNode;o&&(l=(o.className.match(e)||[,""])[1],i=n.languages[l]),t.className=t.className.replace(e,"").replace(/\\s+/g," ")+" language-"+l,o=t.parentNode,/pre/i.test(o.nodeName)&&(o.className=o.className.replace(e,"").replace(/\\s+/g," ")+" language-"+l);var s=t.textContent,u={element:t,language:l,grammar:i,code:s};if(!s||!i)return n.hooks.run("complete",u),void 0;if(n.hooks.run("before-highlight",u),a&&_self.Worker){var c=new Worker(n.filename);c.onmessage=function(e){u.highlightedCode=e.data,n.hooks.run("before-insert",u),u.element.innerHTML=u.highlightedCode,r&&r.call(u.element),n.hooks.run("after-highlight",u),n.hooks.run("complete",u)},c.postMessage(JSON.stringify({language:u.language,code:u.code,immediateClose:!0}))}else u.highlightedCode=n.highlight(u.code,u.grammar,u.language),n.hooks.run("before-insert",u),u.element.innerHTML=u.highlightedCode,r&&r.call(t),n.hooks.run("after-highlight",u),n.hooks.run("complete",u)},highlight:function(e,t,r){var l=n.tokenize(e,t);return a.stringify(n.util.encode(l),r)},tokenize:function(e,t){var a=n.Token,r=[e],l=t.rest;if(l){for(var i in l)t[i]=l[i];delete t.rest}e:for(var i in t)if(t.hasOwnProperty(i)&&t[i]){var o=t[i];o="Array"===n.util.type(o)?o:[o];for(var s=0;s<o.length;++s){var u=o[s],c=u.inside,g=!!u.lookbehind,h=!!u.greedy,f=0,d=u.alias;u=u.pattern||u;for(var p=0;p<r.length;p++){var m=r[p];if(r.length>e.length)break e;if(!(m instanceof a)){u.lastIndex=0;var y=u.exec(m),v=1;if(!y&&h&&p!=r.length-1){var b=r[p+1].matchedStr||r[p+1],k=m+b;if(p<r.length-2&&(k+=r[p+2].matchedStr||r[p+2]),u.lastIndex=0,y=u.exec(k),!y)continue;var w=y.index+(g?y[1].length:0);if(w>=m.length)continue;var _=y.index+y[0].length,P=m.length+b.length;if(v=3,P>=_){if(r[p+1].greedy)continue;v=2,k=k.slice(0,P)}m=k}if(y){g&&(f=y[1].length);var w=y.index+f,y=y[0].slice(f),_=w+y.length,S=m.slice(0,w),O=m.slice(_),j=[p,v];S&&j.push(S);var A=new a(i,c?n.tokenize(y,c):y,d,y,h);j.push(A),O&&j.push(O),Array.prototype.splice.apply(r,j)}}}}}return r},hooks:{all:{},add:function(e,t){var a=n.hooks.all;a[e]=a[e]||[],a[e].push(t)},run:function(e,t){var a=n.hooks.all[e];if(a&&a.length)for(var r,l=0;r=a[l++];)r(t)}}},a=n.Token=function(e,t,n,a,r){this.type=e,this.content=t,this.alias=n,this.matchedStr=a||null,this.greedy=!!r};if(a.stringify=function(e,t,r){if("string"==typeof e)return e;if("Array"===n.util.type(e))return e.map(function(n){return a.stringify(n,t,e)}).join("");var l={type:e.type,content:a.stringify(e.content,t,r),tag:"span",classes:["token",e.type],attributes:{},language:t,parent:r};if("comment"==l.type&&(l.attributes.spellcheck="true"),e.alias){var i="Array"===n.util.type(e.alias)?e.alias:[e.alias];Array.prototype.push.apply(l.classes,i)}n.hooks.run("wrap",l);var o="";for(var s in l.attributes)o+=(o?" ":"")+s+\'="\'+(l.attributes[s]||"")+\'"\';return"<"+l.tag+\' class="\'+l.classes.join(" ")+\'" \'+o+">"+l.content+"</"+l.tag+">"},!_self.document)return _self.addEventListener?(_self.addEventListener("message",function(e){var t=JSON.parse(e.data),a=t.language,r=t.code,l=t.immediateClose;_self.postMessage(n.highlight(r,n.languages[a],a)),l&&_self.close()},!1),_self.Prism):_self.Prism;var r=document.currentScript||[].slice.call(document.getElementsByTagName("script")).pop();return r&&(n.filename=r.src,document.addEventListener&&!r.hasAttribute("data-manual")&&document.addEventListener("DOMContentLoaded",n.highlightAll)),_self.Prism}();"undefined"!=typeof module&&module.exports&&(module.exports=Prism),"undefined"!=typeof global&&(global.Prism=Prism);\nPrism.languages.markup={comment:/<!--[\\w\\W]*?-->/,prolog:/<\\?[\\w\\W]+?\\?>/,doctype:/<!DOCTYPE[\\w\\W]+?>/,cdata:/<!\\[CDATA\\[[\\w\\W]*?]]>/i,tag:{pattern:/<\\/?(?!\\d)[^\\s>\\/=.$<]+(?:\\s+[^\\s>\\/=]+(?:=(?:("|\')(?:\\\\\\1|\\\\?(?!\\1)[\\w\\W])*\\1|[^\\s\'">=]+))?)*\\s*\\/?>/i,inside:{tag:{pattern:/^<\\/?[^\\s>\\/]+/i,inside:{punctuation:/^<\\/?/,namespace:/^[^\\s>\\/:]+:/}},"attr-value":{pattern:/=(?:(\'|")[\\w\\W]*?(\\1)|[^\\s>]+)/i,inside:{punctuation:/[=>"\']/}},punctuation:/\\/?>/,"attr-name":{pattern:/[^\\s>\\/]+/,inside:{namespace:/^[^\\s>\\/:]+:/}}}},entity:/&#?[\\da-z]{1,8};/i},Prism.hooks.add("wrap",function(a){"entity"===a.type&&(a.attributes.title=a.content.replace(/&amp;/,"&"))}),Prism.languages.xml=Prism.languages.markup,Prism.languages.html=Prism.languages.markup,Prism.languages.mathml=Prism.languages.markup,Prism.languages.svg=Prism.languages.markup;\nPrism.languages.css={comment:/\\/\\*[\\w\\W]*?\\*\\//,atrule:{pattern:/@[\\w-]+?.*?(;|(?=\\s*\\{))/i,inside:{rule:/@[\\w-]+/}},url:/url\\((?:(["\'])(\\\\(?:\\r\\n|[\\w\\W])|(?!\\1)[^\\\\\\r\\n])*\\1|.*?)\\)/i,selector:/[^\\{\\}\\s][^\\{\\};]*?(?=\\s*\\{)/,string:/("|\')(\\\\(?:\\r\\n|[\\w\\W])|(?!\\1)[^\\\\\\r\\n])*\\1/,property:/(\\b|\\B)[\\w-]+(?=\\s*:)/i,important:/\\B!important\\b/i,"function":/[-a-z0-9]+(?=\\()/i,punctuation:/[(){};:]/},Prism.languages.css.atrule.inside.rest=Prism.util.clone(Prism.languages.css),Prism.languages.markup&&(Prism.languages.insertBefore("markup","tag",{style:{pattern:/(<style[\\w\\W]*?>)[\\w\\W]*?(?=<\\/style>)/i,lookbehind:!0,inside:Prism.languages.css,alias:"language-css"}}),Prism.languages.insertBefore("inside","attr-value",{"style-attr":{pattern:/\\s*style=("|\').*?\\1/i,inside:{"attr-name":{pattern:/^\\s*style/i,inside:Prism.languages.markup.tag.inside},punctuation:/^\\s*=\\s*[\'"]|[\'"]\\s*$/,"attr-value":{pattern:/.+/i,inside:Prism.languages.css}},alias:"language-css"}},Prism.languages.markup.tag));\nPrism.languages.clike={comment:[{pattern:/(^|[^\\\\])\\/\\*[\\w\\W]*?\\*\\//,lookbehind:!0},{pattern:/(^|[^\\\\:])\\/\\/.*/,lookbehind:!0}],string:{pattern:/(["\'])(\\\\(?:\\r\\n|[\\s\\S])|(?!\\1)[^\\\\\\r\\n])*\\1/,greedy:!0},"class-name":{pattern:/((?:\\b(?:class|interface|extends|implements|trait|instanceof|new)\\s+)|(?:catch\\s+\\())[a-z0-9_\\.\\\\]+/i,lookbehind:!0,inside:{punctuation:/(\\.|\\\\)/}},keyword:/\\b(if|else|while|do|for|return|in|instanceof|function|new|try|throw|catch|finally|null|break|continue)\\b/,"boolean":/\\b(true|false)\\b/,"function":/[a-z0-9_]+(?=\\()/i,number:/\\b-?(?:0x[\\da-f]+|\\d*\\.?\\d+(?:e[+-]?\\d+)?)\\b/i,operator:/--?|\\+\\+?|!=?=?|<=?|>=?|==?=?|&&?|\\|\\|?|\\?|\\*|\\/|~|\\^|%/,punctuation:/[{}[\\];(),.:]/};\nPrism.languages.javascript=Prism.languages.extend("clike",{keyword:/\\b(as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|var|void|while|with|yield)\\b/,number:/\\b-?(0x[\\dA-Fa-f]+|0b[01]+|0o[0-7]+|\\d*\\.?\\d+([Ee][+-]?\\d+)?|NaN|Infinity)\\b/,"function":/[_$a-zA-Z\\xA0-\\uFFFF][_$a-zA-Z0-9\\xA0-\\uFFFF]*(?=\\()/i}),Prism.languages.insertBefore("javascript","keyword",{regex:{pattern:/(^|[^\\/])\\/(?!\\/)(\\[.+?]|\\\\.|[^\\/\\\\\\r\\n])+\\/[gimyu]{0,5}(?=\\s*($|[\\r\\n,.;})]))/,lookbehind:!0,greedy:!0}}),Prism.languages.insertBefore("javascript","class-name",{"template-string":{pattern:/`(?:\\\\\\\\|\\\\?[^\\\\])*?`/,greedy:!0,inside:{interpolation:{pattern:/\\$\\{[^}]+\\}/,inside:{"interpolation-punctuation":{pattern:/^\\$\\{|\\}$/,alias:"punctuation"},rest:Prism.languages.javascript}},string:/[\\s\\S]+/}}}),Prism.languages.markup&&Prism.languages.insertBefore("markup","tag",{script:{pattern:/(<script[\\w\\W]*?>)[\\w\\W]*?(?=<\\/script>)/i,lookbehind:!0,inside:Prism.languages.javascript,alias:"language-javascript"}}),Prism.languages.js=Prism.languages.javascript;\nPrism.languages.actionscript=Prism.languages.extend("javascript",{keyword:/\\b(?:as|break|case|catch|class|const|default|delete|do|else|extends|finally|for|function|if|implements|import|in|instanceof|interface|internal|is|native|new|null|package|private|protected|public|return|super|switch|this|throw|try|typeof|use|var|void|while|with|dynamic|each|final|get|include|namespace|native|override|set|static)\\b/,operator:/\\+\\+|--|(?:[+\\-*\\/%^]|&&?|\\|\\|?|<<?|>>?>?|[!=]=?)=?|[~?@]/}),Prism.languages.actionscript["class-name"].alias="function",Prism.languages.markup&&Prism.languages.insertBefore("actionscript","string",{xml:{pattern:/(^|[^.])<\\/?\\w+(?:\\s+[^\\s>\\/=]+=("|\')(?:\\\\\\1|\\\\?(?!\\1)[\\w\\W])*\\2)*\\s*\\/?>/,lookbehind:!0,inside:{rest:Prism.languages.markup}}});\nPrism.languages.aspnet=Prism.languages.extend("markup",{"page-directive tag":{pattern:/<%\\s*@.*%>/i,inside:{"page-directive tag":/<%\\s*@\\s*(?:Assembly|Control|Implements|Import|Master(?:Type)?|OutputCache|Page|PreviousPageType|Reference|Register)?|%>/i,rest:Prism.languages.markup.tag.inside}},"directive tag":{pattern:/<%.*%>/i,inside:{"directive tag":/<%\\s*?[$=%#:]{0,2}|%>/i,rest:Prism.languages.csharp}}}),Prism.languages.aspnet.tag.pattern=/<(?!%)\\/?[^\\s>\\/]+(?:\\s+[^\\s>\\/=]+(?:=(?:("|\')(?:\\\\\\1|\\\\?(?!\\1)[\\w\\W])*\\1|[^\\s\'">=]+))?)*\\s*\\/?>/i,Prism.languages.insertBefore("inside","punctuation",{"directive tag":Prism.languages.aspnet["directive tag"]},Prism.languages.aspnet.tag.inside["attr-value"]),Prism.languages.insertBefore("aspnet","comment",{"asp comment":/<%--[\\w\\W]*?--%>/}),Prism.languages.insertBefore("aspnet",Prism.languages.javascript?"script":"tag",{"asp script":{pattern:/(<script(?=.*runat=[\'"]?server[\'"]?)[\\w\\W]*?>)[\\w\\W]*?(?=<\\/script>)/i,lookbehind:!0,inside:Prism.languages.csharp||{}}});\nPrism.languages.c=Prism.languages.extend("clike",{keyword:/\\b(asm|typeof|inline|auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|int|long|register|return|short|signed|sizeof|static|struct|switch|typedef|union|unsigned|void|volatile|while)\\b/,operator:/\\-[>-]?|\\+\\+?|!=?|<<?=?|>>?=?|==?|&&?|\\|?\\||[~^%?*\\/]/,number:/\\b-?(?:0x[\\da-f]+|\\d*\\.?\\d+(?:e[+-]?\\d+)?)[ful]*\\b/i}),Prism.languages.insertBefore("c","string",{macro:{pattern:/(^\\s*)#\\s*[a-z]+([^\\r\\n\\\\]|\\\\.|\\\\(?:\\r\\n?|\\n))*/im,lookbehind:!0,alias:"property",inside:{string:{pattern:/(#\\s*include\\s*)(<.+?>|("|\')(\\\\?.)+?\\3)/,lookbehind:!0},directive:{pattern:/(#\\s*)\\b(define|elif|else|endif|error|ifdef|ifndef|if|import|include|line|pragma|undef|using)\\b/,lookbehind:!0,alias:"keyword"}}},constant:/\\b(__FILE__|__LINE__|__DATE__|__TIME__|__TIMESTAMP__|__func__|EOF|NULL|stdin|stdout|stderr)\\b/}),delete Prism.languages.c["class-name"],delete Prism.languages.c["boolean"];\nPrism.languages.csharp=Prism.languages.extend("clike",{keyword:/\\b(abstract|as|async|await|base|bool|break|byte|case|catch|char|checked|class|const|continue|decimal|default|delegate|do|double|else|enum|event|explicit|extern|false|finally|fixed|float|for|foreach|goto|if|implicit|in|int|interface|internal|is|lock|long|namespace|new|null|object|operator|out|override|params|private|protected|public|readonly|ref|return|sbyte|sealed|short|sizeof|stackalloc|static|string|struct|switch|this|throw|true|try|typeof|uint|ulong|unchecked|unsafe|ushort|using|virtual|void|volatile|while|add|alias|ascending|async|await|descending|dynamic|from|get|global|group|into|join|let|orderby|partial|remove|select|set|value|var|where|yield)\\b/,string:[/@("|\')(\\1\\1|\\\\\\1|\\\\?(?!\\1)[\\s\\S])*\\1/,/("|\')(\\\\?.)*?\\1/],number:/\\b-?(0x[\\da-f]+|\\d*\\.?\\d+f?)\\b/i}),Prism.languages.insertBefore("csharp","keyword",{preprocessor:{pattern:/(^\\s*)#.*/m,lookbehind:!0,alias:"property",inside:{directive:{pattern:/(\\s*#)\\b(define|elif|else|endif|endregion|error|if|line|pragma|region|undef|warning)\\b/,lookbehind:!0,alias:"keyword"}}}});\nPrism.languages.cpp=Prism.languages.extend("c",{keyword:/\\b(alignas|alignof|asm|auto|bool|break|case|catch|char|char16_t|char32_t|class|compl|const|constexpr|const_cast|continue|decltype|default|delete|do|double|dynamic_cast|else|enum|explicit|export|extern|float|for|friend|goto|if|inline|int|long|mutable|namespace|new|noexcept|nullptr|operator|private|protected|public|register|reinterpret_cast|return|short|signed|sizeof|static|static_assert|static_cast|struct|switch|template|this|thread_local|throw|try|typedef|typeid|typename|union|unsigned|using|virtual|void|volatile|wchar_t|while)\\b/,"boolean":/\\b(true|false)\\b/,operator:/[-+]{1,2}|!=?|<{1,2}=?|>{1,2}=?|\\->|:{1,2}|={1,2}|\\^|~|%|&{1,2}|\\|?\\||\\?|\\*|\\/|\\b(and|and_eq|bitand|bitor|not|not_eq|or|or_eq|xor|xor_eq)\\b/}),Prism.languages.insertBefore("cpp","keyword",{"class-name":{pattern:/(class\\s+)[a-z0-9_]+/i,lookbehind:!0}});\n!function(e){var n=/#(?!\\{).+/,t={pattern:/#\\{[^}]+\\}/,alias:"variable"};e.languages.coffeescript=e.languages.extend("javascript",{comment:n,string:[/\'(?:\\\\?[^\\\\])*?\'/,{pattern:/"(?:\\\\?[^\\\\])*?"/,inside:{interpolation:t}}],keyword:/\\b(and|break|by|catch|class|continue|debugger|delete|do|each|else|extend|extends|false|finally|for|if|in|instanceof|is|isnt|let|loop|namespace|new|no|not|null|of|off|on|or|own|return|super|switch|then|this|throw|true|try|typeof|undefined|unless|until|when|while|window|with|yes|yield)\\b/,"class-member":{pattern:/@(?!\\d)\\w+/,alias:"variable"}}),e.languages.insertBefore("coffeescript","comment",{"multiline-comment":{pattern:/###[\\s\\S]+?###/,alias:"comment"},"block-regex":{pattern:/\\/{3}[\\s\\S]*?\\/{3}/,alias:"regex",inside:{comment:n,interpolation:t}}}),e.languages.insertBefore("coffeescript","string",{"inline-javascript":{pattern:/`(?:\\\\?[\\s\\S])*?`/,inside:{delimiter:{pattern:/^`|`$/,alias:"punctuation"},rest:e.languages.javascript}},"multiline-string":[{pattern:/\'\'\'[\\s\\S]*?\'\'\'/,alias:"string"},{pattern:/"""[\\s\\S]*?"""/,alias:"string",inside:{interpolation:t}}]}),e.languages.insertBefore("coffeescript","keyword",{property:/(?!\\d)\\w+(?=\\s*:(?!:))/})}(Prism);\n!function(e){e.languages.ruby=e.languages.extend("clike",{comment:/#(?!\\{[^\\r\\n]*?\\}).*/,keyword:/\\b(alias|and|BEGIN|begin|break|case|class|def|define_method|defined|do|each|else|elsif|END|end|ensure|false|for|if|in|module|new|next|nil|not|or|raise|redo|require|rescue|retry|return|self|super|then|throw|true|undef|unless|until|when|while|yield)\\b/});var n={pattern:/#\\{[^}]+\\}/,inside:{delimiter:{pattern:/^#\\{|\\}$/,alias:"tag"},rest:e.util.clone(e.languages.ruby)}};e.languages.insertBefore("ruby","keyword",{regex:[{pattern:/%r([^a-zA-Z0-9\\s\\{\\(\\[<])(?:[^\\\\]|\\\\[\\s\\S])*?\\1[gim]{0,3}/,inside:{interpolation:n}},{pattern:/%r\\((?:[^()\\\\]|\\\\[\\s\\S])*\\)[gim]{0,3}/,inside:{interpolation:n}},{pattern:/%r\\{(?:[^#{}\\\\]|#(?:\\{[^}]+\\})?|\\\\[\\s\\S])*\\}[gim]{0,3}/,inside:{interpolation:n}},{pattern:/%r\\[(?:[^\\[\\]\\\\]|\\\\[\\s\\S])*\\][gim]{0,3}/,inside:{interpolation:n}},{pattern:/%r<(?:[^<>\\\\]|\\\\[\\s\\S])*>[gim]{0,3}/,inside:{interpolation:n}},{pattern:/(^|[^\\/])\\/(?!\\/)(\\[.+?]|\\\\.|[^\\/\\r\\n])+\\/[gim]{0,3}(?=\\s*($|[\\r\\n,.;})]))/,lookbehind:!0}],variable:/[@$]+[a-zA-Z_][a-zA-Z_0-9]*(?:[?!]|\\b)/,symbol:/:[a-zA-Z_][a-zA-Z_0-9]*(?:[?!]|\\b)/}),e.languages.insertBefore("ruby","number",{builtin:/\\b(Array|Bignum|Binding|Class|Continuation|Dir|Exception|FalseClass|File|Stat|File|Fixnum|Fload|Hash|Integer|IO|MatchData|Method|Module|NilClass|Numeric|Object|Proc|Range|Regexp|String|Struct|TMS|Symbol|ThreadGroup|Thread|Time|TrueClass)\\b/,constant:/\\b[A-Z][a-zA-Z_0-9]*(?:[?!]|\\b)/}),e.languages.ruby.string=[{pattern:/%[qQiIwWxs]?([^a-zA-Z0-9\\s\\{\\(\\[<])(?:[^\\\\]|\\\\[\\s\\S])*?\\1/,inside:{interpolation:n}},{pattern:/%[qQiIwWxs]?\\((?:[^()\\\\]|\\\\[\\s\\S])*\\)/,inside:{interpolation:n}},{pattern:/%[qQiIwWxs]?\\{(?:[^#{}\\\\]|#(?:\\{[^}]+\\})?|\\\\[\\s\\S])*\\}/,inside:{interpolation:n}},{pattern:/%[qQiIwWxs]?\\[(?:[^\\[\\]\\\\]|\\\\[\\s\\S])*\\]/,inside:{interpolation:n}},{pattern:/%[qQiIwWxs]?<(?:[^<>\\\\]|\\\\[\\s\\S])*>/,inside:{interpolation:n}},{pattern:/("|\')(#\\{[^}]+\\}|\\\\(?:\\r?\\n|\\r)|\\\\?.)*?\\1/,inside:{interpolation:n}}]}(Prism);\nPrism.languages.glsl=Prism.languages.extend("clike",{comment:[/\\/\\*[\\w\\W]*?\\*\\//,/\\/\\/(?:\\\\(?:\\r\\n|[\\s\\S])|.)*/],number:/\\b(?:0x[\\da-f]+|(?:\\.\\d+|\\d+\\.?\\d*)(?:e[+-]?\\d+)?)[ulf]*\\b/i,keyword:/\\b(?:attribute|const|uniform|varying|buffer|shared|coherent|volatile|restrict|readonly|writeonly|atomic_uint|layout|centroid|flat|smooth|noperspective|patch|sample|break|continue|do|for|while|switch|case|default|if|else|subroutine|in|out|inout|float|double|int|void|bool|true|false|invariant|precise|discard|return|d?mat[234](?:x[234])?|[ibdu]?vec[234]|uint|lowp|mediump|highp|precision|[iu]?sampler[123]D|[iu]?samplerCube|sampler[12]DShadow|samplerCubeShadow|[iu]?sampler[12]DArray|sampler[12]DArrayShadow|[iu]?sampler2DRect|sampler2DRectShadow|[iu]?samplerBuffer|[iu]?sampler2DMS(?:Array)?|[iu]?samplerCubeArray|samplerCubeArrayShadow|[iu]?image[123]D|[iu]?image2DRect|[iu]?imageCube|[iu]?imageBuffer|[iu]?image[12]DArray|[iu]?imageCubeArray|[iu]?image2DMS(?:Array)?|struct|common|partition|active|asm|class|union|enum|typedef|template|this|resource|goto|inline|noinline|public|static|extern|external|interface|long|short|half|fixed|unsigned|superp|input|output|hvec[234]|fvec[234]|sampler3DRect|filter|sizeof|cast|namespace|using)\\b/}),Prism.languages.insertBefore("glsl","comment",{preprocessor:{pattern:/(^[ \\t]*)#(?:(?:define|undef|if|ifdef|ifndef|else|elif|endif|error|pragma|extension|version|line)\\b)?/m,lookbehind:!0,alias:"builtin"}});\nPrism.languages.go=Prism.languages.extend("clike",{keyword:/\\b(break|case|chan|const|continue|default|defer|else|fallthrough|for|func|go(to)?|if|import|interface|map|package|range|return|select|struct|switch|type|var)\\b/,builtin:/\\b(bool|byte|complex(64|128)|error|float(32|64)|rune|string|u?int(8|16|32|64|)|uintptr|append|cap|close|complex|copy|delete|imag|len|make|new|panic|print(ln)?|real|recover)\\b/,"boolean":/\\b(_|iota|nil|true|false)\\b/,operator:/[*\\/%^!=]=?|\\+[=+]?|-[=-]?|\\|[=|]?|&(?:=|&|\\^=?)?|>(?:>=?|=)?|<(?:<=?|=|-)?|:=|\\.\\.\\./,number:/\\b(-?(0x[a-f\\d]+|(\\d+\\.?\\d*|\\.\\d+)(e[-+]?\\d+)?)i?)\\b/i,string:/("|\'|`)(\\\\?.|\\r|\\n)*?\\1/}),delete Prism.languages.go["class-name"];\n!function(e){e.languages.haml={"multiline-comment":{pattern:/((?:^|\\r?\\n|\\r)([\\t ]*))(?:\\/|-#).*((?:\\r?\\n|\\r)\\2[\\t ]+.+)*/,lookbehind:!0,alias:"comment"},"multiline-code":[{pattern:/((?:^|\\r?\\n|\\r)([\\t ]*)(?:[~-]|[&!]?=)).*,[\\t ]*((?:\\r?\\n|\\r)\\2[\\t ]+.*,[\\t ]*)*((?:\\r?\\n|\\r)\\2[\\t ]+.+)/,lookbehind:!0,inside:{rest:e.languages.ruby}},{pattern:/((?:^|\\r?\\n|\\r)([\\t ]*)(?:[~-]|[&!]?=)).*\\|[\\t ]*((?:\\r?\\n|\\r)\\2[\\t ]+.*\\|[\\t ]*)*/,lookbehind:!0,inside:{rest:e.languages.ruby}}],filter:{pattern:/((?:^|\\r?\\n|\\r)([\\t ]*)):[\\w-]+((?:\\r?\\n|\\r)(?:\\2[\\t ]+.+|\\s*?(?=\\r?\\n|\\r)))+/,lookbehind:!0,inside:{"filter-name":{pattern:/^:[\\w-]+/,alias:"variable"}}},markup:{pattern:/((?:^|\\r?\\n|\\r)[\\t ]*)<.+/,lookbehind:!0,inside:{rest:e.languages.markup}},doctype:{pattern:/((?:^|\\r?\\n|\\r)[\\t ]*)!!!(?: .+)?/,lookbehind:!0},tag:{pattern:/((?:^|\\r?\\n|\\r)[\\t ]*)[%.#][\\w\\-#.]*[\\w\\-](?:\\([^)]+\\)|\\{(?:\\{[^}]+\\}|[^}])+\\}|\\[[^\\]]+\\])*[\\/<>]*/,lookbehind:!0,inside:{attributes:[{pattern:/(^|[^#])\\{(?:\\{[^}]+\\}|[^}])+\\}/,lookbehind:!0,inside:{rest:e.languages.ruby}},{pattern:/\\([^)]+\\)/,inside:{"attr-value":{pattern:/(=\\s*)(?:"(?:\\\\?.)*?"|[^)\\s]+)/,lookbehind:!0},"attr-name":/[\\w:-]+(?=\\s*!?=|\\s*[,)])/,punctuation:/[=(),]/}},{pattern:/\\[[^\\]]+\\]/,inside:{rest:e.languages.ruby}}],punctuation:/[<>]/}},code:{pattern:/((?:^|\\r?\\n|\\r)[\\t ]*(?:[~-]|[&!]?=)).+/,lookbehind:!0,inside:{rest:e.languages.ruby}},interpolation:{pattern:/#\\{[^}]+\\}/,inside:{delimiter:{pattern:/^#\\{|\\}$/,alias:"punctuation"},rest:e.languages.ruby}},punctuation:{pattern:/((?:^|\\r?\\n|\\r)[\\t ]*)[~=\\-&!]+/,lookbehind:!0}};for(var t="((?:^|\\\\r?\\\\n|\\\\r)([\\\\t ]*)):{{filter_name}}((?:\\\\r?\\\\n|\\\\r)(?:\\\\2[\\\\t ]+.+|\\\\s*?(?=\\\\r?\\\\n|\\\\r)))+",r=["css",{filter:"coffee",language:"coffeescript"},"erb","javascript","less","markdown","ruby","scss","textile"],n={},a=0,i=r.length;i>a;a++){var l=r[a];l="string"==typeof l?{filter:l,language:l}:l,e.languages[l.language]&&(n["filter-"+l.filter]={pattern:RegExp(t.replace("{{filter_name}}",l.filter)),lookbehind:!0,inside:{"filter-name":{pattern:/^:[\\w-]+/,alias:"variable"},rest:e.languages[l.language]}})}e.languages.insertBefore("haml","filter",n)}(Prism);\nPrism.languages.java=Prism.languages.extend("clike",{keyword:/\\b(abstract|continue|for|new|switch|assert|default|goto|package|synchronized|boolean|do|if|private|this|break|double|implements|protected|throw|byte|else|import|public|throws|case|enum|instanceof|return|transient|catch|extends|int|short|try|char|final|interface|static|void|class|finally|long|strictfp|volatile|const|float|native|super|while)\\b/,number:/\\b0b[01]+\\b|\\b0x[\\da-f]*\\.?[\\da-fp\\-]+\\b|\\b\\d*\\.?\\d+(?:e[+-]?\\d+)?[df]?\\b/i,operator:{pattern:/(^|[^.])(?:\\+[+=]?|-[-=]?|!=?|<<?=?|>>?>?=?|==?|&[&=]?|\\|[|=]?|\\*=?|\\/=?|%=?|\\^=?|[?:~])/m,lookbehind:!0}}),Prism.languages.insertBefore("java","function",{annotation:{alias:"punctuation",pattern:/(^|[^.])@\\w+/,lookbehind:!0}});\nPrism.languages.json={property:/".*?"(?=\\s*:)/gi,string:/"(?!:)(\\\\?[^"])*?"(?!:)/g,number:/\\b-?(0x[\\dA-Fa-f]+|\\d*\\.?\\d+([Ee]-?\\d+)?)\\b/g,punctuation:/[{}[\\]);,]/g,operator:/:/g,"boolean":/\\b(true|false)\\b/gi,"null":/\\bnull\\b/gi},Prism.languages.jsonp=Prism.languages.json;\nPrism.languages.less=Prism.languages.extend("css",{comment:[/\\/\\*[\\w\\W]*?\\*\\//,{pattern:/(^|[^\\\\])\\/\\/.*/,lookbehind:!0}],atrule:{pattern:/@[\\w-]+?(?:\\([^{}]+\\)|[^(){};])*?(?=\\s*\\{)/i,inside:{punctuation:/[:()]/}},selector:{pattern:/(?:@\\{[\\w-]+\\}|[^{};\\s@])(?:@\\{[\\w-]+\\}|\\([^{}]*\\)|[^{};@])*?(?=\\s*\\{)/,inside:{variable:/@+[\\w-]+/}},property:/(?:@\\{[\\w-]+\\}|[\\w-])+(?:\\+_?)?(?=\\s*:)/i,punctuation:/[{}();:,]/,operator:/[+\\-*\\/]/}),Prism.languages.insertBefore("less","punctuation",{"function":Prism.languages.less.function}),Prism.languages.insertBefore("less","property",{variable:[{pattern:/@[\\w-]+\\s*:/,inside:{punctuation:/:/}},/@@?[\\w-]+/],"mixin-usage":{pattern:/([{;]\\s*)[.#](?!\\d)[\\w-]+.*?(?=[(;])/,lookbehind:!0,alias:"function"}});\nPrism.languages.objectivec=Prism.languages.extend("c",{keyword:/\\b(asm|typeof|inline|auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|int|long|register|return|short|signed|sizeof|static|struct|switch|typedef|union|unsigned|void|volatile|while|in|self|super)\\b|(@interface|@end|@implementation|@protocol|@class|@public|@protected|@private|@property|@try|@catch|@finally|@throw|@synthesize|@dynamic|@selector)\\b/,string:/("|\')(\\\\(?:\\r\\n|[\\s\\S])|(?!\\1)[^\\\\\\r\\n])*\\1|@"(\\\\(?:\\r\\n|[\\s\\S])|[^"\\\\\\r\\n])*"/,operator:/-[->]?|\\+\\+?|!=?|<<?=?|>>?=?|==?|&&?|\\|\\|?|[~^%?*\\/@]/});\nPrism.languages.php=Prism.languages.extend("clike",{keyword:/\\b(and|or|xor|array|as|break|case|cfunction|class|const|continue|declare|default|die|do|else|elseif|enddeclare|endfor|endforeach|endif|endswitch|endwhile|extends|for|foreach|function|include|include_once|global|if|new|return|static|switch|use|require|require_once|var|while|abstract|interface|public|implements|private|protected|parent|throw|null|echo|print|trait|namespace|final|yield|goto|instanceof|finally|try|catch)\\b/i,constant:/\\b[A-Z0-9_]{2,}\\b/,comment:{pattern:/(^|[^\\\\])(?:\\/\\*[\\w\\W]*?\\*\\/|\\/\\/.*)/,lookbehind:!0}}),Prism.languages.insertBefore("php","class-name",{"shell-comment":{pattern:/(^|[^\\\\])#.*/,lookbehind:!0,alias:"comment"}}),Prism.languages.insertBefore("php","keyword",{delimiter:/\\?>|<\\?(?:php)?/i,variable:/\\$\\w+\\b/i,"package":{pattern:/(\\\\|namespace\\s+|use\\s+)[\\w\\\\]+/,lookbehind:!0,inside:{punctuation:/\\\\/}}}),Prism.languages.insertBefore("php","operator",{property:{pattern:/(->)[\\w]+/,lookbehind:!0}}),Prism.languages.markup&&(Prism.hooks.add("before-highlight",function(e){"php"===e.language&&(e.tokenStack=[],e.backupCode=e.code,e.code=e.code.replace(/(?:<\\?php|<\\?)[\\w\\W]*?(?:\\?>)/gi,function(a){return e.tokenStack.push(a),"{{{PHP"+e.tokenStack.length+"}}}"}))}),Prism.hooks.add("before-insert",function(e){"php"===e.language&&(e.code=e.backupCode,delete e.backupCode)}),Prism.hooks.add("after-highlight",function(e){if("php"===e.language){for(var a,n=0;a=e.tokenStack[n];n++)e.highlightedCode=e.highlightedCode.replace("{{{PHP"+(n+1)+"}}}",Prism.highlight(a,e.grammar,"php").replace(/\\$/g,"$$$$"));e.element.innerHTML=e.highlightedCode}}),Prism.hooks.add("wrap",function(e){"php"===e.language&&"markup"===e.type&&(e.content=e.content.replace(/(\\{\\{\\{PHP[0-9]+\\}\\}\\})/g,\'<span class="token php">$1</span>\'))}),Prism.languages.insertBefore("php","comment",{markup:{pattern:/<[^?]\\/?(.*?)>/,inside:Prism.languages.markup},php:/\\{\\{\\{PHP[0-9]+\\}\\}\\}/}));\nPrism.languages.python={"triple-quoted-string":{pattern:/"""[\\s\\S]+?"""|\'\'\'[\\s\\S]+?\'\'\'/,alias:"string"},comment:{pattern:/(^|[^\\\\])#.*/,lookbehind:!0},string:/("|\')(?:\\\\?.)*?\\1/,"function":{pattern:/((?:^|\\s)def[ \\t]+)[a-zA-Z_][a-zA-Z0-9_]*(?=\\()/g,lookbehind:!0},"class-name":{pattern:/(\\bclass\\s+)[a-z0-9_]+/i,lookbehind:!0},keyword:/\\b(?:as|assert|async|await|break|class|continue|def|del|elif|else|except|exec|finally|for|from|global|if|import|in|is|lambda|pass|print|raise|return|try|while|with|yield)\\b/,"boolean":/\\b(?:True|False)\\b/,number:/\\b-?(?:0[bo])?(?:(?:\\d|0x[\\da-f])[\\da-f]*\\.?\\d*|\\.\\d+)(?:e[+-]?\\d+)?j?\\b/i,operator:/[-+%=]=?|!=|\\*\\*?=?|\\/\\/?=?|<[<=>]?|>[=>]?|[&|^~]|\\b(?:or|and|not)\\b/,punctuation:/[{}[\\];(),.:]/};\n!function(a){var e=a.util.clone(a.languages.javascript);a.languages.jsx=a.languages.extend("markup",e),a.languages.jsx.tag.pattern=/<\\/?[\\w\\.:-]+\\s*(?:\\s+[\\w\\.:-]+(?:=(?:("|\')(\\\\?[\\w\\W])*?\\1|[^\\s\'">=]+|(\\{[\\w\\W]*?\\})))?\\s*)*\\/?>/i,a.languages.jsx.tag.inside["attr-value"].pattern=/=[^\\{](?:(\'|")[\\w\\W]*?(\\1)|[^\\s>]+)/i;var s=a.util.clone(a.languages.jsx);delete s.punctuation,s=a.languages.insertBefore("jsx","operator",{punctuation:/=(?={)|[{}[\\];(),.:]/},{jsx:s}),a.languages.insertBefore("inside","attr-value",{script:{pattern:/=(\\{(?:\\{[^}]*\\}|[^}])+\\})/i,inside:s,alias:"language-javascript"}},a.languages.jsx.tag)}(Prism);\n!function(e){e.languages.sass=e.languages.extend("css",{comment:{pattern:/^([ \\t]*)\\/[\\/*].*(?:(?:\\r?\\n|\\r)\\1[ \\t]+.+)*/m,lookbehind:!0}}),e.languages.insertBefore("sass","atrule",{"atrule-line":{pattern:/^(?:[ \\t]*)[@+=].+/m,inside:{atrule:/(?:@[\\w-]+|[+=])/m}}}),delete e.languages.sass.atrule;var a=/((\\$[-_\\w]+)|(#\\{\\$[-_\\w]+\\}))/i,t=[/[+*\\/%]|[=!]=|<=?|>=?|\\b(?:and|or|not)\\b/,{pattern:/(\\s+)-(?=\\s)/,lookbehind:!0}];e.languages.insertBefore("sass","property",{"variable-line":{pattern:/^[ \\t]*\\$.+/m,inside:{punctuation:/:/,variable:a,operator:t}},"property-line":{pattern:/^[ \\t]*(?:[^:\\s]+ *:.*|:[^:\\s]+.*)/m,inside:{property:[/[^:\\s]+(?=\\s*:)/,{pattern:/(:)[^:\\s]+/,lookbehind:!0}],punctuation:/:/,variable:a,operator:t,important:e.languages.sass.important}}}),delete e.languages.sass.property,delete e.languages.sass.important,delete e.languages.sass.selector,e.languages.insertBefore("sass","punctuation",{selector:{pattern:/([ \\t]*)\\S(?:,?[^,\\r\\n]+)*(?:,(?:\\r?\\n|\\r)\\1[ \\t]+\\S(?:,?[^,\\r\\n]+)*)*/,lookbehind:!0}})}(Prism);\nPrism.languages.scss=Prism.languages.extend("css",{comment:{pattern:/(^|[^\\\\])(?:\\/\\*[\\w\\W]*?\\*\\/|\\/\\/.*)/,lookbehind:!0},atrule:{pattern:/@[\\w-]+(?:\\([^()]+\\)|[^(])*?(?=\\s+[{;])/,inside:{rule:/@[\\w-]+/}},url:/(?:[-a-z]+-)*url(?=\\()/i,selector:{pattern:/(?=\\S)[^@;\\{\\}\\(\\)]?([^@;\\{\\}\\(\\)]|&|#\\{\\$[-_\\w]+\\})+(?=\\s*\\{(\\}|\\s|[^\\}]+(:|\\{)[^\\}]+))/m,inside:{placeholder:/%[-_\\w]+/}}}),Prism.languages.insertBefore("scss","atrule",{keyword:[/@(?:if|else(?: if)?|for|each|while|import|extend|debug|warn|mixin|include|function|return|content)/i,{pattern:/( +)(?:from|through)(?= )/,lookbehind:!0}]}),Prism.languages.insertBefore("scss","property",{variable:/\\$[-_\\w]+|#\\{\\$[-_\\w]+\\}/}),Prism.languages.insertBefore("scss","function",{placeholder:{pattern:/%[-_\\w]+/,alias:"selector"},statement:/\\B!(?:default|optional)\\b/i,"boolean":/\\b(?:true|false)\\b/,"null":/\\bnull\\b/,operator:{pattern:/(\\s)(?:[-+*\\/%]|[=!]=|<=?|>=?|and|or|not)(?=\\s)/,lookbehind:!0}}),Prism.languages.scss.atrule.inside.rest=Prism.util.clone(Prism.languages.scss);\nPrism.languages.scala=Prism.languages.extend("java",{keyword:/<-|=>|\\b(?:abstract|case|catch|class|def|do|else|extends|final|finally|for|forSome|if|implicit|import|lazy|match|new|null|object|override|package|private|protected|return|sealed|self|super|this|throw|trait|try|type|val|var|while|with|yield)\\b/,string:/"""[\\W\\w]*?"""|"(?:[^"\\\\\\r\\n]|\\\\.)*"|\'(?:[^\\\\\\r\\n\']|\\\\.[^\\\\\']*)\'/,builtin:/\\b(?:String|Int|Long|Short|Byte|Boolean|Double|Float|Char|Any|AnyRef|AnyVal|Unit|Nothing)\\b/,number:/\\b(?:0x[\\da-f]*\\.?[\\da-f]+|\\d*\\.?\\d+e?\\d*[dfl]?)\\b/i,symbol:/\'[^\\d\\s\\\\]\\w*/}),delete Prism.languages.scala["class-name"],delete Prism.languages.scala["function"];\nPrism.languages.sql={comment:{pattern:/(^|[^\\\\])(?:\\/\\*[\\w\\W]*?\\*\\/|(?:--|\\/\\/|#).*)/,lookbehind:!0},string:{pattern:/(^|[^@\\\\])("|\')(?:\\\\?[\\s\\S])*?\\2/,lookbehind:!0},variable:/@[\\w.$]+|@("|\'|`)(?:\\\\?[\\s\\S])+?\\1/,"function":/\\b(?:COUNT|SUM|AVG|MIN|MAX|FIRST|LAST|UCASE|LCASE|MID|LEN|ROUND|NOW|FORMAT)(?=\\s*\\()/i,keyword:/\\b(?:ACTION|ADD|AFTER|ALGORITHM|ALL|ALTER|ANALYZE|ANY|APPLY|AS|ASC|AUTHORIZATION|BACKUP|BDB|BEGIN|BERKELEYDB|BIGINT|BINARY|BIT|BLOB|BOOL|BOOLEAN|BREAK|BROWSE|BTREE|BULK|BY|CALL|CASCADED?|CASE|CHAIN|CHAR VARYING|CHARACTER (?:SET|VARYING)|CHARSET|CHECK|CHECKPOINT|CLOSE|CLUSTERED|COALESCE|COLLATE|COLUMN|COLUMNS|COMMENT|COMMIT|COMMITTED|COMPUTE|CONNECT|CONSISTENT|CONSTRAINT|CONTAINS|CONTAINSTABLE|CONTINUE|CONVERT|CREATE|CROSS|CURRENT(?:_DATE|_TIME|_TIMESTAMP|_USER)?|CURSOR|DATA(?:BASES?)?|DATETIME|DBCC|DEALLOCATE|DEC|DECIMAL|DECLARE|DEFAULT|DEFINER|DELAYED|DELETE|DENY|DESC|DESCRIBE|DETERMINISTIC|DISABLE|DISCARD|DISK|DISTINCT|DISTINCTROW|DISTRIBUTED|DO|DOUBLE(?: PRECISION)?|DROP|DUMMY|DUMP(?:FILE)?|DUPLICATE KEY|ELSE|ENABLE|ENCLOSED BY|END|ENGINE|ENUM|ERRLVL|ERRORS|ESCAPE(?:D BY)?|EXCEPT|EXEC(?:UTE)?|EXISTS|EXIT|EXPLAIN|EXTENDED|FETCH|FIELDS|FILE|FILLFACTOR|FIRST|FIXED|FLOAT|FOLLOWING|FOR(?: EACH ROW)?|FORCE|FOREIGN|FREETEXT(?:TABLE)?|FROM|FULL|FUNCTION|GEOMETRY(?:COLLECTION)?|GLOBAL|GOTO|GRANT|GROUP|HANDLER|HASH|HAVING|HOLDLOCK|IDENTITY(?:_INSERT|COL)?|IF|IGNORE|IMPORT|INDEX|INFILE|INNER|INNODB|INOUT|INSERT|INT|INTEGER|INTERSECT|INTO|INVOKER|ISOLATION LEVEL|JOIN|KEYS?|KILL|LANGUAGE SQL|LAST|LEFT|LIMIT|LINENO|LINES|LINESTRING|LOAD|LOCAL|LOCK|LONG(?:BLOB|TEXT)|MATCH(?:ED)?|MEDIUM(?:BLOB|INT|TEXT)|MERGE|MIDDLEINT|MODIFIES SQL DATA|MODIFY|MULTI(?:LINESTRING|POINT|POLYGON)|NATIONAL(?: CHAR VARYING| CHARACTER(?: VARYING)?| VARCHAR)?|NATURAL|NCHAR(?: VARCHAR)?|NEXT|NO(?: SQL|CHECK|CYCLE)?|NONCLUSTERED|NULLIF|NUMERIC|OFF?|OFFSETS?|ON|OPEN(?:DATASOURCE|QUERY|ROWSET)?|OPTIMIZE|OPTION(?:ALLY)?|ORDER|OUT(?:ER|FILE)?|OVER|PARTIAL|PARTITION|PERCENT|PIVOT|PLAN|POINT|POLYGON|PRECEDING|PRECISION|PREV|PRIMARY|PRINT|PRIVILEGES|PROC(?:EDURE)?|PUBLIC|PURGE|QUICK|RAISERROR|READ(?:S SQL DATA|TEXT)?|REAL|RECONFIGURE|REFERENCES|RELEASE|RENAME|REPEATABLE|REPLICATION|REQUIRE|RESTORE|RESTRICT|RETURNS?|REVOKE|RIGHT|ROLLBACK|ROUTINE|ROW(?:COUNT|GUIDCOL|S)?|RTREE|RULE|SAVE(?:POINT)?|SCHEMA|SELECT|SERIAL(?:IZABLE)?|SESSION(?:_USER)?|SET(?:USER)?|SHARE MODE|SHOW|SHUTDOWN|SIMPLE|SMALLINT|SNAPSHOT|SOME|SONAME|START(?:ING BY)?|STATISTICS|STATUS|STRIPED|SYSTEM_USER|TABLES?|TABLESPACE|TEMP(?:ORARY|TABLE)?|TERMINATED BY|TEXT(?:SIZE)?|THEN|TIMESTAMP|TINY(?:BLOB|INT|TEXT)|TOP?|TRAN(?:SACTIONS?)?|TRIGGER|TRUNCATE|TSEQUAL|TYPES?|UNBOUNDED|UNCOMMITTED|UNDEFINED|UNION|UNIQUE|UNPIVOT|UPDATE(?:TEXT)?|USAGE|USE|USER|USING|VALUES?|VAR(?:BINARY|CHAR|CHARACTER|YING)|VIEW|WAITFOR|WARNINGS|WHEN|WHERE|WHILE|WITH(?: ROLLUP|IN)?|WORK|WRITE(?:TEXT)?)\\b/i,"boolean":/\\b(?:TRUE|FALSE|NULL)\\b/i,number:/\\b-?(?:0x)?\\d*\\.?[\\da-f]+\\b/,operator:/[-+*\\/=%^~]|&&?|\\|?\\||!=?|<(?:=>?|<|>)?|>[>=]?|\\b(?:AND|BETWEEN|IN|LIKE|NOT|OR|IS|DIV|REGEXP|RLIKE|SOUNDS LIKE|XOR)\\b/i,punctuation:/[;[\\]()`,.]/};\nPrism.languages.swift=Prism.languages.extend("clike",{string:{pattern:/("|\')(\\\\(?:\\((?:[^()]|\\([^)]+\\))+\\)|\\r\\n|[\\s\\S])|(?!\\1)[^\\\\\\r\\n])*\\1/,inside:{interpolation:{pattern:/\\\\\\((?:[^()]|\\([^)]+\\))+\\)/,inside:{delimiter:{pattern:/^\\\\\\(|\\)$/,alias:"variable"}}}}},keyword:/\\b(as|associativity|break|case|catch|class|continue|convenience|default|defer|deinit|didSet|do|dynamic(?:Type)?|else|enum|extension|fallthrough|final|for|func|get|guard|if|import|in|infix|init|inout|internal|is|lazy|left|let|mutating|new|none|nonmutating|operator|optional|override|postfix|precedence|prefix|private|Protocol|public|repeat|required|rethrows|return|right|safe|self|Self|set|static|struct|subscript|super|switch|throws?|try|Type|typealias|unowned|unsafe|var|weak|where|while|willSet|__(?:COLUMN__|FILE__|FUNCTION__|LINE__))\\b/,number:/\\b([\\d_]+(\\.[\\de_]+)?|0x[a-f0-9_]+(\\.[a-f0-9p_]+)?|0b[01_]+|0o[0-7_]+)\\b/i,constant:/\\b(nil|[A-Z_]{2,}|k[A-Z][A-Za-z_]+)\\b/,atrule:/@\\b(IB(?:Outlet|Designable|Action|Inspectable)|class_protocol|exported|noreturn|NS(?:Copying|Managed)|objc|UIApplicationMain|auto_closure)\\b/,builtin:/\\b([A-Z]\\S+|abs|advance|alignof(?:Value)?|assert|contains|count(?:Elements)?|debugPrint(?:ln)?|distance|drop(?:First|Last)|dump|enumerate|equal|filter|find|first|getVaList|indices|isEmpty|join|last|lexicographicalCompare|map|max(?:Element)?|min(?:Element)?|numericCast|overlaps|partition|print(?:ln)?|reduce|reflect|reverse|sizeof(?:Value)?|sort(?:ed)?|split|startsWith|stride(?:of(?:Value)?)?|suffix|swap|toDebugString|toString|transcode|underestimateCount|unsafeBitCast|with(?:ExtendedLifetime|Unsafe(?:MutablePointers?|Pointers?)|VaList))\\b/}),Prism.languages.swift.string.inside.interpolation.inside.rest=Prism.util.clone(Prism.languages.swift);\nPrism.languages.typescript=Prism.languages.extend("javascript",{keyword:/\\b(break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|false|finally|for|function|get|if|implements|import|in|instanceof|interface|let|new|null|package|private|protected|public|return|set|static|super|switch|this|throw|true|try|typeof|var|void|while|with|yield|module|declare|constructor|string|Function|any|number|boolean|Array|enum)\\b/});\nPrism.languages.yaml={scalar:{pattern:/([\\-:]\\s*(![^\\s]+)?[ \\t]*[|>])[ \\t]*(?:((?:\\r?\\n|\\r)[ \\t]+)[^\\r\\n]+(?:\\3[^\\r\\n]+)*)/,lookbehind:!0,alias:"string"},comment:/#.*/,key:{pattern:/(\\s*[:\\-,[{\\r\\n?][ \\t]*(![^\\s]+)?[ \\t]*)[^\\r\\n{[\\]},#]+?(?=\\s*:\\s)/,lookbehind:!0,alias:"atrule"},directive:{pattern:/(^[ \\t]*)%.+/m,lookbehind:!0,alias:"important"},datetime:{pattern:/([:\\-,[{]\\s*(![^\\s]+)?[ \\t]*)(\\d{4}-\\d\\d?-\\d\\d?([tT]|[ \\t]+)\\d\\d?:\\d{2}:\\d{2}(\\.\\d*)?[ \\t]*(Z|[-+]\\d\\d?(:\\d{2})?)?|\\d{4}-\\d{2}-\\d{2}|\\d\\d?:\\d{2}(:\\d{2}(\\.\\d*)?)?)(?=[ \\t]*($|,|]|}))/m,lookbehind:!0,alias:"number"},"boolean":{pattern:/([:\\-,[{]\\s*(![^\\s]+)?[ \\t]*)(true|false)[ \\t]*(?=$|,|]|})/im,lookbehind:!0,alias:"important"},"null":{pattern:/([:\\-,[{]\\s*(![^\\s]+)?[ \\t]*)(null|~)[ \\t]*(?=$|,|]|})/im,lookbehind:!0,alias:"important"},string:{pattern:/([:\\-,[{]\\s*(![^\\s]+)?[ \\t]*)("(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\')(?=[ \\t]*($|,|]|}))/m,lookbehind:!0},number:{pattern:/([:\\-,[{]\\s*(![^\\s]+)?[ \\t]*)[+\\-]?(0x[\\da-f]+|0o[0-7]+|(\\d+\\.?\\d*|\\.?\\d+)(e[\\+\\-]?\\d+)?|\\.inf|\\.nan)[ \\t]*(?=$|,|]|})/im,lookbehind:!0},tag:/![^\\s]+/,important:/[&*][\\w]+/,punctuation:/---|[:[\\]{}\\-,|>?]|\\.\\.\\./};\n' +
		          '})()';
    script = script.replace(/\"%%%(.*?)%%%\"/g,function(_,match){
    	return eval('"'+match+'"');
    });
		return script;
	}


	var worker = null;
	function buildWorker() {
		if(worker) return worker;
		var blob = new Blob([scriptFromScope(fileRenderScope)], { type: "text/javascript" })
		var url = window.URL.createObjectURL(blob);
		worker = new Worker(url);

		worker.fileHtml = function(file, file_index) {
			var deferred = $q.defer();

			worker.onmessage = function(event) {
				deferred.resolve(event.data);
			}
			worker.postMessage(JSON.stringify({fn: 'fileHtml', params: [file, file_index], globals: {$scope: {unified: $scope.unified, commit: { highlightEnabled: $scope.commit.highlightEnabled, repo_id: $scope.commit.repo_id } } } }) );
			return deferred.promise;
		}
		return worker;
	}

	var queue = [];
	var working = false;
	$scope.renderDiff= function(file_index, no_loading) {
		var status = gc.status();
		queue.push((function () {
			var file = $scope.commit.files[file_index];

			var worker = buildWorker();

			worker.fileHtml(file, file_index).then(function(buf) {

				var tbody = $('#file'+file_index);
				tbody.find('tr.diff-line:not(.comment-line,.issue-line), tr.expand-line').remove();
				tbody.prepend(buf);
				var rows = tbody.find('tr.diff-line:not(.comment-line,.issue-line)');
				rows.click(function() {
					$scope.showComment(file_index, parseInt($(this).attr('data-line')), file, '', $(this));
				});

				var target = function(element) { return element.parents('.file').find('.comment[data-offset="' + element.attr('data-line')+'"]'); };

				//rows.hover(
				//	function() { target($(this)).addClass('comment-hover');},
				//	function() { target($(this)).removeClass('comment-hover');}
				//);

				$timeout(function() {
					file.$rendered=true;
					status.manual_loading=false;
					if($scope.scrollTop) {
						$timeout(function() {
							$(window).scrollTop( $scope.scrollTop ) ;
							$scope.scrollTop = null;
						});
					}

					$timeout(function() {
						file.$html = {};
						file.$html.height = tbody.height();
						file.$html.top = tbody.offset().top;
						file.$html.visible = true;
						file.$html.parent = tbody.parent();
						file.$html.content = tbody;
						ensureVisible();
					})
				});

				if(queue.length) {
					setTimeout(queue.shift());
				} else working = false;

			});


		}));

		if(!working) {
			//if(file_index == 0) status.manual_loading= !no_loading;
			working=true;
			setTimeout(queue.shift());
		}
	}

	var timer = null
	$document.scroll(function() {
		if(timer) return;
		timer = setTimeout(function(){timer=null; ensureVisible();} , 300);
	});

	function ensureVisible() {
		if (!$scope.commit || !$scope.commit.files) return;
		var files = $scope.commit.files;
		var l = files.length;
		var off = 300;
		var st = $document.scrollTop() - off;
		var dh = window.innerHeight + 2*off; // visible windows is window.innerHeight + 2*off with this hack files will be rendered earlier
		for(var i=0; i<l;++i) {
			var f = files[i];
			var html = f.$html;
			if(!html) continue;

			var ot = html.top;
			var h = html.height;

			if((ot > st && ot < st+dh) ||
				 (ot + h > st && ot + h < st+dh) ||
				 (ot < st && ot+h > st+dh) ) {
				//file visible
				if(!html.visible){
					html.parent.html('');
					html.parent.append(html.content);
					html.visible=true;
				}
			} else {
				//file not visible
				if(html.visible){
					html.height = html.content.height();
					html.top = html.content.offset().top;
					html.content.detach();
					html.visible = false;
					html.parent.append('<div style="height:'+h+'px"></div>');
				}

			}
		}
	}

	$scope.$watch('hide_comments', function(hide){
		if(!$scope.commit.files) return;
		for(var f = 0; f < $scope.commit.files.length; f++) {
			var file = $scope.commit.files[f];
			for(var i = 0; i < file.comments.length; i++) {
				var c = file.comments[i];
				c.$hide = !!hide;
			}
		}
	})

	$scope.fileClass = function(file) {
		var css = ['file'];
		if ($.grep($scope.commit.files, function(f) { return (f.comments||[]).length; }).length) {
			css.push('has-comments');
		}
		return css.join(' ');
	}

	function lineClass(file, line) {
		return '';
		var css = [];
		if (line.extra) css.push('extra');
		var issues = $.grep(file.comments, function(c) { return c.offset == line.offset && c.issue });
		if (issues.length) {
			css.push('issue');
			if (!$.grep(issues, function(c) { return !c.closed }).length) {
				css.push('closed');
			}
		}
		return css.join(' ');
	}

	$scope.commentClass = function(comment) {
		if (!comment.issue) return;
		if (!comment.closed) return 'issue';
		return 'issue closed';
	}

	$scope.showMainComment = function() { $window.scrollTo(0, 0); }

	$scope.showReply = function(comment) {
		comment.$showReply=!comment.$showReply || comment.$replyFocus;
	}

	$scope.showComment = function(file_index, line_offset, file, text, elem, comment_parent) {
		file.editing = null;
		if (!$scope.review || line_offset === undefined) return;
		var comment = $('table[data-file="'+file_index+'"] .file-comment');
		var row = (elem || $('tr[data-file="'+file_index+'"][data-line="'+line_offset+'"]').last());
		row.after(comment);
		if (comment.attr('data-line') == line_offset) {
			comment.toggleClass('hidden');
		} else {
			comment.removeClass('hidden');
		}
		if (!comment.hasClass('hidden')) {
			comment.attr('data-line', row.attr('data-offset'));
			//comment.find('textarea').focus().val(text || '');
			if(file.new_comment.$tab == 'edit') {
				$timeout(function(){
					comment.find('textarea').focus().click();
					$timeout(function(){comment.find('textarea').focus().click();});
				});
			}

			file.new_comment.text = text;
			file.new_comment.$active = true;
			file.reply_to = comment_parent || null;
		}
	}
	$scope.editComment = function(file_index, file, comment, tab, offset) {
		file.new_comment.text = comment.text;
		file.new_comment.title = comment.title;
		file.new_comment.severity = comment.severity;
		file.new_comment.issue = comment.issue;
		file.new_comment.$tab = tab || 'edit';
		file.new_comment.$active = true;
		$scope.showComment(file_index, offset || comment.offset, file, comment.text);
		file.editing = comment;
	}
	$scope.newReplay = function(file_index, file, comment, tab, offset) {
		file.new_comment.text = comment.text;
		file.new_comment.title = comment.title;
		file.new_comment.severity = comment.severity;
		file.new_comment.issue = comment.issue;
		file.new_comment.$tab = tab || 'edit';
		file.new_comment.$active = true;
		$scope.showComment(file_index, offset || comment.offset, file, comment.text);
		file.editing = comment;
	}
	$scope.updateComment = function(file_index, file) {
		var comment = $('table[data-file="'+file_index+'"] .file-comment');
		file.editing.text = file.new_comment.text;
		file.editing.title = file.new_comment.title;
		file.editing.severity = file.new_comment.severity;
		file.new_comment.$active = true;
		comment.addClass('hidden');
		$scope.onUpdateComment({'$diffComment': file.editing});
		file.editing = null;
	}
	$scope.replyComment = function(comment, text) {
		$scope.onReplyComment({$comment:{text: text}, $parent: comment.id})
		comment.$newComment = '';
	}
	$scope.hideComment = function(file_index) {
		$('table[data-file="'+file_index+'"] .file-comment').addClass('hidden');
	}
	$scope.saveComment = function(file_index, file, is_issue) {

		var comment_ctrl = $('table[data-file="'+file_index+'"] .file-comment');

		if(file.reply_to) {
			//reply to comment
			comment_ctrl.addClass('hidden');
			return $scope.replyComment(file.reply_to, file.new_comment.text);
		}

		var line = comment_ctrl.attr('data-line') | 0;
		if (!file.comments) file.comments = [];
		var comment_text = file.new_comment.text;//comment_ctrl.find('textarea').val();
		var title = file.new_comment.title;
		var issue = file.new_comment.issue;
		if((!/\S/.test(comment_text) && !issue) || (issue && !/\S/.test(title) ) ) return;

		comment_ctrl.addClass('hidden');

		var code = file.diff[line].modified.text || file.diff[line].original.text;
		var lang = gcHighlight.langToPrism(file.path, (!!file.skills[0] ? file.skills[0].name || "" : ""));
		var code_block = "\n```"+ lang +"\n" + code + "\n```";
		comment_text += code_block;

		var comment = {
			author: {
				username: $scope.info.name,
				avatar:   $scope.info.avatar
			},
			offset:   file.diff[line].modified.line,
			line:     file.diff[line].modified.line,
			title:    title,
			blocker:  file.new_comment.blocker,
			sync:     file.new_comment.sync,
			severity: file.new_comment.severity,
			assignee:  (issue ? file.new_comment.assignee : null),
			provider_parent: (file.new_comment.parent ? file.new_comment.parent.provider_id : null), //todo send our id not the provider
			text:     comment_text,
			date:     'now',
			is_new:   true,
			issue:    issue,
			path:     file.path,
			closed:   false,
			status:   'Open',
			parent_id: $scope.commit.id,
			sha:      $scope.commit.head_sha,
			created: new Date(),
			updated: new Date()
		};

		//store the issue
		file.comments.push(comment);

		if (!$scope.commit.$new_comments) $scope.commit.$new_comments = {'$count': 0};
		if (!$scope.commit.$new_comments[file.path]) $scope.commit.$new_comments[file.path] = [];
		$scope.commit.$new_comments[file.path].push(comment);
		++$scope.commit.$new_comments.$count;

		file.new_comment = newComment();

	}
	$scope.commentsCount = function() {
		var count = 0;
		for(var i=0; i < $scope.commit.files.length; i++) {
			var f = $scope.commit.files[i];
			for(var j=0; j < f.comments.length; j++) {
				var c = f.comments[j];
				if(c.issue || !c.closed) count += 1;
			}
		}
		return count;
	}
	$scope.deleteComment = function(comment, file_index) {
		if(file_index!==undefined) comment.file_index=file_index;
		$scope.onDeleteComment({'$diffComment':comment})
	}
	$scope.commentText = function(comment) {
		if(comment.issue) return comment.title;
		var text = comment.text.split("\n")[0];
		return comment.more || text.length < 50 ? text : (text.substr(0, 47)+'...');
	}

	$scope.closeIssue = function(issue, resolution) {
		var args = resolution ? {resolution: resolution} : {};
		issue.$closing = true;
		gc.closeIssue($scope.commit.repo_id, issue, args).then(function(data) {
			$scope.onCloseIssue({'$issue': issue, '$data': data});
			issue.$closing = false;
		}, function(){issue.$closing = false;});
	}

  $scope.openIssue = function(issue) {
		issue.$closing = true;
		gc.openIssue($scope.commit.repo_id, issue).then(function(data) {
			$scope.onOpenIssue({'$issue': issue, '$data': data});
			issue.$closing = false;
		}, function(){issue.$closing = false;});
	}

	$scope.resolveComment = function(comment) {
		comment.$closing = true;
		gc.resolveCommentPullRequest($scope.commit.repo_id, $scope.commit.id, {comment_id: comment.id, resolved: true}).then(function(data) {
			comment.closed = true;
			comment.$closing = false;
		}, function(){comment.$closing = false;});
	}

	$scope.unresolveComment = function(comment) {
		comment.$closing = true;
		gc.resolveCommentPullRequest($scope.commit.repo_id, $scope.commit.id, {comment_id: comment.id, resolved: false}).then(function(data) {
			comment.closed = false;
			comment.$closing = false;
		}, function(){comment.$closing = false;});
	}


	$scope.showFullScreen = function(comment) {
		$scope.fullScreenComment = comment;
	}

	$scope.filterResolved = function(comment) {
		return comment.issue || !comment.closed;
	}

	$scope.gcIf = function(expr, on_true, on_false) { return expr ? on_true : on_false }

	function newComment() {
		return {blocker: true, sync: true, issue: false, severity: 2, text:"", title: "", $tab: 'edit' };
	}

	$scope.$watch('commit.files', function(loaded) {
		if (!loaded) return;
		var has_comments = false;
		$.each($scope.commit.files, function() {
			this.new_comment = newComment();
			$.each(this.comments || [], function() {
				if(this.issue || !this.closed) has_comments = true;
				if (this.is_new || !this.issue) return;
				var issue_id = parseInt(this.issue);
				this.issue = $.grep($scope.commit.issues, function(i) { return i.id == issue_id; })[0] || { closed: true };
			});
		});
	});

	$scope.$watch('commit.files.length', function(){
		if($scope.commit.files && $scope.commit.files.length) {

			if($scope.commit.files) {
				var l = $scope.commit.files.length;
				for(var i = 0; i < l; i++) {
					var file = $scope.commit.files[i];
					if(!file.new_comment) {
						file.new_comment = newComment();
					}
				}
			}
		}
	});

	$scope.$watch('unified', function(newVal, oldVal) {

		if(oldVal === false || oldVal===true) {
			refreshDiff();
		}

	});

	$scope.$watch('commit.highlightEnabled', function(newVal, oldVal) {

		if(oldVal === false || oldVal===true) {
			refreshDiff();
		}

	});

	function refreshDiff() {
		queue=[];
		//working=false;
		$scope.scrollTop = $(window).scrollTop();
		if($scope.commit.files) {
			var l = $scope.commit.files.length;
			for(var i = 0; i < l; i++) {
				var f = $scope.commit.files[i];
				f.$rendered=false;
				if(f.$html && !f.$html.visible){
					f.$html.parent.html('');
					f.$html.parent.append(f.$html.content);
				}
				f.$html=null;
			}
			for(var i = 0; i < l; i++) {
				$scope.renderDiff(i);
			}
		}
	}

	$scope.$watch('commit.issues', function(loaded) {
		if (!loaded) return;
		$scope.commit.$openIssues = function() {
			return $.grep($scope.commit.issues || [], function(i) { return !i.closed && i.blocker; }).length;
		}
	});

	$scope.openTabConversation = function(comment) {
		$location.search({tab: 'conversation', comment_id: comment.id, reply_comment: true });
	}

	$scope.severities = IncidentsHelpers.severities.slice(0, IncidentsHelpers.severities.length-1); //Remove last item (none severity)

	$scope.activeFile=0;
	$document.scroll(function(){
		$timeout(function(){
			var files = $('.file-container');
			var l = files.length;
			var off = 90;
			var st = $document.scrollTop() + off;
			var dh = window.innerHeight - off;
			$scope.activeFile = -1;
			for(var i=0; i<l;++i) {
				var f = $(files[i]);
				var ot = f.offset().top;
				var h = f.height();
				if(ot > st+dh) {
					$scope.activeFile = i > 0 ? i - 1 : 0;
					break;
				}
				if(ot > st) {
					$scope.activeFile = i;
					break;
				}
				$scope.activeFile=($scope.activeFile+1);
			}
		});
	})

	function setActiveComment(move) {
		var comments = [];
		for(var i = 0; i < $scope.commit.files.length; ++i) {
			var cs = $scope.commit.files[i].comments;
			for(var j = 0; j < cs.length; j++) {
				comments.push(cs[j]);
			}
		}
		var l = comments.length;
		var off = 90;
		var st = $document.scrollTop() + off;
		var dh = 300;//window.innerHeight - off;
		var activeComment = -1;
		for(var i=0; i<l;++i) {
			var c = comments[i];
			var ot = c.$top;
			var h = 40;
			if(ot+h < st) {
				//between two comments
				activeComment = i + 0.5;
			}
			if(ot+h < st+dh && ot > st) {
				//comment visible
				activeComment = i;
				break;
			}
		}

		var n = Math.round(activeComment + move);

		if(n < 0 || n >= l ) return;

		var c = comments[n];
		var ot = c.$top;
		var h = 40;

		$("html, body").animate({ scrollTop: ot - 112 } );

		var f = function(){
			var ce = $('#fcomment_'+c.id);
			if(!ce.length) return $timeout(f,50);
			c.$top = ce.offset().top;
			$("html, body").animate({ scrollTop: c.$top - 112 } );
		}
		$timeout(f,350);
	}

	$scope.nextComment = function() {
		setActiveComment(1);
	}

	$scope.prevComment = function() {
		setActiveComment(-1);
	}

	function fileByTarget(e) {
		var f = $(e.target).closest('table[data-file]');
		return f.length ? f.attr('data-file')|0 : -1;
	}

	$scope.shortCreateComment = function(e) {
		var fi = fileByTarget(e);
		if(fi==-1) return;
		saveComment(fi, $scope.commit.file[fi]);
	}

}]);

gitcolony.directive("gcIssues", [function() {
	return({
		restrict: 'A',
		scope: { diff: '=gcIssues', onCloseIssue: '&' },
		controller: 'GcIssuesCtrl',
		templateUrl: 'widgets/gc-issues.html'
	});
}]);
gitcolony.controller('GcIssuesCtrl', ['$scope', '$window', 'gc', function($scope, $window, gc) {
	$scope.scrollToIssue = function(issue) {
		var target = $('[issue-id='+issue.id+']');
		if (!target.length) return;
		var actions = $('.sticky');
		if (!actions.is('.is_stuck')) {
			$window.scrollTo(0, actions.height() + actions.offset());
		}
		var offset = parseInt(actions.css('margin-top')) + actions.height();

		$('html,body').animate({scrollTop: target.offset().top + (-offset - 50) }, 'slow');
	}
	$scope.closeIssue = function(issue, resolution) {
		var args = resolution ? {resolution: resolution} : {};
		gc.closeIssue($scope.diff.repo_id, issue, args).then(function(data) {
			$scope.onCloseIssue({'$issue': issue, '$data': data});
		});
	}
	$scope.cardFriendlyStatus=function(card){
		var msg={'current': 'Current Phase', 'doing': 'In Progress', 'qa': 'Ready for QA'};
		return (card.status in msg) ? msg[card.status] : '';
	}

	$scope.showCard=function(card){
		$window.open('https://trello.com/c/'+card.provider_id, '_blank');
	}
}]);

gitcolony.directive("gcTests", [function() {
	return({
		restrict: 'A',
		scope: { tests: '=gcTests' },
		controller: 'GcTestsCtrl',
		templateUrl: 'widgets/gc-tests.html'
	});
}]);
gitcolony.controller('GcTestsCtrl', ['$scope', function($scope) {
	//empty
}]);


gitcolony.factory('gcCollabHelper', ['gc', function(gc) {
	return {
		inviteCollab: function(repo, email, id) {
			return gc.inviteCollab(repo.id, email, id).then(function(data) {
				if (data.user) {
					repo.current[data.user.id] = data.user;
				} else if (data.id) {
					repo.pending[data.id] = email;
				}
			});
		}
	}
}]);

gitcolony.directive("gcCollabSearch", [function() {
	return({
		restrict: 'A',
		scope: { repo: '=gcCollabSearch' },
		controller: 'GcCollabSearchCtrl',
		templateUrl: 'widgets/gc-collab-search.html',
		link: function(scope, element, attrs) {
			scope.container = element;
		}
	});
}]);
gitcolony.controller('GcCollabSearchCtrl', ['$scope', 'gc', 'gcCollabHelper', 'message', function($scope, gc, gcCollabHelper, message) {
	function search_container() { return $scope.container.find('.search-container'); }
	function username()         { return $scope.container.find('.username');         }

	$scope.predict = function(u) {
		if (!USERNAME_REGEXP.test(u)) {
			$scope.not_found = u;
			return [];
		}
		return gc.predictUsername(u).then(function(data) {
			$scope.not_found = (!data.length) ? u : null;
			return data;
		});
	}

	$scope.onFocus = function() { search_container().collapse('show'); }
	$scope.onBlur  = function() { username().removeClass('ng-invalid'); }

	$scope.checkEmail = function() { $scope.allow_invite = EMAIL_REGEXP.test(username().val()); }

	$scope.hideSearch = function(e) {
		e.stopImmediatePropagation();
		e.preventDefault();
		search_container().collapse('hide');
	}

	$scope.inviteCollab = function() {
		gcCollabHelper.inviteCollab($scope.repo, username().val());
		$scope.user = null;
		search_container().collapse('hide');
	}

	$scope.addCollab = function() {
		if (!$scope.user) {
			if ($scope.allow_invite) $scope.inviteCollab();
			return;
		}

		if ($scope.repo.current[$scope.user.id]) {
			message.show($scope.user.username +' is a collaborator already!');
		} else {
			var user = $scope.user;
			gc.addCollab($scope.repo.id, $scope.user.id).then(function(data) {
				$scope.repo.current[user.id] = data.user;
			});
		}

		$scope.user= null;
		$scope.not_found = null;
		search_container().collapse('hide');
	}
}]);

gitcolony.directive("gcCollabList", [function() {
	return({
		restrict: 'A',
		scope: { repo: '=gcCollabList' },
		controller: 'GcCollabListCtrl',
		templateUrl: 'widgets/gc-collab-list.html'
	});
}]);
gitcolony.controller('GcCollabListCtrl', ['$scope', 'gc', 'gcCollabHelper', function($scope, gc, gcCollabHelper) {
	$scope.left  = [];
	$scope.right = [];
	$scope.is_empty = true;

	function hashToArray(hash, type) {
		var list = [];
		for (var id in hash) {
			if (id.indexOf('$') == 0) continue;
			list.push({id: id, val: hash[id], type: type, active: hash[id].active, email: hash[id].email });
			$scope.checkEmail(list[list.length-1]);
		}
		return list;
	}

	function splitList() {
		var current = hashToArray($scope.repo.current, 'current');
		var pending = hashToArray($scope.repo.pending, 'pending');

		current.sort(function(a,b) {
			return a.val.username < b.val.username ? -1 : 1;
		});
		pending.sort(function(a,b) {
			return a.val < b.val ? -1 : 1;
		});

		var list = current.concat(pending);
		var half = Math.ceil(list.length/2);
		angular.copy(list.slice(0,half), $scope.left );
		angular.copy(list.slice(half)  , $scope.right);
		$scope.is_empty = (list.length == 0);
	}

	$scope.$watchCollection('repo.current', function() { splitList(); });
	$scope.$watchCollection('repo.pending', function() { splitList(); });

	$scope.deleteCollab = function(id) {
		gc.deleteCollab($scope.repo.id, id).then(function(data) {
			delete $scope.repo.current[id];
		});
	}
	$scope.deleteCollabInvite = function(id) {
		gc.deleteCollabInvite($scope.repo.id, id).then(function(data) {
			delete $scope.repo.pending[id];
		});
	}

	$scope.checkEmail = function(collab) { collab.allow_invite = EMAIL_REGEXP.test(collab.email); }

	$scope.inviteCollab = function(collab) {
		$scope.checkEmail(collab);
		if (!collab.allow_invite) return;
		collab.val.inviting = true;
		gc.inviteToTeam(collab.email, collab.id).then(function() {
			collab.val.inviting = false;
			collab.val.invited  = true;
			//collab.val.active   = true;
			var c = $scope.repo.current[collab.id];
			c.inviting = false;
			c.invited  = true;
			//c.active   = true;
		}, function() {
			collab.val.inviting = false;
			var c = $scope.repo.current[collab.id];
			c.inviting = false;
		});
	}
}]);

gitcolony.directive("gcCollabsCombo", [function() {
	return({
		restrict: 'A',
		scope: {
			collabs: '=gcCollabsCombo',
			gcClick: '&'
		},
		link: function(scope, element, attrs) {

			scope.select = function(id) {
				//scope.selected_id = id;
				//scope.selected = scope.collabs[id];
				scope.gcClick({id: id});
			}
			scope.selected = {username: 'Add collaborators to this repo' };

			scope.sortedItems = function(){
				var a = [];
				for(var k in scope.collabs) {
					scope.collabs[k].$id = k;
					a.push(scope.collabs[k]);
				}

				a.sort(function(a,b){return a.username < b.username ? -1 : 1;});

				if(!scope.selected_id && a.length > 0) {
					//scope.selected = a[0];
					//scope.selected_id = a[0].$id;
				}

				return a;
			}
		},
		template: '<div class="dropdown"><button type="button" class="btn btn-default dropdown-toggle"><span gc-user="selected" display="avatar nolink" size="small"></span> {{selected.username}} <span class="caret"></span></button><ul class="dropdown-menu dropdown-menu-right" role="menu"><li ng-repeat="collab in sortedItems()"><a ng-click="select(collab.$id)"><span gc-user="collab" display="avatar nolink" size="small"></span> {{collab.username}}</a></li></ul></div>'
	});
}]);

gitcolony.directive("gcCollabWidget", [function() {
	return({
		restrict: 'A',
		scope: {
			repo: '=gcCollabWidget',
			collabs: '=collabs',
			gitProvider: '=gitProvider',
			ctrlDeleteRepo: '&deleteRepoFn'
		},
		controller: 'GcCollabWidgetCtrl',
		template: '<h3 class="clearfix">{{repo.name}} <div ng-show="repo.importing" class="spinner"></div><span class="pull-right"><button ng-hide="repo.importing || gitProvider!=\'github\'" type="button" class="btn btn-default" ng-click="importCollabs(repo)"><i class="fa fa-github fa-lg"></i> Import collaborators from GitHub</button> &nbsp; <button ng-hide="repo.importing || gitProvider!=\'bitbucket\'" type="button" class="btn btn-default" ng-click="importCollabs(repo)"><i class="fa fa-bitbucket fa-lg"></i> Import collaborators from Bitbucket</button> &nbsp; <div class="btn-group"><div class="inline" gc-collabs-combo="collabs.collabs.current" gc-click="addCollab(id)"> </div></div> &nbsp; <a class="btn btn-danger" data-confirm="Are you sure you want to delete this repository from Gitcolony? You will lose all the information associated that was generated on the platform" gc-confirm="deleteRepo(repo)">Delete repo</a></span></h3> <div gc-collab-list="repo"> </div>'
	});
}]);

gitcolony.controller('GcCollabWidgetCtrl', ['$scope', 'gc', 'gcCollabHelper', function($scope, gc, gcCollabHelper) {
	$scope.importCollabs = function(repo) {
		repo.importing = true;
		gc.importCollabs(repo.id).then(function(data) {
			repo.importing = false;
			angular.extend(repo.current, data.collabs);
		}, function() { repo.importing = false; });
	}

	$scope.addCollab = function(id) {
		var user = $scope.collabs.collabs.current[id];

		if (!user) {
			return;
		}

		if ($scope.repo.current[user.id]) {
			message.show(user.username +' is a collaborator already!');
		} else {
			gc.addCollab($scope.repo.id, user.id).then(function(data) {
				$scope.repo.current[user.id] = data.user;
			});
		}
	}

	$scope.deleteRepo = function(repo) {
		$scope.ctrlDeleteRepo({repo: repo});
	}

}]);

// Slider
gitcolony.factory('gcSliderStatus', [function() {
	return {
		from:     		0,
		to:       		0,
		ghostFrom:     -1,
		ghostTo:       -1,
		reviewed: 		0,
		setFrom: 		function(val, index) { this.from = val; this.listFrom = index || (val+1);},
		setTo: 			function(val, index){ this.to = val; this.listTo = index || val;},
		listTo: 		0,
		listFrom: 		0
	};
}]);

gitcolony.directive('gcSlider', ['gcSliderStatus', function(gcSliderStatus) {
	return({
	restrict: 'A',
		link: function(scope, el, attrs) {
			angular.element(el).attr("draggable", "true");
			el.bind("dragstart", function(e) {
				e.originalEvent.dataTransfer.setData('id', attrs.id);
				e.originalEvent.dataTransfer.setData(attrs.placement, "true"); //in chrome cant retrieve data with getData, but the dataType works
				e.originalEvent.dataTransfer.setDragImage($('#slider_drag_image')[0], 0, 0);
			});
		}
	});
}]);

gitcolony.directive('gcGhostSlider', ['gcSliderStatus', function(gcSliderStatus) {
	return({
		restrict: 'A',
		link: function(scope, el, attrs) {
			el.css('opacity', 0.2);
		}
	});
}]);

gitcolony.directive('gcSliderTarget', ['gcSliderStatus', '$timeout', function(gcSliderStatus, $timeout) {
	return({
		restrict: 'A',
		scope: {
			index: 		'=',
			listIndex:  '=',
			onDrop: 	'&'
		},
		link: function(scope, element, attrs) {
			element.attr('target-index', scope.index);
			element.bind("dragenter", function(e) {
				$(e.target).addClass('drag-enter');
				element.addClass('drag-over');
				var slider = $('#'+e.originalEvent.dataTransfer.getData('id'));
				if ($.inArray('before', e.originalEvent.dataTransfer.types) != -1){
					if (scope.index < gcSliderStatus.from) return;
					scope.$apply(function() { gcSliderStatus.setTo(scope.index+1); });

				} else {
					//if (scope.index >= gcSliderStatus.to || scope.index > gcSliderStatus.reviewed) return;
					if (scope.index >= gcSliderStatus.to) return;
					scope.$apply(function() { gcSliderStatus.setFrom(scope.index, scope.listIndex); });
				}
			});
			element.bind("dragleave", function(e) {
				$(e.target).removeClass('drag-enter');
				if (!element.find('.drag-enter').length) element.removeClass('drag-over');
			});
			element.bind("click", function(e) {
				var move_to = e.offsetY < element.height()/2;
				if (move_to){
					if (scope.index < gcSliderStatus.from) return;
					scope.$apply(function() { gcSliderStatus.setTo(scope.index+1, scope.listIndex); });

				} else {
					//if (scope.index >= gcSliderStatus.to || scope.index > gcSliderStatus.reviewed) return;
					if (scope.index >= gcSliderStatus.to) return;
					scope.$apply(function() { gcSliderStatus.setFrom(scope.index, scope.listIndex); });
				}
			});

			$(element[0]).mousemove(function(e) {
				var move_to = e.offsetY < element.height()/2;
				if (move_to){
					if (scope.index < gcSliderStatus.from) return;
					scope.$apply(function() { gcSliderStatus.ghostTo = scope.index+1; gcSliderStatus.ghostFrom = -1; });

				} else {
					//if (scope.index >= gcSliderStatus.to || scope.index > gcSliderStatus.reviewed) return;
					if (scope.index >= gcSliderStatus.to) return;
					scope.$apply(function() { gcSliderStatus.ghostFrom = scope.index; gcSliderStatus.ghostTo = -1;});
				}
			});

			$(element[0]).hover(function(e) {
			}, function(e) {
				scope.$apply(function() { gcSliderStatus.ghostFrom = gcSliderStatus.ghostTo = -1; });
			});

			//if(!gcSliderStatus.listTo && scope.$parent.$first) $timeout(function() { if(!gcSliderStatus.listTo)	gcSliderStatus.setTo(gcSliderStatus.to, scope.listIndex);	}); //hack to recalculate gcSliderStatus.listTo
			//if(scope.index == gcSliderStatus.from)$timeout(function() { gcSliderStatus.setFrom(gcSliderStatus.from, scope.listIndex); }); //hack to recalculate gcSliderStatus.listFrom
			//if(scope.index == gcSliderStatus.to) $timeout(function() { gcSliderStatus.setTo(gcSliderStatus.to, scope.listIndex); }); //hack to recalculate gcSliderStatus.listTo
			//if(!gcSliderStatus.listFrom && scope.$parent.$last) $timeout(function() { if(!gcSliderStatus.listFrom)	gcSliderStatus.setFrom(gcSliderStatus.from, scope.listIndex);	}); //hack to recalculate gcSliderStatus.listFrom
		}
	});
}]);
gitcolony.directive('gcTimeline', ['gcSliderStatus','$timeout', function(gcSliderStatus, $timeout) {
	return({
		restrict: 'A',
		scope: { onUpdate: '&gcTimeline' },
		link: function(scope, element, attrs) {
			scope.slider = gcSliderStatus;
			function withRetry(f, time, attempt) {
				time = time || 500;
				attempt = attempt || 0;
				if(f() === false && attempt < 1000000) $timeout(function(){ withRetry(f, time, attempt+1) })
			}
			scope.$watch('slider.to', function(newVal, oldVal) {
				var arrow = element.find('[gc-slider][placement=before]');
				withRetry(function(){
					var target = element.find('[gc-slider-target][target-index='+(scope.slider.to-1)+']');
					target.before(arrow);
				});
				scope.onUpdate({ '$status': gcSliderStatus });
			});
			scope.$watch('slider.from', function(newVal, oldVal) {
				var arrow = element.find('[gc-slider][placement=after]');
				withRetry(function(){
					var target = element.find('[gc-slider-target][target-index='+scope.slider.from+']');
					if(!target.length) return false;
					target.after(arrow);
				});
				scope.onUpdate({ '$status': gcSliderStatus });
			});
			scope.$watch('slider.ghostTo', function(newVal, oldVal) {
				if (newVal == oldVal) return;
				var arrow = element.find('[gc-ghost-slider][placement=before]');

				if(newVal == -1 || newVal==scope.slider.to) {
					arrow.hide();
					return;
				} else {
					arrow.show();
				}
				var target = element.find('[gc-slider-target][target-index='+(newVal-1)+']');
				target.before(arrow);
				scope.onUpdate({ '$status': gcSliderStatus });
			});
			scope.$watch('slider.ghostFrom', function(newVal, oldVal) {
				if (newVal == oldVal) return;
				var arrow = element.find('[gc-ghost-slider][placement=after]');

				if(newVal == -1 || newVal==scope.slider.from) {
					arrow.hide();
					return;
				} else {
					arrow.show();
				}

				var target = element.find('[gc-slider-target][target-index='+newVal+']');
				target.after(arrow);
				scope.onUpdate({ '$status': gcSliderStatus });
			});
		}
	});
}]);

gitcolony.directive("gcPagination", [function() {
	return ({
		restrict: 'E',
		scope: {
			loadPage: '=loadPage',
			data: '=data',
		},
		controller: ['$scope', function ($scope) {
      if($scope.data.page === undefined) $scope.data.page = 0;
      if($scope.data.more === undefined) $scope.data.more = true;
			$scope.load = function () {
				$scope.loading_more = true;
				$scope.loadPage($scope.data.page).then(function (newData) {
					var array = [];

					for(var k in newData) {
						if($.isArray(newData[k])) {
							array = newData[k];
							break;
						}
					}

					$scope.loading_more = false;
					$scope.data.items = $scope.data.items.concat(array);
					$scope.data.more = newData.more;
					$scope.data.page++;
				}, function () {
					$scope.loading_more = false;
				});
			}

      $scope.$watch('data.page', function(curPage) {
        console.log(curPage);
        if(curPage===0)
          $scope.load();
      });

		}],
		template: '<div ng-show="data.more"><button class="btn btn-primary" ng-hide="loading_more" ng-click="load()">More</button><span class="spinner" ng-show="loading_more"></span></div>'
	});
}]);

gitcolony.directive('gcSelectRepo', ['gc', function(gc) {
	return({
		restrict: 'A',
		scope: { repo: '=gcSelectRepo', 'onSelect': '&' },
		template: '<input type="text" ng-model="repo" placeholder="Repository (org/name)" typeahead="repo as repo.name for repo in predictRepo($viewValue)" typeahead-editable="false" typeahead-wait-ms="300" typeahead-on-select="onSelect({\'$repo\':$model.id})" class="form-control always-valid">',
		link: function(scope, element, attrs) {
			scope.predictRepo = function(r) { return gc.predictRepo(r); }
		}
	});
}]);

gitcolony.directive('gcTextarea', ['gc', '$compile', '$timeout', function(gc, $compile, $timeout) {
	return({
		restrict: 'A',
		priority:1001,
		scope:false,
		compile: function(element) {

			var collabs = element.attr("collabs");
      var model = element.attr("ng-model");
			element.removeAttr('gc-textarea'); // necessary to avoid infinite compile loop
			element.attr("mentio","");
			element.attr("mentio-items", collabs+" | filter:username:typedTerm");
			element.attr("mentio-template-url","/users-mentions.tpl");

      var content = '<div class="relative">' +
                      element[0].outerHTML +
                      '<span gc-fav-emoji="'+model+'"></span>'+
                    '</div>';

      element[0].outerHTML=content;
      var fn = $compile(element);
			return function(scope, element){
				fn(scope);
        element = element.find('textarea');

				inlineAttach.attachToInput(element[0], {
					uploadUrl: '/api/storage/img',
					onUploadedFile: function(){
						$timeout(function(){ element.change(); });
					}
				});

				//add autosize
				var textarea = element[0];
				textarea.oninput = function(e) {
					textarea.style.height = "";
					textarea.style.height = (textarea.scrollHeight+5) + "px";
				};

				$(textarea).closest('td').keydown(function(e) {
					var ctrl = e.ctrlKey || e.metaKey;
					var key = e.keyCode || e.which;
					if(ctrl && key == 13) { // ctrl/cmd + enter submit or
						e.preventDefault();
						$(textarea).closest('form').find('button.btn-primary:not(.ng-hide)').click(); //submit button
					} else if(ctrl && key == 32) { // ctrl/cmd + space
						e.preventDefault();
						var t = scope.file.new_comment.$tab;
						scope.file.new_comment.$tab = t == 'edit' ? 'preview' : 'edit'; //open preview tab
					} else if (key == 27) { // escape
						$(textarea).closest('form').find('button.btn-default:not(.ng-hide)').click(); // cancel button
						e.preventDefault();
					}
				});

				//add dropzone, change css when dragging a file
				element.on('dragover', function (e) {
					element.addClass("dragover");
					return false;
				});
				element.on('dragleave', function (e) {
					element.removeClass("dragover");
				});
				element.on('drop', function (e) {
					element.removeClass("dragover");
				});

				element.on('click', function (e) {
					textarea.oninput()
				});
			};
		}
	});
}]);

gitcolony.directive('gcMarkdown', ['gcHighlight', function(gcHighlight) {
	return({
		restrict: 'A',
		scope: {
			source: '=gcMarkdown'
		},
		link: function link(scope,element, attrs)
		{
			function getHtml(text) {
				if(!text)
					return '';

				var sd = new Showdown.converter({extensions: ['gitcolony']});
				var str = sd.makeHtml(text);

				//hightlight
				var html = $.parseHTML(str);
				$(html).find('code').each(function(){
					var block = $(this);
					var lang = block.attr('class');
					if(!lang || lang == "")
						return;

					block.html(gcHighlight.highlightPrism(block.text(), lang));
				});

				return html;
			}

			scope.$watch('source', function (newVal) {
				element.html(getHtml(newVal));
			});
		}
	});
}]);

gitcolony.directive('gcSidebarItem', ['layout', function(layout) {
	return({
		restrict: 'E',
		scope: { link: '@', label: '@', custom: '@' },
		transclude: true,
		template: '<li ng-class="menuClass()" title="{{label}}" data-placement="right" gc-tooltip="{{label}}"><a gc-link="{{link}}"><i ng-if="!custom" class="icon-{{link}}"></i> <span ng-if="!custom" class="item-label">{{label}}</span><span  ng-if="custom" ng-transclude></span></a></li>',
		link: function(scope, element, attrs) {
			scope.menuClass = function() {
				return (scope.link === layout.current()) ? 'active' : '';
			};
		}
	});
}]);

gitcolony.directive('XXXscrollIf', function () {
	return {
		restrict: "A",
		scope: {
			scrollIf: "&"
		},
		link : function(scope, element, attrs) {

			var attempt = 0;
			function scroll() {
				setTimeout(function () {
					if (element[0].offsetTop > 0) {
						window.scrollTo(0, element[0].offsetTop - 10);
						attempt = 0;
					} else {
						attempt++;
						if(attempt < 10)
							scroll();
						else attempt = 0;
					}
				}, 500);
			}

			scope.$watch('scrollIf()', function(value) {
				if(value)
					scroll();
			});
		}
	};
});

gitcolony.directive('gcIncident', ['layout', function(layout) {
	return({
		restrict: 'E',
		scope: { link: '@', label: '@', custom: '@' },
		transclude: true,
		template: '<li ng-class="menuClass()" title="{{label}}" data-placement="right" gc-tooltip="{{label}}"><a gc-link="{{link}}"><i ng-if="!custom" ng-class="link"></i> <span ng-if="!custom" class="item-label">{{label}}</span><span  ng-if="custom" ng-transclude></span></a></li>',
		link: function(scope, element, attrs) {
			scope.menuClass = function() {
				return (scope.link === layout.current()) ? 'active' : '';
			};
		}
	});
}]);


gitcolony.directive('gcPieChart', [function(gc) {
	return({
		restrict: 'A',
		scope: { values: '=gcPieChart', 'colors': '=' },
		template:
			'<span style="position:absolute; top: 50%; left:50%; transform: translateX(-50%) translateY(-50%);">{{percentage}}</span>'+
			'<canvas></canvas>',
		link: function(scope, element, attrs) {

			element.css('position', 'relative');

			scope.percentage='';

			scope.draw = function() {
				if(!scope.values) return;
				var values = scope.values;
				var colors = scope.colors || ['#47B6D5', '#1E3044', '#F03233'];
				var total = 0;

				for(var i = 0; i < values.length; i++)
					total += values[i];

				if(total == 0 ) total = 1;

				var percentages = [];
				for(var i = 0; i < values.length ; i++)
					percentages[i] = values[i]/total;

				if(element.width() <= 1) element.width(100);
				if(element.height() <= 1) element.height(100);


				scope.percentage = values.length==2 ? Math.floor(percentages[0]*100) + '%' : '';


				var canvas = element.find('canvas')[0];//.getElementById('myCanvas');
				var ctx = canvas.getContext('2d');
				canvas.width = element.width();
				canvas.height = element.height();

				var start_ang = -0.5*Math.PI;
				var centerX = canvas.width/2;
				var centerY = canvas.height/2;
				var rad = Math.min(centerX, centerY);
				var min_rad = rad - 15;

				ctx.clearRect(0, 0, canvas.width, canvas.height);
				for(var i = 0; i < values.length; i++) {
					var end_ang = start_ang + 2*percentages[i]*Math.PI;

					ctx.beginPath();
					ctx.moveTo(centerX, centerY);
					ctx.arc(centerX, centerY, rad, start_ang, end_ang, false);
					ctx.closePath();
					ctx.fillStyle = colors[i];
					ctx.fill();
					start_ang = end_ang;
				}


				// Middle circle
				// Clip to the current path
				ctx.globalCompositeOperation = 'destination-out';
				ctx.beginPath();
				ctx.arc(centerX, centerY, min_rad, 0, 2*Math.PI, false);
				ctx.closePath();
				ctx.fill();

				/// remove clipping mask
				ctx.restore();
			}

			scope.$watch('values', function() {
				scope.draw();
			});
		}
	});
}]);

gitcolony.directive('gcSticky', ['$timeout', function($timeout) {
	return({
		restrict: 'A',
		scope: { addClass: '@gcSticky'},
		link: function(scope, element, attrs) {

			element.after('<div class="hidden"></div>');
			var div = element.next();

			$(window).scroll(function () {
				var scrollTop = $(window).scrollTop();
				var fixed = element.css('position') == 'fixed';
				var top = !fixed ? element.offset().top : div.offset().top;
				if(element.height() <= 1) return;
				if (scrollTop >= top) {
					if (fixed || element.width() < 300) return;
					div.width(element.width());
					div.height(element.outerHeight(true));
					div.removeClass('hidden');
					element.css('width', element.parent().width() + 'px');
					element.css('position', 'fixed');
					element.css('top', '0');
					element.css('z-index', '1000');
					element.addClass(scope.addClass);
				}
				else {
					if (!fixed) return;
					element.css('position', '');
					element.css('top', '');
					element.css('width', '');
					element.css('z-index', '');
					element.removeClass(scope.addClass);
					div.addClass('hidden');
				}
			});
		}
	});
}]);

gitcolony.directive('gcStatNum', [function() {
	return({
		restrict: 'A',
		scope: { value: '=gcStatNum', numClass: '@' },
		template: '<span class="" ng-class="getColor()"><i class="fa" ng-class="getChevron()"></i><span ng-class="getValueClass()">{{getValue()}}</span></span>',
		link: function(scope, element, attrs) {

			scope.getColor = function() {
				if(scope.value > 0) return 'green';
				else if(scope.value < 0) return 'red';
				else return 'txt-grey';
			}

			scope.getChevron = function(){
				if(scope.value > 0) return 'fa-chevron-up';
				else if(scope.value < 0) return 'fa-chevron-down';
				else return '';
			}

			scope.getValue = function() {
				return scope.value != 0 ? Math.abs(scope.value) + "%" : "= " + Math.abs(scope.value) + "%";
			};

			scope.getValueClass = function() {
				return scope.numClass;
			}
		}
	});
}]);


gitcolony.directive('gcScroll', ['$analytics', 'layout', function($analytics, layout) {
	return({
		restrict: 'A',
		scope: { selector: '@gcScroll', event: "@event", offset: "@offset" },
		link: function(scope, element, attrs) {
			if(scope.offset == undefined) scope.offset = 0;
			element.click(function(){
				$("html, body").animate({ scrollTop: $(scope.selector).offset().top - scope.offset} );

				if(scope.event) {
					var args = {company: layout.company(), repo: layout.repo() };
					$analytics.eventTrack(scope.event, args);
				}
			})
		}
	});
}]);

gitcolony.directive('gcSeverity', [function() {
	return({
		restrict: 'A',
		scope: { value: '=gcSeverity', observe: "@observe" },
		template: '<span class="pointed-tag sm label"><span class="ico"></span> <span ng-class="severity.css"></span> <span>{{severity.name}}</span></span>',
		link: function(scope, element, attrs) {
			scope.severity = IncidentsHelpers.byPriority(scope.value);

			if(scope.observe=="true"){
				scope.$watch('value', function(value, oldVal){
	        if (!value || value==oldVal) return;
					scope.severity = IncidentsHelpers.byPriority(scope.value);
	      });
			}
		}
	});
}]);

gitcolony.directive('gcSeverityClass', [function() {
	return({
		restrict: 'A',
		link: function(scope, element, attrs) {
			var value = scope.$eval(attrs.gcSeverityClass);
			var severity = IncidentsHelpers.byPriority(value);
			element.addClass(severity.css);
			element.attr("data-placement","bottom");
			element.attr("data-toggle","tooltip").attr("title",severity.tooltip).tooltip();
			if(attrs.observe=="true"){
				scope.$watch(attrs.gcSeverityClass, function(value, oldVal){
	        if (!value || value==oldVal) return;
	        element.removeClass(severity.css)
	        var value = scope.$eval(attrs.gcSeverityClass);
					severity = IncidentsHelpers.byPriority(value);
					element.addClass(severity.css);
	      });
			}
		}
	});
}]);

gitcolony.directive("gcFileManager", [function() {
	return({
		restrict: 'A',
		scope: { pull: '=gcFileManager', commands: '=fileCommands'},
		controller: 'GcFileManagerCtrl',
		templateUrl: 'widgets/gc-file-manager.html'
	});
}]);
gitcolony.controller('GcFileManagerCtrl', ['$scope', '$element','gc','gcHighlight', '$sce', '$document', '$timeout', '$analytics', 'layout', function($scope, $element, gc, gcHighlight, $sce, $document, $timeout, $analytics, layout) {
	var repo = null;
	var pull_id   = -1;
	var branch_name = null;
	$scope.files = [];
	$scope.tree = [];
	$scope.file = null;
	$scope.search = '';
	$scope.searchIndex = -1;
	$scope.windows = [];
	var windowSeq = 0;
	var ztop = 1000;
	var MAX_FILES = 50;

	$scope.eventTrack = function(event,args) {
		args = $.extend({company: layout.company(), repo: repo, pull: pull_id }, args || {} );

		$analytics.eventTrack(event, args);
	}

	var FILE_TYPES = {
		'jpg':   {name: 'img', css: 'fa-file-image-o'},
		'jpeg':  {name: 'img', css: 'fa-file-image-o'},
		'png':   {name: 'img', css: 'fa-file-image-o'},
		'gif':   {name: 'img', css: 'fa-file-image-o'},
		'svg':   {name: 'img', css: 'fa-file-image-o'},
		'zip':   {name: 'zip', css: 'fa-file-zip-o'},
		'gz':    {name: 'zip', css: 'fa-file-zip-o'},
		'tar':   {name: 'zip', css: 'fa-file-zip-o'},
		'rar':   {name: 'zip', css: 'fa-file-zip-o'},
		default: {name: 'txt', css: 'fa-file-text-o'}
	}

	var fileType = function(ext){
		return FILE_TYPES[ext] || FILE_TYPES.default;
	}

	$scope.initTree = function(files) {
		files.sort();
		$scope.files=[];
		var tree = {};
		for(var i = 0; i < files.length; ++i) {
			var f = files[i];
			var segments = f.split('/');
			var t = tree;
			for(var j = 0; j < segments.length; ++j) {
				var s = segments[j];
				if(j == segments.length - 1) {
					//file
					var ext = s.split('.').pop();
					t[s]= {
						name: s,
						path: f,
						ext: ext,
						type: fileType(ext),
						body: null,
						$isDir: false
					};
					$scope.files.push(t[s]);
				} else {
					//folder
					t = t[s] = t[s] || {$isDir: true};
				}
			}
		}
		$scope.tree = tree;
	}

	$scope.maximizeFile = function(window) {
		$scope.restoreFile(window);
		var elem = windowElement(window);
		if(!window.maximized) {
			//maximize full screen
			window.maximized=true;
			window.top = elem.css('top');
			window.left = elem.css('left');
			window.width = elem.width();
			window.height = elem.height();
			elem.width('100%');
			elem.height('100%');
			$timeout(function(){
				elem.css({'top': 0, 'left': 0})
			})

		} else {
			//normal not full screen
			window.maximized=false;
			elem.offset(window.offset);
			elem.width(window.width);
			elem.height(window.height);
			$timeout(function(){
				//elem.offset(window.offset);
				elem.css({top: window.top, left: window.left})
			})
		}
		$scope.eventTrack(':maximize file');
	}

	$scope.restoreFile = function(window) {
		if(window.minimized)
			$scope.eventTrack(':restore file');

		$scope.setTopMost(window);
		var elem = windowElement(window);
		elem.addClass('restore');
		window.minimized=false;
		$timeout(function(){elem.removeClass('restore');}, 2000);
	}

	$scope.minimizeFile = function(window) {
		window.minimized=true;
		$scope.eventTrack(':minimize file');
	}

	$scope.closeFile = function(window) {
		$scope.windows.splice($.inArray(window, $scope.windows), 1);
		$scope.eventTrack(':close file');
	}

	function windowFromFile(f) {
		for(var i = 0; i < $scope.windows.length; ++i) {
			var w = $scope.windows[i];
			if(w.file==f) return w;
		}

		return null;
	}

	var entityMap = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': '&quot;',
		"'": '&#39;',
		"/": '&#x2F;'
	};

	function escapeHtml(string) {
		return String(string).replace(/[&<>"'\/]/g, function (s) {
			return entityMap[s];
		});
	}

	$scope.openFile = function(file, window) {
		$scope.hideSearch();

		if(file && !window) $scope.eventTrack(':search file done');

		if(!window && file && (window=windowFromFile(file)) ){
			//if the file is already open only maximize that window.
			$scope.restoreFile(window);
			return;
		}

		if(!file && !window) $scope.eventTrack(':navigate file');

		if(!window) {
			window = {
				id: windowSeq++,
				file: file,
				minimized: false,
				showTree: !file
			}
			$scope.windows.push(window);
			$timeout(function(){$scope.setTopMost(window);windowEvents(window);});
		}
		window.file = file;

		$scope.eventTrack(':open file');

		if(!file || file.body) return; //already loaded or empty

		var f = branch_name+":"+file.path;

		if(file.type.name == 'img') {
			file.body = gc.repoFileUrl(repo, f);
			return;
		}

		file.$loading = true;
		gc.repoFile(repo, f).then(function(body) {
			file.body = body.split('\n');
			var lang = gcHighlight.langToPrism(file.path, file.ext);
			var highlight = function(line){ return lang.length ? gcHighlight.highlight(file.path, line, file.ext) : escapeHtml(line); }
			var html = '';
			for(var i = 0; i < file.body.length; i++) {
				html += '<tr class="diff-line">' +
							'<td class="line">'+(i+1)+'</td>' +
							'<td colspan="4" class="text modified">' +
								highlight(file.body[i]) +
							'</td>' +
						'</tr>'
			}
			file.body = $sce.trustAsHtml(html)
			$timeout(function(){file.$loading = false;});
		},function(){
			$timeout(function(){file.$loading = false;});
		})
	}

	$scope.filterFiles = function(){
		$scope.searchIndex = -1;
		var files = $scope.files || [];
		var length = files.length;

		for(var i = 0; i < length; ++i)
			files[i].$path = false;

		if(!$scope.search || $scope.search.length==0) {
			var m = Math.min(length, MAX_FILES);

			for(var i = 0; i < m; ++i)
				files[i].$path = $sce.trustAsHtml(files[i].path);

			return;
		}

		var reg = new RegExp($scope.search, "ig");
		var cant = 0;
		for(var i = 0; i < length && cant < MAX_FILES; i++) {
			var f = files[i];
			var visible = false;
			f.$path = f.path.replace(reg, function (s) {
				visible = true;
				return '<span class="hl">'+s+'</span>';
			});

			if(visible) {
				f.$path = $sce.trustAsHtml(f.$path);
				++cant;
				if($scope.searchIndex == -1) $scope.searchIndex = i;
			} else f.$path = false;
		}
	};

	$scope.hideSearch = function() {
		$scope.searchIndex=-1;
		$scope.search='';
		$scope.searchVisible=false;
	}

	var firstSearch = true;
	$scope.showSearch = function() {
		if(firstSearch) {
			trapScroll($element.find('.search-coincidence'));
		}

		$scope.searchVisible = true;
		$scope.filterFiles();
		$timeout(function(){
			$element.find('input[ng-model="search"]').focus();
		})
		$scope.eventTrack(':search file starts');
	}

	$scope.keyDown = function(e) {
		var i = $scope.searchIndex;

		var key=e.keyCode || e.which;

		if (e.keyCode == 38) { //up arrow
			for(--i; i >= 0; --i) {
				if($scope.files[i].$path){
					$scope.searchIndex=i;
					ensureVisible();
					break;
				}
			}
			e.preventDefault();
		}else if (e.keyCode == 40) { // down arrow
	        for(++i; i < $scope.files.length; ++i) {
				if($scope.files[i].$path){
					$scope.searchIndex=i;
					ensureVisible();
					break;
				}
			}
			e.preventDefault();
	    }else if (e.keyCode == 13) { // enter
			e.preventDefault();
			if(i != -1) {
				$scope.openFile($scope.files[i]);
			}
	    }
	}

	$document.bind('keydown', function(e) {

		var ctrl = e.ctrlKey || e.metaKey;
		var key = e.keyCode || e.which;

		if(ctrl && e.shiftKey && key == 83) { // ctrl/cmd + shift + s
			e.preventDefault();
			$scope.showSearch();
		} else if(ctrl && e.shiftKey && key == 69) { // ctrl/cmd + shift + e
			e.preventDefault();
			$scope.openFile();//open a blank file
		} else if (key == 27) { // escape
			$scope.hideSearch();
			e.preventDefault();
		}
	});

	function windowElement(w) {
		return $('#window'+w.id);
	}

	$scope.setTopMost = function(w) {
		windowElement(w).css('z-index', ztop++);
	}

	function windowEvents(w) {
		trapScroll(windowElement(w).find('.file-content, .modal-tree'));
	};

	function trapScroll(elem) {
		elem.bind("DOMMouseScroll mousewheel onmousewheel", function(e) {
			// cross-browser wheel delta
			var trapElement=$(this);
			var scrollableDist=trapElement[0].scrollHeight - trapElement.outerHeight();

			var curScrollPos = $(this).scrollTop();
			var wheelEvent = e.originalEvent;
			var dY = wheelEvent.deltaY;

			// only trap events once we've scrolled to the end
			// or beginning
			if ((dY>0 && curScrollPos >= scrollableDist - 3) ||
				(dY<0 && curScrollPos <= 3)) {

				e.preventDefault();
				return false;
			}
		});
	}

	function ensureVisible() {
		if($scope.searchIndex == -1) return;
		var elem = $('#search_file'+$scope.searchIndex);
		var div = $('.search-coincidence');
		var offset = elem.offset().top - div.offset().top

		if(offset > div.innerHeight() - elem.height()) {
			// Not in view so scroll to it
			div.scrollTop(div.scrollTop() + offset - div.innerHeight() + elem.height());
		}

		if(offset < 0) {
			// Not in view so scroll to it
			div.scrollTop(div.scrollTop() + offset);
		}
	}

	function init() {
		if(pull_id <= 0) return;

		if($scope.tree.length == 0) {
			gc.pullRequestFilesTree(repo, pull_id).then(function(data){
				$scope.initTree(data);
			});
		}

		$scope.commands = {
			openFile: function(path) {
				var f = fileFromPath(path);
				if(f) $scope.openFile(f);
			}
		}
	}

	$scope.$watch('search', function() {
		$scope.filterFiles();
	});

	$scope.$watch('commands', function(){
		if(!$scope.commands)
			init();
	});

	$scope.$watch('pull.repository_id', function(loaded) {
		if(!loaded) return;
		repo = $scope.pull.repository_id;
		pull_id   = $scope.pull.id;
		branch_name = $scope.pull.head_sha || $scope.pull.head;

		init();
	});
	$scope.isMac = navigator.platform.toUpperCase().indexOf('MAC')>=0;

	function fileFromPath(path) {
		for(var i = 0; i < $scope.files.length; ++i) {
			var f = $scope.files[i];
			if(f.path==path) return f;
		}
		return null;
	}

	init();
}]);

gitcolony.directive("gcDraggable", ['$document', function($document) {
	return({
		restrict: 'A',
		scope: { parents: '@gcDraggable'},
		link: function(scope, element, attrs) {

			var move = element;
			var dragging = false;
			var ant_pos;

			var parents = scope.parents ? scope.parents | 0 : 0;
			for(var i=0; i < parents; ++i) move=move.parent();

			$document.bind("mousemove", function(e) {
		        if (dragging) {
		        	e.preventDefault();
		        	var off = move.offset();
		            move.offset({
		                top: off.top + (e.pageY - ant_pos.pageY),
		                left: off.left + (e.pageX - ant_pos.pageX)
		            });
		            ant_pos = {pageX: e.pageX, pageY: e.pageY};
		        }
		    });

		    element.on("mousedown", function (e) {
		        dragging = true;
		        ant_pos = {pageX: e.pageX, pageY: e.pageY};
		    });

		    $document.bind("mouseup", function (e) {
		        dragging = false;
		    });
		}
	});
}]);

gitcolony.directive("gcResizable", ['$document', function($document) {
	return({
		restrict: 'A',
		scope: { },
		link: function(scope, element, attrs) {

			var dragging = false;
			var ant_pos;
			var min_width = element.css('min-width') | 0 || 1;
			var min_height = element.css('min-height') | 0 || 1;
			var max_width = element.css('max-width') | 0 || 9999;
			var max_height = element.css('max-height') | 0 || 9999;

			$document.bind("mousemove", function(e) {
		        if (dragging) {
		        	e.preventDefault();
		        	var w = element.width() + (e.pageX - ant_pos.pageX),
		        		h = element.height() + (e.pageY - ant_pos.pageY);

		        	w = Math.min(Math.max(w, min_width), max_width);
		        	h = Math.min(Math.max(h, min_height), max_height);
		        	element.width(w);
		        	element.height(h);
		            ant_pos = {pageX: e.pageX, pageY: e.pageY};
		        }
		    });

		    function isCorner(e){
		    	var off = element.offset();
		    	var cx = 20,
		    		cy = 20,
		    		w = element.width(),
		    		h = element.height(),
		    		x = e.pageX,
		    	    y = e. pageY,
		    	    x1 = off.left + w,
		    	    x0 = x1 - cx,
		    	    y1 = off.top + h,
		    	    y0 = y1 - cy;
		    	return x >= x0 && x <=x1 && y >= y0 && y<= y1;
		    }

		    element.on("mousedown", function (e) {
		        if(isCorner(e)) {
		        	dragging = true;
		        	ant_pos = {pageX: e.pageX, pageY: e.pageY};
		        	$('body').css('cursor', 'se-resize');
		        }
		    });

		    $document.bind("mouseup", function (e) {
		        if(dragging) $('body').css('cursor', '');
		        dragging = false;
		    });

		    element.on("mousemove", function (e) {
		    	element.css('cursor', isCorner(e) ? 'se-resize' : '');
		    });
		}
	});
}]);

gitcolony.directive("gcRepeat", ['$timeout', function($timeout) {
	return({
		restrict: 'A',
		scope: { items: "=gcRepeat" },
		link: function(scope, element, attrs) {
			//var template = element.html().split(/{{|}}/);
			var template = element.html().split(/%{|}%/);
			var tl = template.length;

			scope.renderItem = function(index) {
				scope.$index = index;
				scope.item = scope.items[index];
				var line = ''
				for(var i = 0; i < tl; ++i) {
					var v = i % 2 ? scope.$eval(template[i]) : template[i];
					line += v !== null && v!==undefined ? v : '';
				}
				line = line.replace(/>/, ' gc-index="'+index+'">');
				return line;
			}

			function update(index) {
				return function(){
					var i = index;
					$timeout(function(){
						var line = scope.renderItem(i);
						element.find('[gc-index="'+i+'"]').replaceWith(line);
					})
				}
			}

			scope.render = function() {
				var items = scope.items || [];
				var html = '';
				for(var i = 0; i < items.length; ++i ) {
					items[i].$update = update(i);
					html+=scope.renderItem(i);
				}
				element.html(html);
			}

			scope.gc_show = function(visible) {
				return !visible ? 'style="display: none"' : '';
			}

			scope.gc_hide = function(notVisible) {
				return scope.gc_show(!notVisible)
			}

			scope.gc_date = function(date) {
				return moment(date).fromNow();
			}

			scope.$watch('items', function() {
				scope.render();
			});
		}
	});
}]);

var _gcSelectMultiple = 0;
gitcolony.directive("gcSelectMultiple", ['$document','$timeout', function($document,$timeout) {
	return({
		restrict: 'A',
		scope: { options: '=gcSelectMultiple', values: '=gcModel' },
		link: function(scope, element, attrs) {
			var initialized = false;

			scope.$id='_sm'+_gcSelectMultiple++;
			element.attr('id', scope.$id);
			element.attr('multiple','');

			scope.$watch('options', function(options) {
				if(!options || options.length==0) return;

				var html = '';
				for (var i = 0; i < options.length; ++i) {
					var o = options[i];
					html += '<option value="'+o.value+'">'+o.name+'</option>';
				}

				element.html(html);
				element.select2({});
				initialized = true;
				element=$('#'+ scope.$id);
				$document.on('mousedown', function(){
					$timeout(function(){
						getValues();
					},300)
				})
				setValues();
			});

			function setValues() {
				if(!scope.values || !initialized) return;
				element.select2('val', scope.values);
			}

			function getValues() {
				var vals = scope.values;
				vals.splice(0,vals.length);
				Array.prototype.push.apply(vals, element.select2('val'));
			}

			scope.$watch('values', function() {
				setValues();
			});
		}
	});
}]);

gitcolony.directive("gcSelect", ['$compile', function($compile) {
	return({
		restrict: 'A',
		scope: {options: "=gcSelect", model: "=gcModel", as:"@valueAttr"},
		link: function(scope, element, attrs) {

			var first = element.children().first();
			var nullItem = 'Select an item';
			if(first.attr('value') == '?') {
				//null value
				nullItem = first[0].outerHTML;
				first.remove();
			}

			var item = element.html();

			var template = angular.element('<div class="btn-group btn-block">' +
				'<button type="button" class="btn btn-drop dropdown-toggle btn-block" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' +
				'<span ng-show="model">' + item + '</span>' +
				'<span ng-hide="model">' + nullItem + '</span>' +
				'<span class="caret"></span>' +
				'</button>' +
				'<ul class="dropdown-menu btn-block" role="menu" aria-labelledby="dLabel">' +
						'<li ng-repeat="option in options" ng-click="setOption(option)"><a>'+item+'</a></li>' +
				'</ul>' +
			'</div>')

			element.removeAttr('gc-select');
			element.html('');
			element.append(template);

			scope.setOption = function(opt) {
				scope.option = opt;
				scope.model = scope.as ? opt[scope.as] : opt;
			}

			scope.setCurrent = function() {
				if(!scope.as) return scope.setOption(scope.model);

				var l = (scope.options || []).length;
				for(var i = 0; i < l; ++i) {
					var o = scope.options[i];
					if(o[scope.as]==scope.model) scope.setOption(o);
				}
			}

			scope.$watch('options', function(newVal,oldVal) {
				scope.setCurrent();
			});

			scope.$watch('model', function(newVal,oldVal) {
				scope.setCurrent();
			});

			$compile(element.contents())(scope);
		}
	});
}]);

gitcolony.directive("gcAttr", ['$compile',function($compile) {
	return({
		terminal: true,
		replace: false,
		priority: 2001,
		restrict: 'A',
		link: function(scope, element, attrs) {
			//use exampl <a gc-attr='{"gc-tooltip=this is a tooltip":"condicion"}'>
			var adds = JSON.parse(attrs.gcAttr);
			element.removeAttr('gc-attr');

			for(var k in adds) {
				if(scope.$eval(adds[k])){
					var kv=k.split('=');
					element.attr(kv[0], kv[1]);
				}
			}
			$compile(element)(scope);
		}
	});
}]);

gitcolony.directive("gcFavEmoji", ['$document','$timeout', function($document, $timeout) {
	return({
		restrict: 'A',
		scope: {model: "=gcFavEmoji"},
		link: function(scope, element, attrs) {

      var favourites = ['+1','-1','punch','ok_hand','clap','pray','raised_hands','hand','blush','smile','sweat','cry','sob','neutral_face','heart','shit'];
    	scope.emojis = [];

    	for (var i = 0; i < favourites.length; i++) {
    		var f = favourites[i];
    		scope.emojis.push({
    			img: window.emojis_url+f+".png",
    			value: ':'+f+':'
    		})
    	}
      scope.append = function(emoji) {
        scope.model += emoji.value;
        scope.show=false;
      }

      $document.bind('keydown', function(e) {
    		var ctrl = e.ctrlKey || e.metaKey;
    		var key = e.keyCode || e.which;
    		if(key == 27) { // esc
          scope.show=false;
    		}
    	});

      $document.bind('click', function(e) {
        scope.show=false;
    	});

      scope.showEmojis = function(){
        $timeout(function(){
          scope.show=!scope.show
        })
      }
		},
		template:
    '<a class="btn-emoticons" gc-tooltip="Add an emoticon." ng-click="showEmojis()">' +
    '  <i class="fa fa-smile-o"></i>' +
    '</a>' +
    '<div class="popover pop-emoticons" ng-show="show">' +
    '  <div class="popover-content text-center">' +
    '      <img ng-repeat="e in emojis" ng-src="{{e.img}}" ng-click="append(e)">' +
    '  </div>' +
    '</div>'
	});
}]);

gitcolony.directive("gcScrollTrap", [function() {
	return({
		restrict: 'A',
		scope: false,
		link: function(scope, element, attrs) {
			element.bind("DOMMouseScroll mousewheel onmousewheel", function(e) {
				// cross-browser wheel delta
				var trapElement=$(this);
				var scrollableDist=trapElement[0].scrollHeight - trapElement.outerHeight();

				var curScrollPos = $(this).scrollTop();
				var wheelEvent = e.originalEvent;
				var dY = wheelEvent.deltaY;

				// only trap events once we've scrolled to the end
				// or beginning
				if ((dY>0 && curScrollPos >= scrollableDist - 3) ||
					(dY<0 && curScrollPos <= 3)) {

					e.preventDefault();
					return false;
				}
			});
      	}
	});
}]);

gitcolony.directive("gcTutorialElem", ['$compile', 'gcTutorial', '$analytics', 'layout',function($compile, gcTutorial, $analytics, layout) {
	return({
		restrict: 'A',
		scope: {flag: "@gcTutorialElem", step: '=model', title:"@title"},
		link: function(scope, element, attrs) {

			var length = element.find('p').each(function(i){
				$(this).attr('ng-show','step=='+i);
			}).length;

			var steps = ''
			for(var i = 0; i < length; ++i) {
				steps += '<li ng-click="step='+i+'" ng-class="{active: step == '+i+ '}"></li>';
			}

			var slides = element.html();

			var content =
				'<div class="arrow"></div>' +
				'<div class="popover-content">' +
					'<h3>{{title}}</h3>' +
					'<div class="slide">' +
						slides +
					'</div>' +
					'<button class="btn btn-primary pull-right" ng-click="step=step+1">{{step < '+(length-1)+' ? \'Next\' : \'Done\'}}</button>' +
					'<ol class="indicators">' +
						steps +
					'</ol>' +
					'<br />' +
					'<br />' +
					'<p class="smll pull-right">Seen this before? <a ng-click="step=9">Opt out of these tips.</a></p>' +
				'</div>';


			element.removeAttr('gc-tutorial-elem');
			element.addClass('popover');
			element.attr("ng-show", "step<"+length);
			element.html(content);
      		var elem = $compile(element)(scope);

			scope.updateTutorial = gcTutorial.updateTutorial;
			scope.tutorialActive = gcTutorial.tutorialActive;
			gcTutorial.init();

			scope.eventTrack = function(event,args) {
				args = $.extend({company: layout.company(), repo: layout.repo() }, args || {} );

				$analytics.eventTrack(event, args);
			}

			scope.tutoClick = function() {
				scope.updateTutorial(scope.flag);
				scope.eventTrack(":click tutorial item", {type: scope.flag});
			}

			scope.tutoDone = function() {
				scope.eventTrack(":click done tutorial item", {type: scope.flag});
			}

			scope.tutoDismiss = function() {
				scope.eventTrack(":dismiss tips", {type: event});
			}

			scope.$watch('step',function(newVal, oldVal) {
				if(oldVal===undefined && newVal!==undefined) scope.tutoClick();
				if(newVal==9) scope.tutoDismiss();
				if(newVal==length) scope.tutoDone();
			})
			return elem;
      	}
	});
}]);

gitcolony.directive("gcTutorialButton", ['$compile', 'gcTutorial',function($compile, gcTutorial) {
	return({
		restrict: 'A',
		scope: {flag: "@gcTutorialButton", step: '=model'},
		link: function(scope, element, attrs) {

			scope.updateTutorial = gcTutorial.updateTutorial;
			scope.tutorialActive = gcTutorial.tutorialActive;

			element.removeAttr('gc-tutorial-button');
			element.attr('ng-show',"tutorialActive('"+scope.flag+"')");
			element.attr('ng-click',"step=0;updateTutorial('"+scope.flag+"')");
			element.addClass('twinkling');
      		var fn = $compile(element)(scope);
			return function(scope, element) {
				fn(scope);
			};
      	}
	});
}]);

gitcolony.directive("gcFlag", ['$compile', '$timeout', function($compile, $timeout) {
	return({
		restrict: 'A',
		scope: {flag: "@gcFlag", model: '=model'},
		link: function(scope, element, attrs) {

			var iflag = scope.flag | 0;
			element.removeAttr('gc-flag');
			element.attr('ng-model',"active");


			scope.$watch('model',function(flags, oldVal){
				if(flags === undefined || scope.active !== undefined) return;
				scope.active = (flags&iflag) == iflag;
			});

			scope.$watch('active',function(active, oldVal){
				if(oldVal==undefined) return;

				if(active) {
					scope.model |= iflag;
				} else {
					scope.model &= (~iflag);
				}
			});

			return $compile(element)(scope);
      	}
	});
}]);

gitcolony.directive("gcDuedate", [function() {
	return({
		restrict: 'A',
		scope: {date: '=gcDuedate'},
		link: function(scope, element, attrs) {

			scope.$watch('date', function(){
				scope.strdate= scope.date ? moment(scope.date).utc().format('MMM DD') : '';
				var diffDate = scope.date ? (new Date(scope.date) - new Date())/(1000.0*60*60*24) + 1 : 0;

				if(diffDate > 2) {
					scope.css='green'
					scope.tooltip="This Pull Request is due in more than 48hs";
				}

				if(diffDate <= 2) {
					scope.css='yellow'
					scope.tooltip="This Pull Request is due in less than 48hs";
				}

				if(diffDate < 0) {
					scope.css='red'
					scope.tooltip="This Pull Request exceeded the due date";
				}
			})

    },
    template: '<span ng-show="date" gc-tooltip="{{tooltip}}" observe="true" ng-class="css" class="due ng-isolate-scope sm" data-placement="bottom"><i class="fa fa-clock-o"></i> {{strdate}}</span>',
	});
}]);

gitcolony.directive("gcDatepicker", [ function() {
	return({
		restrict: 'A',
		scope:{date: "=gcDatepicker"},
    link: function(scope, element, attrs) {

    	var input = element.find('input');
			input.datepicker({ dateFormat: 'yy-mm-dd' });

      scope.$watch('strDate', function(newVal, oldVal){
      	scope.date=new Date(scope.strDate);
  	  })

  	  function validDate(date) {
  	  	return date && date.getTime && !isNaN(date.getTime());
  	  }

  	  scope.$watch('date', function(newVal, oldVal){
  	  	if( (oldVal && validDate(oldVal)) || (!newVal || !validDate(new Date(newVal)))) {
  	  			if(!newVal || !validDate(newVal))
  	  				scope.strDate='Pick a Date';
  	  		return;
  	  	}

  	  	var d = new Date(scope.date);
  	  	var nowUtc = new Date( d.getTime() + (d.getTimezoneOffset() * 60000));
  	  	input.datepicker('setDate', nowUtc);

  	  })

    },
    template: '<input class="form-control" type="text" ng-model="strDate">'
	});
}]);

gitcolony.filter('propsFilter', function() {
  return function(items, props) {
    var out = [];

    if (angular.isArray(items)) {
      items.forEach(function(item) {
        var itemMatches = false;

        var keys = Object.keys(props);
        for (var i = 0; i < keys.length; i++) {
          var prop = keys[i];
          var text = props[prop].toLowerCase();
          if (item[prop].toString().toLowerCase().indexOf(text) !== -1) {
            itemMatches = true;
            break;
          }
        }

        if (itemMatches) {
          out.push(item);
        }
      });
    } else {
      // Let the output be the input untouched
      out = items;
    }

    return out;
  };
});

gitcolony.directive("gcUserselection", [ '$timeout', '$document', function($timeout, $document) {
	return({
		restrict: 'A',
		scope: { users: '=gcUserselection', values: '=gcModel', defaultTask: '@defaultTask' },
		link: function(scope, element, attrs) {

    	scope.sel= { values: scope.values }

			scope.tooltipText = function(v){
				if(v.task=="optional") return "Optional reviewer. Click to convert to mandatory reviewer.";
				else if(v.task == 'mandatory') return "Mark as optional reviewer"
				else return "";
			}

			var transitions = {'optional': 'mandatory', 'mandatory': 'optional', 'merger' : 'merger'};
			scope.changeType = function(u) {
				u.task = transitions[u.task];
			}

    	scope.$watch('users', function(){
    		if(!scope.users || !scope.users.length ) return;
    		scope.items = JSON.parse(JSON.stringify(scope.users));

    		scope.items.sort(function compare(a,b) {
				  if (a.username < b.username)
				    return -1;
				  else if (a.username > b.username)
				    return 1;
				  else
				    return 0;
				});

    		refreshVisibility();
    	}, true);

    	scope.$watch('values', function(newVal, oldVal){
    		scope.sel.values = newVal;

    		refreshVisibility();
    	})

    	scope.$watch('sel.values', function(newVal, oldVal){
    		scope.values = newVal;

    		if(!newVal) return;

    		scope.sel.values.forEach(function(v){
    			if(!v.task) v.task = scope.defaultTask || 'optional';
    		});

    		refreshVisibility();

    	}, true)

    	function refreshVisibility() {
    		if(!scope.values || !scope.items) return;
    		for(var j = 0; j < scope.items.length; ++j) {
    			for(var i = 0; i < scope.values.length; ++i) {
    				var v = scope.values[i];
    				if(scope.items[j].id == v.id) scope.items[j]=v;
    			}
    		}
    	}

		},
		template:
		  '<ui-select multiple ng-model="sel.values" template="select2" class="user-choices">' +
		  '  <ui-select-match placeholder="Select users">'+
			'		 <div ng-click="changeType($item)" class="select2-search-choice" ng-class="{active: $item.task==\'optional\'}" gc-tooltip="{{tooltipText($item)}}" observe="true">'+
			'			 <img class="avatar merger" style="max-width: 18px; max-height: 18px" ng-src="{{$item.avatar}}"> {{$item.username}}'+
			'      <span>&nbsp;&nbsp;&nbsp;</span>'+
			'    </div>'+
			'  </ui-select-match>'+
		  '  <ui-select-choices repeat="u in items | propsFilter: {username: $select.search}  track by u.id">' +
		  '    <div><span class="select2-results" gc-user="u" size="small"></span></div>' +
		  '  </ui-select-choices>' +
		  '</ui-select>'
	});
}]);

gitcolony.directive("gcPopover", [ function() {
	return({
		restrict: 'A',
		scope:{popquery: "@gcPopover"},
    link: function(scope, element, attrs) {

    	var initialized = false;
    	var popelem = $(scope.popquery);
    	popelem.addClass('hide');
			element.hover(function() {
				if(!popelem.length) popelem = $(scope.popquery);

				popelem.removeClass('hide');

				var off = element.offset();

				off.left += element.width()/2 - popelem.width()/2;
				off.top += 30;

				popelem.offset(off);
				popelem.css({position: 'absolute'});

			}, function(){popelem.addClass('hide');});

    }
	});
}]);

gitcolony.directive("gcRulesTag", [ function() {
	return({
		restrict: 'A',
		scope: { pull: '=gcRulesTag'},
		link: function(scope, element, attrs) {

			var popelem = null;

			function create() {
				if(scope.pull.business_rules_ok) {
					element.text('RULES OK');
					element.removeClass('red').addClass('tagg green sm');
				}	else {
					element.text('RULES NOT OK');
					element.removeClass('green').addClass('tagg red sm');
				}

				if(popelem) {
					popelem.remove();
					popelem = null;
				}

				element.hover(function() {
					if(!popelem) {
						var rules = '';

						var rs = scope.pull.business_rules_descri;
						for(var i = 0; i < rs.length; i++) {
							var r = rs[i];
							rules += '<li><i class="fa fa-check ' + ( r.ok ? 'fa-check green' : 'fa-times red') +'"></i> &nbsp; ' + r.descri +'</li>';
						}

						var html =
							'<div id="rules" class="text-left popover bottom">' +
								'<div class="arrow"></div>' +
								'<div class="popover-content">' +
									'<ul class="list sm stripped">' +
										rules +
									'</ul>' +
								'</div>' +
							'</div>';
						element.after(html);
						popelem = element.next();
					}

					popelem.removeClass('hide');

					var off = element.offset();

					off.left += element.width()/2 - popelem.width()/2;
					off.top += 30;

					popelem.offset(off);
					popelem.css({position: 'absolute'});

				}, function(){popelem.addClass('hide');});
			}

			scope.$watch('pull.business_rules_ok', function(valid){
				if(valid===undefined) return;
				create();
			})
		}
	});
}]);

gitcolony.directive("gcGkeyup", [ '$document', '$parse', function($document, $parse) {
	return({
		restrict: 'A',
		link: function(scope, element, attr) {
			var fn = $parse(attr.gcGkeyup)
			var eventFn = function(event) {
				scope.$apply(function(){ fn(scope, { $event: event }) });
    	}

			$document.bind('keyup', eventFn);

    	element.on('$destroy',function(){ $document.unbind('keyup', eventFn); } );
		}
	});
}]);

gitcolony.directive("gcComment", [ '$document', '$parse', '$timeout', function($document, $parse, $timeout) {
	return({
		restrict: 'A',
		link: function(scope, element, attr) {
			var removeWatch = scope.$watch('file.$rendered', function(rendered) {
				if(!rendered) return;
				//set the correct position of the comment
				var row = [];
				var c = scope.comment;
				var fi = scope.file_index;

				if(!c.gap) {
					//line exists in the diff
					row = $('tr[data-file="' + fi + '"][data-line="' + c.offset + '"]').last();
				} else {
					//The comment is inside a gap
					var g = fi + '-' + c.gap;
					if(!c.closed)
						row = $('tbody[gap="' + g + '"]>tr:last');
				}

				if(row.length) {
					c.$hide=false;
					row.after(element);
					c.$top = row.offset().top + row.height();
				} else {
					c.$hide=true;
				}
				//removeWatch();
			})
			scope.showReply = function() {
				scope.showComment(scope.file_index, scope.comment.offset, scope.file, '', element, scope.comment);
			}
		}
	});
}]);

gitcolony.directive("gcFormShow", [function(){
	return ({
		restrict: 'A',
		link: function(scope, element, attr) {
			scope.$watch(attr.gcFormShow, function(show){
				if(show === undefined) return;

				if(show)
					element.modal('show');
				else
					element.modal('hide');
			})
		}
	})
}]);

gitcolony.directive("gcShortcut", [ function() {
	return({
		restrict: 'A',
		link: function(scope, element, attr) {
			var keys = scope.$eval(attr.gcShortcut);

    	for(var k in keys) {
    		Mousetrap.bind(k, scopeFunction(keys[k]));
    	}

    	function scopeFunction(func ) {
    		return (function(e) {
					scope.$apply(function(){ func(e) });
    		})
    	}

    	element.on('$destroy',function(){
    		for(var k in keys) {
    			Mousetrap.unbind(k);
    		}
    	});
		}
	});
}]);

gitcolony.directive("gcClipboard", [ function() {
	return({
		restrict: 'A',
		link: function(scope, element, attr) {
			var node = document.createElement("SPAN");
			node.style.opacity = 0;
			node.style.position = 'absolute';
			node.style['z-index'] = '-100';

			document.body.appendChild(node);

			element.click(function(){
				node.innerHTML = attr.gcClipboard;

			  window.getSelection().removeAllRanges()
				var range = document.createRange();
			  range.selectNode(node);
			  window.getSelection().addRange(range);

			  try {
			    // Now that we've selected the anchor text, execute the copy command
			    var successful = document.execCommand('copy');
			    var msg = successful ? 'successful' : 'unsuccessful';
			  } catch(err) {
			    console.log('Oops, unable to copy');
			  }

			  // Remove the selections - NOTE: Should use
			  // removeRange(range) when it is supported
			  window.getSelection().removeAllRanges();

			})
		}
	});
}]);

gitcolony.directive("gcAssignee", [ function() {
	return({
		restrict: 'E',
		scope: { user: '=user', size: '@size'},
		controller: ['$scope', function($scope) {
			var size = $scope.size || '20'
			$scope.style = {
				'width': size + 'px',
				'height': size + 'px',
			};
		}],
		template:
		  '<span ng-if="user.task==\'optional\'" ng-class="{\'ok-reviewed\': user.reviewed}">' +
			'  <img class="avatar optional" ng-style="style" ng-src="{{user.avatar}}" gc-tooltip="Optional reviewer: {{user.username}}. The Pull Request can be merged, without his aproval, when necessary votes are reached.">' +
			'  <i ng-show="user.reviewed" class="fa fa-check-circle green smll"></i>' +
			'</span>' +
			'<span ng-if="user.task==\'merger\'" class="inline light-blue">' +
			'  <img class="avatar merger" ng-style="style" ng-src="{{user.avatar}}" gc-tooltip="Merger: {{user.username}}">' +
			'  <i class="icon-merge-circle smll"></i>' +
			'</span>' +
			'<span ng-if="user.task==\'mandatory\'" ng-class="{\'ok-reviewed\': user.reviewed}" gc-tooltip="Mandatory reviewer {{user.username}}.">' +
			'  <img ng-class="avatarClass" ng-style="style" class="avatar" ng-src="{{user.avatar}}">' +
			'  <i ng-show="user.reviewed" class="fa fa-check-circle green smll"></i>' +
			'</span>',
	});
}]);
