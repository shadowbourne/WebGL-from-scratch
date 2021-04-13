# WebGL-from-scratch
A sitting room scene made in WebGL entirely by hand at the most base level possible (no three.js, all models made by hand etc..)
  
In order to run the webgl program: open "CG.html" found under the "source_code" folder in chrome with the parameter "-allow-file-access-from-files".

If program is too slow or fast for the system, the parameter "fpsdelay" can be changed in line 2 of "CG.js" 
in order to increase / decrease delay between frame renders.

If there are problems with the resolution of the window, the "width" and "height" of the webgl canvas can be changed on line 9 of "CG.html".

In this project, the following scripts are imported and should be located in a subfolder called "lib" 1 layer up from the contents of "source_code" (for specifics inspect CG.html)
	"webgl-utils.js
	webgl-debug.js
	cuon-utils.js
	cuon-matrix.js
	gl-matrix.js"

Additionally are provided some textures for the program which are located and loaded from the folder "resources".
These may be changed as long as the resolutions match otherwise rendering problems may occur.

## Controls (as shown "in-game"):

### Camera Controls:

* ↑ ← ↓ → : look around.
* W, A, S, D, SPACE BAR, LEFT CTRL : Move camera (forwards, left, back, right, vertically up, vertically down).
* \- = : Decrease/increase the movement speed of the camera by 10%.
* '[   ]' : Decrease/increase the turning speed of the camera by 10%.
* 1, 2, 3, 4, 5, 6, 7, 8, 9, 0 : Move to preset camera view setups (0 resets camera to original position).
* N : Toggle camera being able to leave the room.
* B : Toggle walls and ceiling.
* G : Toggle background colour.

### Lighting and Rendering Controls:

* L : Toggle "Warmed Love" filter (default is on).
* M : Toggle Multitextured Rendering.
* J : Turn main lights off / on.
* H : Cycle through RGB light presets.
* P : Toggle Party Lights: Cycle Mode.
* O : Toggle Party Lights: Strobe Mode.
* F : Put out / Light Fire in Fireplace (sets logs on fire and toggles flickering fire).

### Animation Controls:

* C : Pull out / tuck in chairs.
* V : Collapse sofas (for when you want a solo chill night :) ).
* T : Hide / reveal mantleplace TV.
* Y : Power off / on rotating table.
