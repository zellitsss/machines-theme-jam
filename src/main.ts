import createGameScene from './scenes/game-scene';
import createMainMenuScene from './scenes/main-menu-scene';
import {
    NAME_Game, NAME_MainMenu,
    Tag_WireType_Blocked, Tag_WireType_End, Tag_WireType_I,
    Tag_WireType_I_1W, Tag_WireType_L, Tag_WireType_L_1W1, Tag_WireType_L_1W2, Tag_WireType_Modifier_Minus,
    Tag_WireType_Modifier_Plus, Tag_WireType_Start
} from "./constants";
import {wireDictionary} from "./wire-dictionary";
import {ConnectionType} from "./types";
import {audio} from "./core/audio";

import {k} from './constants'

function initializeWireDictionary() {
    wireDictionary.add(Tag_WireType_I, {
        sprite: "atlas",
        frame: 1,
        flow: [
            ConnectionType.Both,
            ConnectionType.None,
            ConnectionType.Both,
            ConnectionType.None
        ]
    });
    wireDictionary.add(Tag_WireType_L, {
        sprite: "atlas",
        frame: 3,
        flow: [
            ConnectionType.None,
            ConnectionType.None,
            ConnectionType.Both,
            ConnectionType.Both
        ]
    });
    wireDictionary.add(Tag_WireType_Start, {
        sprite: "atlas",
        frame: 0,
        flow: [
            ConnectionType.None,
            ConnectionType.Outlet,
            ConnectionType.None,
            ConnectionType.None
        ]
    });
    wireDictionary.add(Tag_WireType_End, {
        sprite: "atlas",
        frame: 0,
        flow: [
            ConnectionType.None,
            ConnectionType.Inlet,
            ConnectionType.None,
            ConnectionType.None
        ]
    });
    wireDictionary.add(Tag_WireType_Blocked, {
        sprite: "atlas",
        frame: 7,
        flow: [
            ConnectionType.None,
            ConnectionType.None,
            ConnectionType.None,
            ConnectionType.None
        ]
    });
    wireDictionary.add(Tag_WireType_I_1W, {
        sprite: "atlas",
        frame: 4,
        flow: [
            ConnectionType.Inlet,
            ConnectionType.None,
            ConnectionType.Outlet,
            ConnectionType.None
        ]
    });
    wireDictionary.add(Tag_WireType_L_1W1, {
        sprite: "atlas",
        frame: 5,
        flow: [
            ConnectionType.None,
            ConnectionType.None,
            ConnectionType.Inlet,
            ConnectionType.Outlet
        ]
    });
    wireDictionary.add(Tag_WireType_L_1W2, {
        sprite: "atlas",
        frame: 2,
        flow: [
            ConnectionType.None,
            ConnectionType.None,
            ConnectionType.Outlet,
            ConnectionType.Inlet
        ]
    });
    wireDictionary.add(Tag_WireType_Modifier_Minus, {
        sprite: "atlas",
        frame: 8,
        flow: [
            ConnectionType.Both,
            ConnectionType.None,
            ConnectionType.Both,
            ConnectionType.None
        ],
        modifier: -1,
        placeholderFrame: 10
    });
    wireDictionary.add(Tag_WireType_Modifier_Plus, {
        sprite: "atlas",
        frame: 9,
        flow: [
            ConnectionType.Both,
            ConnectionType.None,
            ConnectionType.Both,
            ConnectionType.None
        ],
        modifier: 1,
        placeholderFrame: 11
    });
}

function registerSounds() {
    audio.register("bgm-menu", "sounds/bgm-menu.mp3", { channel: "bgm", loop: true });
    audio.register("bgm-gameplay", "sounds/bgm-gameplay.mp3", { channel: "bgm", loop: true });
    audio.register("sfx-rotate", "sounds/sfx-rotate.mp3", { channel: "sfx" });
    audio.register("sfx-pickup", "sounds/sfx-pickup.mp3", { channel: "sfx" });
    audio.register("sfx-place", "sounds/sfx-place.mp3", { channel: "sfx" });
    audio.register("sfx-button-click", "sounds/sfx-button-click.mp3", { channel: "sfx" });
}

k.loadRoot("./"); // A good idea for Itch.io publishing later
initializeWireDictionary();

registerSounds();
await audio.loadAll();

audio.setMuted("bgm", true);

k.scene(NAME_MainMenu, createMainMenuScene());
k.scene(NAME_Game, createGameScene());
k.go(NAME_MainMenu);