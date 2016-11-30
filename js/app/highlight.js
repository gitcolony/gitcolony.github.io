var gitcolonyHighlight = angular.module('gitcolonyHighlight', []);

gitcolonyHighlight.encodeHtml = function(text) { return $('<div />').text(text).html(); }

gitcolonyHighlight.factory('gcHighlightPrism', [function() {
	return {
		highlight: function(file, text, lang) {
			lang = this.langToPrism(file,lang);
			return this.highlightPrism(text, lang);
		},
		escapeHtml: function(string) {
			var entityMap = {
				"&": "&amp;",
				"<": "&lt;",
				">": "&gt;",
				'"': '&quot;',
				"'": '&#39;',
				"/": '&#x2F;'
			}
			return String(string).replace(/[&<>"'\/]/g, function (s) {
				return entityMap[s];
			});
		},
		langToPrism: function(file, lang) {
			var ext = file.split('.').pop();
			switch (lang) {
				case 'HTML & CSS':
				case 'css':
				case 'html':
				case 'htm':
				case 'xml':
				case 'svg':
					if (file.match(/\.css$/)) {
						lang = 'css';
					} else {
						lang = 'markup';
					}
					if(Prism.languages[ext.toLowerCase()]) lang = ext.toLowerCase();
					break;
				case 'C#':
				case 'cs':
					lang = 'csharp'    ; break;
				case 'C++':
				case 'c':
				case 'cpp':
				case 'h':
				case 'hpp':
					lang = 'cpp'       ; break;
				case 'ASP.NET':
				case 'asp':
				case 'aspx':
					lang = 'aspnet'    ; break;
				case 'Objective-C':
				case 'm':
					lang = 'objectivec'; break;
				case 'Shell Script': lang = 'bash'      ; break;
				case 'ActionScript':
				case 'js':
				case 'as':
					lang = 'javascript'; break;
				case 'JSP':
					lang = 'java'      ; break;
				case 'rb':
					lang = 'ruby'      ; break;
				case 'jsx':
					lang = 'jsx'      ; break;
				case 'ts':
				case 'tsx':
					lang = 'typescript'      ; break;

			}

			lang = lang.toLowerCase();
			if(!Prism.languages[lang])
				lang='';

			return lang;
		},
		highlightPrism: function(text, lang) {
			if (text.length > 2000) return '';
			lang = Prism.languages[lang];
			if (!lang) return this.escapeHtml(text);
			return Prism.highlight(text, lang);
		}
	}
}]);

gitcolonyHighlight.factory('gcHighlight', ['gcHighlightPrism', function(gcHighlightPrism) {
	var impl = gcHighlightPrism;
	return {
		highlight: impl.highlight,//function(file, text, lang) {
		//	return impl.highlight(file, text, lang);
		//},
		langToPrism: impl.langToPrism,//function(file, lang) {
		//	return impl.langToPrism(file, lang);
		//},
		highlightPrism: impl.highlightPrism,//function(text, lang) {
		//	return impl.highlightPrism(text, lang);
		//}
		escapeHtml: impl.escapeHtml,
	}
}]);

