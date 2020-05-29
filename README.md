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
