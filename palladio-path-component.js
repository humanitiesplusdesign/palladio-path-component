// Facet filter module

angular.module('palladioPathView', ['palladio', 'palladio.services'])
	.directive('palladioPathView', function (palladioService, dataService) {
		return {
			scope : {
				
			},
			template : "<div>Hi, I'm a component.</div>",
			link : {
				pre : function(scope, element) {
					// Set up data and stuff on the scope here.
				},

				post : function(scope, element, attrs) {
					// Anything that touches the DOM happens here.
				}
			}
		};
	});