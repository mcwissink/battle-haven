export interface SoundPack {
    audio: AudioBuffer;
    mapping: any;
}

export class Audio {
    soundPool: HTMLAudioElement[] = [];
    context = new AudioContext();
    constructor(public soundPacks: Record<string, SoundPack>) {
    }

    play(path: string) {
        const [pack, id] = path.split('/');
        const soundpack = this.soundPacks[pack];
        const source = this.context.createBufferSource();
        source.buffer = soundpack.audio
        source.connect(this.context.destination);
        const { start, end } = soundpack.mapping[id];
        source.start(0, start, end - start);
    }
}
