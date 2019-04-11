import { Box2D } from './box2d.js'
debugger;

figma.showUI(__html__);

const currentThreads = [];

function startBox2D(parent: FrameNode) {
  var world = new Box2D.b2World( new Box2D.b2Vec2(0.0, -10.0) );
  var groundBody = world.CreateBody( new Box2D.b2BodyDef() );

  var childIDToBody = {}

  for (const child of parent.children) {
    var bodyDef = new Box2D.b2BodyDef();
    bodyDef.set_type( Box2D.b2_dynamicBody );
    var dynamicBody = world.CreateBody( bodyDef );

    childIDToBody[child.id] = dynamicBody;

    console.log(dynamicBody)
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
