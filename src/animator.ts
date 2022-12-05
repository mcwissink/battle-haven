export class Animator {
    current = 0;
    reset() {
        this.current = 0;
    }
    oscillate(min: number, max: number): number {
        const range = max - min;
        const offset = this.current >= range ? range - (this.current % range) : this.current;
        this.current = (this.current + 1) % (range * 2);
        return min + offset;
    }
}
