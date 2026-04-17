import kaplay from "kaplay";
import createGameScene from './scenes/game-scene';
import createMainMenuScene from './scenes/main-menu-scene';
import {NAME_Game, NAME_MainMenu} from "./constants";
import {wireDictionary} from "./wire-dictionary";
import {ConnectionType} from "./types";

const k = kaplay({
    width: 960,
    height: 640,
    scale: 1,
    debug: true,
    debugKey: "`"
});

function initializeWireDictionary() {
    wireDictionary.add("wire-i", {
        sprite: "wire-i",
        flow: [
            ConnectionType.Both,
            ConnectionType.None,
            ConnectionType.Both,
            ConnectionType.None
        ]
    });
    wireDictionary.add("wire-l", {
        sprite: "wire-l",
        flow: [
            ConnectionType.None,
            ConnectionType.None,
            ConnectionType.Both,
            ConnectionType.Both
        ]
    });
    wireDictionary.add("wire-gate-start", {
        sprite: "wire-gate",
        flow: [
            ConnectionType.Outlet,
            ConnectionType.None,
            ConnectionType.None,
            ConnectionType.None
        ]
    });
    wireDictionary.add("wire-gate-end", {
        sprite: "wire-gate",
        flow: [
            ConnectionType.Inlet,
            ConnectionType.None,
            ConnectionType.None,
            ConnectionType.None
        ]
    });
    wireDictionary.add("wire-blocked", {
        sprite: "wire-blocked",
        flow: [
            ConnectionType.None,
            ConnectionType.None,
            ConnectionType.None,
            ConnectionType.None
        ]
    });
    wireDictionary.add("wire-i-1w", {
        sprite: "wire-i-1w",
        flow: [
            ConnectionType.Outlet,
            ConnectionType.None,
            ConnectionType.Inlet,
            ConnectionType.None
        ]
    });
    wireDictionary.add("wire-l-1w1", {
        sprite: "wire-l-1w1",
        flow: [
            ConnectionType.None,
            ConnectionType.None,
            ConnectionType.Inlet,
            ConnectionType.Outlet
        ]
    });
    wireDictionary.add("wire-l-1w2", {
        sprite: "wire-l-1w2",
        flow: [
            ConnectionType.None,
            ConnectionType.None,
            ConnectionType.Outlet,
            ConnectionType.Inlet
        ]
    });
    wireDictionary.add("wire-modifier", {
        sprite: "wire-modifier",
        flow: [
            ConnectionType.Both,
            ConnectionType.None,
            ConnectionType.Both,
            ConnectionType.None
        ]
    });
}

k.loadRoot("./"); // A good idea for Itch.io publishing later
initializeWireDictionary();
k.scene(NAME_MainMenu, createMainMenuScene(k));
k.scene(NAME_Game, createGameScene(k));

k.go(NAME_MainMenu);