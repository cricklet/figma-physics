import { Box2D } from './box2d.js'
import { copyVec2, scaleVec2, scaledVec2, createPolygonShape } from './box2d-helpers.js'

figma.showUI(__html__);

const currentThreads = [];

function startBox2D(parent: FrameNode) {
  var world = new Box2D.b2World(new Box2D.b2Vec2(0.0, 10.0));
  var groundBody = world.CreateBody(new Box2D.b2BodyDef());

  var childIDToBody = {}

  for (const child of parent.children) {
    if (child.type !== 'RECTANGLE') {
      continue;
    }

    const x = child.relativeTransform[0][2];
    const y = child.relativeTransform[1][2];
    const rotation = Math.acos(child.relativeTransform[0][0])
    const width = child.width;
    const height = child.height;

    // Just double checking that my math is right :)
    const rotation2 = Math.asin(child.relativeTransform[0][1])
    const rotation3 = - Math.asin(child.relativeTransform[1][0])
    const rotation4 = Math.acos(child.relativeTransform[1][1])
    console.log(rotation, rotation2, rotation3, rotation4)

    // var vertices = [];
    // vertices.push( new Box2D.b2Vec2(0, 0) );
    // vertices.push( new Box2D.b2Vec2(0, height));
    // vertices.push( new Box2D.b2Vec2(width, height));
    // vertices.push( new Box2D.b2Vec2(width, 0));
    
    // const shape = createPolygonShape(vertices);
    // var fixtureDef = new Box2D.b2FixtureDef();
    // fixtureDef.set_shape(shape);

    // var bodyDef = new Box2D.b2BodyDef();
    // bodyDef.CreateFixture(fixtureDef);
    // bodyDef.set_type(Box2D.b2_dynamicBody);
    // bodyDef.set_position(Box2D.b2Vec2(x, y));
    // bodyDef.set_angle(rotation);

    // var dynamicBody = world.CreateBody(bodyDef);

    // childIDToBody[child.id] = dynamicBody;

    // console.log(dynamicBody)
    // console.log(bodyDef)
    // console.log(child)
  }
}

figma.ui.onmessage = msg => {
  if (msg.type === 'start-box2d') {
    const selection: ReadonlyArray<BaseNode> = figma.currentPage.selection
    console.log(selection);
    for (const node of selection) {
      if (node.type == "FRAME") {
        startBox2D(node)
      }
    }
  }
  if (msg.type === 'stop') {
    console.log('todo')
  }
};
