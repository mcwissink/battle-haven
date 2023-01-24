interface SoundPack {
    audio: HTMLAudioElement;
    mapping: any;
}

export class Audio {
    soundPool: HTMLAudioElement[] = [];
    context = new AudioContext();
    constructor(public soundPacks: Record<string, SoundPack>) {
    }

    play(path: string) {
        const [pack, id] = path.split('/');
        const sound = this.soundPool.pop() ?? new Sound(this.soundPacks[pack], id);
    }
}

class Sound {
    constructor(audio: SoundPack, id: string) {
    }
}
