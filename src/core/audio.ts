import { AudioPlay } from "kaplay";
import { k } from "../constants";

type ChannelName = "master" | "bgm" | "sfx";

interface SoundEntry {
    path: string;
    channel: "bgm" | "sfx";
    defaultVolume: number;
    loop: boolean;
    loaded: boolean;
}

interface Channel {
    volume: number;
    muted: boolean;
    handles: Set<AudioPlay>;
}

const STORAGE_KEY = "audio.volumes";

function loadPersistedVolumes(): Record<ChannelName, number> {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            return {
                master: Math.max(0, Math.min(1, parsed.master ?? 1)),
                bgm: Math.max(0, Math.min(1, parsed.bgm ?? 1)),
                sfx: Math.max(0, Math.min(1, parsed.sfx ?? 1)),
            };
        }
    } catch { /* ignore */ }
    return { master: 1, bgm: 1, sfx: 1 };
}

function persistVolumes(channels: Record<ChannelName, Channel>): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            master: channels.master.volume,
            bgm: channels.bgm.volume,
            sfx: channels.sfx.volume,
        }));
    } catch { /* ignore */ }
}

const savedVolumes = loadPersistedVolumes();

const channels: Record<ChannelName, Channel> = {
    master: { volume: savedVolumes.master, muted: false, handles: new Set() },
    bgm:    { volume: savedVolumes.bgm,    muted: false, handles: new Set() },
    sfx:    { volume: savedVolumes.sfx,    muted: false, handles: new Set() },
};

const registry = new Map<string, SoundEntry>();
let currentBgm: { id: string; handle: AudioPlay } | null = null;

function effectiveVolume(channelName: "bgm" | "sfx", perSound: number): number {
    const ch = channels[channelName];
    const master = channels.master;
    if (ch.muted || master.muted) return 0;
    return master.volume * ch.volume * perSound;
}

export const audio = {
    register(id: string, path: string, opts?: { channel?: "bgm" | "sfx"; defaultVolume?: number; loop?: boolean }): void {
        registry.set(id, {
            path,
            channel: opts?.channel ?? "sfx",
            defaultVolume: opts?.defaultVolume ?? 1,
            loop: opts?.loop ?? false,
            loaded: false,
        });
    },

    async loadAll(): Promise<void> {
        const tasks = Array.from(registry.entries()).map(async ([id, entry]) => {
            try {
                await k.loadSound(id, entry.path);
                entry.loaded = true;
            } catch (e) {
                console.warn(`[audio] Failed to load sound "${id}" from "${entry.path}":`, e);
            }
        });
        await Promise.all(tasks);
    },

    playBgm(id: string): void {
        if (currentBgm) {
            currentBgm.handle.stop();
            channels.bgm.handles.delete(currentBgm.handle);
            currentBgm = null;
        }

        const entry = registry.get(id);
        if (!entry) {
            console.warn(`[audio] playBgm: unknown id "${id}"`);
            return;
        }
        if (!entry.loaded) {
            console.warn(`[audio] playBgm: "${id}" was not loaded (missing file?)`);
            return;
        }

        const vol = effectiveVolume("bgm", entry.defaultVolume);
        const handle = k.play(id, { volume: vol, loop: true });
        channels.bgm.handles.add(handle);
        currentBgm = { id, handle };
    },

    stopBgm(): void {
        if (currentBgm) {
            currentBgm.handle.stop();
            channels.bgm.handles.delete(currentBgm.handle);
            currentBgm = null;
        }
    },

    playSfx(id: string, opts?: { volume?: number; speed?: number }): AudioPlay | null {
        const entry = registry.get(id);
        if (!entry) {
            console.warn(`[audio] playSfx: unknown id "${id}"`);
            return null;
        }
        if (!entry.loaded) {
            console.warn(`[audio] playSfx: "${id}" was not loaded (missing file?)`);
            return null;
        }

        const perSound = opts?.volume ?? entry.defaultVolume;
        const vol = effectiveVolume("sfx", perSound);
        const handle = k.play(id, { volume: vol, loop: false, speed: opts?.speed });
        channels.sfx.handles.add(handle);
        handle.onEnd(() => channels.sfx.handles.delete(handle));
        return handle;
    },

    setChannelVolume(channel: ChannelName, vol: number): void {
        const clamped = Math.max(0, Math.min(1, vol));
        channels[channel].volume = clamped;
        persistVolumes(channels);

        if (channel === "master" || channel === "bgm") {
            channels.bgm.handles.forEach((h) => {
                const bgmId = currentBgm?.id;
                const entry = bgmId ? registry.get(bgmId) : undefined;
                h.volume = effectiveVolume("bgm", entry?.defaultVolume ?? 1);
            });
        }
        if (channel === "master" || channel === "sfx") {
            channels.sfx.handles.forEach((h) => {
                h.volume = effectiveVolume("sfx", 1);
            });
        }
    },

    getChannelVolume(channel: ChannelName): number {
        return channels[channel].volume;
    },

    setMuted(channel: ChannelName, muted: boolean): void {
        channels[channel].muted = muted;
        this.setChannelVolume(channel, channels[channel].volume);
    },

    get currentBgmId(): string | null {
        return currentBgm?.id ?? null;
    },
};
