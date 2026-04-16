import kaplay from "kaplay";
import createGameScene from './scenes/game-scene';
import createMainMenuScene from './scenes/main-menu-scene';
import {NAME_Game, NAME_MainMenu} from "./constants";

const k = kaplay({
    width: 960,
    height: 640,
    scale: 1,
    debug: true,
    debugKey: "`"
});

k.loadRoot("./"); // A good idea for Itch.io publishing later

k.scene(NAME_MainMenu, createMainMenuScene(k));
k.scene(NAME_Game, createGameScene(k));

k.go(NAME_MainMenu);