import kaplay from "kaplay";

export const CELL_SIZE = 128;
export const INVENTORY_CELL_SIZE = 96;
export const ROTATE_TWEEN_SEC = 0.25;
export const ROTATE_SCALE_PEAK = 0.9;
export const ROTATION_ANGLE_PER_STEP = 90;
export const NAME_MainMenu = "main-menu";
export const NAME_Game = "game";

export const LEFT_PANEL_RATIO = 1/4;
export const RIGHT_PANEL_RATIO = 1/4;
export const CENTER_PANEL_RATIO = 1/2;
export const TOP_PANEL_HEIGHT = 120;
export const MAIN_PANEL_PADDING = 20;
export const FOOTER_HEIGHT = 60;

export const DRAG_THRESHOLD = 16;

export const EVENT_WireClicked = "wireClicked";
export const EVENT_WireStartDragging = "wireStartDragging";
export const EVENT_WireEndDragging = "wireEndDragging";
export const EVENT_WireDraggingUpdate = "wireDraggingUpdate";

export const Tag_Wire = "wire";
export const Tag_WireType_Start = "wire-gate-start";
export const Tag_WireType_End = "wire-gate-end";
export const Tag_WireType_Modifier_Minus = "wire-modifier-minus";
export const Tag_WireType_Modifier_Plus = "wire-modifier-plus";
export const Tag_WireType_I = "wire-i";
export const Tag_WireType_L = "wire-l";
export const Tag_WireType_Blocked = "wire-blocked";
export const Tag_WireType_I_1W = "wire-i-1w";
export const Tag_WireType_L_1W1 = "wire-l-1w1";
export const Tag_WireType_L_1W2 = "wire-l-1w2";
export const Tag_Wire_Modifier_Label = "wire_modifier_label";
export const Tag_Wire_Ghost = "ghost";
export const Tag_Wire_Placeholder = "placeholder_wire";
export const Tag_Wire_Bg = "wire_Bg";
export const Tag_Wire_InGrid = "in_grid";
export const Tag_Wire_Visual = "wire_visual";
export const Tag_Placeholder = "placeholder";
export const Tag_InventoryPanel = "inventory_panel";
export const Tag_InventoryLabel = "inventory_label";
export const Tag_InventoryItem = "inventory_item";
export const Tag_InventoryItemSlot = "inventory_item_slot";

export const COLOR_Background = 0xefebe4;
export const COLOR_Active = 0x3858e5;
export const COLOR_Inactive = 0xb0bbd4;
export const COLOR_Negative = 0xf46926;
export const COLOR_Positive = 0x1aa482;
export const COLOR_Neutral = 0xc7c7c7;

export const TRAVEL_OFFSET = [
    {x: 0, y: -1},     // up
    {x: 1, y: 0},      // right
    {x: 0, y: 1},      // down
    {x: -1, y: 0}      // left
]

export const LAYER_BACKGROUND = "background";
export const LAYER_GAME = "game";
export const LAYER_UI = "ui";
export const LAYER_TRANSITION = "transition";

export const SIDEBAR_PADDING = 50;
export const ITEM_SLOT_PADDING = 10;
export const INVENTORY_TITLE_HEIGHT = 36;
export const INVENTORY_TITLE_PADDING = 10;
export const INVENTORY_ITEM_COUNT = 4;
export const INVENTORY_BORDER_HEIGHT = INVENTORY_CELL_SIZE * INVENTORY_ITEM_COUNT + ITEM_SLOT_PADDING * (INVENTORY_ITEM_COUNT + 1) + INVENTORY_TITLE_HEIGHT + INVENTORY_TITLE_PADDING * 2;
export const COUNT_TEXT_SIZE = 22;
export const CONTAINER_PADDING = 14;
export const INVENTORY_TITLE_TEXT = "INVENTORY";

export const TAG_CURRENT_MODIFIER_TEXT = "current_modifier_text";
export const TAG_TARGET_MODIFIER_TEXT = "target_modifier_text";

export const LEVEL_SELECTION_CLOSE_SIZE = 48;
export const LEVEL_SELECTION_ITEM_SIZE = 64;
export const LEVEL_SELECTION_PADDING = 8;
export const LEVEL_SELECTION_ITEM_COLS = 7;

export const HEX_TRANSITION_WIDTH = 221;
export const HEX_TRANSITION_HEIGHT = 256;

export const STORAGE_KEY_PROGRESS = "amper-sum:progress";

export const gameState = {
    won: false,
    levels: [] as string[],
    currentLevel: 0,
    highestUnlockedLevel: 0,
}

export const k = kaplay({
    width: 1280,
    height: 720,
    scale: 1,
    letterbox: true,
    debug: false,
    debugKey: "`",
    topMostOnlyActivated: true,
    canvas: document.getElementById("game-canvas") as HTMLCanvasElement,
    texFilter: "linear",
    fontFilter: "linear",
    pixelDensity: Math.min(devicePixelRatio, 2),
    background: "efebe4",
    global: false
});