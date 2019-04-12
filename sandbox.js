import { Box2D } from './box2d.js'
import { getCanvasDebugDraw, drawAxes } from './box2d-canvas.js'
import { copyVec2, scaleVec2, scaledVec2, createPolygonShape } from './box2d-helpers.js'


const keysDown = {};

function getChar(e) {
  if (e.keyCode >= 48 && e.keyCode <= 90)
    return String.fromCharCode(e.keyCode).toLowerCase();

  return null;
}

document.body.addEventListener('keydown', e => {
  let key = getChar(e);
  if (key) keysDown[key] = true;
});

document.body.addEventListener('keyup', e => {
  let key = getChar(e);
  if (key) keysDown[key] = false;
});

var canvasOffset = {
    x: 0,
    y: 0
};

const canvas = document.getElementById("canvas");
const context = canvas.getContext( '2d' );
const debugDraw = getCanvasDebugDraw(context);
debugDraw.SetFlags(0x0001);

var world = new Box2D.b2World(new Box2D.b2Vec2(0.0, 50.0));

world.SetDebugDraw(debugDraw);

function addGround() {
  var groundBody = world.CreateBody(new Box2D.b2BodyDef());
  var groundShape = new Box2D.b2EdgeShape();
  groundShape.Set(new Box2D.b2Vec2(10,10), new Box2D.b2Vec2(490,10));
  groundBody.CreateFixture(groundShape, 0.0);
  groundShape.Set(new Box2D.b2Vec2(10,10), new Box2D.b2Vec2(10,490));
  groundBody.CreateFixture(groundShape, 0.0);
  groundShape.Set(new Box2D.b2Vec2(490,10), new Box2D.b2Vec2(490,490));
  groundBody.CreateFixture(groundShape, 0.0);
  groundShape.Set(new Box2D.b2Vec2(10,490), new Box2D.b2Vec2(490,490));
  groundBody.CreateFixture(groundShape, 0.0);
}

function addRectangle() {
  const x = 100;
  const y = 100;
  const rotation = 0;
  const width = 50;
  const height = 50;

  var vertices = [];
  vertices.push( new Box2D.b2Vec2(0, 0) );
  vertices.push( new Box2D.b2Vec2(0, height));
  vertices.push( new Box2D.b2Vec2(width, height));
  vertices.push( new Box2D.b2Vec2(width, 0));
  const shape = createPolygonShape(vertices);

  var bodyDef = new Box2D.b2BodyDef();
  bodyDef.set_type(Box2D.b2_dynamicBody);
  bodyDef.set_position(new Box2D.b2Vec2(0,0));

  var body = world.CreateBody(bodyDef);
  body.CreateFixture(shape, 1.0);

  body.SetTransform(new Box2D.b2Vec2(x,y), rotation);
  body.SetAwake(1);
  body.SetActive(1);

  return body;
}

function addPlayer() {
  const x = 400
  const y = 100
  const rotation = 0;
  const width = 60;
  const height = 60;

  let vertices = [];
  vertices.push( new Box2D.b2Vec2(0, 0) );
  vertices.push( new Box2D.b2Vec2(0, height));
  vertices.push( new Box2D.b2Vec2(width, height));
  vertices.push( new Box2D.b2Vec2(width, 0));
  const shape = createPolygonShape(vertices);

  let bodyDef = new Box2D.b2BodyDef();
  bodyDef.set_type(Box2D.b2_dynamicBody);
  bodyDef.set_position(new Box2D.b2Vec2(0,0));

  let body = world.CreateBody(bodyDef);
  body.CreateFixture(shape, 1.0);

  body.SetTransform(new Box2D.b2Vec2(x,y), rotation);
  body.SetAwake(1);
  body.SetActive(1);
  body.SetFixedRotation(true);

  return {
    body: body,
    width: width,
    height: height,
  };
}

function draw() {
  context.fillStyle = 'rgb(200,200,200)';
  context.fillRect( 0, 0, canvas.width, canvas.height );

  context.save();

    context.translate(canvasOffset.x, canvasOffset.y);
    
    drawAxes(context);
    
    context.fillStyle = 'rgb(255,255,0)';
    world.DrawDebugData();

  context.restore();
}

addRectangle();
addGround();
var player = addPlayer();

const PLAYER_CONTROLS =
  {
    up: 'w',
    down: 's',
    left: 'a',
    right: 'd'
  }


const play = (function () {
  var hitBodies = [];
  var callback = new Box2D.JSQueryCallback();
  callback.ReportFixture = function(fixturePtr) {
    var fixture = Box2D.wrapPointer(fixturePtr, Box2D.b2Fixture);
    hitBodies.push(fixture.GetBody());
    return true;
  };

  return function () {
    const body = player.body;
    const width = player.width;
    const height = player.height;
    const controlMap = PLAYER_CONTROLS

    const x = body.GetPosition().get_x();
    const y = body.GetPosition().get_y();
    let vx = body.GetLinearVelocity().get_x();
    let vy = body.GetLinearVelocity().get_y();

    var aabb = new Box2D.b2AABB();
    aabb.set_lowerBound(new Box2D.b2Vec2(x + 10, y + height - 6));
    aabb.set_upperBound(new Box2D.b2Vec2(x + width - 10, y + height + 6));

    let canJump = false;
    hitBodies = [];

    callback.m_fixture = null;
    world.QueryAABB(callback, aabb);
    if (hitBodies.length >= 2) {
      canJump = true;
    }

    const acceleration = canJump ? 12 : 6;

    if (keysDown[controlMap.left] && !keysDown[controlMap.right]) {
      vx -= acceleration;
    } else if (!keysDown[controlMap.left] && keysDown[controlMap.right]) {
      vx += acceleration;
    } else {
      if (Math.abs(vx) > 1) {
        vx -= Math.min(acceleration, Math.abs(vx)) * vx / Math.abs(vx);
      }
    }

    if (keysDown[controlMap.up] && canJump) {
      vy = -1000;
    }

    body.SetLinearVelocity(new Box2D.b2Vec2(vx, vy));
  }
})();

function step() {
  world.Step(1/60, 3, 2);
  draw();
}

var frames = 0;

function animate() {
  frames += 1;
  if (frames < 1000) {
    window.requestAnimationFrame(animate);
  }

  play();
  step();
}

animate();
