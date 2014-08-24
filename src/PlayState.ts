/// <reference path="../lib/phaser.d.ts" />
/// <reference path="Player.ts"/>
/// <reference path="House.ts"/>
/// <reference path="PowerUp.ts"/>
module states {

    
    export class PlayState extends Phaser.State {    
        
        HOUSE_SIZE: number =  48;
        HOUSE_SPACE: number = 56;

	HOUSE_MATERIAL : Phaser.Physics.P2.Material;
	CABLE_MATERIAL : Phaser.Physics.P2.Material;

        emitter: Phaser.Particles.Arcade.Emitter;
        player: Player;   
        
        lastPowerUpSpawn: number = 0;
        
        houseGroup: Phaser.Group;
        houseCollisionGroup: Phaser.Physics.P2.CollisionGroup;
        cableCollisionGroup: Phaser.Physics.P2.CollisionGroup;
        
        collideSound: Phaser.Sound;
        motorSound: Phaser.Sound;
	dingSound: Phaser.Sound;
        
        nextMotorPlay: number;
        nextPuff: number;
        
        cableUsedText: Phaser.Text;

	houseA		: House = null;
	houseB		: House = null;
	start_house	: House = null;
	end_house	: House = null;

	can_start_cable(p : Player) : House {
	    if (this.houseB || this.houseA) {
		if (this.houseA.house_hitbox(p)) {
		    return this.houseA;
		} else if (this.houseB.house_hitbox(p)) {
		    return this.houseB;
		}
	    }
	    return null;
	}

	set_start_house(house:House) {
	    this.start_house = house;
	    this.end_house = this.houseA == house ? this.houseB : this.houseA;
	}

	end_misstion() {
	    console.log("YEEEHAW");
	    this.dingSound.play();
	    this.houseA.celebrate();
	    this.houseB.celebrate();

	    // make ready for next mission
	    this.houseA = null;
	    this.houseB = null;
	    this.start_house = null;
	    this.end_house = null;
	    this.player.remove_cable();

	    // create next mission ?
	    this.create_mission();
	}

	create_mission() {
	    if (this.houseB || this.houseA) return;
	    this.houseA =  <House> this.houseGroup.getRandom(0,0);
	    do {
		this.houseB = <House> this.houseGroup.getRandom(0,0);
	    } while( this.houseA == this.houseB);
	    this.houseA.hilight_house();
	    this.houseB.hilight_house();
	}

        
        preload() {
            this.game.load.image("asphalt", "assets/asphalt.png");
            this.game.load.image("crossing", "assets/crossing.png");
            
            this.game.load.image("house1", "assets/house1.png");            
            this.game.load.image("house2", "assets/house2.png");            

            this.game.load.image("garden1", "assets/garden1.png");
            this.game.load.image("garden2", "assets/garden2.png");
            this.game.load.image("garden3", "assets/garden3.png");

            this.game.load.image("park1", "assets/park.png");
            this.game.load.image("park2", "assets/park2.png");

            this.game.load.image("car", "assets/car.png");

            this.game.load.image("powerup1", "assets/powerup1.png");
            this.game.load.image("powerup2", "assets/powerup2.png");
            
            this.game.load.image("smoke", "assets/smoke.png");
            this.game.load.image("cableUsedIcon", "assets/cableIcon.png");
            this.game.load.image("asphalt", "assets/asphalt.png");
	        this.game.load.image("hep", "assets/hep.png");
            
            this.game.load.audio("motorsound", "assets/sound/sound_motor.wav");
            this.game.load.audio("ding", "assets/sound/sound_haleding.wav");
            this.game.load.audio("collide", "assets/sound/sound_kollision.wav");
            //this.game.load.audio("motorstrained", "assets/sound/sound_motorbelastet.wav");
        }
        
        create() {
            this.game.stage.backgroundColor = 0x333333;
            var cars = [];

            this.game.physics.startSystem(Phaser.Physics.P2JS);
            this.game.physics.p2.setImpactEvents(true);
	    this.HOUSE_MATERIAL = this.game.physics.p2.createMaterial();
	    this.CABLE_MATERIAL = this.game.physics.p2.createMaterial();
	    var slippery = this.game.physics.p2.createContactMaterial(this.HOUSE_MATERIAL, this.CABLE_MATERIAL, {friction : 0});
	    this.game.physics.p2.addContactMaterial(slippery);

	    this.game.world.setBounds(-10, -10, this.game.width + 20, this.game.height + 20);

            
            var playerCollisionGroup = this.game.physics.p2.createCollisionGroup();
            this.cableCollisionGroup = this.game.physics.p2.createCollisionGroup();
            this.houseCollisionGroup = this.game.physics.p2.createCollisionGroup();
            this.game.physics.p2.updateBoundsCollisionGroup();
            
            //this.game.add.sprite(100, 100, "car");
            this.game.add.tileSprite(0, 0, this.game.width, this.game.height, "asphalt");
            
            this.houseGroup = this.game.add.group();
            var houseGroup = this.houseGroup;
            houseGroup.enableBody = true;
            houseGroup.physicsBodyType = Phaser.Physics.P2JS;
            this.game.physics.p2.friction = 100;
            
            this.collideSound = this.game.add.sound("collide");
	    this.dingSound = this.game.add.sound("ding");
            this.motorSound = this.game.add.sound("motorsound");            
            this.nextMotorPlay = game.time.time;
            this.nextPuff = game.time.time;

            for (var y = 60; y <= game.height; y += this.HOUSE_SPACE*2) {
                var lastWasCrossing = false;
                
                for (var x = 24; x <= game.width; x += this.HOUSE_SPACE) {
                    var row = (y - 50) / this.HOUSE_SPACE;
                    var col = (x - 30) / this.HOUSE_SPACE;
                    
                    if ((row % 2 == 1 && col % 2 == 1)) {
                        continue;
                    } else if ((row % 2 == 1 || col % 2 == 1) && Math.random() < 0.5) {
                        continue;
                    }
                    
                    if (Math.random() < 0.5) {
                        if (Math.random() < 0.1 || lastWasCrossing) {
                            var parkGfx = Math.random() > 0.75 ? "park1" : "park2";
                            var park:Phaser.Sprite = game.add.sprite(x, y, parkGfx);
                            park.anchor.setTo(0.5, 0.5);
                            lastWasCrossing = false;
                        } else {
                            lastWasCrossing = true;
                        }
                                                
                    } else {
                        var houseGfx = Math.random() > 0.25 ? "house1" : "house2";
                        var sprite =  new House(this, x, y, houseGfx);
			this.houseGroup.add(sprite);
                        var spriteBody:Phaser.Physics.P2.Body = sprite.body;
			
                        var gardenTag = Math.random() > 0.5 ? "garden1" : "garden2";
                        if (Math.random() > 0.5) {
                            gardenTag = "garden3";
                        }
                        var garden = this.game.add.sprite(x, y + sprite.height, gardenTag);
                        garden.anchor.set(0.5, 1);
                        
                        spriteBody.setRectangle(this.HOUSE_SIZE, this.HOUSE_SIZE);
                        spriteBody.setCollisionGroup(this.houseCollisionGroup);                    
                        spriteBody.collides([this.houseCollisionGroup, playerCollisionGroup, this.cableCollisionGroup]);
                        spriteBody.mass = 5;

                        spriteBody.setMaterial(this.HOUSE_MATERIAL);
                        spriteBody.fixedRotation = true;
                        
                        var spriteLock = this.game.add.sprite(x, y);
                        this.game.physics.p2.enableBody(spriteLock, false);
                        
                        var spriteLockBody: Phaser.Physics.P2.Body = spriteLock.body;                        
                        spriteLock.body.dynamic = false;
			
                        this.game.physics.p2.createSpring(sprite, spriteLock, 0.01, 1000, 0.9);
                    }
                }                
            }
            
            this.emitter = this.game.add.emitter(0, 0, 100);            
            this.emitter.makeParticles("smoke");
            this.emitter.gravity = 0;
            this.emitter.setScale(0.3, 2, 0.3, 2, 1000, Phaser.Easing.Cubic.InOut, false);  
            this.emitter.setAlpha(0.25, 0, 2000);
            this.emitter.setXSpeed(-25, 25);
            this.emitter.setYSpeed(-25, 25);

	    this.player = new Player(this, 320, 320);
            
            var body:Phaser.Physics.P2.Body = this.player.body;
            body.setCollisionGroup(playerCollisionGroup);
            body.collides(this.houseCollisionGroup, this.carHitHouse, this);

            /*
              this.emitter = this.game.add.emitter(0, 0, 100);            
              this.emitter.makeParticles("particle");
              this.emitter.gravity = 200;
              this.emitter.setScale(1, 4, 1, 4, 1000, Phaser.Easing.Cubic.InOut, false);             
              this.game.input.onDown.add(this.burst, this);
            */
            
            //GUI Stuff
            var cableIcon: Phaser.Sprite = game.add.sprite(0, 0, "cableUsedIcon");
            cableIcon.scale.setTo(2, 2);
            cableIcon.smoothed = false;
            this.cableUsedText = createText(32, -2, "#FFFFFF", 28, String(200 - this.player.cableUsed * this.player.SEGMENT_LENGTH) + "m");
            this.cableUsedText.setShadow(-5, -5, 'rgba(0,0,0,0.5)', 5);
            this.cableUsedText.stroke = '#000000';
            this.cableUsedText.strokeThickness = 3;


	    this.create_mission();
        }
        
        /*
          burst(pointer) {
          this.emitter.x = pointer.x;
          this.emitter.y = pointer.y;
          this.emitter.start(true, 2000, null, 10);
          }*/
        
        carHitHouse(body1, body2) {
            this.collideSound.play();
            //console.log("Hit");
            //body2.sprite.alpha = 0.25;
            //game.add.tween(body2.sprite).to( { alpha: 1 }, 500, Phaser.Easing.Linear.None, true);
	    // Shake the camera by moving it up and down 5 times really fast
            this.game.camera.y = 0;
            this.game.add.tween(this.game.camera)
		.to({ y: -5 }, 40, Phaser.Easing.Sinusoidal.InOut, false, 0, 5, true)
		.start();
            
            this.emitter.x = body2.x;
            this.emitter.y = body2.y + body2.sprite.height * 0.25;
            this.emitter.start(true, 1000, null, 5);

        }
        
        update() {
            if (this.game.input.keyboard.isDown(Phaser.Keyboard.UP) || this.game.input.keyboard.isDown(Phaser.Keyboard.DOWN)) {
                if (this.game.time.time > this.nextMotorPlay) {
                    this.nextMotorPlay = this.game.time.time + 700;
                    this.motorSound.play();                    
                }
                
                if (this.game.time.time > this.nextPuff) {
                    this.emitter.x = this.player.x + Math.cos(this.player.rotation) * -this.player.SIZE.x / 2.0 + Math.random() * 6 - 3;
                    this.emitter.y = this.player.y + Math.sin(this.player.rotation) * -this.player.SIZE.y / 2.0 + Math.random() * 6 - 3;
                    this.emitter.start(true, 1000, null, 10);                    
                    this.nextPuff = this.game.time.time + 100;
                }
            }
            
	    // if (this.game.input.keyboard.isDown(Phaser.Keyboard.M))
	    // 	this.create_mission();
	    
            //Update the GUI
            this.cableUsedText.text = String(200 - this.player.cableUsed * this.player.SEGMENT_LENGTH) + "m";

	    // check the cable end
	    if (this.start_house) {
		if (this.end_house.house_hitbox(this.player)) {
		    this.end_misstion();
		}
	    }
            
            if(Math.random() * 100 <= (this.game.time.totalElapsedSeconds() - this.lastPowerUpSpawn) / 3.14)
            {
                var newPowerUp: PowerUp = new PowerUp(this, Math.round(Math.random() * 12) + Math.round(Math.random() * 6) * 100, Math.random() * this.game.width, 1);
                
                this.lastPowerUpSpawn = this.game.time.totalElapsedSeconds();
            }
        }
    }

    function createText(x: number, y: number, color: Phaser.Color, size: number, text: string)  {
        var style = { font: "65px Arial", fill: "#000000", align: "center" };
        var _text = game.add.text(x, y, text, style);
        _text.fontSize = size;
        _text.fill = color;
        return _text;
    }

}
