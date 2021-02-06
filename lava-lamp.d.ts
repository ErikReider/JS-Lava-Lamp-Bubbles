export declare class Ge1doot {
    private elem;
    private callback;
    private ctx;
    private width;
    private height;
    private left;
    private top;
    constructor(id: string, callback: Function);
    init(initRes: boolean): this;
    resize(): void;
}
export declare class LavaLamp {
    private ctx;
    private step;
    width: number;
    height: number;
    wh: number;
    private sx;
    private sy;
    private paint;
    private metaFill;
    private plx;
    private ply;
    private mscases;
    private ix;
    private grid;
    private balls;
    private iter;
    private sign;
    constructor(ctx: CanvasRenderingContext2D, width: number, height: number, numBalls: number, c0: string, c1: string);
    computeForce(x: number, y: number, idx: number): number;
    marchingSquares(next: any): false | any[];
    renderMetaballs(): void;
}
