import kaplay from "kaplay";
import createGameScene from './scenes/game-scene';
import createMainMenuScene from './scenes/main-menu-scene';
import {NAME_Game, NAME_MainMenu} from "./constants";

const k = kaplay();

k.loadRoot("./"); // A good idea for Itch.io publishing later

k.scene(NAME_MainMenu, createMainMenuScene(k));
k.scene(NAME_Game, createGameScene(k));

k.go(NAME_Game);