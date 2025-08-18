export default class Timer {
    private stopTime: number;
    private time: number = 0;

    constructor(stopTime: number) {
        this.stopTime = stopTime;
    }

    /**
     * Checks to see if the timer is up and adds to the time.
     * 
     * @param dt The time since the last tick.
     * 
     * @returns finished?
     */
    public Tick(dt: number): boolean {
        this.time += dt;
        if (this.time < this.stopTime) return false;
        this.time -= this.stopTime;
        return true;
    }
}