"use strict";

var canvas;
var gl;
var program;

var projectionMatrix;
var modelViewMatrix;
var instanceMatrix;
var modelViewMatrixLoc;

var walk = false;
	var walkmin = false;
	var walkmax = true;
var turn = false;
	var turnmin = false;
	var turnmax = true;
var wave = false;
	var wavemin = false;
	var wavemax = true;
var agree = false;
	var agreemin = false;
	var agreemax = true;
var disagree = false;
	var disagreemin = false;
	var disagreemax = true;
var dance = false;
var reset = false;



var vertices = [
    vec4( -0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5,  0.5,  0.5, 1.0 ),
    vec4(  0.5,  0.5,  0.5, 1.0 ),
    vec4(  0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5, -0.5, -0.5, 1.0 ),
    vec4( -0.5,  0.5, -0.5, 1.0 ),
    vec4(  0.5,  0.5, -0.5, 1.0 ),
    vec4(  0.5, -0.5, -0.5, 1.0 )
];

var torsoId = 0;
var headId  = 1;
var head1Id = 1;
var head2Id = 10;
var leftUpperArmId = 2;
var leftLowerArmId = 3;
var rightUpperArmId = 4;
var rightLowerArmId = 5;
var leftUpperLegId = 6;
var leftLowerLegId = 7;
var rightUpperLegId = 8;
var rightLowerLegId = 9;

var torsoHeight = 5.0;
var torsoWidth  = 2.0;
var upperArmHeight = 2.0;
var lowerArmHeight = 1.8;
var upperArmWidth  = 0.7;
var lowerArmWidth  = 0.5;
var upperLegWidth  = 0.7;
var lowerLegWidth  = 0.5;
var lowerLegHeight = 2.0;
var upperLegHeight = 3.0;
var headHeight = 1.5;
var headWidth  = 1.0;

var numNodes = 10;
var numAngles = 11;

var theta = [0, 0, 180, 0, 180, 0, 180, 0, 180, 0, 0];

var stack = [];
var figure = [];

for( var i=0; i<numNodes; i++) figure[i] = createNode(null, null, null, null);

var vBuffer, cBuffer;

var pointsArray = [];
var colorsArray = [];

//-------------------------------------------

function scale4(a, b, c) {
   var result = mat4();
   result[0][0] = a;
   result[1][1] = b;
   result[2][2] = c;
   return result;
}

//--------------------------------------------

function createNode(transform, render, sibling, child){
    var node = {
    transform: transform,
    render: render,
    sibling: sibling,
    child: child,
    }
    return node;
}

function initNodes(Id) {

    var m = mat4();

    switch(Id) {

    case torsoId:
		m = rotate(theta[torsoId], 0, 1, 0 );
		figure[torsoId] = createNode( m, torso, null, headId );
    break;
    case headId:
    case head1Id:
    case head2Id:
		m = translate(0.0, torsoHeight+0.5*headHeight, 0.0);
		m = mult(m, rotate(theta[head1Id], 1, 0, 0))
		m = mult(m, rotate(theta[head2Id], 0, 1, 0));
		m = mult(m, translate(0.0, -0.5*headHeight, 0.0));
		figure[headId] = createNode( m, head, leftUpperArmId, null);
    break;
    case leftUpperArmId:
		m = translate(-(torsoWidth/1.5), 0.9*torsoHeight, 0.0);
		m = mult(m, rotate(theta[leftUpperArmId], 0, 0, 1));
		figure[leftUpperArmId] = createNode( m, leftUpperArm, rightUpperArmId, leftLowerArmId );
    break;
    case rightUpperArmId:
		m = translate(torsoWidth/1.5, 0.9*torsoHeight, 0.0);
		m = mult(m, rotate(theta[rightUpperArmId], 0, 0, 1));
		figure[rightUpperArmId] = createNode( m, rightUpperArm, leftUpperLegId, rightLowerArmId );
    break;
    case leftUpperLegId:
		m = translate(-(torsoWidth/1.5), 0.1*upperLegHeight, 0.0);
		m = mult(m , rotate(theta[leftUpperLegId], 1, 0, 0));
		figure[leftUpperLegId] = createNode( m, leftUpperLeg, rightUpperLegId, leftLowerLegId );
    break;
    case rightUpperLegId:
		m = translate(torsoWidth/1.5, 0.1*upperLegHeight, 0.0);
		m = mult(m, rotate(theta[rightUpperLegId], 1, 0, 0));
		figure[rightUpperLegId] = createNode( m, rightUpperLeg, null, rightLowerLegId );
    break;
    case leftLowerArmId:
		m = translate(0.0, upperArmHeight, 0.0);
		m = mult(m, rotate(theta[leftLowerArmId], 1, 0, 0));
		figure[leftLowerArmId] = createNode( m, leftLowerArm, null, null );
    break;
    case rightLowerArmId:
		m = translate(0.0, upperArmHeight, 0.0);
		m = mult(m, rotate(theta[rightLowerArmId], 1, 0, 0));
		figure[rightLowerArmId] = createNode( m, rightLowerArm, null, null );
    break;
    case leftLowerLegId:
		m = translate(0.0, upperLegHeight, 0.0);
		m = mult(m, rotate(theta[leftLowerLegId], 1, 0, 0));
		figure[leftLowerLegId] = createNode( m, leftLowerLeg, null, null );
    break;
    case rightLowerLegId:
		m = translate(0.0, upperLegHeight, 0.0);
		m = mult(m, rotate(theta[rightLowerLegId], 1, 0, 0));
		figure[rightLowerLegId] = createNode( m, rightLowerLeg, null, null );
    break;
    }
}

function traverse(Id) {
    if(Id == null) return;
    stack.push(modelViewMatrix);
    modelViewMatrix = mult(modelViewMatrix, figure[Id].transform);
    figure[Id].render();
    if(figure[Id].child != null) traverse(figure[Id].child);
    modelViewMatrix = stack.pop();
    if(figure[Id].sibling != null) traverse(figure[Id].sibling);
}

function torso() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5*torsoHeight, 0.0) );
    instanceMatrix = mult(instanceMatrix, scale4( torsoWidth, torsoHeight, torsoWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}
function head() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * headHeight, 0.0 ));
	instanceMatrix = mult(instanceMatrix, scale4(headWidth, headHeight, headWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}
function leftUpperArm() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperArmHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(upperArmWidth, upperArmHeight, upperArmWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}
function leftLowerArm() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerArmHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(lowerArmWidth, lowerArmHeight, lowerArmWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}
function rightUpperArm() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperArmHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(upperArmWidth, upperArmHeight, upperArmWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}
function rightLowerArm() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerArmHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(lowerArmWidth, lowerArmHeight, lowerArmWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}
function  leftUpperLeg() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(upperLegWidth, upperLegHeight, upperLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}
function leftLowerLeg() {
    instanceMatrix = mult(modelViewMatrix, translate( 0.0, 0.5 * lowerLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(lowerLegWidth, lowerLegHeight, lowerLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}
function rightUpperLeg() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(upperLegWidth, upperLegHeight, upperLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}
function rightLowerLeg() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(lowerLegWidth, lowerLegHeight, lowerLegWidth) )
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function quad(a, b, c, d) {
	var vertexColors = [
        [ 0.0, 0.0, 0.0, 1.0 ],  // black
        [ 0.7, 0.7, 0.7, 1.0 ],  // gray
        [ 0.7, 0.0, 0.7, 1.0 ],  // purple
        [ 0.0, 0.0, 1.0, 1.0 ],  // blue
        [ 0.0, 0.0, 0.0, 1.0 ],  // black
        [ 0.7, 0.7, 0.7, 1.0 ],  // gray
        [ 0.7, 0.0, 0.7, 1.0 ],  // purple
        [ 0.0, 0.0, 1.0, 1.0 ]   // blue 
	];
    pointsArray.push(vertices[a]);
    pointsArray.push(vertices[b]);
    pointsArray.push(vertices[c]);
    pointsArray.push(vertices[d]);
	colorsArray.push(vertexColors[a]);
	colorsArray.push(vertexColors[a]);
	colorsArray.push(vertexColors[b]);
	colorsArray.push(vertexColors[b]);
}

function cube() {
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}


window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.8, 0.8, 0.8, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader");

    gl.useProgram( program);

    instanceMatrix = mat4();

    projectionMatrix = ortho(-10.0,10.0,-10.0, 10.0,-10.0,10.0);
    modelViewMatrix = mat4();

    gl.uniformMatrix4fv(gl.getUniformLocation( program, "modelViewMatrix"), false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( gl.getUniformLocation( program, "projectionMatrix"), false, flatten(projectionMatrix) );

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix")

    cube();

    vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );
	
	
	document.getElementById("Button0").onclick = function(){ 
		walk = !walk;
	};	
	document.getElementById("Button1").onclick = function(){ 
		turn = !turn;
	};	
	document.getElementById("Button2").onclick = function(){ 
		wave = !wave;
	};	
	document.getElementById("Button3").onclick = function(){ 
		agree = !agree;
	};	
	document.getElementById("Button4").onclick = function(){ 
		disagree = !disagree;
	};	
	document.getElementById("Button5").onclick = function(){ 
		walk = true;
		turn = true;
		wave = true;
		agree = true;
	};	
	document.getElementById("Button6").onclick = function(){ 
		reset = !reset;
	};	


    for(i=0; i<numNodes; i++) initNodes(i);

    render();
}


var render = function() {
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

///////// TURN ///////////
	if(turn == true && turnmax == true && turnmin == false){
		theta[torsoId] += 2;
		if(theta[torsoId] > 135){
			turnmax = false;
			turnmin = true;
		}
	}
	if(turn == true && turnmax == false && turnmin == true){
		theta[torsoId] -= 2;
		if(theta[torsoId] < -135){
			turnmax = true;
			turnmin = false;
			
		}
	}
	initNodes(torsoId);
///////// WALK /////////////
	if(walk == true && walkmax == true){
		theta[leftUpperLegId] += 2;
		theta[rightUpperLegId] -= 2;
		if(theta[leftUpperLegId] > 230){
				walkmax = false;
				walkmin = true;
			}
	}
	if(walk == true && walkmin == true){
		theta[leftUpperLegId] -= 2;
		theta[rightUpperLegId] += 2;
		if(theta[leftUpperLegId] < 130){
				walkmax = true;
				walkmin = false;
			}
	}
	initNodes(leftUpperLegId);
	initNodes(rightUpperLegId);
	
//////// WAVE ////////////
	if(wave == true && wavemax == true){
		theta[leftUpperArmId] -= 4;
		theta[rightUpperArmId] += 4;
		if(theta[rightUpperArmId] > 360){
				wavemax = false;
				wavemin = true;
		}
	}
	if(wave == true && wavemin == true){
		theta[leftUpperArmId] += 4;
		theta[rightUpperArmId] -= 4;
		if(theta[rightUpperArmId] < 180){
				wavemax = true;
				wavemin = false;
		}
	}
	initNodes(leftUpperArmId);
	initNodes(rightUpperArmId);

////// AGREE ///////////
	if(agree == true && agreemax == true){
		theta[head1Id] -= 2;
		if(theta[head1Id] < -45){
				agreemax = false;
				agreemin = true;
		}
	}
	if(agree == true && agreemin == true){
		theta[head1Id] += 2;
		if(theta[head1Id] > 45){
				agreemax = true;
				agreemin = false;
		}
	}
	initNodes(head1Id);
	
////// DISAGREE	////////////
	if(disagree == true && disagreemax == true){
		theta[head2Id] -= 2;
		if(theta[head2Id] < -45){
				disagreemax = false;
				disagreemin = true;
		}
	}
	if(disagree == true && disagreemin == true){
		theta[head2Id] += 2;
		if(theta[head2Id] > 45){
				disagreemax = true;
				disagreemin = false;
		}
	}
	initNodes(head2Id);
	
//////// DANCE ///////////


///////// RESET //////////
	if(reset == true){
		walk = false;
		turn = false;
		wave = false;
		agree = false;
		disagree = false;
		theta[head2Id] = 0;
		theta[head1Id] = 0;
		theta[leftUpperArmId] = 180;
		theta[rightUpperArmId] = 180;
		theta[torsoId] = 0;
		theta[leftUpperLegId] = 180;
		theta[rightUpperLegId] = 180;
		reset = false;
	}
	

    traverse(torsoId);
    requestAnimFrame(render);
}
