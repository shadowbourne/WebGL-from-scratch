// CHANGE THIS LINE TO CHANGE DELAY IN ms BETWEEN FRAME RENDERS V
var fpsdelay = 8;

//#region 
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'attribute vec4 a_Normal;\n' +        // Normal
  'attribute vec2 a_TexCoords;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_NormalMatrix;\n' +
  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_ProjMatrix;\n' +
  'varying vec4 v_Color;\n' +
  'varying vec3 v_Normal;\n' +
  'varying vec2 v_TexCoords;\n' +
  'varying vec3 v_Position;\n' +
  'void main() {\n' +
  '  gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;\n' +
  '  v_Position = vec3(u_ModelMatrix * a_Position);\n' +
  '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
  '  v_Color = a_Color;\n' + 
  '  v_TexCoords = a_TexCoords;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'uniform int u_MultiTexture;\n' +    // Texture enable/disable flag
  'uniform sampler2D u_Sampler0;\n' +
  'uniform sampler2D u_Sampler1;\n' +
  'uniform vec3 u_LightColor0;\n' +     // Light color
  'uniform vec3 u_LightPosition0;\n' +  // Position of the light source
  'uniform vec3 u_LightColor1;\n' +     // Light color
  'uniform vec3 u_LightPosition1;\n' +  // Position of the light source
  'uniform vec3 u_LightColor2;\n' +     // Light color
  'uniform vec3 u_LightPosition2;\n' +  // Position of the light source
  'uniform vec3 u_AmbientLight;\n' +   // Ambient light color
  'varying vec3 v_Normal;\n' +
  'varying vec3 v_Position;\n' +
  'varying vec4 v_Color;\n' +
  'varying vec2 v_TexCoords;\n' +
  'void main() {\n' +
   // Normalize the normal because it is interpolated and not 1.0 in length any more
    '  vec3 normal = normalize(v_Normal);\n' +
   // Calculate the light direction and make its length 1.
    '  vec3 lightDirection0 = normalize(u_LightPosition0 - v_Position);\n' +
    '  vec3 lightDirection1 = normalize(u_LightPosition1 - v_Position);\n' +
    '  vec3 lightDirection2 = normalize(u_LightPosition2 - v_Position);\n' +
    //Average light colour
    '  float lightDist0 = 1.0/(pow(length(u_LightPosition0 - v_Position),0.5));\n' +
    '  float lightDist1 = 1.0/(pow(length(u_LightPosition1 - v_Position),0.5));\n' +
    '  float lightDist2 = 1.0/(pow(length(u_LightPosition2 - v_Position),0.5));\n' +
    '  float totalLightDist = lightDist0 + lightDist1 + lightDist2;\n' +
    '  vec3 u_LightColor = (u_LightColor0/totalLightDist*lightDist0 + u_LightColor1/totalLightDist*lightDist1 + u_LightColor2/totalLightDist*lightDist2);\n' +
    // The dot product of the light direction and the orientation of a surface (the normal)
    '  float nDotL0 = max(dot(lightDirection0, normal), 0.0);\n' +
    '  float nDotL1 = max(dot(lightDirection1, normal), 0.0);\n' +
    '  float nDotL2 = max(dot(lightDirection2, normal), 0.0);\n' +
    '  float nDotL = (nDotL0+nDotL1+nDotL2)/2.4;\n' +
    // Calculate the final color from diffuse reflection and ambient reflection
    '  vec3 diffuse;\n' +
    '  if (u_MultiTexture == 0) {\n' +
    '     vec4 TexColor = texture2D(u_Sampler0, v_TexCoords);\n' +
    '     diffuse = u_LightColor * TexColor.rgb * nDotL * 1.2;\n' +
    '  } else if (u_MultiTexture == 1) {\n' +
    '     vec4 TexColor = texture2D(u_Sampler0, v_TexCoords) + texture2D(u_Sampler1, v_TexCoords);\n' +
    '     diffuse = u_LightColor * TexColor.rgb * nDotL * 0.65;\n' +
    '  } else if (u_MultiTexture == -1) {\n' +
    '     diffuse = u_LightColor * v_Color.rgb * nDotL;\n' +
    '  }\n' +
    '  vec3 ambient = u_AmbientLight * v_Color.rgb;\n' +
    '  gl_FragColor = vec4(diffuse + ambient, v_Color.a);\n' +
  '}\n';
//#endregion


//SET UP CLASSES
class ModelClass {
    modelMatrix = new Matrix4();
    rotationMatrix = new Matrix4();
    parentscaling = [];
    scaled = [];
    translated = [];
    rotated = [];
    children = [];
    textureNo = -1;
    type_of_model = "";
    constructor() {
        this.parentscaling = [1,1,1];
        this.translated = [0,0,0];
        this.scaled = [1,1,1];
        this.rotated = [0,0,0];
        this.rotationMatrix.elements = mat4.create();
    }
    scale(x,y,z) {
        this.scaled[0] *= x;
        this.scaled[1] *= y;
        this.scaled[2] *= z;
        var Rotation = quat.create();
        quat.fromEuler(Rotation,this.rotated[0],this.rotated[1],this.rotated[2]);
        mat4.fromRotationTranslationScale(this.modelMatrix.elements, Rotation, vec3.fromValues(this.translated[0]/this.parentscaling[0],this.translated[1]/this.parentscaling[1],this.translated[2]/this.parentscaling[2]), vec3.fromValues(this.scaled[0],this.scaled[1],this.scaled[2]));
        mat4.multiply(this.modelMatrix.elements,this.rotationMatrix.elements,this.modelMatrix.elements);
    }
    translate(x,y,z) {
        this.translated[0] += x;
        this.translated[1] += y;
        this.translated[2] += z;
        var Rotation = quat.create();
        quat.fromEuler(Rotation,this.rotated[0],this.rotated[1],this.rotated[2]);
        mat4.fromRotationTranslationScale(this.modelMatrix.elements, Rotation, vec3.fromValues(this.translated[0]/this.parentscaling[0],this.translated[1]/this.parentscaling[1],this.translated[2]/this.parentscaling[2]), vec3.fromValues(this.scaled[0],this.scaled[1],this.scaled[2]));
        mat4.multiply(this.modelMatrix.elements,this.rotationMatrix.elements,this.modelMatrix.elements);
    }

    rotate(x,y,z) {
        this.rotated[0] += x;
        this.rotated[1] += y;
        this.rotated[2] += z;
        var Rotation = quat.create();
        quat.fromEuler(Rotation,this.rotated[0],this.rotated[1],this.rotated[2]);
        mat4.fromRotationTranslationScale(this.modelMatrix.elements, Rotation, vec3.fromValues(this.translated[0]/this.parentscaling[0],this.translated[1]/this.parentscaling[1],this.translated[2]/this.parentscaling[2]), vec3.fromValues(this.scaled[0],this.scaled[1],this.scaled[2]));
        mat4.multiply(this.modelMatrix.elements,this.rotationMatrix.elements,this.modelMatrix.elements);
    }
    setChildrenPosition() {
        for (let i = 0; i < this.children.length; i++) {
            var Rotation = quat.create();
            quat.fromEuler(Rotation,this.rotated[0],this.rotated[1],this.rotated[2]);
            var temp = mat4.create();
            mat4.fromRotationTranslationScaleOrigin(temp, Rotation, vec3.fromValues(0,0,0), vec3.fromValues(this.scaled[0],this.scaled[1],this.scaled[2]), vec3.fromValues(this.translated[0]/this.parentscaling[0],this.translated[1]/this.parentscaling[1],this.translated[2]/this.parentscaling[2]));
            mat4.translate(temp,temp, vec3.fromValues(this.translated[0]/this.parentscaling[0],this.translated[1]/this.parentscaling[1],this.translated[2]/this.parentscaling[2]));
            mat4.multiply(this.children[i].rotationMatrix.elements, this.rotationMatrix.elements, temp); 
            this.children[i].translate(0,0,0);
            this.children[i].parentscaling[0] = this.scaled[0];
            this.children[i].parentscaling[1] = this.scaled[1];
            this.children[i].parentscaling[2] = this.scaled[2];
        }
    }
    createNewInstance(newInst) {
        newInst.parentscaling[0] = this.parentscaling[0];
        newInst.parentscaling[1] = this.parentscaling[1];
        newInst.parentscaling[2] = this.parentscaling[2];
        newInst.translate(this.translated[0],this.translated[1],this.translated[2]);
        newInst.rotate(this.rotated[0],this.rotated[1],this.rotated[2]);
        newInst.scale(this.scaled[0],this.scaled[1],this.scaled[2]);
        for (let i = 0; i < this.children.length; i++) {
            var child = new ModelClass();
            newInst.children.push(child);
            }
        newInst.setChildrenPosition();
        for (let i = 0; i < this.children.length; i++) {
            newInst.children[i].rotate(this.children[i].rotated[0],this.children[i].rotated[1],this.children[i].rotated[2]);
            newInst.children[i].scale(this.children[i].scaled[0],this.children[i].scaled[1],this.children[i].scaled[2]);
            newInst.children[i].translate(this.children[i].translated[0],this.children[i].translated[1],this.children[i].translated[2]);
            newInst.children[i].textureNo = this.children[i].textureNo;
            newInst.children[i].type_of_model = this.children[i].type_of_model;
            newInst.children[i].parentscaling[0] = this.scaled[0];
            newInst.children[i].parentscaling[1] = this.scaled[1];
            newInst.children[i].parentscaling[2] = this.scaled[2];
            }
    }
}
class ObjectClass {
    texBuffer = [];
    vertexBuffer = [];
    colorBuffer = [];
    normalBuffer = [];
    indexBuffer = [];
}

function makeTriangleClass() {
    TriangleClass = new ObjectClass();

    TriangleClass.texBuffer = new Float32Array([
      0.5, 1.0,    0.5, 1.0,   0.1, 0.1,   1.0, 0.1,  // v0-v1-v2-v3 front
      0.1, 1.0,    0.1, 0.1,   1.0, 0.1,   0.5, 1.0,  // v0-v3-v4-v5 right
      0.5, 1.0,    0.5, 1.0,   0.5, 1.0,   0.5, 1.0,  // v0-v5-v6-v1 up
      0.5, 1.0,    0.5, 1.0,   0.1, 0.1,   1.0, 0.1,  // v1-v6-v7-v2 left
      0.1, 0.1,    1.0, 0.1,   1.0, 1.0,   0.1, 1.0,  // v7-v4-v3-v2 down
      0.1, 0.1,    1.0, 0.1,   0.5, 1.0,   0.5, 1.0,   // v4-v7-v6-v5 back
    ]);

    TriangleClass.vertexBuffer = new Float32Array([   // Coordinates
        0.0001, 0.56, 0.0001,  -0.0001, 0.56, 0.0001,  -0.5,-0.56, 0.5,   0.5,-0.56, 0.5, // v0-v1-v2-v3 front
        0.0001, 0.56, 0.0001,  0.5,-0.56, 0.5,  0.5,-0.56,-0.5,  0.0001, 0.56, -0.0001, // v0-v3-v4-v5 right
        0.0001, 0.56, 0.0001,   0.0001, 0.56, -0.0001,  -0.0001, 0.56, -0.0001,  -0.0001, 0.56, 0.0001, // v0-v5-v6-v1 up
        -0.0001, 0.56, 0.0001,  -0.0001, 0.56, -0.0001,  -0.5,-0.56,-0.5,  -0.5,-0.56, 0.5, // v1-v6-v7-v2 left
        -0.5,-0.56,-0.5,   0.5,-0.56,-0.5,   0.5,-0.56, 0.5,  -0.5,-0.56, 0.5, // v7-v4-v3-v2 down
        0.5,-0.56,-0.5,  -0.5,-0.56,-0.5,  -0.0001, 0.56, -0.0001,  0.0001, 0.56, -0.0001,  // v4-v7-v6-v5 back
    ]);

    TriangleClass.colorBuffer = new Float32Array([    // Colors
        0.3, 0, 0.3,   0.3, 0, 0.3,   0.3, 0, 0.3,  0.3, 0, 0.3,     // v0-v1-v2-v3 front
        0.3, 0, 0.3,   0.3, 0, 0.3,   0.3, 0, 0.3,  0.3, 0, 0.3,     // v0-v3-v4-v5 right
        0.3, 0, 0.3,   0.3, 0, 0.3,   0.3, 0, 0.3,  0.3, 0, 0.3,     // v0-v5-v6-v1 up
        0.3, 0, 0.3,   0.3, 0, 0.3,   0.3, 0, 0.3,  0.3, 0, 0.3,     // v1-v6-v7-v2 left
        0.3, 0, 0.3,   0.3, 0, 0.3,   0.3, 0, 0.3,  0.3, 0, 0.3,     // v7-v4-v3-v2 down
        0.3, 0, 0.3,   0.3, 0, 0.3,   0.3, 0, 0.3,  0.3, 0, 0.3　    // v4-v7-v6-v5 back
    ]);

    TriangleClass.normalBuffer = new Float32Array([    // Normal
        // 0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
        // 1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
        // 0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
        // -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
        // 0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
        // 0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
        0.0, 0.5, 1.0,   0.0, 0.5, 1.0,   0.0, 0.5, 1.0,   0.0, 0.5, 1.0,  // v0-v1-v2-v3 front
        1.0, 0.5, 0.0,   1.0, 0.5, 0.0,   1.0, 0.5, 0.0,   1.0, 0.5, 0.0,  // v0-v3-v4-v5 right
        1.0, 1.0, 1.0,   -1.0, 1.0, -1.0,   1.0, 1.0, -1.0,   -1.0, 1.0, 1.0,  // v0-v5-v6-v1 up
        -1.0, 0.5, 0.0,  -1.0, 0.5, 0.0,  -1.0, 0.5, 0.0,  -1.0, 0.5, 0.0,  // v1-v6-v7-v2 left
        0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
        0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.5,-1.0,   0.0, 0.5,-1.0   // v4-v7-v6-v5 back
    ]);

    TriangleClass.indexBuffer = new Uint8Array([
        0, 1, 2,   0, 2, 3,    // front
        4, 5, 6,   4, 6, 7,    // right
        8, 9,10,   8,10,11,    // up
        12,13,14,  12,14,15,    // left
        16,17,18,  16,18,19,    // down
        20,21,22,  20,22,23     // back
    ]);
    return TriangleClass;
}
function makeCubeClass() {
    CubeClass = new ObjectClass();

    CubeClass.texBuffer = new Float32Array([
      1.0, 1.0,    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,  // v0-v1-v2-v3 front
      0.0, 1.0,    0.0, 0.0,   1.0, 0.0,   1.0, 1.0,  // v0-v3-v4-v5 right
      1.0, 0.0,    1.0, 1.0,   0.0, 1.0,   0.0, 0.0,  // v0-v5-v6-v1 up
      1.0, 1.0,    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,  // v1-v6-v7-v2 left
      0.0, 0.0,    1.0, 0.0,   1.0, 1.0,   0.0, 1.0,  // v7-v4-v3-v2 down
      0.0, 0.0,    1.0, 0.0,   1.0, 1.0,   0.0, 1.0   // v4-v7-v6-v5 back
    ]);

    CubeClass.vertexBuffer = new Float32Array([   // Coordinates
        0.5, 0.5, 0.5,  -0.5, 0.5, 0.5,  -0.5,-0.5, 0.5,   0.5,-0.5, 0.5, // v0-v1-v2-v3 front
        0.5, 0.5, 0.5,   0.5,-0.5, 0.5,   0.5,-0.5,-0.5,   0.5, 0.5,-0.5, // v0-v3-v4-v5 right
        0.5, 0.5, 0.5,   0.5, 0.5,-0.5,  -0.5, 0.5,-0.5,  -0.5, 0.5, 0.5, // v0-v5-v6-v1 up
        -0.5, 0.5, 0.5,  -0.5, 0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5,-0.5, 0.5, // v1-v6-v7-v2 left
        -0.5,-0.5,-0.5,   0.5,-0.5,-0.5,   0.5,-0.5, 0.5,  -0.5,-0.5, 0.5, // v7-v4-v3-v2 down
        0.5,-0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5, 0.5,-0.5,   0.5, 0.5,-0.5  // v4-v7-v6-v5 back
    ]);

    CubeClass.colorBuffer = new Float32Array([    // Colors
        0.3, 0, 0.3,   0.3, 0, 0.3,   0.3, 0, 0.3,  0.3, 0, 0.3,     // v0-v1-v2-v3 front
        0.3, 0, 0.3,   0.3, 0, 0.3,   0.3, 0, 0.3,  0.3, 0, 0.3,     // v0-v3-v4-v5 right
        0.3, 0, 0.3,   0.3, 0, 0.3,   0.3, 0, 0.3,  0.3, 0, 0.3,     // v0-v5-v6-v1 up
        0.3, 0, 0.3,   0.3, 0, 0.3,   0.3, 0, 0.3,  0.3, 0, 0.3,     // v1-v6-v7-v2 left
        0.3, 0, 0.3,   0.3, 0, 0.3,   0.3, 0, 0.3,  0.3, 0, 0.3,     // v7-v4-v3-v2 down
        0.3, 0, 0.3,   0.3, 0, 0.3,   0.3, 0, 0.3,  0.3, 0, 0.3　    // v4-v7-v6-v5 back
    ]);

    CubeClass.normalBuffer = new Float32Array([    // Normal
        0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
        1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
        0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
        -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
        0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
        0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
    ]);

    CubeClass.indexBuffer = new Uint8Array([
        0, 1, 2,   0, 2, 3,    // front
        4, 5, 6,   4, 6, 7,    // right
        8, 9,10,   8,10,11,    // up
        12,13,14,  12,14,15,    // left
        16,17,18,  16,18,19,    // down
        20,21,22,  20,22,23     // back
    ]);
    return CubeClass;
}
CubeClass = makeCubeClass();
TriangleClass = makeTriangleClass();

DarkColoredCubeColorBuffer = new Float32Array([    // Colors
    0.01, 0.01, 0.01,   0.01, 0.01, 0.01,   0.01, 0.01, 0.01,  0.01, 0.01, 0.01,     // v1-v1-v2-v3 front
    0.01, 0.01, 0.01,   0.01, 0.01, 0.01,   0.01, 0.01, 0.01,  0.01, 0.01, 0.01,     // v1-v3-v4-v5 right
    0.01, 0.01, 0.01,   0.01, 0.01, 0.01,   0.01, 0.01, 0.01,  0.01, 0.01, 0.01,     // v1-v5-v6-v1 up
    0.01, 0.01, 0.01,   0.01, 0.01, 0.01,   0.01, 0.01, 0.01,  0.01, 0.01, 0.01,     // v1-v6-v7-v2 left
    0.01, 0.01, 0.01,   0.01, 0.01, 0.01,   0.01, 0.01, 0.01,  0.01, 0.01, 0.01,     // v7-v4-v3-v2 down
    0.01, 0.01, 0.01,   0.01, 0.01, 0.01,   0.01, 0.01, 0.01,  0.01, 0.01, 0.01　    // v4-v7-v6-v5 back
]);
WarmedLightShadersColoredCubeColorBuffer = new Float32Array([    // Colors
    0.3, 0, 0.3,   0.3, 0, 0.3,   0.3, 0, 0.3,  0.3, 0, 0.3,     // v0-v1-v2-v3 front
    0.3, 0, 0.3,   0.3, 0, 0.3,   0.3, 0, 0.3,  0.3, 0, 0.3,     // v0-v3-v4-v5 right
    0.3, 0, 0.3,   0.3, 0, 0.3,   0.3, 0, 0.3,  0.3, 0, 0.3,     // v0-v5-v6-v1 up
    0.3, 0, 0.3,   0.3, 0, 0.3,   0.3, 0, 0.3,  0.3, 0, 0.3,     // v1-v6-v7-v2 left
    0.3, 0, 0.3,   0.3, 0, 0.3,   0.3, 0, 0.3,  0.3, 0, 0.3,     // v7-v4-v3-v2 down
    0.3, 0, 0.3,   0.3, 0, 0.3,   0.3, 0, 0.3,  0.3, 0, 0.3　    // v4-v7-v6-v5 back
]);
// CubeClass.colorBuffer = DarkColoredCubeColorBuffer;
//#region 

var SceneCenter = new ModelClass();
SceneCenter.translate(0,-2,0);

//LINK CHILDREN AND PARENTS
var SofaArea = new ModelClass();
SceneCenter.children.push(SofaArea);
var WallsandFloor_dummygroup = new ModelClass();
var WallsandCeiling =  new ModelClass();
var Floor_dummygroup =  new ModelClass();
SceneCenter.children.push(WallsandFloor_dummygroup);
WallsandFloor_dummygroup.children.push(Floor_dummygroup);
WallsandFloor_dummygroup.children.push(WallsandCeiling);

var ChairsandTable = new ModelClass();
SceneCenter.children.push(ChairsandTable);

var RandomObjects_dummygroup = new ModelClass();
var RandomObjects =  new ModelClass();
SceneCenter.children.push(RandomObjects);
RandomObjects.children.push(RandomObjects_dummygroup);
var Fireplace = new ModelClass();
var TV = new ModelClass();
var Painting = new ModelClass();
var Painting2 = new ModelClass();
RandomObjects.children.push(Fireplace);
RandomObjects.children.push(TV);
RandomObjects.children.push(Painting);
RandomObjects.children.push(Painting2);



// SceneCenter.scale(1,1,2);
SceneCenter.setChildrenPosition();
RandomObjects.setChildrenPosition();
WallsandFloor_dummygroup.setChildrenPosition();
var Floor = new ModelClass();
var Ceiling = new ModelClass();
var Wall1 = new ModelClass();
var Wall2 = new ModelClass();
var Wall3 = new ModelClass();
var Wall4 = new ModelClass();
Floor_dummygroup.children.push(Floor);
WallsandCeiling.children.push(Ceiling);
WallsandCeiling.children.push(Wall1);
WallsandCeiling.children.push(Wall2);
WallsandCeiling.children.push(Wall3);
WallsandCeiling.children.push(Wall4);
Floor_dummygroup.setChildrenPosition();
WallsandCeiling.setChildrenPosition();
Wall1.type_of_model = "cube";
Wall2.type_of_model = "cube";
Wall3.type_of_model = "cube";
Wall4.type_of_model = "cube";
Floor.type_of_model = "cube";
Ceiling.type_of_model = "cube";
Wall1.textureNo = 3;
Wall2.textureNo = 3;
Wall3.textureNo = 3;
Wall4.textureNo = 3;
Floor.textureNo = 5;
Ceiling.textureNo = 6;


Floor.scale(25,4,40);
Floor.translate(0,-2,0);

Ceiling.scale(40,2,25);
Ceiling.translate(0,9,0);
Ceiling.rotate(0,90,0);

Wall1.scale(2,15,40);
Wall2.scale(2,15,40);
Wall3.scale(25,15,2);
Wall4.scale(25,15,2);

Wall1.translate(13.5,1.0,0);
Wall2.translate(-13.5,1.0,0);
Wall3.translate(0,1.0,21);
Wall4.translate(0,1.0,-21);




// Chairs modelling
var Chair1 = new ModelClass();
// Additional Chairs set up
ChairsandTable.children.push(Chair1);
var Chair2 = new ModelClass();
ChairsandTable.children.push(Chair2);
var Chair3 = new ModelClass();
ChairsandTable.children.push(Chair3);
var Chair4 = new ModelClass();
ChairsandTable.children.push(Chair4);
var Table = new ModelClass();
ChairsandTable.children.push(Table);
var Lamp = new ModelClass();
ChairsandTable.children.push(Lamp);
ChairsandTable.translate(0,0,-16.5);
ChairsandTable.setChildrenPosition();



// Making the initial chair model
var chairBase = new ModelClass();
var chairBack = new ModelClass();
var chairTop = new ModelClass();
var chairSeat = new ModelClass();
var chairSeatBack = new ModelClass();


Chair1.children.push(chairBase);
Chair1.children.push(chairBack);
Chair1.children.push(chairTop);
Chair1.children.push(chairSeat);
// Chair1.children.push(chairSeatBack);

var chairLeg1 = new ModelClass();
var chairLeg2 = new ModelClass();
var chairLeg3 = new ModelClass();
var chairLeg4 = new ModelClass();

Chair1.children.push(chairLeg1);
Chair1.children.push(chairLeg2);
Chair1.children.push(chairLeg3);
Chair1.children.push(chairLeg4);

// ORGINAL Chair translation and rotation section

Chair1.translate(-1.9,1.98,3);
Chair1.rotate(0,180,0);

Chair1.setChildrenPosition();


chairBack.translate(0,1.375,-0.75);
chairBack.scale(2,2.35,0.5);
chairBack.textureNo = 1;
chairBack.type_of_model = "cube";

chairBase.scale(2,0.5,2);
chairBase.textureNo = 1;
chairBase.type_of_model = "cube";

chairTop.scale(2,0.9,0.5)
chairTop.translate(0,(1.375+2.35/2+0.56*0.9),-0.75);
chairTop.textureNo = 1;
chairTop.type_of_model = "pyramid";

chairSeat.translate(0,0.265,0.25);
chairSeat.scale(1.75,0.03,1.25);
chairSeat.textureNo = 2;
chairSeat.type_of_model = "cube";

chairSeatBack.translate();
chairSeatBack.scale(2,0.5,2);
chairSeatBack.textureNo = 2;
chairSeatBack.type_of_model = "cube";

chairLeg1.scale(0.5, 2.1, 0.5);
chairLeg2.scale(0.5, 2.1, 0.5);
chairLeg3.scale(0.5, 2.1, 0.5);
chairLeg4.scale(0.5, 2.1, 0.5);
chairLeg1.translate(1.75/2,-0.88-0.05,1.75/2);
chairLeg2.translate(-1.75/2,-0.88-0.05,1.75/2);
chairLeg3.translate(-1.75/2,-0.88-0.05,-1.75/2);  
chairLeg4.translate(1.75/2,-0.88-0.05,-1.75/2);
chairLeg1.textureNo = 0;
chairLeg2.textureNo = 0;
chairLeg3.textureNo = 0;
chairLeg4.textureNo = 0;
chairLeg1.type_of_model = "cube";
chairLeg2.type_of_model = "cube";
chairLeg3.type_of_model = "cube";
chairLeg4.type_of_model = "cube";
// OTHER Chair translation and rotation section (Translation is relative to ORIGINAL CHAIR to move all chairs, move ORIGINAL above))


Chair2.translate(3.8,0,0);
Chair3.translate(6.9,0,-3);
Chair3.rotate(0,90,0);
Chair4.translate(-3.1,0,-3);
Chair4.rotate(0,-90,0);

var tempy = 0;

// Make Additional chairs into chairs
Chair1.createNewInstance(Chair2);
Chair1.createNewInstance(Chair3);
Chair1.createNewInstance(Chair4);

var tableTop = new ModelClass();
var tableTop2 = new ModelClass();
var tableLeg1 = new ModelClass();
var tableSubLeg2 = new ModelClass();
var tableSubLeg3 = new ModelClass();
var tableSubLeg4 = new ModelClass();
var tableSubLeg5 = new ModelClass();

Table.children.push(tableTop);
Table.children.push(tableTop2);
Table.children.push(tableLeg1);
Table.children.push(tableSubLeg2);
Table.children.push(tableSubLeg3);
Table.children.push(tableSubLeg4);
Table.children.push(tableSubLeg5);

//Table translation and rotation section
Table.translate(0,1.25,0);

Table.setChildrenPosition();

tableTop.scale(10,1.15,6);
tableTop2.scale(10,0.12,6);
tableTop.translate(0,0.85+0.25,0);
tableTop2.translate(0,0.882+1.2*0.56+0.25,0);
tableTop.rotate(180,0,0);
tableTop.textureNo = 1;
tableTop2.textureNo = 1;
tableTop.type_of_model = "pyramid";
tableTop2.type_of_model = "cube";

tableLeg1.scale(1.5, 2.5, 1.5);
tableSubLeg2.scale(0.85, 2.4, 0.85);
tableSubLeg3.scale(0.85, 2.4, 0.85);
tableSubLeg4.scale(0.85, 2.4, 0.85);
tableSubLeg5.scale(0.85, 2.4, 0.85);
tableSubLeg2.rotate(-45,90,0);
tableSubLeg3.rotate(-45,0,0);
tableSubLeg4.rotate(-45,180,0);
tableSubLeg5.rotate(-45,270,0);
// tableLeg1.translate();
tableSubLeg2.translate(1.0,-1,0);
tableSubLeg3.translate(0,-1,1.0);  
tableSubLeg4.translate(0,-1,-1.0);
tableSubLeg5.translate(-1.0,-1,0);
tableLeg1.textureNo = 0;
tableSubLeg2.textureNo = 0;
tableSubLeg3.textureNo = 0;
tableSubLeg4.textureNo = 0;
tableSubLeg5.textureNo = 0;
tableLeg1.type_of_model = "cube";
tableSubLeg2.type_of_model = "cube";
tableSubLeg3.type_of_model = "cube";
tableSubLeg4.type_of_model = "cube";
tableSubLeg5.type_of_model = "cube";

//LAMP
var lampStand = new ModelClass();
Lamp.children.push(lampStand);
var lampBase = new ModelClass();
Lamp.children.push(lampBase);
var lampBaseRing = new ModelClass();
Lamp.children.push(lampBaseRing);
var lampShadeWall0 = new ModelClass();
Lamp.children.push(lampShadeWall0);
var lampShadeWall1 = new ModelClass();
Lamp.children.push(lampShadeWall1);
var lampShadeWall2 = new ModelClass();
Lamp.children.push(lampShadeWall2);
var lampShadeWall3 = new ModelClass();
Lamp.children.push(lampShadeWall3);
Lamp.translate(0,4.1,0);
Lamp.setChildrenPosition();
lampStand.scale(0.35, 2, 0.35);
lampStand.textureNo = 0;
lampStand.type_of_model = "cube";
lampShadeWall0.scale(1.4, 1.6, 0.00);
lampShadeWall0.translate(0, 1.05, 0.7);
lampShadeWall0.textureNo = 4;
lampShadeWall0.type_of_model = "cube";
lampShadeWall1.scale(1.4, 1.6, 0.00);
lampShadeWall1.translate(0, 1.05, -0.7);
lampShadeWall1.textureNo = 4;
lampShadeWall1.type_of_model = "cube";
lampShadeWall2.scale(0.00, 1.6, 1.4);
lampShadeWall2.translate(0.7, 1.05, 0);
lampShadeWall2.textureNo = 4;
lampShadeWall2.type_of_model = "cube";
lampShadeWall3.scale(0.00, 1.6, 1.4);
lampShadeWall3.translate(-0.7, 1.05, 0);
lampShadeWall3.textureNo = 4;
lampShadeWall3.type_of_model = "cube";
lampBaseRing.scale(0.40, 0.1, 0.40);
lampBaseRing.translate(0,-0.59,0);
lampBaseRing.textureNo = 2;
lampBaseRing.type_of_model = "cube";
lampBase.scale(0.9, 0.5, 0.9);
lampBase.translate(0,-.7,0);
lampBase.textureNo = 0;
lampBase.type_of_model = "pyramid";


//RANDOM OBJECTS SECTION

var StandUpLamp = new ModelClass();
SofaArea.children.push(StandUpLamp);
var Sofa = new ModelClass();
SofaArea.children.push(Sofa);
var Sofa1 = new ModelClass();
SofaArea.children.push(Sofa1);
var Sofa2 = new ModelClass();
SofaArea.children.push(Sofa2);
var CoffeeTable = new ModelClass();
SofaArea.children.push(CoffeeTable);
var Sofa1Cover = new ModelClass();
SofaArea.children.push(Sofa1Cover);
var Sofa2Cover = new ModelClass();
SofaArea.children.push(Sofa2Cover);

SofaArea.translate(0,0,5);
SofaArea.setChildrenPosition();

CoffeeTable.translate(0,-0.1,5);
Table.createNewInstance(CoffeeTable);   
CoffeeTable.children[0].scale(0.4,1,0.6666);
CoffeeTable.children[1].scale(0.4,1,0.6666);
CoffeeTable.children[0].translate(0,-0.95,0);
CoffeeTable.children[1].translate(0,-0.95,0);
CoffeeTable.children[0].textureNo = [1,4];
CoffeeTable.children[1].textureNo = 4;
CoffeeTable.children[2].scale(1,0.75,1);
CoffeeTable.children[2].translate(0,-0.31,0);

CoffeeTable.children[3].scale(0.85,0.75,0.85);
CoffeeTable.children[4].scale(0.85,0.75,0.85);
CoffeeTable.children[5].scale(0.85,0.75,0.85);
CoffeeTable.children[6].scale(0.85,0.75,0.85);
var OrnamentHolder = new ModelClass();
var SpinningOrnament = new ModelClass();
CoffeeTable.children.push(SpinningOrnament);
CoffeeTable.children.push(OrnamentHolder);
CoffeeTable.setChildrenPosition();
SpinningOrnament.scale(0.5,0.5,0.5);
SpinningOrnament.rotate(45,0,35);
SpinningOrnament.translate(0,1.63,0);
SpinningOrnament.textureNo = 5;
SpinningOrnament.type_of_model = "cube";
OrnamentHolder.scale(0.7,0.21,0.7);
// OrnamentHolder.rotate(45,0,35);
OrnamentHolder.translate(0,1,0);
OrnamentHolder.textureNo = 3;
OrnamentHolder.type_of_model = "pyramid";


StandUpLamp.translate(6.44,-3.1, -0.5);
Lamp.createNewInstance(StandUpLamp);
StandUpLamp.children[0].scale(1,2.3,1);
StandUpLamp.children[0].translate(0,1.5, 0);
StandUpLamp.children[1].scale(1.3,2.3,1.3);
StandUpLamp.children[1].translate(0,-0.05,0);
StandUpLamp.children[2].translate(0,0.09,0);
StandUpLamp.children[3].translate(0,2.8, 0);
StandUpLamp.children[4].translate(0,2.8, 0);
StandUpLamp.children[5].translate(0,2.8, 0);
StandUpLamp.children[6].translate(0,2.8, 0);

var sofaCushion0 = new ModelClass();
var sofaCushion1= new ModelClass();
var sofaBack = new ModelClass();
var sofaBackTop = new ModelClass();
var sofaBackBottom = new ModelClass();
var sofaArm0 = new ModelClass();
var sofaArm1 = new ModelClass();
var Sofastand = new ModelClass();

Sofa.children.push(sofaCushion0);
Sofa.children.push(sofaCushion1);
Sofa.children.push(sofaBack);
Sofa.children.push(sofaBackTop);
Sofa.children.push(sofaBackBottom);
Sofa.children.push(sofaArm0);
Sofa.children.push(sofaArm1);
Sofa.children.push(Sofastand);

sofaCushion0.textureNo = 4;
sofaCushion1.textureNo = 4;
sofaBack.textureNo = 4;
sofaBackTop.textureNo = 4;
sofaBackBottom.textureNo = 0;
sofaArm0.textureNo = 0;
sofaArm1.textureNo = 0;
sofaCushion0.type_of_model = "cube";
sofaCushion1.type_of_model = "cube";
sofaBack.type_of_model = "cube";
sofaBackTop.type_of_model = "pyramid";
sofaBackBottom.type_of_model = "cube";
sofaArm0.type_of_model = "cube";
sofaArm1.type_of_model = "cube";
Sofastand.textureNo = [3,4];
Sofastand.type_of_model = "cube";


sofaCushion0.scale(2.5,0.90,1.4);
sofaCushion1.scale(2.5,0.90,1.4);
sofaCushion0.translate(-1.2504,0.75,-0.55);
sofaCushion1.translate(1.2504,0.75,-0.55);
sofaArm0.scale(0.7,1.9,1.5+0.74);
sofaArm0.translate(-1.2504-1.25-0.35,0.95,-0.87);
sofaArm1.scale(0.7,1.9,1.5+0.74);
sofaArm1.translate(1.2504+1.25+0.35,0.95,-0.87);
sofaBack.scale(5.0008,1.6,0.74);
sofaBack.translate(0,0.8+0.3,-1.25-0.37);
sofaBackTop.scale(5.0008,2.3*0.4,0.74);
sofaBackTop.translate(0,2.416,-1.25-0.37);
sofaBackBottom.scale(0.3,5.0008,0.74+1.5);
sofaBackBottom.rotate(0,0,90);
sofaBackBottom.translate(0,0.15,-0.87);
Sofastand.scale(3.1,0.2,7.55);
Sofastand.rotate(0,90,0);
Sofastand.translate(0,-0.02,-1.25-0.37+0.75);
Sofa.setChildrenPosition();


Sofa1.rotate(0,90,0);
Sofa2.rotate(0,-90,0);
Sofa1.translate(-5.8,0,1.12+4.5);
Sofa2.translate(5.8,0,1.12+4.5);

Sofa.createNewInstance(Sofa1);
Sofa.createNewInstance(Sofa2);


Sofa1.children[7].textureNo = 2;
Sofa2.children[7].textureNo = 2;

Sofa1Cover.translate(-8.2,-0.101,1.12+4.5);
var Sofa1Covercube = new ModelClass();
Sofa1Cover.children.push(Sofa1Covercube);
Sofa1Cover.setChildrenPosition();
Sofa1Covercube.scale(6,0.2,8);
Sofa1Covercube.textureNo = 5;
Sofa1Covercube.type_of_model = "cube";

Sofa2Cover.translate(+8.1,-0.101,1.12+4.5);
var Sofa2Covercube = new ModelClass();
Sofa2Cover.children.push(Sofa2Covercube);
Sofa2Cover.setChildrenPosition();
Sofa2Covercube.scale(6,0.2,8);
Sofa2Covercube.textureNo = 5;
Sofa2Covercube.type_of_model = "cube";

Sofa1Cover.children.push(Sofa1.children[7]);
Sofa2Cover.children.push(Sofa2.children[7]);
Sofa1.children.pop();
Sofa2.children.pop();

var fireplaceWall0 = new ModelClass();
var fireplaceWall1 = new ModelClass();
var fireplaceWall2 = new ModelClass();
var fireplaceBottom = new ModelClass();
var fireplaceTopCover = new ModelClass();
var fireplacePyramid = new ModelClass();
var fireplacePyramidTop = new ModelClass();
Fireplace.children.push(fireplaceWall0);
Fireplace.children.push(fireplaceWall1);
Fireplace.children.push(fireplaceWall2);
Fireplace.children.push(fireplaceBottom);
Fireplace.children.push(fireplaceTopCover);
Fireplace.children.push(fireplacePyramid);
Fireplace.children.push(fireplacePyramidTop);


var fireplaceTV = new ModelClass();
var fireplaceTVside0 = new ModelClass();
var fireplaceTVside1 = new ModelClass();
var fireplaceTVside2 = new ModelClass();
var fireplaceTVside3 = new ModelClass();
var fireplaceTVbutton = new ModelClass();
TV.children.push(fireplaceTV);
TV.children.push(fireplaceTVside0);
TV.children.push(fireplaceTVside1);
TV.children.push(fireplaceTVside2);
TV.children.push(fireplaceTVside3);
TV.children.push(fireplaceTVbutton);
TV.translate(0,6.2,16.75);
TV.setChildrenPosition();

fireplaceTV.textureNo = 10;
fireplaceTV.type_of_model = "cube";
fireplaceTVside0.textureNo = 3;
fireplaceTVside0.type_of_model = "cube";
fireplaceTVside1.textureNo = 3;
fireplaceTVside1.type_of_model = "cube";
fireplaceTVside2.textureNo = 3;
fireplaceTVside2.type_of_model = "cube";
fireplaceTVside3.textureNo = 3;
fireplaceTVside3.type_of_model = "cube";
fireplaceTVbutton.textureNo = 2;
fireplaceTVbutton.type_of_model = "cube";

fireplaceTVbutton.translate(-1.1,-0.725,-0.077);
fireplaceTVside0.translate(0,0.725,0);
fireplaceTVside1.translate(1.25,0,0);
fireplaceTVside2.translate(0,-0.725,0);
fireplaceTVside3.translate(-1.25,0,0);
fireplaceTV.translate(0,0,0);
fireplaceTVbutton.scale(0.05,0.05,0.04);
fireplaceTVside0.scale(2.4,0.1,0.15);
fireplaceTVside1.scale(0.1,1.55,0.15);
fireplaceTVside2.scale(2.4,0.1,0.15);
fireplaceTVside3.scale(0.1,1.55,0.15);  
fireplaceTV.scale(2.4,1.35,0.05);




var log0 = new ModelClass();
var log1 = new ModelClass();
var log2 = new ModelClass();
// var log3 = new ModelClass();
// var log4 = new ModelClass();
// var log5 = new ModelClass();
// var log6 = new ModelClass();
Fireplace.children.push(log0);
Fireplace.children.push(log1);
Fireplace.children.push(log2);
// Fireplace.children.push(log3);
// Fireplace.children.push(log4);
// Fireplace.children.push(log5);
// Fireplace.children.push(log6);

Fireplace.translate(0,0,18.3);
Fireplace.setChildrenPosition();

fireplaceBottom.scale(3,0.2,3);
fireplaceTopCover.scale(3,4.5,0.4);
fireplaceTopCover.translate(0,5.75,-1.3);
fireplacePyramidTop.scale(5.5,0.2,4.5);
fireplacePyramidTop.translate(0,4.67,0);
fireplacePyramid.scale(5.5,0.6,4.5);
fireplacePyramid.rotate(180,0,0);
fireplacePyramid.translate(0,4.25,0);
fireplaceWall0.scale(0.4,8,3);
fireplaceWall1.scale(3.8,8,0.4);
fireplaceWall2.scale(0.4,8,3);
fireplaceBottom.translate(0,0.1,0);
fireplaceWall0.translate(0.2+1.5,4,0);
fireplaceWall1.translate(0,4,0.2+1.5);
fireplaceWall2.translate(-1.7,4,0);
fireplaceWall0.textureNo = [1,3];
fireplaceWall0.type_of_model = "cube";
fireplaceWall1.textureNo = 3;
fireplaceWall1.type_of_model = "cube";
fireplaceWall2.textureNo = [1,3];
fireplaceWall2.type_of_model = "cube";
fireplaceBottom.textureNo = 3;
fireplaceBottom.type_of_model = "cube";
fireplaceTopCover.textureNo = [1,3];
fireplaceTopCover.type_of_model = "cube";
fireplacePyramid.textureNo = 0;
fireplacePyramid.type_of_model = "pyramid";
fireplacePyramidTop.textureNo = 0;
fireplacePyramidTop.type_of_model = "cube";


log0.scale(0.4,1.6,0.4);
log0.translate(0.2,0.70,-0.4);
log0.rotate(80,50,10);
log1.scale(0.4,1.6,0.4);
log1.translate(0.8,0.5,-0.4);
log1.rotate(90,10,0);
log2.scale(0.4,1.6,0.4);
log2.translate(-0.15,0.5,0.3);
log2.rotate(90,-100,0);
// log3.scale(0.4,1.6,0.4);
// log3.translate(0,0.68,0);
// log3.rotate(80,40,9);
// log4.scale(0.4,1.6,0.4);
// log4.translate(0,0.68,0);
// log4.rotate(80,40,9);
// log5.scale(0.4,1.6,0.4);
// log5.translate(0,0.68,0);
// log5.rotate(80,40,9);
// log6.scale(0.4,1.6,0.4);
// log6.translate(0,0.68,0);
// log6.rotate(80,40,9);



log0.textureNo = [0,7];
log0.type_of_model = "cube";
log1.textureNo = [0,7];
log1.type_of_model = "cube";
log2.textureNo = [0,7];
log2.type_of_model = "cube";
// log3.textureNo = [0,7];
// // log3.type_of_model = "cube";
// log4.textureNo = 0;
// // log4.type_of_model = "cube";
// log5.textureNo = 0;
// // log5.type_of_model = "cube";
// log6.textureNo = 0;
// // log6.type_of_model = "cube";


var Paintingcanvas = new ModelClass();
var Paintingside0 = new ModelClass();
var Paintingside1 = new ModelClass();
var Paintingside2 = new ModelClass();
var Paintingside3 = new ModelClass();
Painting.children.push(Paintingcanvas);
Painting.children.push(Paintingside0);
Painting.children.push(Paintingside1);
Painting.children.push(Paintingside2);
Painting.children.push(Paintingside3);
// Painting.translate(0,0,0);
Painting.setChildrenPosition();

Paintingcanvas.textureNo = 8;
Paintingcanvas.type_of_model = "cube";
Paintingside0.textureNo = 0;
Paintingside0.type_of_model = "cube";
Paintingside1.textureNo = 0;
Paintingside1.type_of_model = "cube";
Paintingside2.textureNo = 0;
Paintingside2.type_of_model = "cube";
Paintingside3.textureNo = 0;
Paintingside3.type_of_model = "cube";

Paintingside0.translate(0,1.9,0);
Paintingside1.translate(3.3,0,0);
Paintingside2.translate(0,-1.9,0);
Paintingside3.translate(-3.3,0,0);
Paintingcanvas.translate(0,0,0.05);
Paintingside0.scale(6.4,0.2,0.15);
Paintingside1.scale(4,0.2,0.15);
Paintingside1.rotate(0,0,90);
Paintingside2.scale(6.4,0.2,0.15);
Paintingside3.scale(4,0.2,0.15);  
Paintingside3.rotate(0,0,90);
Paintingcanvas.scale(6.4,3.6,0.05);

Painting2.translate(-12,4.4,0);
Painting2.rotate(0,-90,0);
Painting.createNewInstance(Painting2);
Painting2.children[0].textureNo = 9;
Painting.translate(12,4.4,0);
Painting.rotate(0,90,0);
Painting.setChildrenPosition();





//#endregion

//INITIALISE PARAMETERS AND VIEW MATRICES
//SET REGION IN WHICH CAMERA CAN MOVE (CURRENTLY THE ROOM LIMITS (FLOOR SIZE -1))
var max_x = 11;
var max_z = 18.5;
var max_y = 5.8;
var min_y = 0;

var RESTRICT_CAMERA = 1;
//SET INITIAL CAMERA MOVING STEPS
var ANGLE_STEP = 1.0;
var DISTANCE_STEP = 0.3;
//SET STARTING CAMERA POSITION
var view_x;
var view_y;
var view_z;
var x_rot;
var y_rot;
view_x = 0, view_y = -5.45125683630685, view_z = 16.557704454931176;
x_rot = 180;
y_rot = 10.577670024104227;
var rotationVector = vec3.fromValues(x_rot,y_rot,1);

var togglebackgroundcolor = 1;
var togglewalls = 1;
var hidetv = 0;
var tablespin = 1;
var tvtranslation = 0;
var collapsesofas = 0;
var sofatranslation = 0.0;
var pulloutchairs = 0;
var chairtranslation = 0.0;
//LIGHTING VARIABLES
//APPLY WARMED LOVE SHADER FILTERING
var warmedloveshadowfilter = 1;
var lights = 1;
var basic_light_color_mode = -1;
var party = 0;
var multitex = 1;
var fireplacelighting = 1;
var Light0_rgb = [255/255, 237/255, 184/255];
var Light1_rgb = [255/255, 214/255, 143/255];
var Light0_rgb_original = [255/255, 237/255, 184/255];
var Light1_rgb_original = [255/255, 214/255, 143/255];
var Light2_rgb = [255/255, 114/255, 143/255];
var firetemp1 = 0;
var firetemp2 = 0;


//INITIALISE VIEW MATRICES
var viewMatrix = new Matrix4();  // The view matrix
var projMatrix = new Matrix4();  // The projection matrix
var g_normalMatrix = new Matrix4();  // Coordinate transformation matrix for normals

function main() {

    // Retrieve <canvas> element
    var canvas = document.getElementById('webgl');
    // Get the rendering context for WebGL
    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }
    // Set clear color and enable hidden surface removal
    gl.clearColor(0.99,0.99,0.99, 1.0);
    gl.enable(gl.DEPTH_TEST);

    // Clear color and depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Get the storage locations of uniform attributes

    var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
    var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
    var u_LightColor0 = gl.getUniformLocation(gl.program, 'u_LightColor0');
    var u_LightColor1 = gl.getUniformLocation(gl.program, 'u_LightColor1');
    var u_LightColor2 = gl.getUniformLocation(gl.program, 'u_LightColor2');
    var u_LightPosition0 = gl.getUniformLocation(gl.program, 'u_LightPosition0');
    var u_LightPosition1 = gl.getUniformLocation(gl.program, 'u_LightPosition1');
    var u_LightPosition2 = gl.getUniformLocation(gl.program, 'u_LightPosition2');
    var u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
    var u_MultiTexture = gl.getUniformLocation(gl.program, 'u_MultiTexture');
    // Trigger using lighting or not
    // var u_isLighting = gl.getUniformLocation(gl.program, 'u_isLighting');   ||!u_isLighting 

    if (!u_ModelMatrix || !u_ViewMatrix || !u_NormalMatrix ||
        !u_ProjMatrix || !u_LightColor0 || !u_LightPosition0 || !u_LightColor1 || !u_LightPosition1 || !u_LightColor2 || !u_LightPosition2 || !u_AmbientLight || !u_MultiTexture) { 
        console.log('Failed to Get the storage locations of u_NormalMatrix, u_LightColor0, u_LightColor1, u_LightColor2, u_LightPosition0, u_LightPosition1,u_LightPosition2, u_AmbientLight, u_ModelMatrix, u_ViewMatrix, u_MultiTexture and/or u_ProjMatrix');
        return;
    }

    var u_Sampler = gl.getUniformLocation(gl.program, "u_Sampler0");
    if (!u_Sampler) { 
      console.log('Failed to get the storage location for texture map enable flag');
      return;
    }
    // Get the storage location of u_Sampler0 and u_Sampler1
    var u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
    var u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
    if (!u_Sampler0 || !u_Sampler1) {
      console.log('Failed to get the storage location of u_Sampler\'s');
      return false;
    }
    if (!initTextures(gl)) {
        console.log('Failed to intialize the texture.');
        return;
      }
    //Set the light color
    gl.uniform3f(u_LightColor0, Light0_rgb[0], Light0_rgb[1], Light0_rgb[2]);
    // Set the light direction (in the world coordinate)
    gl.uniform3f(u_LightPosition0, 6.44, 2.8 , 4.5);
    gl.uniform3f(u_LightColor1, Light1_rgb[0], Light1_rgb[1], Light1_rgb[2]);
    // Set the light direction (in the world coordinate)
    gl.uniform3f(u_LightPosition1, -0.4, 3.1, -16.6);
    gl.uniform3f(u_LightColor2, Light2_rgb[0], Light2_rgb[1], Light2_rgb[2]);
    // Set the light direction (in the world coordinate)
    gl.uniform3f(u_LightPosition2, 0, 0.1, 18);
    // Set the ambient light
    gl.uniform3f(u_AmbientLight, 0.2, 0.2, 0.2);



    projMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);
    // Pass the model, view, and projection matrix to the uniform variable respectively
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
    gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
    // Prevent arrow keys and space from scrolling
    window.addEventListener("keydown", function(e) {
        if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
            e.preventDefault();
        }
    }, false);
    document.onkeydown = function(ev){
        keydown(ev,gl, u_LightColor0, u_LightColor1, u_LightColor2);
    };
    setTimeout(() => { drawloop(gl, u_ModelMatrix, u_NormalMatrix, u_ViewMatrix, u_Sampler0, u_Sampler1, u_MultiTexture, u_LightColor0 , u_LightColor1, u_LightColor2); }, 2000);
}

function drawloop(gl, u_ModelMatrix, u_NormalMatrix, u_ViewMatrix, u_Sampler0, u_Sampler1, u_MultiTexture, u_LightColor0 , u_LightColor1, u_LightColor2) {
    setInterval(() => { draw(gl, u_ModelMatrix, u_NormalMatrix, u_ViewMatrix, u_Sampler0, u_Sampler1, u_MultiTexture, u_LightColor0 , u_LightColor1, u_LightColor2); }, fpsdelay );
}

function keydown(ev,gl, u_LightColor0, u_LightColor1, u_LightColor2) {
    rotationVector = vec3.fromValues(0,0,-1);
    vec3.rotateX(rotationVector, rotationVector, vec3.fromValues(0,0,0), -y_rot/180*Math.PI);
    vec3.rotateY(rotationVector, rotationVector, vec3.fromValues(0,0,0), -x_rot/180*Math.PI);
    sidewaysVector = vec3.create();
    vec3.cross(sidewaysVector, rotationVector, vec3.fromValues(0,1,0));
    switch (ev.keyCode) {
        case 40: // Up arrow key -> the positive rotation of arm1 around the y-axis
        if (y_rot + ANGLE_STEP < 90) {
        y_rot += ANGLE_STEP;
        }
        break;
        case 38: // Down arrow key -> the negative rotation of arm1 around the y-axis
        if (y_rot - ANGLE_STEP > -90) {
        y_rot += -ANGLE_STEP; }
        break;
        case 39: // Right arrow key -> the positive rotation of arm1 around the y-axis
        x_rot += ANGLE_STEP;
        break;
        case 37: // Left arrow key -> the negative rotation of arm1 around the y-axis
        x_rot += -ANGLE_STEP;
        break;
        case 87: // w
        view_x += -2*DISTANCE_STEP*rotationVector[0], view_y += -2*DISTANCE_STEP*rotationVector[1], view_z += -2*DISTANCE_STEP*rotationVector[2];
        break;
        case 83: // s
        view_x += 2*DISTANCE_STEP*rotationVector[0], view_y += 2*DISTANCE_STEP*rotationVector[1], view_z += 2*DISTANCE_STEP*rotationVector[2];
        break;
        case 65: // a
        view_x += DISTANCE_STEP*sidewaysVector[0], view_y += DISTANCE_STEP*sidewaysVector[1], view_z += DISTANCE_STEP*sidewaysVector[2];
        break;
        case 68: // d
        view_x += -DISTANCE_STEP*sidewaysVector[0], view_y += -DISTANCE_STEP*sidewaysVector[1], view_z += -DISTANCE_STEP*sidewaysVector[2];
        break;
        case 32: // space
        view_y += -DISTANCE_STEP;
        break;
        case 17: // ctrl
        view_y += DISTANCE_STEP;  
        break;
        case 219: // left square bracket
        ANGLE_STEP/=1.10;
        break;
        case 221: // right square bracket
        ANGLE_STEP*=1.10;
        break;
        case 189: //minus
        DISTANCE_STEP/=1.10;
        break;
        case 187: //equals
        DISTANCE_STEP*=1.10;
        break;
        case 78: // n
        RESTRICT_CAMERA = (RESTRICT_CAMERA+1)%2;
        break;
        case 66: // b
        if(togglewalls == 1) {
            WallsandFloor_dummygroup.children.pop();
            togglewalls = 0;
        }
        else {
        WallsandFloor_dummygroup.children.push(WallsandCeiling);
        togglewalls = 1;
        }

        break;
        case 48: // 0
        view_x = 0, view_y = -5.45125683630685, view_z = 16.557704454931176;
        x_rot = 180;
        y_rot = 10.577670024104227;
        break;
        case 49: // 1
        view_x = -11, view_y =-5.0970319054613675, view_z = 18.5;
        x_rot = 201;
        y_rot = 8.394001221233648;
        break;
        case 50: // 2
        //     
        view_x = 6.226862232409779, view_y = -0.7658654204015789, view_z = -10.611140144420617;
        x_rot = -226;
        y_rot = -15;
        break;
        case 51: // 3
        view_x = 4.389, view_y = -2.14, view_z = 16.46;
        x_rot = 90;
        y_rot = 0;
        break;
        case 52: // 4
        view_x = 11, view_y = -5.7131006860789935, view_z = -4.572849379488293;
        x_rot = 26.774394022187025;
        y_rot = 11.918996643592113;
        break;
        case 53: // 5
        view_x = 6.1887382388114895, view_y = -5.634617584943771, view_z = -0.34253227710723655;
        x_rot = 157.18492865941883;
        y_rot = 15.836492009173442;
        break;
        case 54: // 6
        view_x = -5.639343271732944, view_y = -2.0393134565341113, view_z = 0.00014807922942761505;
        x_rot = -90;
        y_rot = 0;
        break;
        case 55: // 7
        view_x = 5.639343271732944, view_y = -2.0393134565341113, view_z = 0.00014807922942761505;
        x_rot = 90;
        y_rot = 0;
        break;
        case 56: // 8    
        view_x = 0.7069448326721915, view_y = -4.2946655788988926, view_z = 6.102953349595305;
        x_rot = 152.9862691306821;
        y_rot = 15.477906674121888;
        
        break;
        case 57: // 9  
        view_x = 0, view_y = -3.157658196924319, view_z = -9.215240053646141;
        x_rot = 0;
        y_rot = 5.904477248553776;
        break;
        case 67: // c
        if(pulloutchairs == 0) 
        {pulloutchairs=1;}
        else {pulloutchairs = 0;}
        break;
        case 86: // v
        if(collapsesofas == 0) 
        {collapsesofas=1;}
        else {collapsesofas = 0;}
        break;
        case 84: // t
        if(hidetv == 0) 
        {hidetv=1;}
        else {hidetv = 0;}
        break;
        case 89: // y
        if(tablespin == 0) 
        {tablespin=1;}
        else {tablespin = 0;}
        break;
        case 77: // m
        if(multitex == 0) 
        {multitex=1;}
        else {multitex = 0;}
        break;
        case 80: // p
        if(party==0 || party ==2) 
        {party=1;}
        else {party = 0;}
        break;
        case 79: // o
        if(party==0 || party ==1) {party=2;}
        else{party = 0;}
        break;
        case 72: // h
        party = 0;
        lights = 1;
        basic_light_color_mode = (basic_light_color_mode + 1)%6;
        switch(basic_light_color_mode) {
            case 0:
            gl.uniform3f(u_LightColor1, 0.8, 0.1, 0.1);
            gl.uniform3f(u_LightColor0, 0.8, 0.1, 0.1);
            break;    
            case 1:
            gl.uniform3f(u_LightColor1, 0.7, 0.4, 0.3);
            gl.uniform3f(u_LightColor0, 0.7, 0.4, 0.3);
            break;    
            case 2:
            gl.uniform3f(u_LightColor1, 0.1, 0.8, 0.1);
            gl.uniform3f(u_LightColor0, 0.1, 0.8, 0.1);
            break;    
            case 3:
            gl.uniform3f(u_LightColor1, 0.8, 0.7, 0.1);
            gl.uniform3f(u_LightColor0, 0.8, 0.7, 0.1);
            break;    
            case 4:
            gl.uniform3f(u_LightColor1, 0.1, 0.1, 0.8);
            gl.uniform3f(u_LightColor0, 0.1, 0.1, 0.8);
            break;    
            case 5:
            gl.uniform3f(u_LightColor1, 0.1, 0.6, 0.8);
            gl.uniform3f(u_LightColor0, 0.1, 0.6, 0.8);
            break;    
        }
        break;
        case 74: // j
        if(lights == 1 || party==2 || party ==1) {
                party=0;
                gl.uniform3f(u_LightColor0, 0,0,0);
                gl.uniform3f(u_LightColor1, 0,0,0);
                lights = 0;
            }
        else{ 
            lights = 1;
            gl.uniform3f(u_LightColor1, Light1_rgb_original[0], Light1_rgb_original[1], Light1_rgb_original[2]);
            gl.uniform3f(u_LightColor0, Light0_rgb_original[0], Light0_rgb_original[1], Light0_rgb_original[2]);
        }
        break;
        case 70: // f
        if(fireplacelighting==0) {
            fireplacelighting=1;
            log0.textureNo = [0,7];
            log1.textureNo = [0,7];
            log2.textureNo = [0,7];
            // log3.textureNo = [0,7];
            // log4.textureNo = [0,7];
            // log5.textureNo = [0,7];
            // log6.textureNo = [0,7];
        }
        else{fireplacelighting = 0;
            gl.uniform3f(u_LightColor2, 0,0,0);
            log0.textureNo = 0;
            log1.textureNo = 0;
            log2.textureNo = 0;
            // log3.textureNo = 0;
            // log4.textureNo = 0;
            // log5.textureNo = 0;
            // log6.textureNo = 0;
        }
        break;
        case 76: // l
        warmedloveshadowfilter = (warmedloveshadowfilter + 1)%2;
        if(warmedloveshadowfilter == 1) {
            TriangleClass.colorBuffer = WarmedLightShadersColoredCubeColorBuffer;
            CubeClass.colorBuffer = WarmedLightShadersColoredCubeColorBuffer;
        }
        else {
            TriangleClass.colorBuffer = DarkColoredCubeColorBuffer;
            CubeClass.colorBuffer = DarkColoredCubeColorBuffer;
        }
        break;
        case 71: // g
        if(togglebackgroundcolor == 1) {
            gl.clearColor(0.05,0.05,0.05, 1.0);
            togglebackgroundcolor = 0;
        }
        else {
        gl.clearColor(0.99,0.99,0.99, 1.0);
        togglebackgroundcolor = 1;
        }
        break;
        default: 
        return; // Skip drawing at no effective action
    }
    if(RESTRICT_CAMERA==1) {
        if(-view_x > max_x) {
            view_x = -max_x;
        }
        else if(-view_x < -max_x) {
            view_x = max_x;
        }
        if(-view_y > max_y) {
            view_y = -max_y;
        }
        else if(-view_y < min_y) {
            view_y = -min_y;
        }
        if(-view_z > max_z) {
            view_z = -max_z;
        }
        else if(-view_z < -max_z) {
            view_z = max_z;
        }
    }
    }

function initVertexBuffers(gl, type_of_object) {
    // Write the vertex property to buffers (coordinates, colors and normals)
    if (!initArrayBuffer(gl, 'a_Position', type_of_object.vertexBuffer, 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_Color', type_of_object.colorBuffer, 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_Normal', type_of_object.normalBuffer, 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_TexCoords', type_of_object.texBuffer, 2, gl.FLOAT)) return -1;

    // Write the indices to the buffer object
    var vertexTexCoordBuffer = gl.createBuffer();
    // Write the vertex coords and textures coords to the object buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexTexCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, type_of_object.texBuffer, gl.STATIC_DRAW);
    
    var indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
        console.log('Failed to create the buffer object');
        return false;
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, type_of_object.indexBuffer, gl.STATIC_DRAW);

    return type_of_object.indexBuffer.length;
    
}

function initTextures(gl,u_Sampler0) {
    // Create a texture object
    var texture0 = gl.createTexture(); 
    var texture1 = gl.createTexture();
    var texture2 = gl.createTexture();
    var texture3 = gl.createTexture(); 
    var texture4 = gl.createTexture();
    var texture5 = gl.createTexture();
    var texture6 = gl.createTexture(); 
    var texture7 = gl.createTexture();
    var texture8 = gl.createTexture();
    var texture9 = gl.createTexture();
    var texture10 = gl.createTexture();
    if (!texture0 || !texture1 || !texture2 || !texture3 || !texture4 || !texture5 || !texture6 || !texture7 || !texture8 || !texture9 || !texture10) {
      console.log('Failed to create the texture object');
      return false;
    }
    // Create the image object
    var image0 = new Image();
    var image1 = new Image();
    var image2 = new Image();
    var image3 = new Image();
    var image4 = new Image();
    var image5 = new Image();
    var image6 = new Image();
    var image7 = new Image();
    var image8 = new Image();
    var image9 = new Image();
    var image10 = new Image();
    if (!image0 || !image1 || !image2 || !image3 || !image4 || !image5 || !image6 || !image7 || !image8 || !image9 || !image10) {
      console.log('Failed to create the image object');
      return false;
    }
    // Register the event handler to be called when image loading is completed
    image0.onload = function(){ loadTexture(gl, texture0, image0, 0); };
    image1.onload = function(){ loadTexture(gl, texture1, image1, 1); };
    image2.onload = function(){ loadTexture(gl, texture2, image2, 2); };
    image3.onload = function(){ loadTexture(gl, texture3, image3, 3); };
    image4.onload = function(){ loadTexture(gl, texture4, image4, 4); };
    image5.onload = function(){ loadTexture(gl, texture5, image5, 5); };
    image6.onload = function(){ loadTexture(gl, texture6, image6, 6); };
    image7.onload = function(){ loadTexture(gl, texture7, image7, 7); };
    image8.onload = function(){ loadTexture(gl, texture8, image8, 8); };
    image9.onload = function(){ loadTexture(gl, texture9, image9, 9); };
    image10.onload = function(){ loadTexture(gl, texture10, image10, 10); };
    // Tell the browser to load an Image
    image0.src = '../resources/wood.png';
    image1.src = '../resources/marble.png';
    image2.src = '../resources/redCarpet.png';
    image3.src = '../resources/wall.jpg';
    image4.src = '../resources/sheet.jpg';
    image5.src = '../resources/floor.png';
    image6.src = '../resources/ceiling.png';
    image7.src = '../resources/fire.png';
    image8.src = '../resources/painting0.jpg';
    image9.src = '../resources/painting1.jpg';
    image10.src = '../resources/tv.jpg';
  
    return true;
  }

function loadTexture(gl, texture, image, texture_number){
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
if(texture_number == 0) {gl.activeTexture(gl.TEXTURE0);}
else if(texture_number == 1) {gl.activeTexture(gl.TEXTURE1);}
else if(texture_number == 2) {gl.activeTexture(gl.TEXTURE2);}
else if(texture_number == 3) {gl.activeTexture(gl.TEXTURE3);}
else if(texture_number == 4) {gl.activeTexture(gl.TEXTURE4);}
else if(texture_number == 5) {gl.activeTexture(gl.TEXTURE5);}
else if(texture_number == 6) {gl.activeTexture(gl.TEXTURE6);}
else if(texture_number == 7) {gl.activeTexture(gl.TEXTURE7);}
else if(texture_number == 8) {gl.activeTexture(gl.TEXTURE8);}
else if(texture_number == 9) {gl.activeTexture(gl.TEXTURE9);}
else if(texture_number == 10) {gl.activeTexture(gl.TEXTURE10);}

// Bind the texture object to the target
gl.bindTexture(gl.TEXTURE_2D, texture);

// Set the texture parameters
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
// Set the texture image
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
}

function initArrayBuffer (gl, attribute, data, num, type) {
    // Create a buffer object
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create the buffer object');
        return false;
    }
    // Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    // Assign the buffer object to the attribute variable
    var a_attribute = gl.getAttribLocation(gl.program, attribute);
    if (a_attribute < 0) {
        console.log('Failed to get the storage location of ' + attribute);
        return false;
    }
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    // Enable the assignment of the buffer object to the attribute variable
    gl.enableVertexAttribArray(a_attribute);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return true;
}

function draw(gl, u_ModelMatrix, u_NormalMatrix, u_ViewMatrix, u_Sampler, u_Sampler1, u_MultiTexture, u_LightColor0 , u_LightColor1 , u_LightColor2) {
    // Set up camera rotation and position and pass it to the uniform variable
    var viewMatrix = new Matrix4();
    viewMatrix.rotate(y_rot,1,0,0);
    viewMatrix.rotate(x_rot,0,1,0);
    viewMatrix.translate(view_x, view_y, view_z);
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
    

    //ANIMATION SECTION
    if(fireplacelighting==1) {
        Light2_rgb[0] = (Light2_rgb[0] + 0.01)%0.09;
        firetemp1 = (firetemp1 - 0.006)%0.09;
        firetemp2 = (firetemp2 + 0.002)%0.06;
        Light2_rgb[1] = (Light2_rgb[1] - 0.0008)%0.07;
        Light2_rgb[2] = (Light2_rgb[2] + 0.0003)%0.04;
        gl.uniform3f(u_LightColor2, 0.759+Light2_rgb[0]+firetemp1+firetemp2, 0.25+Light2_rgb[1], 0.1+Light2_rgb[2]);
    }
    // Light2_rgb[0] = 0.013 + (Light2_rgb[0] - 0.01)%0.7;
    // Light2_rgb[1] = 0.023 + (Light2_rgb[1] + 0.003)%0.7;
    // Light2_rgb[2] = 0.013 + (Light2_rgb[2] - 0.03)%0.7;
    if(party==1) {
        Light0_rgb[0] = 0.023 + (Light0_rgb[0] + 0.002)%0.7;
        Light0_rgb[1] = 0.013 + (Light0_rgb[1] - 0.02)%0.7;
        Light0_rgb[2] = 0.023 + (Light0_rgb[2] + 0.008)%0.7;
        Light1_rgb[0] = 0.013 + (Light1_rgb[0] - 0.01)%0.7;
        Light1_rgb[1] = 0.023 + (Light1_rgb[1] + 0.003)%0.7;
        Light1_rgb[2] = 0.013 + (Light1_rgb[2] - 0.03)%0.7;
        gl.uniform3f(u_LightColor0, Light0_rgb[0], Light0_rgb[1], Light0_rgb[2]);
        gl.uniform3f(u_LightColor1, Light1_rgb[0], Light1_rgb[1], Light1_rgb[2]);
    }
    else if(party==2) {
        Light0_rgb[0] = (Light0_rgb[0] + 0.04)%0.6;
        Light0_rgb[1] = (Light0_rgb[1] - 0.04)%0.6;
        Light0_rgb[2] = (Light0_rgb[2] + 0.16)%0.6;
        Light1_rgb[0] = (Light1_rgb[0] - 0.04)%0.6;
        Light1_rgb[1] = (Light1_rgb[1] + 0.06)%0.6;
        Light1_rgb[2] = (Light1_rgb[2] - 0.12)%0.6;
        gl.uniform3f(u_LightColor0, 0.3 + Light0_rgb[0], 0.3 + Light0_rgb[1], 0.3 + Light0_rgb[2]);
        gl.uniform3f(u_LightColor1, 0.3 + Light1_rgb[0], 0.3 + Light1_rgb[1], 0.3 + Light1_rgb[2]);
    }

    if(pulloutchairs == 1) {
        if( chairtranslation - 1.65 < -0.015) {
            if( chairtranslation -0.6 < -0.015) {
                Chair1.rotate(-1.0,0,0);
                Chair2.rotate(-1.0,0,0);
                Chair3.rotate(-1.0,0,0);
                Chair4.rotate(-1.0,0,0);
                tempy += 1.3;
            }
            else if( chairtranslation >= 1.185) {
                Chair1.rotate(4/3,0,0);
                Chair2.rotate(4/3,0,0);
                Chair3.rotate(4/3,0,0);
                Chair4.rotate(4/3,0,0);
                tempy += -26/15;
            }
        chairtranslation += 0.075;
        Chair1.translate(0,0,0.075);
        Chair2.translate(0,0,0.075);
        Chair3.translate(0.075,0,0);
        Chair4.translate(-0.075,0,0);
        Chair1.setChildrenPosition();
        Chair2.setChildrenPosition();
        Chair3.setChildrenPosition();
        Chair4.setChildrenPosition();
        }
        
    }
    else {
        if( chairtranslation > 0.015) {
        chairtranslation += -0.075;
        Chair1.translate(0,0,-0.075);
        Chair2.translate(0,0,-0.075);
        Chair3.translate(-0.075,0,0);
        Chair4.translate(0.075,0,0);
        Chair1.setChildrenPosition();
        Chair2.setChildrenPosition();
        Chair3.setChildrenPosition();
        Chair4.setChildrenPosition();
        }
        
    }

    if(collapsesofas == 1) {
        if( sofatranslation > -3.31) {
            if( sofatranslation < -1.75) {
                Sofa1Covercube.rotate(0,0,-6.923);
                Sofa2Covercube.rotate(0,0,6.923);
                Sofa1Cover.children[1].translate(0,-0.0036,0);
                Sofa2Cover.children[1].translate(0,-0.0036,0);
            }
            sofatranslation += -0.06;
            Sofa1.translate(0,-0.06,0);
            Sofa2.translate(0,-0.06,0);
            Sofa1.rotate(0.08,0,0);
            Sofa2.rotate(0.08,0,0);
            Sofa1.setChildrenPosition();
            Sofa2.setChildrenPosition();
        }
    }
    else {
        if( sofatranslation < -0.015) {
            sofatranslation += 0.06;
                if( sofatranslation < -1.75) {
                    Sofa1Covercube.rotate(0,0,6.923);
                    Sofa2Covercube.rotate(0,0,-6.923);
                    Sofa1Cover.children[1].translate(0,0.0036,0);
                    Sofa2Cover.children[1].translate(0,0.0036,0);
                }
            Sofa1.translate(0,0.06,0);
            Sofa2.translate(0,0.06,0);
            Sofa1.rotate(-0.08,0,0);
            Sofa2.rotate(-0.08,0,0);
            Sofa1.setChildrenPosition();
            Sofa2.setChildrenPosition();
        }
    }
    if(hidetv == 1) {
        if( tvtranslation < 0.243) {
            tvtranslation += 0.02;
            TV.translate(0,0,0.02);
            TV.setChildrenPosition();
        }
    }
    else {
        if( tvtranslation > 0.007) {
            tvtranslation += -0.02;
            TV.translate(0,0,-0.02);
            TV.setChildrenPosition();
        }
    }
    SpinningOrnament.rotate(0,1,0);
    // OrnamentHolder.rotate(0,0.25,0);
    if(tablespin==1) {
        CoffeeTable.rotate(0,-0.1,0);
        CoffeeTable.setChildrenPosition();
    }
    // Clear color and depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Set the vertex coordinates and color (for the cube)
    var n = initVertexBuffers(gl, CubeClass);
    if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
    }
    //Draw cubes
    for (let i = 0; i < SceneCenter.children.length; i++) {
        for (let j = 0; j < SceneCenter.children[i].children.length; j++) {
            for (let k = 0; k < SceneCenter.children[i].children[j].children.length; k++) {
                if( SceneCenter.children[i].children[j].children[k].type_of_model == "cube" ) {
                    if(Array.isArray(SceneCenter.children[i].children[j].children[k].textureNo)) {
                        drawbox(SceneCenter.children[i].children[j].children[k], gl, u_ModelMatrix, u_NormalMatrix, n, u_Sampler, u_Sampler1, u_MultiTexture, 1);
                    }
                    else {drawbox(SceneCenter.children[i].children[j].children[k], gl, u_ModelMatrix, u_NormalMatrix, n, u_Sampler, u_Sampler1, u_MultiTexture, 0);
                }}
            }
        }
    }
    //Draw pyramids
    var n = initVertexBuffers(gl, TriangleClass);
    if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
    }

    for (let i = 0; i < SceneCenter.children.length; i++) {
        for (let j = 0; j < SceneCenter.children[i].children.length; j++) {
            for (let k = 0; k < SceneCenter.children[i].children[j].children.length; k++) {
                if( SceneCenter.children[i].children[j].children[k].type_of_model == "pyramid" ) {
                    if(Array.isArray(SceneCenter.children[i].children[j].children[k].textureNo)) {
                        drawbox(SceneCenter.children[i].children[j].children[k], gl, u_ModelMatrix, u_NormalMatrix, n, u_Sampler, u_Sampler1, u_MultiTexture, 1);
                    }
                    else {drawbox(SceneCenter.children[i].children[j].children[k], gl, u_ModelMatrix, u_NormalMatrix, n, u_Sampler, u_Sampler1, u_MultiTexture, 0);
                }}
            }
        }
    }
    
}
  
  function drawbox(current_object, gl, u_ModelMatrix, u_NormalMatrix, n, u_Sampler, u_Sampler1, u_MultiTexture, multitexture) {
    if(multitexture == 1) {
        if(multitex == 1) {
        gl.uniform1i(u_MultiTexture, 1);
        gl.uniform1i(u_Sampler, current_object.textureNo[0]);
        gl.uniform1i(u_Sampler1, current_object.textureNo[1]);
        }
        else {
            gl.uniform1i(u_MultiTexture, 0);
            gl.uniform1i(u_Sampler, current_object.textureNo[0]);
        }
    }
    else if (multitexture == 0) {
        gl.uniform1i(u_Sampler, current_object.textureNo);
        gl.uniform1i(u_MultiTexture, 0);
    }
    else if(multitexture == -1) {
        gl.uniform1i(u_MultiTexture, -1);
    } 
    else {
        console.log("Invalid parameter supplied for multitexture setting in drawbox function.")
        return;
    }
    // Pass the model matrix to the uniform variable
    gl.uniformMatrix4fv(u_ModelMatrix, false, current_object.modelMatrix.elements);

    // Calculate the normal transformation matrix and pass it to u_NormalMatrix
    g_normalMatrix.setInverseOf(current_object.modelMatrix);
    g_normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);

    // Draw the cube
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);

} 

