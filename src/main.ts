import createGameScene from './scenes/game-scene';
import createMainMenuScene from './scenes/main-menu-scene';
import {
    k,
    LAYER_BACKGROUND,
    LAYER_GAME,
    LAYER_TRANSITION,
    LAYER_UI,
    NAME_Game,
    NAME_MainMenu,
    Tag_WireType_Blocked,
    Tag_WireType_End,
    Tag_WireType_I,
    Tag_WireType_I_1W,
    Tag_WireType_L,
    Tag_WireType_L_1W1,
    Tag_WireType_L_1W2,
    Tag_WireType_Modifier_Minus,
    Tag_WireType_Modifier_Plus,
    Tag_WireType_Start,
    Tag_WireType_T
} from "./constants";
import {wireDictionary} from "./wire-dictionary";
import {ConnectionType} from "./types";
import {audio} from "./core/audio";
import {loadProgress} from "./core/progress";

// @ts-ignore
const WavedashJS = await window.WavedashJS;
WavedashJS?.init({
    debug: false,
});
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
        frame: 12,
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
    wireDictionary.add(Tag_WireType_T, {
        sprite: "atlas",
        frame: 15,
        flow: [
            ConnectionType.None,
            ConnectionType.Both,
            ConnectionType.Both,
            ConnectionType.Both
        ]
    })
}

function registerSounds() {
    audio.register("bgm-menu", "sounds/bgm-menu.mp3", {channel: "bgm", loop: true});
    audio.register("bgm-gameplay", "sounds/bgm-gameplay.mp3", {channel: "bgm", loop: true});
    audio.register("sfx-rotate", "sounds/sfx-rotate-2.mp3", {channel: "sfx", defaultVolume: 0.5});
    audio.register("sfx-pickup", "sounds/sfx-pickup-2.mp3", {channel: "sfx", defaultVolume: 0.5});
    audio.register("sfx-place", "sounds/sfx-place-2.mp3", {channel: "sfx", defaultVolume: 0.5});
    audio.register("sfx-button-click", "sounds/sfx-button-2.mp3", {channel: "sfx", defaultVolume: 0.5});
    audio.register("sfx-win", "sounds/sfx-win-2.mp3", {channel: "sfx"});
}

k.loadRoot("./"); // A good idea for Itch.io publishing later

await k.loadSprite("hexagon", "sprites/hexagon.png");
// k.loadSprite("background", "sprites/Background.png", {
//     slice9: {
//         top: 232,
//         bottom: 232,
//         left: 217,
//         right: 380,
//         tileMode: "none"
//     }
// });
k.loadFont("Audiowide", "fonts/Audiowide-Regular.woff2");
k.loadFont("ZenDots", "fonts/ZenDots-Regular.woff2");

// Electric background shader
// Ported from "Procedural Electric Background Shader" by Yui Kinomoto (@arlez80), MIT License.
k.loadShader(
    "electricBg",
    null,
    `
    uniform float u_time;
    uniform vec3 u_background_rgb;
    uniform vec3 u_line_rgb;

    const float LINE_FREQ       = 9.56;
    const float HEIGHT          = 0.6;
    const float SPEED           = 0.8;
    const vec2  SCALE           = vec2(2.0, 16.0);

    vec4 frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {
        vec2 st = uv * SCALE;
        float shift = cos(floor(st.y));
        st.x += shift;

        float freq = clamp(cos(st.x * LINE_FREQ) * 3.0, 0.0, 1.0) * HEIGHT;
        float line = 1.0 - clamp(abs(freq - mod(st.y, 1.0)) * 11.0, 0.0, 1.0);

        // Kaplay passes Color as uniform3f with r,g,b in 0–255, not 0–1.
        vec3 bg = u_background_rgb / 255.0;
        vec3 ln = u_line_rgb / 255.0;

        return mix(
            vec4(bg, 1.0),
            vec4(ln, 1.0),
            line * mod(st.x - u_time * SPEED * abs(shift), 1.0)
        );
    }
`,
);

initializeWireDictionary();

registerSounds();
await audio.loadAll();

audio.setMuted("bgm", true);

k.setLayers([LAYER_BACKGROUND, LAYER_GAME, LAYER_UI, LAYER_TRANSITION], LAYER_GAME);

loadProgress();

k.scene(NAME_MainMenu, createMainMenuScene());
k.scene(NAME_Game, createGameScene());
k.go(NAME_MainMenu);