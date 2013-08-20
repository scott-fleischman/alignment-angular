"use strict";

function handleDragEnter(e) {
  // this / e.target is the current hover target.
  this.classList.add('over');
}

angular.module("alignment.controllers", []).
	controller("VerseController", function($scope, $http) {
		$http.get("data/john-3-16.json").success(function(data) {
			var originalIdToIndex = {};
			var translationIdToIndex = {};

			data.original.forEach(function(x, i) { originalIdToIndex[x.id] = i; })
			data.translation.forEach(function(x, i) { translationIdToIndex[x.id] = i; })

			$scope.original = data.original;
			$scope.translation = data.translation;

			$scope.links = data.links.map(function(link) {
				return {
					kind: link.kind,
					original: link.original.map(function(x) { return originalIdToIndex[x]; }),
					translation: link.translation.map(function(x) { return translationIdToIndex[x]; })
				};
			});

			$scope.links.forEach(function(link) {
				link.original.forEach(function(x) { $scope.disabled.original[x] = true; });
				link.translation.forEach(function(x) { $scope.disabled.translation[x] = true; });
			});

			addEmptyLink();
			resetSelection();
		});

		function getLinkIndex(source, wordIndex) {
			var i1, n1, i2, n2, linkSource;
			for (i1 = 0, n1 = $scope.links.length; i1 < n1; i1++) {
				linkSource = $scope.links[i1][source];
				for (i2 = 0, n2 = linkSource.length; i2 < n2; i2++) {
					if (linkSource[i2] === wordIndex) {
						return i2;
					}
				}
			}
			return -1;
		}

		function createEmptyLink() {
			return {
				kind: "assoc",
				original: [],
				translation: []
			};
		}

		function addEmptyLink() {
			var lastLink;

			if ($scope.links.length === 0)
				$scope.links.push(createEmptyLink());

			lastLink = $scope.links[$scope.links.length - 1];
			if (!isLinkEmpty(lastLink)) {
				$scope.links.push(createEmptyLink());
			}
		}

		function resetSelection() {
			$scope.directSelect = false;
			$scope.currentLinkIndex = $scope.links.length - 1;
		}

		function directSelect(index) {
			$scope.directSelect = true;
			$scope.currentLinkIndex = index;
		}

		function isLinkEmpty(link) {
			return link.original.length === 0 && link.translation.length === 0;
		}

		$scope.addWord = function(source, wordIndex, $event) {
			var link, linkSource;

			$event.stopPropagation();

			link = $scope.links[$scope.currentLinkIndex];

			linkSource = link[source];
			linkSource.push(wordIndex);
			linkSource.sort();
			$scope.disabled[source][wordIndex] = true;

			if (!$scope.directSelect && link.original.length === 1 && link.translation.length === 1) {
				addEmptyLink();
				resetSelection();
			}
		};

		$scope.removeWord = function(source, wordIndex, linkIndex, $event) {
			var link = $scope.links[linkIndex];
			var linkWordIndex = link[source].indexOf(wordIndex);
			var word = $scope[source][wordIndex];

			$event.stopPropagation();

			if (word.isAlt) {
				word.isAlt = false;
				
				link[source].splice(linkWordIndex, 1);
				delete $scope.disabled[source][wordIndex];

				if (isLinkEmpty(link)) {
					$scope.links.splice(linkIndex, 1);
					addEmptyLink();
					resetSelection();
				}
			}
			else {
				word.isAlt = true;
			}
		}

		$scope.selectLink = function(linkIndex) {
			if ($scope.currentLinkIndex === linkIndex) {
				addEmptyLink();
				resetSelection();
			}
			else if (linkIndex === $scope.links.length - 1) {
				resetSelection();
			}
			else {
				directSelect(linkIndex);
			}
		}

		$scope.changeLinkKind = function(linkIndex, $event) {
			var link = $scope.links[linkIndex];

			$event.stopPropagation();

			if (link.kind === 'assoc') {
				link.kind = 'idiom';
				link.original.forEach(function(x, i) { $scope.original[x].isAlt = false; });
				link.translation.forEach(function(x, i) { $scope.translation[x].isAlt = false; });
			}
			else {
				link.kind = 'assoc';
			}
		}

		$scope.original = [];
		$scope.translation = [];
		$scope.links = [];
		$scope.directSelect = false;
		$scope.currentLinkIndex = 0;
		$scope.disabled = {
			original: {},
			translation: {}
		};
		addEmptyLink();
		resetSelection();
	});
