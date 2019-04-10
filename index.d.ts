// This is a global variable with Figma's plugin API.
declare const figma: PluginAPI

// If you set the "html" manifest field to a file name, the contents of that
// file will be accessible through this variable within your plugin code.
declare const __html__: string

interface PluginAPI {
  readonly currentPage: PageNode

  // This is the root of the entire Figma document. Each child is a PageNode.
  readonly root: DocumentNode

  // API for accessing viewport information
  readonly viewport: ViewportAPI

  // You must remember to call closePlugin() once your plugin is
  // finished executing.
  closePlugin(): void

  // Command that the user chose through menu when launching the plugin
  readonly command: string

  // Finds a node by its id string. If no node has that id, this function will
  // return null instead.
  getNodeById(id: string): BaseNode | null

  // Finds a style by its id string. If no style has that id, this function will
  // return null instead.
  getStyleById(id: string): BaseStyle | null

  // This is a way to access browser APIs and/or show UI to the user.
  // The returned promise can be used to communicate the result of user input
  // back to the main thread.
  //
  //   let result = await figma.showUI(`
  //     <input id=textControl>
  //     <button onclick='send()'>Submit</button>
  //     <script>
  //     function send() {
  //       window.parent.postMessage({
  //         pluginResult: textControl.value
  //       }, '*')
  //     }
  //     </script>`)
  //   console.log("User input:", result)
  showUI(html: string, options?: ShowUIOptions): Promise<any>
  readonly ui: UIAPI

  // These functions let you create new nodes. Nodes will start off without a
  // parent. To set a parent, use "appendChild" or "insertChild".
  createRectangle(): RectangleNode
  createPage(): PageNode
  createSlice(): SliceNode
  createFrame(): FrameNode
  createGroup(): FrameNode
  createComponent(): ComponentNode
  createBooleanOperation(): BooleanOperationNode
  createVector(): VectorNode
  createStar(): StarNode
  createLine(): LineNode
  createEllipse(): EllipseNode
  createPolygon(): PolygonNode
  createText(): TextNode

  // These functions let you create styles. Styles can be assigned to
  // node properties like textStyleId, fillStyleId, etc.
  // e.g. textNode.textStyleId = style.id
  createPaintStyle(): PaintStyle
  createTextStyle(): TextStyle
  createEffectStyle(): EffectStyle
  createGridStyle(): GridStyle

  // Create a new node from an SVG string. This behaves the same as the SVG
  // import feature in the editor.
  createNodeFromSvg(svg: string): FrameNode

  // Create an Image object using the provided file contents.
  createImage(data: Uint8Array): Image
}

type ShowUIOptions = {
  visible?: boolean, // defaults to true
  width?: number,    // defaults to 300
  height?: number,   // defaults to 200
}

interface UIAPI {
  show(): void
  hide(): void
  resize(width: number, height: number): void
  close(): void // Causes the promise returned from showUI to reject

  // This will send a message to the iframe. The iframe can receive this message
  // by assigning a callback to "window.onmessage". The message shows up as an
  // object with a single property "pluginMessage" containing the value passed in
  // here. Example:
  //
  //   figma.showUI(`<script>
  //     window.onmessage = event => {
  //       console.log('iframe got:', event.data.pluginMessage)
  //     }
  //   </script>`)
  //   figma.iframe.postMessage('this is your message')
  //
  postMessage(pluginMessage: any): void

  // Assign to this to register a callback for messages sent by the iframe. To
  // send a message in the iframe, you must send it as an object with the property
  // "pluginMessage". Example:
  //
  //   figma.showUI(`<script>
  //     window.parent.postMessage({
  //       pluginMessage: 'this is your message'
  //     }, '*')
  //   </script>`)
  //   figma.iframe.onmessage = pluginMessage => {
  //     console.log('plugin got:', pluginMessage)
  //   }
  //
  onmessage: ((pluginMessage: any) => void) | undefined
}

interface ViewportAPI {
  // Read and update the center of the viewport
  center: { x: number, y: number }

  // Zoom scale. 100% zoom returns 1.0, 50% zoom return 0.5 etc
  zoom: number

  // Adjust the viewport such that it shows the provided nodes
  scrollAndZoomIntoView(nodes: BaseNode[])
}

// Local development
// manifest.json format

interface ManifestJson {
  // This is the name of the extension as displayed in the Figma UI. The name must be a string.
  name: string

  // Version of the runtime that the extension uses, e.g. '0.3.0'.
  version: string

  // The file name that contains the extension code.
  // It's a path relative to the manifest file and is allowed to contain directory names.
  // For security reasons the script file must be located in the same directory as, or a subdirectory of, the manifest file.
  script: string

  // The file name that contains the html code made available in script.
  // Before the extension is run, the contents of this file is read and made available through a global variable named
  // `__html__`. This variable can then be used as `figma.showUI(__html__, { width: 300, height: 100 })`.
  html?: string

  // Shell command to be executed before the contents of the `html` and `script` files are read.
  // This can be used to, compile typescript sources into javascript, or to bundle multiple resource
  // files into a single javascript file.
  build?: string

  // Menu items to show up in UI. This allows arbitrarily deeply nested menu items to be created.
  // The selected command is exposed through `figma.command` API
  menu?: ManifestMenuItem[]
}

type ManifestMenuItem =
  // Clickable menu item. The 'command' value is passed along to the script and exposed through the
  // `figma.command` property
  { label: string, command: string } |
  // Separator
  { separator: true } |
  // Submenu. Menu must contain at least one item
  { label: string, menu: ManifestMenuItem[] }

////////////////////////////////////////////////////////////////////////////////
// Values

// These are the top two rows of a 3x3 matrix. This is enough to represent
// translation, rotation, and skew.
type Transform = [
  [number, number, number],
  [number, number, number]
]

interface Vector {
  readonly x: number
  readonly y: number
}

interface RGB {
  readonly r: number
  readonly g: number
  readonly b: number
}

interface RGBA {
  readonly r: number
  readonly g: number
  readonly b: number
  readonly a: number
}

interface FontName {
  readonly family: string
  readonly style: string
}

interface ArcData {
  readonly startingAngle: number
  readonly endingAngle: number
  readonly innerRadius: number
}

interface ShadowEffect {
  readonly type: "DROP_SHADOW" | "INNER_SHADOW"
  readonly color: RGBA
  readonly offset: Vector
  readonly radius: number
  readonly visible: boolean
  readonly blendMode: BlendMode
}

interface BlurEffect {
  readonly type: "LAYER_BLUR" | "BACKGROUND_BLUR"
  readonly radius: number
  readonly visible: boolean
}

type Effect = ShadowEffect | BlurEffect

type ConstraintType = "MIN" | "CENTER" | "MAX" | "STRETCH" | "SCALE"

interface Constraints {
  readonly horizontal: ConstraintType
  readonly vertical: ConstraintType
}

interface ColorStop {
  readonly position: number
  readonly color: RGBA
}

interface SolidPaint {
  readonly type: "SOLID"
  readonly color: RGB

  readonly visible?: boolean
  readonly opacity?: number
}

interface GradientPaint {
  readonly type: "GRADIENT_LINEAR" | "GRADIENT_RADIAL" | "GRADIENT_ANGULAR" | "GRADIENT_DIAMOND"
  readonly gradientTransform: Transform
  readonly gradientStops: ReadonlyArray<ColorStop>

  readonly visible?: boolean
  readonly opacity?: number
}

interface ImagePaint {
  readonly type: "IMAGE"
  readonly scaleMode: "FILL" | "FIT" | "CROP" | "TILE"
  readonly image: Image | null
  readonly imageTransform?: Transform // used as setting for "CROP"
  readonly scalingFactor?: number // used as setting for "TILE"

  readonly visible?: boolean
  readonly opacity?: number
}

type Paint = SolidPaint | GradientPaint | ImagePaint

interface Guide {
  readonly axis: "X" | "Y"
  readonly offset: number
}

interface RowsColsLayoutGrid {
  readonly pattern: "ROWS" | "COLUMNS"
  readonly alignment: "MIN" | "STRETCH" | "CENTER"
  readonly gutterSize: number

  readonly count: number        // This is Infinity when "Auto" is set in the UI
  readonly sectionSize?: number // Not set for alignment: "STRETCH"
  readonly offset?: number      // Not set for alignment: "CENTER"

  readonly visible?: boolean
  readonly color?: RGBA
}

interface GridLayoutGrid {
  readonly pattern: "GRID"
  readonly sectionSize: number

  readonly visible?: boolean
  readonly color?: RGBA
}

type LayoutGrid = RowsColsLayoutGrid | GridLayoutGrid

interface ExportSettingsImage {
  format: "JPG" | "PNG"
  contentsOnly?: boolean    // defaults to true
  suffix?: string
  constraint?: {            // defaults to unscaled ({ type: "SCALE", value: 1 })
    type: "SCALE" | "WIDTH" | "HEIGHT"
    value: number
  }
}

interface ExportSettingsSVG {
  format: "SVG"
  contentsOnly?: boolean    // defaults to true
  suffix?: string
  svgOutlineText?: boolean  // defaults to true
  svgIdAttribute?: boolean  // defaults to false
  svgSimplifyStroke?: boolean // defaults to true
}

interface ExportSettingsPDF {
  format: "PDF"
  contentsOnly?: boolean    // defaults to true
  suffix?: string
}

type ExportSettings = ExportSettingsImage | ExportSettingsSVG | ExportSettingsPDF

type WindingRule = 'nonzero' | 'evenodd'

interface VectorVertex {
  readonly position: Vector
}

interface VectorHandle {
  readonly index: number
  readonly tangent: Vector
}

interface VectorSegment {
  readonly start: VectorHandle
  readonly end: VectorHandle
}

interface VectorRegion {
  readonly windingRule: WindingRule
  readonly loops: ReadonlyArray<ReadonlyArray<number>>
}

interface VectorNetwork {
  readonly vertices: ReadonlyArray<VectorVertex>
  readonly segments: ReadonlyArray<VectorSegment>
  readonly regions: ReadonlyArray<VectorRegion>
}

interface VectorPath {
  // This is similar to the svg fill-rule
  // A null value means that an open path won't have a fill
  readonly windingRule: WindingRule | null
  readonly data: string
}

type VectorPaths = ReadonlyArray<VectorPath>

interface NumberWithUnits {
  readonly value: number
  readonly units: "PIXELS" | "PERCENT"
}

type BlendMode =
  "PASS_THROUGH" |
  "NORMAL" |
  "DARKEN" |
  "MULTIPLY" |
  "LINEAR_BURN" |
  "COLOR_BURN" |
  "LIGHTEN" |
  "SCREEN" |
  "LINEAR_DODGE" |
  "COLOR_DODGE" |
  "OVERLAY" |
  "SOFT_LIGHT" |
  "HARD_LIGHT" |
  "DIFFERENCE" |
  "EXCLUSION" |
  "HUE" |
  "SATURATION" |
  "COLOR" |
  "LUMINOSITY"

////////////////////////////////////////////////////////////////////////////////
// Mixins

interface BaseNodeMixin {
  readonly id: string
  readonly parent: (BaseNode & ChildrenMixin) | null
  name: string
  visible: boolean
  locked: boolean
  toString(): string
  remove(): void
}

interface ChildrenMixin {
  // Sorted back-to-front. I.e. the top-most child is last in this array.
  readonly children: ReadonlyArray<BaseNode>

  // Adds to the end of the .children array. I.e. visually on top of all other
  // children.
  appendChild(child: BaseNode): void

  insertChild(index: number, child: BaseNode): void

  // Searches this entire subtree (this node's children, its children's
  // children, etc.). Returns all nodes searched for which "callback"
  // returns true. If "callback" is omitted, this returns all nodes in
  // the subtree.
  //
  // Nodes are included in back-to-front order. Parents always appear
  // before their children, and children appear in same relative order
  // as in the .children array. I.e. this uses "Pre-order traversal"
  // https://en.wikipedia.org/wiki/Tree_traversal#Pre-order_(NLR)
  // Note that this node itself is not included.
  //
  // Example:
  //
  //   const colors = figma.currentPage.findAll(n => n.name === 'Color');
  //
  findAll(callback?: (node: BaseNode) => boolean): ReadonlyArray<BaseNode>

  // Searches this entire subtree (this node's children, its children's
  // children, etc.). Returns the first node searched for which "callback"
  // returns true. Traversal order is the same order as "findAll". Returns
  // null if nothing was found.
  //
  // Example:
  //
  //   const template = figma.currentPage.findOne(n => n.name === 'Template');
  //
  findOne(callback: (node: BaseNode) => boolean): BaseNode | null
}

interface LayoutMixin {
  relativeTransform: Transform
  x: number // The same as "relativeTransform[0][2]"
  y: number // The same as "relativeTransform[1][2]"

  readonly size: Vector
  readonly width: number // The same as "size.x"
  readonly height: number // The same as "size.y"

  // Resizes the node. If the node has constraints, it applies them to it's children
  resize(width: number, height: number): void
  // Resizes the node. If the node has constraints, they are ignored
  resizeWithoutConstraints(width: number, height: number): void

  constraints: Constraints
}

interface BlendMixin {
  opacity: number
  blendMode: BlendMode
  isMask: boolean
  effects: ReadonlyArray<Effect>

  // Id of an EFFECT style
  // If non-empty, effects will return that of the style
  effectStyleId: string
}

interface FrameMixin {
  backgrounds: ReadonlyArray<Paint>
  layoutGrids: ReadonlyArray<LayoutGrid>
  clipsContent: boolean

  guides: ReadonlyArray<Guide>

  // Id of a GRID style
  // If non-empty, layoutGrids will return that of the style
  gridStyleId: string

  // Id of a FILL style
  // If non-empty, backgrounds will return that of the style
  backgroundStyleId: string
}

interface GeometryMixin {
  fills: ReadonlyArray<Paint>
  strokes: ReadonlyArray<Paint>
  strokeWeight: number
  strokeAlign: "CENTER" | "INSIDE" | "OUTSIDE"
  strokeCap: "NONE" | "ROUND" | "SQUARE" | "ARROW_LINES" | "ARROW_EQUILATERAL"
  strokeJoin: "MITER" | "BEVEL" | "ROUND"
  dashPattern: ReadonlyArray<number>

  // Id of a FILL style
  // If non-empty, fills will return that of the style
  fillStyleId: string

  // Id of a FILL style
  // If non-empty, strokes will return that of the style
  strokeStyleId: string
}

interface CornerMixin {
  cornerRadius: number
  cornerSmoothing: number
}

interface ExportMixin {
  exportSettings: ExportSettings[]
  exportAsync(settings?: ExportSettings): Promise<Uint8Array> // Defaults to PNG format
}

////////////////////////////////////////////////////////////////////////////////
// Nodes

interface DocumentNode extends BaseNodeMixin, ChildrenMixin {
  readonly type: "DOCUMENT"
  clone(): DocumentNode // Note: this always throws an error
}

interface PageNode extends BaseNodeMixin, ChildrenMixin, ExportMixin {
  readonly type: "PAGE"
  clone(): PageNode

  guides: ReadonlyArray<Guide>
  selection: ReadonlyArray<BaseNode>
}

interface FrameNode extends BaseNodeMixin, BlendMixin, ChildrenMixin, FrameMixin, LayoutMixin, ExportMixin {
  readonly type: "FRAME"
  clone(): FrameNode
}

interface SliceNode extends BaseNodeMixin, LayoutMixin, ExportMixin {
  readonly type: "SLICE"
  clone(): SliceNode
}

interface RectangleNode extends BaseNodeMixin, BlendMixin, CornerMixin, GeometryMixin, LayoutMixin, ExportMixin {
  readonly type: "RECTANGLE"
  clone(): RectangleNode
  topLeftRadius: number
  topRightRadius: number
  bottomLeftRadius: number
  bottomRightRadius: number
}

interface LineNode extends BaseNodeMixin, BlendMixin, GeometryMixin, LayoutMixin, ExportMixin {
  readonly type: "LINE"
  clone(): LineNode
}

interface EllipseNode extends BaseNodeMixin, BlendMixin, CornerMixin, GeometryMixin, LayoutMixin, ExportMixin {
  readonly type: "ELLIPSE"
  clone(): EllipseNode
  arcData: ArcData
}

interface PolygonNode extends BaseNodeMixin, BlendMixin, CornerMixin, GeometryMixin, LayoutMixin, ExportMixin {
  readonly type: "POLYGON"
  clone(): PolygonNode
  pointCount: number
}

interface StarNode extends BaseNodeMixin, BlendMixin, CornerMixin, GeometryMixin, LayoutMixin, ExportMixin {
  readonly type: "STAR"
  clone(): StarNode
  pointCount: number
  starInnerRadius: number
}

interface VectorNode extends BaseNodeMixin, BlendMixin, CornerMixin, GeometryMixin, LayoutMixin, ExportMixin {
  readonly type: "VECTOR"
  clone(): VectorNode
  vectorNetwork: VectorNetwork
  vectorPaths: VectorPaths
}

interface TextNode extends BaseNodeMixin, BlendMixin, GeometryMixin, LayoutMixin, ExportMixin {
  readonly type: "TEXT"
  clone(): TextNode
  characters: string
  fontSize: number
  fontName: FontName
  textAlignHorizontal: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED"
  textAlignVertical: "TOP" | "CENTER" | "BOTTOM"
  textDecoration: "NONE" | "UNDERLINE" | "STRIKETHROUGH"
  textAutoResize: "NONE" | "WIDTH_AND_HEIGHT" | "HEIGHT"
  letterSpacing: NumberWithUnits
  lineHeight: NumberWithUnits
  paragraphIndent: number
  paragraphSpacing: number
  textCase: "ORIGINAL" | "UPPER" | "LOWER" | "TITLE"

  // If this is set to true, "name" will be auto-derived from "characters".
  // Note that this is automatically reset to false if "name" is modified in
  // order to allow the node to keep the new name.
  autoRename: boolean

  // Id of a TEXT style
  // If non-empty, various text properties will return that of the style
  textStyleId: string
}

interface ComponentNode extends BaseNodeMixin, BlendMixin, ChildrenMixin, FrameMixin, LayoutMixin, ExportMixin {
  readonly type: "COMPONENT"
  clone(): ComponentNode
  createInstance(): InstanceNode
  description: string
  readonly isRemote: boolean
}

interface InstanceNode extends BaseNodeMixin, BlendMixin, ChildrenMixin, FrameMixin, LayoutMixin, ExportMixin {
  readonly type: "INSTANCE"
  clone(): InstanceNode
  readonly masterComponent: ComponentNode
}

interface BooleanOperationNode extends BaseNodeMixin, BlendMixin, ChildrenMixin, CornerMixin, GeometryMixin, LayoutMixin, ExportMixin {
  readonly type: "BOOLEAN_OPERATION"
  clone(): BooleanOperationNode
  booleanOperation: "UNION" | "INTERSECT" | "SUBTRACT" | "EXCLUDE"
}

type BaseNode =
  DocumentNode |
  PageNode |
  SliceNode |
  FrameNode |
  ComponentNode |
  InstanceNode |
  BooleanOperationNode |
  VectorNode |
  StarNode |
  LineNode |
  EllipseNode |
  PolygonNode |
  RectangleNode |
  TextNode

type NodeType =
  "DOCUMENT" |
  "PAGE" |
  "SLICE" |
  "FRAME" |
  "COMPONENT" |
  "INSTANCE" |
  "BOOLEAN_OPERATION" |
  "VECTOR" |
  "STAR" |
  "LINE" |
  "ELLIPSE" |
  "POLYGON" |
  "RECTANGLE" |
  "TEXT"

////////////////////////////////////////////////////////////////////////////////
// Styles
type StyleType = 'PAINT' | 'TEXT' | 'EFFECT' | 'GRID'

interface BaseStyle {
  // The string to uniquely identify a style by
  readonly id: string
  readonly type: StyleType
  name: string // Note: setting this also sets "autoRename" to false on TextNodes
  description: string

  // Returns whether the style belongs to the current file.
  // Remote styles and nodes cannot be modified.
  isRemote(): boolean

  // Deletes a style if it can be modified.
  remove(): void
}

interface PaintStyle extends BaseStyle {
  type: 'PAINT'
  paints: ReadonlyArray<Paint>
}

interface TextStyle extends BaseStyle {
  type: 'TEXT'
  fontSize: number
  textDecoration: "NONE" | "UNDERLINE" | "STRIKETHROUGH"
  fontName: FontName
  letterSpacing: NumberWithUnits
  lineHeight: NumberWithUnits
  paragraphIndent: number
  paragraphSpacing: number
  textCase: "ORIGINAL" | "UPPER" | "LOWER" | "TITLE"
}

interface EffectStyle extends BaseStyle {
  type: 'EFFECT'
  effects: ReadonlyArray<Paint>
}

interface GridStyle extends BaseStyle {
  type: 'GRID'
  layoutGrids: ReadonlyArray<LayoutGrid>
}

////////////////////////////////////////////////////////////////////////////////
// Other

interface Image {
  // Returns a unique hash for the image
  readonly hash: string

  // The contents of the image file
  getBytesAsync(): Promise<Uint8Array>
}

