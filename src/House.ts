/// <reference path="../lib/phaser.d.ts" />
/// <reference path="PlayState.ts"/>
module states {

    export class House extends Phaser.Sprite {

	is_connected : boolean;
	ps : PlayState;
	high_light : Phaser.Sprite;

	emitter :Phaser.Particles.Arcade.Emitter;
	

        constructor(ps: PlayState, x: number, y: number, housegfx : string) {
            super(ps.game, x, y, housegfx);
	    this.is_connected = false;
	    this.ps = ps;
	    this.game.physics.p2.enableBody(this, false);
            var body: Phaser.Physics.P2.Body = this.body;
	    game.add.existing(this);
        }

        update()  {

	}


	remove_emitter() {
	    if(this.emitter) 
		this.emitter.destroy();
	}
	
	celebrate() {
	    this.emitter = this.game.add.emitter(this.x, this.y, 1000);            
            this.emitter.makeParticles("connected");
            this.emitter.gravity = 200;
	    this.emitter.start(true, 5000, null, 50);
        
            this.emitter.setScale(0.3, 2, 0.3, 2, 1000, Phaser.Easing.Cubic.InOut, false);  
            this.emitter.setAlpha(1, 0, 2000);
        
	    this.is_connected = true;
	    this.high_light.destroy();
	    this.high_light = this.game.add.sprite(this.x, this.y + 24, "connected");
	    this.high_light.anchor.setTo(.5,.5);
	}

	
	hilight_house() {
	    this.high_light = this.game.add.sprite(this.x, this.y + 24, "hep");
	    this.high_light.anchor.setTo(.5,.5);
	}

	house_hitbox(p : Phaser.Sprite) : boolean {
	    var dy = (p.y - this.y);
	    var dx = (p.x - this.x);
	    return  Math.abs(dx) < 24 && dy > 24 && dy < 48
	}
	

    }

}