import createGameScene from './scenes/game-scene';
import createMainMenuScene from './scenes/main-menu-scene';
import {NAME_Game, NAME_MainMenu} from "./constants";
import {wireDictionary} from "./wire-dictionary";
import {ConnectionType} from "./types";
import {audio} from "./core/audio";

import {k} from './constants'

function initializeWireDictionary() {
    wireDictionary.add("wire-i", {
        sprite: "atlas",
        frame: 1,
        flow: [
            ConnectionType.Both,
            ConnectionType.None,
            ConnectionType.Both,
            ConnectionType.None
        ]
    });
    wireDictionary.add("wire-l", {
        sprite: "atlas",
        frame: 3,
        flow: [
            ConnectionType.None,
            ConnectionType.None,
            ConnectionType.Both,
            ConnectionType.Both
        ]
    });
    wireDictionary.add("wire-gate-start", {
        sprite: "atlas",
        frame: 0,
        flow: [
            ConnectionType.None,
            ConnectionType.Outlet,
            ConnectionType.None,
            ConnectionType.None
        ]
    });
    wireDictionary.add("wire-gate-end", {
        sprite: "atlas",
        frame: 0,
        flow: [
            ConnectionType.None,
            ConnectionType.Inlet,
            ConnectionType.None,
            ConnectionType.None
        ]
    });
    wireDictionary.add("wire-blocked", {
        sprite: "atlas",
        frame: 7,
        flow: [
            ConnectionType.None,
            ConnectionType.None,
            ConnectionType.None,
            ConnectionType.None
        ]
    });
    wireDictionary.add("wire-i-1w", {
        sprite: "atlas",
        frame: 4,
        flow: [
            ConnectionType.Inlet,
            ConnectionType.None,
            ConnectionType.Outlet,
            ConnectionType.None
        ]
    });
    wireDictionary.add("wire-l-1w1", {
        sprite: "atlas",
        frame: 5,
        flow: [
            ConnectionType.None,
            ConnectionType.None,
            ConnectionType.Inlet,
            ConnectionType.Outlet
        ]
    });
    wireDictionary.add("wire-l-1w2", {
        sprite: "atlas",
        frame: 2,
        flow: [
            ConnectionType.None,
            ConnectionType.None,
            ConnectionType.Outlet,
            ConnectionType.Inlet
        ]
    });
    wireDictionary.add("wire-modifier-minus", {
        sprite: "atlas",
        frame: 8,
        flow: [
            ConnectionType.Both,
            ConnectionType.None,
            ConnectionType.Both,
            ConnectionType.None
        ],
        modifier: -1
    });
    wireDictionary.add("wire-modifier-plus", {
        sprite: "atlas",
        frame: 9,
        flow: [
            ConnectionType.Both,
            ConnectionType.None,
            ConnectionType.Both,
            ConnectionType.None
        ],
        modifier: 1
    });
}

function registerSounds() {
    audio.register("bgm-menu", "sounds/bgm-menu.mp3", { channel: "bgm", loop: true });
    audio.register("bgm-gameplay", "sounds/bgm-gameplay.mp3", { channel: "bgm", loop: true });
    audio.register("sfx-rotate", "sounds/sfx-rotate.mp3", { channel: "sfx" });
}

k.loadRoot("./"); // A good idea for Itch.io publishing later
initializeWireDictionary();

registerSounds();
await audio.loadAll();

audio.setMuted("bgm", true);

k.scene(NAME_MainMenu, createMainMenuScene());
k.scene(NAME_Game, createGameScene());
k.go(NAME_MainMenu);