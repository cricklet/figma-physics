import { Box2D } from './box2d.js'

//to replace original C++ operator =
export function copyVec2(vec) {
  return new Box2D.b2Vec2(vec.get_x(), vec.get_y());
}

//to replace original C++ operator * (float)
export function scaleVec2(vec, scale) {
  vec.set_x( scale * vec.get_x() );
  vec.set_y( scale * vec.get_y() );            
}

//to replace original C++ operator *= (float)
export function scaledVec2(vec, scale) {
  return new Box2D.b2Vec2(scale * vec.get_x(), scale * vec.get_y());
}

// http://stackoverflow.com/questions/12792486/emscripten-bindings-how-to-create-an-accessible-c-c-array-from-javascript
export function createChainShape(vertices, closedLoop) {
  var shape = new Box2D.b2ChainShape();            
  var buffer = Box2D.allocate(vertices.length * 8, 'float', Box2D.ALLOC_STACK);
  var offset = 0;
  for (var i=0;i<vertices.length;i++) {
      Box2D.setValue(buffer+(offset), vertices[i].get_x(), 'float'); // x
      Box2D.setValue(buffer+(offset+4), vertices[i].get_y(), 'float'); // y
      offset += 8;
  }            
  var ptr_wrapped = Box2D.wrapPointer(buffer, Box2D.b2Vec2);
  if ( closedLoop )
      shape.CreateLoop(ptr_wrapped, vertices.length);
  else
      shape.CreateChain(ptr_wrapped, vertices.length);
  return shape;
}

export function createPolygonShape(vertices) {
  var shape = new Box2D.b2PolygonShape();            
  var buffer = Box2D.allocate(vertices.length * 8, 'float', Box2D.ALLOC_STACK);
  var offset = 0;
  for (var i=0;i<vertices.length;i++) {
      Box2D.setValue(buffer+(offset), vertices[i].get_x(), 'float'); // x
      Box2D.setValue(buffer+(offset+4), vertices[i].get_y(), 'float'); // y
      offset += 8;
  }            
  var ptr_wrapped = Box2D.wrapPointer(buffer, Box2D.b2Vec2);
  shape.Set(ptr_wrapped, vertices.length);
  return shape;
}

export function createRandomPolygonShape(radius) {
  var numVerts = 3.5 + Math.random() * 5;
  numVerts = numVerts | 0;
  var verts = [];
  for (var i = 0; i < numVerts; i++) {
      var angle = i / numVerts * 360.0 * 0.0174532925199432957;
      verts.push( new b2Vec2( radius * Math.sin(angle), radius * -Math.cos(angle) ) );
  }            
  return createPolygonShape(verts);
}