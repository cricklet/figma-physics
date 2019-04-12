import { Box2D } from './box2d.js'
import { copyVec2, scaleVec2, scaledVec2, createPolygonShape } from './box2d-helpers.js'

figma.showUI(__html__);

const currentThreads = [];

function createGroundBox(parent: FrameNode, world: any) {
  const width = parent.width;
  const height = parent.height;

  var groundBody = world.CreateBody(new Box2D.b2BodyDef());
  var groundShape = new Box2D.b2EdgeShape();
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

function createRectangle(child: RectangleNode, world: any) {
  const x = child.relativeTransform[0][2];
  const y = child.relativeTransform[1][2];
  const rotation = Math.atan2(child.relativeTransform[1][0], child.relativeTransform[1][1])
  const width = child.width;
  const height = child.height;

  // // Just double checking that my math is right :)
  // const rotation2 = Math.asin(child.relativeTransform[0][1])
  // const rotation3 = - Math.asin(child.relativeTransform[1][0])
  // const rotation4 = Math.acos(child.relativeTransform[1][1])
  // console.log(rotation, rotation2, rotation3, rotation4)

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

interface Physics {
  stepPhysics: () => void,
  updateLayers: () => void,
}

function setupPhysicsOnFrame(parent: FrameNode) {
  var world = new Box2D.b2World(new Box2D.b2Vec2(0.0, 100.0));
  createGroundBox(parent, world);

  var childIDToBody = {}

  for (const child of parent.children) {
    if (child.type !== 'RECTANGLE') {
      continue;
    }
    console.log(child.x, child.y);
    childIDToBody[child.id] = createRectangle(child, world);
  }

  function step() {
    world.Step(1/60, 3, 2);
  }

  function update() {
    for (const childID in childIDToBody) {
      const child: BaseNode = figma.getNodeById(childID);
      if (child.type !== 'RECTANGLE') {
        continue;
      }

      const body = childIDToBody[childID];
      const rotation = body.GetAngle();
      const x = body.GetPosition().get_x();
      const y = body.GetPosition().get_y();

      console.log(rotation, x, y);

      const newTransform: Transform = [
        [Math.cos(rotation), -Math.sin(rotation), x],
        [Math.sin(rotation), Math.cos(rotation), y]
      ];
      child.relativeTransform = newTransform;
    }
  }

  return {
    stepPhysics: step, updateLayers: update
  }
}

const frameIDToPhysics: { [id: string]: Physics } = {};

figma.ui.onmessage = msg => {
  if (msg.type === 'start-box2d') {
    const selection: ReadonlyArray<BaseNode> = figma.currentPage.selection
    console.log(selection);
    for (const node of selection) {
      if (node.type != "FRAME") {
        continue;
      }
      frameIDToPhysics[node.id] = setupPhysicsOnFrame(node)
    }
  }
  if (msg.type === 'step') {
    for (const frameID in frameIDToPhysics) {
      frameIDToPhysics[frameID].stepPhysics();
      frameIDToPhysics[frameID].updateLayers();
    }
  }
};
