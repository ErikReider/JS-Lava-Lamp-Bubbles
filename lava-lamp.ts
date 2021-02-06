export class Ge1doot {
    private elem: HTMLCanvasElement;
    private callback: Function;
    private ctx: CanvasRenderingContext2D;
    private width = 0;
    private height = 0;
    private left = 0;
    private top = 0;

    constructor(id: string, callback: Function) {
        this.elem = <HTMLCanvasElement>document.getElementById(id);
        this.callback = callback || null;
        this.ctx = <CanvasRenderingContext2D>this.elem.getContext("2d");
    }

    init(initRes: boolean) {
        window.addEventListener("resize", () => this.resize());
        this.elem.onselectstart = function () {
            return false;
        };
        this.elem.ondrag = function () {
            return false;
        };
        initRes && this.resize();
        return this;
    }

    resize() {
        let o: any = this.elem;
        this.width = o.offsetWidth;
        this.height = o.offsetHeight;
        for (this.left = 0, this.top = 0; o != null; o = o.offsetParent) {
            this.left += o.offsetLeft;
            this.top += o.offsetTop;
        }
        if (this.ctx) {
            this.elem.width = this.width;
            this.elem.height = this.height;
        }
        this.callback && this.callback();
    }
}

class Point {
    public x: number;
    public y: number;
    public magnitude: number;
    public computed: number = 0;
    public force: number = 0;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.magnitude = x * x + y * y;
        this.computed = 0;
        this.force = 0;
    }

    add(p: Point) {
        return new Point(this.x + p.x, this.y + p.y);
    }
}

class Ball {
    private vel: Point;
    public pos: Point;
    public size: number;
    private width: number;
    private height: number;

    constructor(par: LavaLamp) {
        let min = 0.05;
        let max = 0.075;
        this.vel = new Point(
            (Math.random() > 0.5 ? 1 : -1) * (0.2 + Math.random() * 0.25) * 0.25,
            (Math.random() > 0.5 ? 1 : -1) * (0.2 + Math.random()) * 0.25
        );
        this.pos = new Point(
            par.width * 0.2 + Math.random() * par.width * 0.6,
            par.height * 0.2 + Math.random() * par.height * 0.6
        );
        this.size = par.wh / 15 + (Math.random() * (max - min) + min) * (par.wh / 15);
        this.width = par.width;
        this.height = par.height;
    }

    move() {
        // bounce borders
        if (this.pos.x >= this.width - this.size) {
            if (this.vel.x > 0) this.vel.x = -this.vel.x;
            this.pos.x = this.width - this.size;
        } else if (this.pos.x <= this.size) {
            if (this.vel.x < 0) this.vel.x = -this.vel.x;
            this.pos.x = this.size;
        }

        if (this.pos.y >= this.height - this.size) {
            if (this.vel.y > 0) this.vel.y = -this.vel.y;
            this.pos.y = this.height - this.size;
        } else if (this.pos.y <= this.size) {
            if (this.vel.y < 0) this.vel.y = -this.vel.y;
            this.pos.y = this.size;
        }

        // velocity
        this.pos = this.pos.add(this.vel);
    }
}

export class LavaLamp {
    private ctx: CanvasRenderingContext2D;
    private step = 5;
    public width: number;
    public height: number;
    public wh: number;
    private sx: number;
    private sy: number;
    private paint = false;
    private metaFill: any;
    private plx: number[];
    private ply: number[];
    private mscases: number[];
    private ix: number[];
    private grid: Point[];
    private balls: Ball[];
    private iter = 0;
    private sign = 1;

    constructor(
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        numBalls: number,
        c0: string,
        c1: string
    ) {
        this.ctx = ctx;
        this.step = 5;
        this.width = width;
        this.height = height;
        this.wh = Math.min(width, height);
        this.sx = Math.floor(this.width / this.step);
        this.sy = Math.floor(this.height / this.step);
        this.paint = false;
        this.metaFill = createRadialGradient(this.ctx, width, height, width, c0, c1);
        this.plx = [0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 0];
        this.ply = [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 0, 1, 0, 1];
        this.mscases = [0, 3, 0, 3, 1, 3, 0, 3, 2, 2, 0, 2, 1, 1, 0];
        this.ix = [1, 0, -1, 0, 0, 1, 0, -1, -1, 0, 1, 0, 0, 1, 1, 0, 0, 0, 1, 1];
        this.grid = [];
        this.balls = [];
        this.iter = 0;
        this.sign = 1;

        // init grid
        for (let i = 0; i < (this.sx + 2) * (this.sy + 2); i++) {
            this.grid[i] = new Point((i % (this.sx + 2)) * this.step, Math.floor(i / (this.sx + 2)) * this.step);
        }

        // create metaballs
        for (let k = 0; k < numBalls; k++) {
            this.balls[k] = new Ball(this);
        }
    }

    computeForce(x: number, y: number, idx: number) {
        let force: number;
        let id = idx || x + y * (this.sx + 2);

        if (x === 0 || y === 0 || x === this.sx || y === this.sy) {
            force = 0.6 * this.sign;
        } else {
            force = 0;
            let cell = this.grid[id];
            let i = 0;
            let ball: Ball;
            while ((ball = this.balls[i++])) {
                force +=
                    (ball.size * ball.size) /
                    (-2 * cell.x * ball.pos.x - 2 * cell.y * ball.pos.y + ball.pos.magnitude + cell.magnitude);
            }
            force *= this.sign;
        }
        this.grid[id].force = force;
        return force;
    }

    marchingSquares(next: any) {
        let x = next[0];
        let y = next[1];
        let pdir = next[2];
        let id = x + y * (this.sx + 2);
        if (this.grid[id].computed === this.iter) {
            return false;
        }
        let dir: any;
        let mscase = 0;

        // neighbors force
        for (let i = 0; i < 4; i++) {
            let idn = x + this.ix[i + 12] + (y + this.ix[i + 16]) * (this.sx + 2);
            let force = this.grid[idn].force;
            if ((force > 0 && this.sign < 0) || (force < 0 && this.sign > 0) || !force) {
                // compute force if not in buffer
                force = this.computeForce(x + this.ix[i + 12], y + this.ix[i + 16], idn);
            }
            if (Math.abs(force) > 1) mscase += Math.pow(2, i);
        }
        if (mscase === 15) {
            // inside
            return [x, y - 1, false];
        } else {
            // ambiguous cases
            if (mscase === 5) dir = pdir === 2 ? 3 : 1;
            else if (mscase === 10) dir = pdir === 3 ? 0 : 2;
            else {
                // lookup
                dir = this.mscases[mscase];
                this.grid[id].computed = this.iter;
            }
            // draw line
            let ix =
                this.step /
                (Math.abs(
                    Math.abs(this.grid[x + this.plx[4 * dir + 2] + (y + this.ply[4 * dir + 2]) * (this.sx + 2)].force) -
                        1
                ) /
                    Math.abs(
                        Math.abs(
                            this.grid[x + this.plx[4 * dir + 3] + (y + this.ply[4 * dir + 3]) * (this.sx + 2)].force
                        ) - 1
                    ) +
                    1);
            this.ctx.lineTo(
                this.grid[x + this.plx[4 * dir] + (y + this.ply[4 * dir]) * (this.sx + 2)].x + this.ix[dir] * ix,
                this.grid[x + this.plx[4 * dir + 1] + (y + this.ply[4 * dir + 1]) * (this.sx + 2)].y +
                    this.ix[dir + 4] * ix
            );
            this.paint = true;
            // next
            return [x + this.ix[dir + 4], y + this.ix[dir + 8], dir];
        }
    }

    renderMetaballs() {
        let i = 0;
        let ball: Ball;
        while ((ball = this.balls[i++])) ball.move();
        // reset grid
        this.iter++;
        this.sign = -this.sign;
        this.paint = false;
        this.ctx.fillStyle = this.metaFill;
        this.ctx.beginPath();
        // compute metaballs
        i = 0;
        while ((ball = this.balls[i++])) {
            // first cell
            let next: any = [Math.round(ball.pos.x / this.step), Math.round(ball.pos.y / this.step), false];
            // marching squares
            while (next) {
                next = this.marchingSquares(next);
            }
            // fill and close path
            if (this.paint) {
                this.ctx.fill();
                this.ctx.closePath();
                this.ctx.beginPath();
                this.paint = false;
            }
        }
    }
}

// gradients
function createRadialGradient(ctx: CanvasRenderingContext2D, w: number, h: number, r: number, c0: string, c1: string) {
    let gradient = ctx.createRadialGradient(w / 1, h / 1, 0, w / 1, h / 1, r);
    gradient.addColorStop(0, c0);
    gradient.addColorStop(1, c1);
    return gradient;
}
