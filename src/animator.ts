export class Animator<T extends Record<number, any>> {
    current = 0;
    reset() {
        this.current = 0;
    }
    oscillate(min: number, max: number): keyof T {
        const range = max - min;
        const offset = this.current >= range ? range - (this.current % range) : this.current;
        this.current = (this.current + 1) % (range * 2);
        return min + offset;
    }
}
