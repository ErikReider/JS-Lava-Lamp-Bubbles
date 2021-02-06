import { LavaLamp, Ge1doot } from "../lava-lamp.js";

let lava0: LavaLamp;
let ctx: CanvasRenderingContext2D;
let screen: any;

var run = function () {
    requestAnimationFrame(run);
    ctx.clearRect(0, 0, screen.width, screen.height);
    lava0.renderMetaballs();
};

onload = () => {
    // canvas
    screen = new Ge1doot("bubble", () => {}).init(true);
    ctx = screen.ctx;
    screen.resize();
    addEventListener("resize", () => screen.resize());
    // create LavaLamps
    lava0 = new LavaLamp(ctx, screen.width, screen.height, 10, "#CA3E8C", "#840470");

    run();
};
