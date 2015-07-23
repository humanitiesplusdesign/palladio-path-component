angular.module('palladioStandaloneApp', [
	'palladio',
	'palladio.controllers',
	'palladio.services',
	'palladio.directives',
	'palladio.filters',
	'palladioDataUpload',
	'palladioFacetFilter',
	'palladioPathView',
	'ui.router'
	])
	.config(function($stateProvider, $urlRouterProvider) {
		$urlRouterProvider.otherwise("upload");

		$stateProvider
			.state('upload', {
				url: '/upload',
				templateUrl: 'partials/upload-standalone.html',
				controller: 'WorkflowCtrl'
			})
			.state('visualization', {
				url: '/visualization',
				templateUrl: 'partials/visualization-standalone.html',
				controller: function($scope, data, palladioService, $state) {
					// Guard against coming here before loading data.
					if(data.data === undefined) {
						$state.go('upload').then(function() {
							document.location.reload(true);
						});
					}
					
					palladioService.facetFilter("#facet-filter-here", {
						height: "300px",
						showControls: false,
						showSettings: false,
						showAccordion: false,
						showDropArea: false,
						dimensions: data.metadata.slice(0,4)
					});
				},
				resolve: {
					data: function (dataService) {
						return dataService.getData();
					}
				}
			});
	});