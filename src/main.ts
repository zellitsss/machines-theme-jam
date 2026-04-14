import kaplay from "kaplay";
import createGameScene from './scenes/game-scene';
import createMainMenuScene from './scenes/main-menu-scene';

const NAME_MainMenu = "main-menu";
const NAME_Game = "game";

const k = kaplay();

k.loadRoot("./"); // A good idea for Itch.io publishing later
k.loadSprite("pipe-straight", "sprites/pipe-straight.png");
k.loadSprite("pipe-l", "sprites/pipe-l.png");
k.loadSprite("pipe-gate", "sprites/pipe-gate.png");

k.scene(NAME_MainMenu, createMainMenuScene(k));
k.scene(NAME_Game, createGameScene(k));

k.go(NAME_Game);