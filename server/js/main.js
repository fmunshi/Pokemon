var $maps = require("./maps")
  , $map = require("./map")
  , $gamejs = require("../lib/gamejs")
  , $g = require("./globals");

for (var i = 0; i < $maps.MAP_HEIGHT; i++) {
	var row = [];
	for (var j = 0; j < $maps.MAP_WIDTH; j++) {
		row.push(new $map.Map([i, j]));
	}
	$g.maps.push(row);
};

var tick = function() {
	var msDuration = (Date.now() - TIMER_LASTCALL);
	TIMER_LASTCALL = Date.now();
	updateMaps(msDuration);
	updateBattles(msDuration);
}
setInterval(tick, 30);
var TIMER_LASTCALL = Date.now();

var updateMaps = function(msDuration) {
	for (var i = $maps.MAP_HEIGHT - 1; i >= 0; i--) {
		for (var j = $maps.MAP_WIDTH - 1; j >= 0; j--) {
			$g.maps[i][j].update(msDuration);
		};
	};
};
var updateBattles = function(msDuration) {
	for (var i = 0; i < $g.battles.length; i++) {
		$g.battles[i].update(msDuration);
	};
};