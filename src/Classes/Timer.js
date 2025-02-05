export default class Timer
{
    constructor(game,time,func,timerType="timeout")
    {
        this.game = game;
        this.timerType = timerType;
        this.func = func;
        this.start = Date.now();
        this.time = time;
        // this.remaining = time;
        this.delta = 20;
        this.paused = false;
        this.id = this.makeId(5);

        this.game.timers.push(this);

        return this;
    }


    execute = () => {
        if(!this.paused)
        {
            // this.remaining -= this.delta;

            if(Date.now() > this.start + this.time)
            {
                this.func();

                if(this.timerType==="timeout")
                {
                    this.remove();
                    return;
                }

                // this.remaining = this.time;
            }
        }

    }

    pause = () => {
        this.paused = true;
    }

    resume = () => {
        this.paused = false;
    }

    remove = () => {
        this.game.timers = this.game.timers.filter((timer)=>timer.id!==this.id);
    }

    makeId(length)
    {
        let s = "1234567890abcdefghijklmnopqrstuvwxyz";
        let id = "";

        for (let i = 0; i < length; i++) {
            let char = s[parseInt(Math.random()*(s.length-1))];
            id += char;
        }
        return id;
    }
}
