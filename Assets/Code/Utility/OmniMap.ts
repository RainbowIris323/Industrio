export class OmniMap<F, B> {
    private front = new Map<F, B>();
    private back = new Map<B, F>();

    public constructor(items: [F, B][] = []) {
        items.forEach((item) => this.Set(item[0], item[1]));
    }

    public Set(front: F, back: B): void {
        this.front.set(front, back);
        this.back.set(back, front);
    }

    public GetBack(front: F): B | undefined {
        return this.front.get(front);
    }

    public GetFront(back: B): F | undefined {
        return this.back.get(back);
    }

    public DelByFront(front: F): void {
        const back = this.front.get(front);
        this.front.delete(front);
        if (back === undefined) return;
        this.back.delete(back);
    }

    public DelByBack(back: B): void {
        const front = this.back.get(back);
        this.back.delete(back);
        if (front === undefined) return;
        this.front.delete(front);
    }

    public Clear(): void {
        this.back.clear();
        this.front.clear();
    }

    public forEach(func: (front: F, back: B) => void): void {
        this.back.forEach((front, back) => func(front, back));
    }
}