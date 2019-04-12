import { Box2D } from './box2d.js'
import { copyVec2, scaleVec2, scaledVec2, createPolygonShape } from './box2d-helpers.js'

figma.showUI(__html__);

let keysDown: { [key: string]: boolean } = {};

const PLAYER_CONTROLS = [
  {
    up: 'w',
    down: 's',
    left: 'a',
    right: 'd'
  }
]

interface Player {
  width: number,
  height: number,
  body: any
}

function createGroundBox(parent: FrameNode, world: any) {
  const width = parent.width;
  const height = parent.height;

  let groundBody = world.CreateBody(new Box2D.b2BodyDef());
  let groundShape = new Box2D.b2EdgeShape();
  groundShape.Set(new Box2D.b2Vec2(0,0), new Box2D.b2Vec2(width,0));
  groundBody.CreateFixture(groundShape, 0.0);
  groundShape.Set(new Box2D.b2Vec2(0,0), new Box2D.b2Vec2(0,height));
  groundBody.CreateFixture(groundShape, 0.0);
  groundShape.Set(new Box2D.b2Vec2(width,0), new Box2D.b2Vec2(width,height));
  groundBody.CreateFixture(groundShape, 0.0);
  groundShape.Set(new Box2D.b2Vec2(0,height), new Box2D.b2Vec2(width,height));
  groundBody.CreateFixture(groundShape, 0.0);

  return groundBody;
}

function createRectangle(child: RectangleNode | FrameNode, world: any) {
  const x = child.relativeTransform[0][2];
  const y = child.relativeTransform[1][2];
  const rotation = Math.atan2(child.relativeTransform[1][0], child.relativeTransform[1][1])
  const width = child.width;
  const height = child.height;

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

  return body;
}

function createPlayer(child: InstanceNode, world: any): Player {
  const x = child.relativeTransform[0][2];
  const y = child.relativeTransform[1][2];
  const rotation = Math.atan2(child.relativeTransform[1][0], child.relativeTransform[1][1])
  const width = child.width;
  const height = child.height;

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
    width, height, body
  }
}

function createVector(child: VectorNode, world: any) {
  const x = child.relativeTransform[0][2];
  const y = child.relativeTransform[1][2];
  const rotation = Math.atan2(child.relativeTransform[1][0], child.relativeTransform[1][1])

  let bodyDef = new Box2D.b2BodyDef();
  bodyDef.set_type(Box2D.b2_dynamicBody);
  bodyDef.set_position(new Box2D.b2Vec2(0,0));

  let body = world.CreateBody(bodyDef);

  const vectorVertices: ReadonlyArray<VectorVertex> = child.vectorNetwork.vertices;
  // const vectorSegments: ReadonlyArray<VectorSegment> = child.vectorNetwork.segments;
  const vectorRegions: ReadonlyArray<VectorRegion> = child.vectorNetwork.regions;
  for (const region of vectorRegions) {
    for (const loop of region.loops) {
      let vertices = [];    
      for (const index of loop) {
        const vertex: VectorVertex = vectorVertices[index];
        vertices.push(new Box2D.b2Vec2(vertex.position.x, vertex.position.y));
      }
      const shape = createPolygonShape(vertices);
      body.CreateFixture(shape, 1.0);
    }
  }

  body.SetTransform(new Box2D.b2Vec2(x,y), rotation);
  body.SetAwake(1);
  body.SetActive(1);

  return body;
}

interface Physics {
  stepPhysics: () => void,
  updateLayers: () => void,
  movePlayers: () => void,
}

function setupPhysicsOnFrame(parent: FrameNode) {
  let world = new Box2D.b2World(new Box2D.b2Vec2(0.0, 1000.0));
  createGroundBox(parent, world);

  let physicsObjects: Array<{
    node: RectangleNode | FrameNode | InstanceNode | VectorNode,
    body: any
  }> = [];

  let players: Player[] = [];

  for (const child of parent.children) {
    if (child.type === 'RECTANGLE' || child.type === 'FRAME') {
      physicsObjects.push({
        node: child, body: createRectangle(child, world)
      });
    } else if (child.type === 'VECTOR') {
      physicsObjects.push({
        node: child, body: createVector(child, world)
      });
    } else if (child.type === 'INSTANCE') {
      const player = createPlayer(child, world);
      physicsObjects.push({
        node: child, body: player.body
      });
      players.push(player);
    }
  }

  function step() {
    world.Step(1/60, 3, 2);
  }

  const play = (function () {
    var hitBodies = [];
    var callback = new Box2D.JSQueryCallback();
    callback.m_fixture = null;
    callback.ReportFixture = function(fixturePtr) {
      var fixture = Box2D.wrapPointer(fixturePtr, Box2D.b2Fixture);
      hitBodies.push(fixture.GetBody());
      return true;
    };
  
    return function () {
      for (let i = 0; i < players.length; i ++) {
        const player = players[i];
        const body = player.body;
        const width = player.width;
        const height = player.height;
        const controlMap = PLAYER_CONTROLS[i]
    
        const x = body.GetPosition().get_x();
        const y = body.GetPosition().get_y();
        const vx = body.GetLinearVelocity().get_x();
        const vy = body.GetLinearVelocity().get_y();
    
        var aabb = new Box2D.b2AABB();
        aabb.set_lowerBound(new Box2D.b2Vec2(x + 10, y + height + 2));
        aabb.set_upperBound(new Box2D.b2Vec2(x + width - 10, y + height + 6));
    
        let canJump = false;
        hitBodies = [];
        world.QueryAABB(callback, aabb);
        if (hitBodies.length >= 1) {
          canJump = true;
        }
    
        const acceleration = canJump ? 12 : 6;
    
        if (keysDown[controlMap.up] && canJump) {
          body.SetLinearVelocity(new Box2D.b2Vec2(vx, -1000));
        } else if (keysDown[controlMap.left] && !keysDown[controlMap.right]) {
          body.SetLinearVelocity(new Box2D.b2Vec2(vx - acceleration, vy));
        } else if (!keysDown[controlMap.left] && keysDown[controlMap.right]) {
          body.SetLinearVelocity(new Box2D.b2Vec2(vx + acceleration, vy));
        }
      }
    }
  })();
  
  function update() {
    for (const physicsObject of physicsObjects) {
      const child: BaseNode = physicsObject.node;
      const body = physicsObject.body

      const rotation = body.GetAngle();
      const x = body.GetPosition().get_x();
      const y = body.GetPosition().get_y();

      const newTransform: Transform = [
        [Math.cos(rotation), -Math.sin(rotation), x],
        [Math.sin(rotation), Math.cos(rotation), y]
      ];
      child.relativeTransform = newTransform;
    }
  }

  return {
    stepPhysics: step, updateLayers: update, movePlayers: play
  }
}

function getTopMostFrame(node: BaseNode): FrameNode {
  let i = 0;
  while (node) {
    i ++;
    if (i > 10) {
      break;
    }
    if (node.type == 'FRAME' && node.parent.type == 'PAGE') {
      return node;
    }
    node = node.parent;
  }
  return undefined;
}

let currentPhysics: Physics;

figma.ui.onmessage = msg => {
  if (msg.type === 'start-box2d') {
    const selection: ReadonlyArray<BaseNode> = figma.currentPage.selection
    if (selection.length >= 1) {
      const frame = getTopMostFrame(selection[0])
      if (frame) {
        currentPhysics = setupPhysicsOnFrame(frame)
      }
    }
  }
  if (msg.type === 'controls') {
    keysDown = msg.keysDown;
  }
  if (msg.type === 'step') {
    if (currentPhysics) {
      currentPhysics.movePlayers();
      currentPhysics.stepPhysics();
      currentPhysics.updateLayers();
    }
  }
};
