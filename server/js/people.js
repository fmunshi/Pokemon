var $globals = require("./globals")
  , $gamejs = require("../lib/gamejs")
  , $mapobj = require("./mapobject")
  , $battle = require("./battles/battle");
var Person = function(map, pos, imageNum){
	Person.superConstructor.apply(this, arguments);
	this.imgNum = imageNum || 16;
	this.moving = false;
	this.map = map;
	this.type = "person";
	this.move_delay = 0;
	return this;
}

$gamejs.utils.objects.extend(Person, $mapobj.MapObject);

Person.prototype.handle = function(event) {
	var $e = $gamejs.event;
	var action = "";
	if(event.type === $e.KEY_DOWN) {
	if (event.key == $e.K_w) {
		this.moving = 'up';
		action = "move";
	} else if (event.key == $e.K_s) {
		this.moving = 'down';
		action = "move";
	} else if (event.key == $e.K_d) {
		this.moving = 'right';
		action = "move";
	} else if (event.key == $e.K_a) {
		this.moving = 'left';
		action = "move";
	}
	}
	if(event.type === $e.KEY_UP) {
		if (event.key == $e.K_w) {
			if(this.moving === 'up') {
				this.moving = false;
				action = "stop";
			}
		} else if (event.key == $e.K_s) {
			if(this.moving === 'down') {
				this.moving = false;
				action = "stop";
			}
		} else if (event.key == $e.K_d) {
			if(this.moving === 'right') {
				this.moving = false;
				action = "stop";
			}
		} else if (event.key == $e.K_a) {
			if(this.moving === 'left') {
				this.moving = false;
				action = "stop";
			}
		}
	}
	return action;
};
Person.prototype.update = function(msDuration) {
	if ((this.moving) && (this.move_delay <= 0)) {
		this.move();
		this.move_delay = 200;
		this.socket.emit("move", this.id, {pos: this.pos, moving: this.moving});
		this.socket.broadcast.emit("move",  this.id, {pos: this.pos, moving: this.moving});
		console.log("Person Pos: " + this.pos[0] + ", " + this.pos[1]);
		if(this.map.tiles[this.pos[0]][this.pos[1]] == 2) {
			console.log("Battle")
			var battle = new $battle.Battle(0);
			this.battle = battle;
			this.moving = false;
			$globals.battles.push(battle);
		};
	};
	if (this.move_delay > 0) {
		this.move_delay -= msDuration;
	};

};



Person.prototype.move = function() {
	var pos = this.pos;
	var check = {};
	if (this.moving === "left") {
		check = this.map.checkSpace([pos[0], pos[1] - 1]);
		if(check.open) {
			this.map.objects[this.pos[0]][this.pos[1]].remove(this);
			this.pos[1] -= 1;
			this.map.objects[this.pos[0]][this.pos[1]].add(this);
		};
	} else if(this.moving === "right") {
		check = this.map.checkSpace([pos[0], pos[1] + 1]);
		if(check.open) {
			this.map.objects[this.pos[0]][this.pos[1]].remove(this);
			this.pos[1] += 1;
			this.map.objects[this.pos[0]][this.pos[1]].add(this);
		};
	} else if(this.moving === "down") {
		check = this.map.checkSpace([pos[0] + 1, pos[1]]);
		if(check.open) {
			this.map.objects[this.pos[0]][this.pos[1]].remove(this);
			this.pos[0] += 1;
			this.map.objects[this.pos[0]][this.pos[1]].add(this);
		};
	} else if(this.moving === "up") {
		check = this.map.checkSpace([pos[0] - 1, pos[1]]);
		if(check.open) {
			this.map.objects[this.pos[0]][this.pos[1]].remove(this);
			this.pos[0] -= 1;
			this.map.objects[this.pos[0]][this.pos[1]].add(this);
		};
	};
	if (check.edge) {
		this.changeMap(this.moving);
		this.moving = false;
	}
};
Person.prototype.changeMap = function(dir) {
	var mapPos = this.map.mapPos;
	var switchedMap = true;
	this.map.remove(this);
	console.log(mapPos);
	if ((dir === "left") && (mapPos[1] != 0)) {
		this.map = $globals.maps[mapPos[0]][mapPos[1] - 1];
		this.pos = [this.pos[0], this.map.tiles[this.pos[0]].length - 1];
	} else if ((dir === "right") && (mapPos[1] != $globals.maps[mapPos[0]].length - 1)) {
		this.map = $globals.maps[mapPos[0]][mapPos[1] + 1];
		this.pos = [this.pos[0], 0];
	} else if ((dir === "down") && (mapPos[0] != $globals.maps.length - 1)) {
		this.map = $globals.maps[mapPos[0] + 1][mapPos[1]];
		this.pos = [0, this.pos[1]];
	} else if ((dir === "up") && (mapPos[0] != 0)) {
		this.map = $globals.maps[mapPos[0] - 1][mapPos[1]];
		this.pos = [this.map.tiles.length - 1, this.pos[1]];
	} else {
		switchedMap = false;
	}
	if (switchedMap) {
		this.moving = dir;
		console.log("Changing Map")
		console.log(this.map.mapPos)
		this.map.objectGroup.add(this);
		this.map.objects[this.pos[0]][this.pos[1]].add(this);

		var objs = [];
		this.map.objectGroup.forEach(function(obj) {
			objs.push({pos: obj.pos, imgNum: obj.imgNum, id: obj.id, type: obj.type, moving: obj.moving})
		});
		this.socket.emit("mapChange", {map: {tiles: this.map.tiles, objects: objs}, number: this.id});
	} else {
		this.map.objectGroup.add(this);
		this.map.objects[this.pos[0]][this.pos[1]].add(this);
	};
};
var NonPlayableChar = function(map, pos, imageNum, moveCycle) {
	NonPlayableChar.superConstructor.apply(this, arguments);
	this.currentMove = 0;
	this.moveTimer = 0;
	if ((!moveCycle) || !(moveCycle instanceof Array)) {
		this.moveCycle = [{dir: "right", spaces: 4},
						   {dir: "left", spaces: 4}];
	} else {
		this.moveCycle = moveCycle;
	}

	return this;

}
$gamejs.utils.objects.extend(NonPlayableChar, Person);

NonPlayableChar.prototype.update = function(msDuration) {
	if (this.move_delay <= 0) {
	if ((this.moving) ) {
		this.move();
		this.move_delay = 500;
	}
	this.moveTimer -= 1;
	if (this.moveTimer < 0) {
		this.currentMove ++;
		if (this.currentMove > this.moveCycle.length - 1) {
			this.currentMove = 0;
		}
		this.moving = this.moveCycle[this.currentMove].dir;
		this.moveTimer = this.moveCycle[this.currentMove].spaces;
	}
};
this.move_delay -= msDuration;

}
exports.Person = Person;
exports.NPC = NonPlayableChar;