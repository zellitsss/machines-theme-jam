import kaplay from "kaplay";
import createGameScene from './scenes/game-scene';
import createMainMenuScene from './scenes/main-menu-scene';

const NAME_MainMenu = "main-menu";
const NAME_Game = "game";

const k = kaplay();

k.loadRoot("./"); // A good idea for Itch.io publishing later
k.loadSprite("bean", "sprites/bean.png");

k.scene(NAME_MainMenu, createMainMenuScene(k));
k.scene(NAME_Game, createGameScene(k));

k.go(NAME_MainMenu);