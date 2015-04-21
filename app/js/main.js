// npr API url
var nprUrl = 'http://api.npr.org/query?id=61&fields=relatedLink,title,byline,text,audio,image,pullQuote,all&output=JSON';
var apiKey = 'MDExODQ2OTg4MDEzNzQ5OTM4Nzg5MzFiZA001';


var app = angular.module("myApp", []);


// Custom directive
// EA -> directive can be used as element or attribute
// requiring the use of ng-model in order to use this directive
// scope object
//  - = is bi-directional data binding
//  - & is to execute a function in context of parent scope
app.directive('nprLink', function () {
	return {
		restrict: 'EA',
		require: ['^ngModel'],
		replace: true,
		scope: {
			ngModel: '=', 
			player: '=' 
		},
		templateUrl: 'views/nprListItem.html',
		link: function (scope, ele, attr) {
			scope.duration = scope.ngModel.audio[0].duration.$text;
		}
	}
});

app.directive('playerView', function () {

	return {
		restrict: 'EA',
		require: ['^ngModel'],
		scope: {
			ngModel: '='
		},
		templateUrl: 'views/playerView.html',
		link: function(scope, iElm, iAttrs, controller) {
	      scope.$watch('ngModel.current', function(newVal) {
	        if (newVal) {
	          scope.playing = true;
	          scope.title = scope.ngModel.current.title.$text;
	          scope.$watch('ngModel.ready', function(newVal) {
	            if (newVal) {
	              scope.duration = scope.ngModel.currentDuration();
	            }
	          });

	          scope.$watch('ngModel.progress', function(newVal) {
	            scope.secondsProgress = scope.ngModel.progress;
	            scope.percentComplete = scope.ngModel.progress_percent;
	          });
	        }
	      });
	      scope.stop = function() {
	        scope.ngModel.stop();
	        scope.playing = false;
	      }
	    }
	};
});

// FACTORIES START
// audio service
app.factory('audio', function ($document) {
	var audio = $document[0].createElement('audio');
	return audio;
});

// player service
app.factory('player', function (audio, $rootScope) {
  var player = {
  	playing: false,
  	current: null,
  	ready: false,

  	currentTime: function() {
  		return audio.currentTime;
  	},

  	currentDuration: function () {
  		return parseInt(audio.duration);
  	},

  	play: function(program) {
  		// if we are playing, stop the current playback
  		if(player.playing) {
  			player.stop();
  		}

  		var url = program.audio[0].format.mp4.$text;
  		player.current = program;
  		audio.src = url;
  		audio.play();
  		player.playing = true;
  	},

  	stop: function() {
  		if(player.playing) {
  			audio.pause(); // stop playback

  			// clear the state of the player
  			player.ready = false;
  			player.playing = false;
  			player.current = null;
  		}
  	}
  };

  // add event listener for audio ending
  // when ended, apply the player stop() method
  audio.addEventListener('ended', function() {
  	$rootScope.$apply(player.stop());
  });

  audio.addEventListener('timeupdate', function(event) {
  	$rootScope.$apply(function () {
  		player.progress = player.currentTime();
  		player.progressPercent = player.progress / player.currentDuration();
  	});
  });

  audio.addEventListener('canplay', function(event) {
  	$rootScope.$apply(function () {
  		player.ready = true;
  	});
  });

  return player;
});

// npr Service
app.factory('nprService', function ($http) {
	var doRequest = function (apiKey) {
		return $http({
			method: 'JSONP',
			url: nprUrl + '&apiKey=' + apiKey + '&callback=JSON_CALLBACK'
		});
	}

	return {
		programs: function (apiKey) {
			return doRequest(apiKey);
		}
	};
});
// FACTORIES END


app.controller('PlayerController', function ($scope, nprService, player) {
	// set the audio
	$scope.player = player;
    nprService.programs(apiKey)
      .success(function(data, status) {
        $scope.programs = data.list.story;
    })
});

// Responsible for keeping track of our audio element
// and will handle fetching our listing of NPR programs
app.controller('RelatedController', function ($scope, player) {
	$scope.player = player;

	$scope.$watch('player.current', function(program) {
		if(program) {
			$scope.related = [];
			angular.forEach(program.relatedLink, function (link) {
				$scope.related.push({
					link: link.link[0].$text, 
					caption: link.caption.$text
				});
			});
		}
	});
});

// Parent scope
app.controller('FrameController', function ($scope) {
});