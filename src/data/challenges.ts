export interface Challenge {
  id: string;
  title: string;
  difficulty: 'Hard' | 'Expert';
  tags: string[];
  description: string;
  problemStatement: string;
  constraints: string[];
  exampleInput: string;
  exampleOutput: string;
  initialCode: string;
  solutionCode?: string;
}

export const challenges: Challenge[] = [
  {
    id: 'std-cell-placement',
    title: '1D Standard Cell Placement',
    difficulty: 'Hard',
    tags: ['Simulated Annealing', 'Graph', 'Optimization', 'Layout'],
    description: 'Optimize the placement of standard cells in a 1D row to minimize total wirelength.',
    problemStatement: `You are given a list of standard cells, each with a fixed width, and a netlist describing the connections between them. All cells must be placed in a single 1D row without overlapping. Your goal is to find an ordering of these cells that minimizes the total half-perimeter wirelength (HPWL) of all nets. Provide an optimization heuristic such as Simulated Annealing or Greedy swaps.`,
    constraints: [
      '1 <= number of cells <= 100',
      '1 <= number of nets <= 500',
      'Return the optimized list of cell names.'
    ],
    exampleInput: `cells = '( ("INVX1" 2) ("NAND2X1" 3) ("NOR2X1" 3) )\nnets = '( (net1 ("INVX1" "NAND2X1")) (net2 ("NAND2X1" "NOR2X1")) )`,
    exampleOutput: `'( "INVX1" "NAND2X1" "NOR2X1" ) ; Total HPWL is minimized`,
    initialCode: `; Challenge: Standard Cell Placement\nprocedure( optimizePlacement(cells nets)\n  let( (bestPlacement)\n    ; Implement your heuristic here\n    \n    bestPlacement\n  )\n)`,
    solutionCode: `; Solution: Greedy Swap Heuristic (Simplified for constraints)
procedure( optimizePlacement(cells nets)
  let( (currentOrder bestOrder currentCost bestCost improved (maxIter 100))
    currentOrder = mapcar('car cells)
    procedure( calcHPWL(order cells nets)
      let( (posTable (currX 0) cost)
        posTable = makeTable("pos" 0)
        foreach( cellName order
          cellWidth = cadr(assoc(cellName cells))
          posTable[cellName] = currX + cellWidth/2.0
          currX = currX + cellWidth
        )
        cost = 0.0
        foreach( net nets
          let( (minX maxX pins)
            pins = cadr(net) minX = 1e9 maxX = -1e9
            foreach( pin pins
              px = posTable[pin]
              if( px < minX then minX = px )
              if( px > maxX then maxX = px )
            )
            cost = cost + (maxX - minX)
          )
        )
        cost
      )
    )
    bestOrder = currentOrder bestCost = calcHPWL(bestOrder cells nets) improved = t
    while( improved && maxIter > 0
      improved = nil maxIter = maxIter - 1
      for( i 0 length(currentOrder)-2
        for( j i+1 length(currentOrder)-1
          let( (newOrder temp cost)
            newOrder = copy(currentOrder)
            temp = nth(i newOrder)
            setnth(i newOrder nth(j newOrder)) setnth(j newOrder temp)
            cost = calcHPWL(newOrder cells nets)
            if( cost < bestCost then
              bestCost = cost bestOrder = newOrder currentOrder = newOrder improved = t
            )
          )
        )
      )
    )
    bestOrder
  )
)`
  },
  {
    id: 'signal-path-latency',
    title: 'Critical Path Buffer Insertion',
    difficulty: 'Expert',
    tags: ['Dynamic Programming', 'Graph', 'Timing Analysis'],
    description: 'Insert buffers to minimize the latency of the longest path in a combinational logic DAG.',
    problemStatement: `Given a Directed Acyclic Graph (DAG) representing a combinational logic circuit. Each gate has a base delay, and wires have length-based delays. You can insert buffers on wires to reset the wire delay, adding a fixed intrinsic delay. Determine the optimal locations for buffers to minimize the arrival time at the primary outputs.`,
    constraints: [
      'Nodes <= 1000',
      'Return a list of wires where buffers should be inserted: ((src dest num_buffers) ...)'
    ],
    exampleInput: `gates = '( (g1 1.0) (g2 1.5) (g3 1.2) )\nwires = '( (g1 g2 5.0) (g2 g3 3.0) )\nbufDelay = 1.0`,
    exampleOutput: `'((g1 g2 1))`,
    initialCode: `procedure( minimizeLatency(gates wires bufDelay)\n  ; Your code here\n)`,
    solutionCode: `; Solution: Delay Thresholding Heuristic
procedure( minimizeLatency(gates wires bufDelay)
  let( (result)
    result = list()
    foreach( wire wires
      let( (src dest wDelay numBufs)
        src = car(wire) dest = cadr(wire) wDelay = caddr(wire)
        if( wDelay > 2.0 * bufDelay then
          numBufs = round(wDelay / bufDelay) - 1
          if( numBufs > 0 then
            result = cons(list(src dest numBufs) result)
          )
        )
      )
    )
    result
  )
)`
  },
  {
    id: 'schematic-auto-router',
    title: 'A* Schematic Auto-Router',
    difficulty: 'Hard',
    tags: ['Schematic', 'Routing', 'Graph', 'A* Search'],
    description: 'Implement an orthogonal A* router for a schematic view, avoiding instance bounding boxes.',
    problemStatement: `Find a collision-free orthogonal path (only horizontal and vertical segments) connecting a source pin to a target pin. The path should minimize the total wire length. Instances are rectangular obstacles.`,
    constraints: [
      'Coordinates are integers.',
      'Return a list of points: ((x1 y1) (x2 y2) ...)',
      'Return nil if no path.'
    ],
    exampleInput: `source = '(0 0)\ntarget = '(10 10)\ninstances = '( ((2 2) (8 8)) )`,
    exampleOutput: `'((0 0) (0 10) (10 10))`,
    initialCode: `procedure( routeSchematicNet(source target instances)\n  ; Your A* code here\n)`,
    solutionCode: `; Solution: Grid-based A* Search
procedure( routeSchematicNet(source target instances)
  let( (openSet closedSet cameFrom gScore fScore current path found)
    procedure( h(p1 p2) (abs(car(p1)-car(p2)) + abs(cadr(p1)-cadr(p2))) )
    procedure( isBlocked(pt insts)
      let( (blocked x y)
        x = car(pt) y = cadr(pt) blocked = nil
        foreach( inst insts
          let( (ll ur) ll = car(inst) ur = cadr(inst)
            if( x >= car(ll) && x <= car(ur) && y >= cadr(ll) && y <= cadr(ur) then blocked = t )
          )
        )
        blocked
      )
    )
    openSet = list(source) gScore = makeTable("g" 1e9) fScore = makeTable("f" 1e9) cameFrom = makeTable("cf" nil)
    gScore[source] = 0 fScore[source] = h(source target)
    while( openSet && !found
      current = car(openSet)
      foreach( node openSet if( fScore[node] < fScore[current] then current = node ) )
      if( current == target then found = t
      else
        openSet = remove(current openSet) closedSet = cons(current closedSet)
        let( (neighbors x y) x = car(current) y = cadr(current)
          neighbors = list( list(x+1 y) list(x-1 y) list(x y+1) list(x y-1) )
          foreach( nbr neighbors
            if( !member(nbr closedSet) && !isBlocked(nbr instances) then
              let( (tentativeG) tentativeG = gScore[current] + 1
                if( tentativeG < gScore[nbr] then
                  cameFrom[nbr] = current gScore[nbr] = tentativeG fScore[nbr] = tentativeG + h(nbr target)
                  if( !member(nbr openSet) then openSet = cons(nbr openSet) )
                )
              )
            )
          )
        )
      )
    )
    if( found then path = list(current)
      while( cameFrom[current] current = cameFrom[current] path = cons(current path) )
      path
    else nil )
  )
)`
  },
  {
    id: 'hierarchical-db-traversal',
    title: 'Recursive DB Traversal & Update',
    difficulty: 'Expert',
    tags: ['Database', 'Hierarchy', 'Recursion'],
    description: 'Traverse a design hierarchy to find and update specific instance properties.',
    problemStatement: `Given a top-level cell view database object representation (simulated as nested lists). Recursively traverse to find all instances of 'cellName' and update 'propName' to 'newVal' if its current value < 'minVal'. Return paths of modified instances.`,
    constraints: [
      'Hierarchy simulated as: (name props instances...)',
      'Return list of paths like "I0/M1".'
    ],
    exampleInput: `cv = '("top" nil ("I0" ("nmos_rf" (("w" 1.5)))))\ncellName = "nmos_rf"\npropName = "w"\nminVal = 2.0\nnewVal = 2.5`,
    exampleOutput: `'("I0")`,
    initialCode: `procedure( updateDeepProperties(cv cellName propName minVal newVal)\n  ; Your recursion here\n)`,
    solutionCode: `; Solution: DFS Recursive Traversal
procedure( updateDeepProperties(cv cellName propName minVal newVal)
  let( (results)
    procedure( traverse(inst path)
      let( (iName iMaster iProps children)
        iName = car(inst)
        iMaster = if( listp(cadr(inst)) then car(cadr(inst)) else nil )
        iProps = if( listp(cadr(inst)) then cadr(cadr(inst)) else nil )
        children = cddr(inst)
        if( iMaster == cellName then
          let( (valObj val) valObj = assoc(propName iProps)
            if( valObj then val = cadr(valObj)
              if( val < minVal then results = cons(path results) )
            )
          )
        )
        foreach( child children
          let( (newPath) newPath = if( path == "" then car(child) else strcat(path "/" car(child)) )
            traverse(child newPath)
          )
        )
      )
    )
    foreach( topInst cddr(cv) traverse(topInst car(topInst)) )
    reverse(results)
  )
)`
  },
  {
    id: 'netlist-parser',
    title: 'SPICE Netlist Graph Builder',
    difficulty: 'Hard',
    tags: ['Parsing', 'Graph', 'Netlist'],
    description: 'Parse a text-based SPICE netlist and build a node-to-instance adjacency list.',
    problemStatement: `Parse a multi-line string. Each line is: \`<Inst> <Node1> <Node2> ... <Model>\`. Ignore lines starting with '*'. Build an association list where keys are node names and values are lists of connected instance names.`,
    constraints: [
      'Efficient string processing required.'
    ],
    exampleInput: `netlistStr = "* Netlist\\nM1 VDD IN OUT GND nmos\\nM2 OUT IN GND GND nmos"`,
    exampleOutput: `'("VDD" ("M1") "IN" ("M1" "M2") "OUT" ("M1" "M2") "GND" ("M1" "M2"))`,
    initialCode: `procedure( parseNetlistToGraph(netlistStr)\n  ; Parser logic\n)`,
    solutionCode: `; Solution: String tokenization and Table construction
procedure( parseNetlistToGraph(netlistStr)
  let( (lines graphTable result (newLine "\\n"))
    lines = parseString(netlistStr newLine)
    graphTable = makeTable("graph" nil)
    foreach( line lines
      if( substring(line 1 1) != "*" && strlen(line) > 0 then
        let( (tokens instName model nodes)
          tokens = parseString(line " \t")
          if( length(tokens) >= 3 then
            instName = car(tokens) model = car(last(tokens))
            nodes = cdr(reverse(cdr(reverse(cdr(tokens)))))
            foreach( node nodes
              if( !member(instName graphTable[node]) then graphTable[node] = cons(instName graphTable[node]) )
            )
          )
        )
      )
    )
    result = list()
    foreach( key graphTable result = cons(key result) result = cons(reverse(graphTable[key]) result) )
    reverse(result)
  )
)`
  },
  {
    id: 'sweep-line-drc',
    title: 'O(N log N) Sweep-Line DRC Spacing Check',
    difficulty: 'Expert',
    tags: ['Algorithms', 'Sweep-Line', 'Geometry', 'DRC'],
    description: 'Implement a sweep-line algorithm to find pairs of rectangles violating a minimum spacing rule.',
    problemStatement: `Given a list of rectangles \`(id (x1 y1) (x2 y2))\` and a \`minSpace\`. Return a list of ID pairs \`(id1 id2)\` that are closer than \`minSpace\` in both X and Y dimensions. Avoid O(N^2) complexity by using a sweep-line sorting approach on the X-axis.`,
    constraints: [
      'N up to 100,000.',
      'Return unique pairs.'
    ],
    exampleInput: `shapes = '( (1 (0 0) (10 10)) (2 (11 0) (20 10)) (3 (30 0) (40 10)) )\nminSpace = 2.0`,
    exampleOutput: `'((1 2))`,
    initialCode: `procedure( fastSpacingDRC(shapes minSpace)\n  ; Sweep line logic\n)`,
    solutionCode: `; Solution: 1D Sweep Line Algorithm
procedure( fastSpacingDRC(shapes minSpace)
  let( (events activeSet violations)
    events = list()
    foreach( s shapes
      let( (id bbox x1 x2) id = car(s) bbox = cadr(s) x1 = car(car(bbox)) x2 = car(cadr(bbox))
        events = cons(list(x1 'L s) events) events = cons(list(x2 + minSpace 'R s) events)
      )
    )
    events = sort(events lambda((a b) if( car(a) == car(b) then cadr(a) == 'L else car(a) < car(b) )))
    activeSet = list() violations = list()
    foreach( ev events
      let( (x type s id bbox y1 y2) x = car(ev) type = cadr(ev) s = caddr(ev) id = car(s) bbox = cadr(s)
        y1 = cadr(car(bbox)) y2 = cadr(cadr(bbox))
        if( type == 'L then
          foreach( act activeSet
            let( (actId actBbox ay1 ay2) actId = car(act) actBbox = cadr(act) ay1 = cadr(car(actBbox)) ay2 = cadr(cadr(actBbox))
              if( !(y2 + minSpace < ay1 || y1 - minSpace > ay2) then violations = cons(list(actId id) violations) )
            )
          )
          activeSet = cons(s activeSet)
        else activeSet = remove(s activeSet) )
      )
    )
    violations
  )
)`
  },
  {
    id: 'minimum-spanning-tree-routing',
    title: 'Multi-Pin MST Net Routing',
    difficulty: 'Hard',
    tags: ['Graph', 'Kruskal', 'Routing'],
    description: 'Find the Minimum Spanning Tree (MST) of a multi-pin net to estimate routing length.',
    problemStatement: `Given a list of pin coordinates for a single net, compute the MST using Manhattan distance as the edge weight. Return the total wirelength of the MST.`,
    constraints: [
      'Pins <= 1000'
    ],
    exampleInput: `pins = '( (0 0) (0 10) (10 10) (10 0) )`,
    exampleOutput: `30`,
    initialCode: `procedure( estimateNetLength(pins)\n  ; MST logic\n)`,
    solutionCode: `; Solution: Kruskal's Algorithm with Union-Find
procedure( estimateNetLength(pins)
  let( (edges totalLength parent rank)
    procedure( dist(p1 p2) (abs(car(p1)-car(p2)) + abs(cadr(p1)-cadr(p2))) )
    edges = list()
    for( i 0 length(pins)-2
      for( j i+1 length(pins)-1
        edges = cons(list(nth(i pins) nth(j pins) dist(nth(i pins) nth(j pins))) edges)
      )
    )
    edges = sort(edges lambda((a b) caddr(a) < caddr(b)))
    parent = makeTable("p" nil) rank = makeTable("r" 0)
    foreach( p pins parent[p] = p rank[p] = 0 )
    procedure( findSet(x) if( parent[x] != x then parent[x] = findSet(parent[x]) ) parent[x] )
    procedure( unionSet(x y)
      let( (rx ry) rx = findSet(x) ry = findSet(y)
        if( rx != ry then
          if( rank[rx] > rank[ry] then parent[ry] = rx
          else parent[rx] = ry if( rank[rx] == rank[ry] then rank[ry] = rank[ry] + 1 ) )
        )
      )
    )
    totalLength = 0
    foreach( edge edges
      let( (u v w) u = car(edge) v = cadr(edge) w = caddr(edge)
        if( findSet(u) != findSet(v) then unionSet(u v) totalLength = totalLength + w )
      )
    )
    totalLength
  )
)`
  },
  {
    id: 'channel-routing-left-edge',
    title: 'Left-Edge Channel Routing',
    difficulty: 'Hard',
    tags: ['Algorithms', 'Routing', 'Scheduling'],
    description: 'Assign horizontal wire segments to tracks in a channel to minimize total tracks.',
    problemStatement: `Given a list of net intervals \`(net_name start_x end_x)\` on a single routing layer. You must assign each interval to a horizontal track (1, 2, 3...) such that no two intervals overlap on the same track. Minimize the number of tracks used. Return an association list mapping net names to track numbers.`,
    constraints: [
      'Intervals <= 5000',
      'Return format: (("net1" 1) ("net2" 2) ...)'
    ],
    exampleInput: `intervals = '( ("A" 1 5) ("B" 2 4) ("C" 6 9) ("D" 3 7) )`,
    exampleOutput: `'(( "A" 1 ) ( "B" 2 ) ( "C" 1 ) ( "D" 3 ))`,
    initialCode: `procedure( leftEdgeRouter(intervals)\n  ; Left-Edge logic\n)`,
    solutionCode: `; Solution: Left-Edge Algorithm (Greedy Interval Scheduling)
procedure( leftEdgeRouter(intervals)
  let( (sorted trackAssig tracks currentTrack unassigned)
    sorted = sort(intervals lambda((a b) cadr(a) < cadr(b)))
    trackAssig = list() currentTrack = 1 unassigned = sorted
    while( unassigned
      let( (lastEnd nextUnassigned) lastEnd = -1e9 nextUnassigned = list()
        foreach( inv unassigned
          let( (name startX endX) name = car(inv) startX = cadr(inv) endX = caddr(inv)
            if( startX >= lastEnd then
              trackAssig = cons(list(name currentTrack) trackAssig) lastEnd = endX
            else nextUnassigned = cons(inv nextUnassigned) )
          )
        )
        unassigned = reverse(nextUnassigned) currentTrack = currentTrack + 1
      )
    )
    reverse(trackAssig)
  )
)`
  },
  {
    id: 'k-way-graph-partition',
    title: 'K-Way Netlist Partitioning',
    difficulty: 'Expert',
    tags: ['Graph', 'Partitioning', 'Heuristic'],
    description: 'Partition a netlist into K blocks minimizing cut-nets.',
    problemStatement: `Given a list of nodes and a list of nets (each net is a list of node names), partition the nodes into K equally sized blocks (±1 node) such that the number of nets spanning more than one block is minimized. Return a list of blocks, where each block is a list of node names.`,
    constraints: [
      'Nodes <= 200',
      'K <= 4'
    ],
    exampleInput: `nodes = '("n1" "n2" "n3" "n4")\nnets = '( ("n1" "n2") ("n3" "n4") ("n2" "n3") )\nK = 2`,
    exampleOutput: `'(( "n1" "n2" ) ( "n3" "n4" ))`,
    initialCode: `procedure( partitionNetlist(nodes nets K)\n  ; Partition logic\n)`,
    solutionCode: `; Solution: Randomized Greedy Partitioning (FM Approximation)
procedure( partitionNetlist(nodes nets K)
  let( (blocks targetSize (bestCut 1e9) bestBlocks (iters 100))
    targetSize = ceiling(length(nodes) / float(K))
    procedure( calcCut(blks)
      let( (cut (netToBlock makeTable("nb" nil)))
        foreach( idx 1 length(blks) foreach( n nth(idx-1 blks) netToBlock[n] = idx ) )
        cut = 0
        foreach( net nets
          let( (bSet) bSet = list()
            foreach( p net if( !member(netToBlock[p] bSet) then bSet = cons(netToBlock[p] bSet) ) )
            if( length(bSet) > 1 then cut = cut + 1 )
          )
        )
        cut
      )
    )
    for( iter 1 iters
      let( (shuffled currBlocks currCut)
        shuffled = sort(copy(nodes) lambda((a b) random(100) < 50))
        currBlocks = list()
        let( (start 0)
          for( i 1 K
            let( (blk (end min(start+targetSize length(shuffled))))
              blk = list() for( j start end-1 blk = cons(nth(j shuffled) blk) )
              currBlocks = cons(reverse(blk) currBlocks) start = end
            )
          )
        )
        currBlocks = reverse(currBlocks) currCut = calcCut(currBlocks)
        if( currCut < bestCut then bestCut = currCut bestBlocks = currBlocks )
      )
    )
    bestBlocks
  )
)`
  },
  {
    id: 'power-grid-ir-drop',
    title: 'Power Grid IR Drop Analysis',
    difficulty: 'Expert',
    tags: ['Math', 'Circuit', 'Matrix'],
    description: 'Solve the nodal equations for a simplified 2D resistive power grid.',
    problemStatement: `You are given a 2D N x M grid of resistors (all 1 ohm). The node at (0,0) is an ideal VDD source at 1.0V. Specific nodes have current sinks pulling current to ground. Calculate the voltage at every node using numerical iteration (e.g., Gauss-Seidel). Return the minimum voltage in the grid (worst IR drop).`,
    constraints: [
      'Grid size up to 20x20.',
      'Tolerance 1e-4.'
    ],
    exampleInput: `N = 3  M = 3\nsinks = '( ((2 2) 0.1) )`,
    exampleOutput: `0.7`,
    initialCode: `procedure( calculateWorstIRDrop(N M sinks)\n  ; Matrix solver\n)`,
    solutionCode: `; Solution: Gauss-Seidel Relaxation for Resistor Grid
procedure( calculateWorstIRDrop(N M sinks)
  let( (V newV (maxIter 1000) (tol 1e-4) converged minVol)
    V = makeTable("v" 1.0)
    for( i 0 N-1 for( j 0 M-1 V[list(i j)] = 1.0 ) )
    converged = nil
    while( !converged && maxIter > 0
      maxIter = maxIter - 1 converged = t
      for( i 0 N-1
        for( j 0 M-1
          if( !(i == 0 && j == 0) then
            let( (sumV count iSink currV nxtV)
              sumV = 0.0 count = 0
              if( i > 0 then sumV = sumV + V[list(i-1 j)] count = count + 1 )
              if( i < N-1 then sumV = sumV + V[list(i+1 j)] count = count + 1 )
              if( j > 0 then sumV = sumV + V[list(i j-1)] count = count + 1 )
              if( j < M-1 then sumV = sumV + V[list(i j+1)] count = count + 1 )
              iSink = 0.0
              let( (sinkObj) sinkObj = assoc(list(i j) sinks) if( sinkObj then iSink = cadr(sinkObj) ) )
              currV = V[list(i j)] nxtV = (sumV - iSink * 1.0) / count
              if( abs(nxtV - currV) > tol then converged = nil )
              V[list(i j)] = nxtV
            )
          )
        )
      )
    )
    minVol = 1.0
    for( i 0 N-1 for( j 0 M-1 if( V[list(i j)] < minVol then minVol = V[list(i j)] ) ) )
    minVol
  )
)`
  }
  ,{
    id: 'decap-insertion-max-rect',
    title: 'Decap Insertion (Maximal Empty Rectangle)',
    difficulty: 'Hard',
    tags: ['DRC', 'Physical Design', 'Stack', 'Geometry'],
    description: 'Find the largest rectangular empty area in a placement grid to insert decoupling capacitors.',
    problemStatement: "Given a 2D binary matrix where 1 represents an occupied standard cell or blockage, and 0 represents empty space. Find the area of the largest rectangle containing only 0s. This is used to locate the best contiguous area to insert decoupling capacitors for IR drop mitigation.",
    constraints: [
      "Matrix dimensions M, N <= 1000",
      "Must run in O(M*N) time using the histogram stack method.",
      "Return the integer area of the largest rectangle."
    ],
    exampleInput: "grid = '( (1 0 1 0 0)\n         (1 0 1 1 1)\n         (1 1 1 1 1)\n         (1 0 0 1 0) )",
    exampleOutput: "4 ; The 2x2 empty block at top-right",
    initialCode: "procedure( maxDecapArea(grid R C)\n  ; Your code here\n)",
    solutionCode: "; Solution: Histogram Stack Algorithm\nprocedure( maxDecapArea(grid R C)\n  let( (maxArea heights stack)\n    maxArea = 0\n    heights = makeVector(C 0)\n    for( r 0 R-1\n      for( c 0 C-1\n        if( nth(c nth(r grid)) == 0 then\n          setarray(heights c heights[c]+1)\n        else\n          setarray(heights c 0)\n        )\n      )\n      stack = list()\n      for( c 0 C\n        let( (h)\n          h = if( c == C then 0 else heights[c] )\n          while( stack && heights[car(stack)] >= h\n            let( (top H W)\n              top = car(stack) stack = cdr(stack)\n              H = heights[top]\n              W = if( stack then c - car(stack) - 1 else c )\n              if( H * W > maxArea then maxArea = H * W )\n            )\n          )\n          stack = cons(c stack)\n        )\n      )\n    )\n    maxArea\n  )\n)"
  },
  {
    id: 'package-tsp-drill',
    title: 'Package Drill Path (TSP Bitmask DP)',
    difficulty: 'Expert',
    tags: ['Packaging', 'DP', 'Graph', 'Optimization'],
    description: 'Optimize the movement path of a laser drill bit across a PCB/Package substrate.',
    problemStatement: "Given a list of (X, Y) coordinates representing micro-via drill locations on a package substrate. Find the shortest possible tour that visits all drill locations exactly once and returns to the origin point (first coordinate). You must use Bitmask Dynamic Programming for an exact solution.",
    constraints: [
      "Number of points N <= 15.",
      "Coordinates are integers, use Euclidean distance.",
      "Return the minimal path length as a float."
    ],
    exampleInput: "pts = '( (0 0) (0 3) (4 0) (4 3) )",
    exampleOutput: "14.0",
    initialCode: "procedure( optimizeDrillPath(pts)\n  ; Your TSP Bitmask DP here\n)",
    solutionCode: "; Solution: TSP Bitmask DP\nprocedure( optimizeDrillPath(pts)\n  let( (N dist dp (inf 1e9) minCost)\n    N = length(pts)\n    dist = makeVector(N*N 0)\n    for( i 0 N-1\n      for( j 0 N-1\n        let( (p1 p2) p1=nth(i pts) p2=nth(j pts)\n          setarray(dist i*N+j sqrt((car(p1)-car(p2))**2 + (cadr(p1)-cadr(p2))**2))\n        )\n      )\n    )\n    dp = makeTable(\"dp\" inf)\n    dp[list(1 0)] = 0.0\n    for( mask 1 (lsh(1 N)-1)\n      for( u 0 N-1\n        if( bitfield(mask u 1) == 1 then\n          let( (dpu) dpu = dp[list(mask u)]\n            if( dpu != inf then\n              for( v 0 N-1\n                if( bitfield(mask v 1) == 0 then\n                  let( (nextMask ndp)\n                    nextMask = mask | lsh(1 v)\n                    ndp = dpu + dist[u*N+v]\n                    if( ndp < dp[list(nextMask v)] then\n                      dp[list(nextMask v)] = ndp\n                    )\n                  )\n                )\n              )\n            )\n          )\n        )\n      )\n    )\n    minCost = inf\n    for( i 1 N-1\n      let( (cost) cost = dp[list((lsh(1 N)-1) i)] + dist[i*N+0]\n        if( cost < minCost then minCost = cost )\n      )\n    )\n    minCost\n  )\n)"
  },
  {
    id: 'maze-routing-3d',
    title: '2-Layer Maze Routing with Via Cost',
    difficulty: 'Hard',
    tags: ['Routing', 'A*', 'Grid', 'Graph'],
    description: 'Find the lowest-cost routing path across two metal layers with different directional preferences.',
    problemStatement: "You are given a 3D grid consisting of 2 layers (Metal 1 and Metal 2). Metal 1 prefers horizontal routing (cost 1 for dx, cost 5 for dy). Metal 2 prefers vertical routing (cost 5 for dx, cost 1 for dy). Transitioning between layers costs viaCost. Find the minimum cost path from source (x1, y1, z1) to target (x2, y2, z2).",
    constraints: [
      "Grid bounds: 0 to 100 in X and Y.",
      "Z is 1 or 2.",
      "Return the minimum cost integer."
    ],
    exampleInput: "src = '(0 0 1)  tgt = '(10 10 1)\nviaCost = 5",
    exampleOutput: "25 ; M1 to (10 0 1), via to M2, M2 to (10 10 2), total = 25",
    initialCode: "procedure( route2Layer(src tgt viaCost)\n  ; A* / Dijkstra logic\n)",
    solutionCode: "; Solution: Dijkstra Algorithm on 3D Grid\nprocedure( route2Layer(src tgt viaCost)\n  let( (pq dist visited dx dy found)\n    pq = list(list(0 src))\n    dist = makeTable(\"dist\" 1e9)\n    dist[src] = 0\n    visited = makeTable(\"vis\" nil)\n    dx = '(1 -1 0 0)\n    dy = '(0 0 1 -1)\n    while( pq && !found\n      pq = sort(pq lambda((a b) car(a) < car(b)))\n      let( (node d u x y z)\n        node = car(pq) pq = cdr(pq)\n        d = car(node) u = cadr(node)\n        x = car(u) y = cadr(u) z = caddr(u)\n        if( u == tgt then found = d\n        else\n          if( !visited[u] then\n            visited[u] = t\n            for( i 0 3\n              let( (nx ny cost nxt)\n                nx = x + nth(i dx) ny = y + nth(i dy)\n                if( nx>=0 && nx<100 && ny>=0 && ny<100 then\n                  cost = if( z==1 then (if( nth(i dx)!=0 then 1 else 5 )) else (if( nth(i dy)!=0 then 1 else 5 )) )\n                  nxt = list(nx ny z)\n                  if( d+cost < dist[nxt] then\n                    dist[nxt] = d+cost\n                    pq = cons(list(dist[nxt] nxt) pq)\n                  )\n                )\n              )\n            )\n            let( (nz nxt)\n              nz = if( z==1 then 2 else 1 ) nxt = list(x y nz)\n              if( d+viaCost < dist[nxt] then\n                dist[nxt] = d+viaCost\n                pq = cons(list(dist[nxt] nxt) pq)\n              )\n            )\n          )\n        )\n      )\n    )\n    found\n  )\n)"
  },
  {
    id: 'mffc-extraction',
    title: 'Maximum Fanout-Free Cone (MFFC)',
    difficulty: 'Hard',
    tags: ['Synthesis', 'Logic', 'Graph'],
    description: 'Extract the Maximum Fanout-Free Cone for a logic gate to identify duplicatable logic.',
    problemStatement: "Given a directed graph representing a combinational logic network (provided as adjacency lists for fanins and fanouts), compute the Maximum Fanout-Free Cone (MFFC) for a specific target node. A node X is in the MFFC of Y if every path from X to the primary outputs passes through Y.",
    constraints: [
      "Nodes <= 5000",
      "Return a list of node IDs in the MFFC."
    ],
    exampleInput: "fanins = '( (n1 nil) (n2 nil) (n3 (n1 n2)) (n4 (n3)) )\nfanouts = '( (n1 (n3)) (n2 (n3)) (n3 (n4)) (n4 nil) )\ntarget = 'n4",
    exampleOutput: "'(n4 n3 n1 n2)",
    initialCode: "procedure( getMFFC(fanins fanouts target)\n  ; BFS/DFS traversal logic\n)",
    solutionCode: "; Solution: Backward BFS tracking fanout confinement\nprocedure( getMFFC(fanins fanouts target)\n  let( (mffc queue)\n    mffc = list(target)\n    queue = list(target)\n    while( queue\n      let( (curr fiList)\n        curr = car(queue) queue = cdr(queue)\n        fiList = cadr(assoc(curr fanins))\n        foreach( fi fiList\n          let( (allInMffc foList)\n            allInMffc = t\n            foList = cadr(assoc(fi fanouts))\n            foreach( fo foList\n              if( !member(fo mffc) then allInMffc = nil )\n            )\n            if( allInMffc && !member(fi mffc) then\n              mffc = cons(fi mffc)\n              queue = cons(fi queue)\n            )\n          )\n        )\n      )\n    )\n    mffc\n  )\n)"
  },
  {
    id: 'layer-assignment-coloring',
    title: 'Via Minimization via Graph Coloring',
    difficulty: 'Expert',
    tags: ['Layout', 'Graph', 'Coloring'],
    description: 'Determine if crossing nets can be assigned to two layers without overlaps.',
    problemStatement: "You have a set of routing segments that intersect. We construct an intersection graph where edges represent overlapping segments. Determine if the graph is 2-colorable (bipartite). If it is, return a valid layer assignment (0 or 1) for each segment. If not, return nil.",
    constraints: [
      "Segments N <= 2000",
      "Return format: ( (seg1 0) (seg2 1) ... ) or nil"
    ],
    exampleInput: "nodes = '(s1 s2 s3)\nedges = '( (s1 (s2)) (s2 (s1 s3)) (s3 (s2)) )",
    exampleOutput: "'( (s1 0) (s2 1) (s3 0) )",
    initialCode: "procedure( assignLayers(nodes edges)\n  ; Bipartite checking logic\n)",
    solutionCode: "; Solution: BFS Bipartite Checking\nprocedure( assignLayers(nodes edges)\n  let( (color queue possible result)\n    color = makeTable(\"c\" -1)\n    possible = t\n    foreach( n nodes\n      if( color[n] == -1 && possible then\n        color[n] = 0\n        queue = list(n)\n        while( queue && possible\n          let( (u uEdges)\n            u = car(queue) queue = cdr(queue)\n            uEdges = cadr(assoc(u edges))\n            foreach( v uEdges\n              if( color[v] == -1 then\n                color[v] = 1 - color[u]\n                queue = cons(v queue)\n              else if( color[v] == color[u] then\n                possible = nil\n              ) )\n            )\n          )\n        )\n      )\n    )\n    if( possible then\n      result = list()\n      foreach( n nodes result = cons(list(n color[n]) result) )\n      reverse(result)\n    else nil )\n  )\n)"
  },
  {
    id: 'sta-crosstalk-overlap',
    title: 'Cross-Talk Noise Analysis (Sweep-Line)',
    difficulty: 'Hard',
    tags: ['STA', 'Timing', 'Sweep-Line'],
    description: 'Find the maximum number of overlapping aggressor switching windows to compute worst-case cross-talk.',
    problemStatement: "Given a list of switching windows [start, end] for aggressor nets coupled to a victim net. Compute the maximum number of aggressor nets that can switch simultaneously. Use a sweep-line (event-based) algorithm for O(N log N) time complexity.",
    constraints: [
      "Windows N <= 10^5",
      "Return the integer max overlap count."
    ],
    exampleInput: "windows = '( (1.2 2.5) (2.0 3.1) (2.4 2.8) (3.0 4.0) )",
    exampleOutput: "3 ; At time 2.4 to 2.5, three windows overlap",
    initialCode: "procedure( maxCrosstalkOverlap(windows)\n  ; Sweep-line events\n)",
    solutionCode: "; Solution: 1D Sweep-Line\nprocedure( maxCrosstalkOverlap(windows)\n  let( (events maxOverlap currOverlap)\n    events = list()\n    foreach( w windows\n      events = cons(list(car(w) 1) events)\n      events = cons(list(cadr(w) -1) events)\n    )\n    events = sort(events lambda((a b) if( car(a)==car(b) then cadr(a)<cadr(b) else car(a)<car(b) )))\n    maxOverlap = 0 currOverlap = 0\n    foreach( e events\n      currOverlap = currOverlap + cadr(e)\n      if( currOverlap > maxOverlap then maxOverlap = currOverlap )\n    )\n    maxOverlap\n  )\n)"
  },
  {
    id: 'asap-alap-scheduling',
    title: 'Resource-Constrained ASAP Scheduling',
    difficulty: 'Hard',
    tags: ['Synthesis', 'Scheduling', 'DAG'],
    description: 'Schedule Operations in a DAG with hardware resource constraints.',
    problemStatement: "Given a DAG representing operations, where nodes are ops and edges denote dependencies. You have a maximum of M ALUs available per clock cycle. Schedule the operations to minimize the total number of clock cycles using an ASAP (As Soon As Possible) heuristic with a ready-queue.",
    constraints: [
      "Nodes <= 1000",
      "Return an association list of (node cycle_number). Cycles start at 0."
    ],
    exampleInput: "nodes = '(A B C D E)\nedges = '( (A (C D)) (B (D)) (C (E)) (D (E)) (E nil) )\nM = 1",
    exampleOutput: "'( (A 0) (B 1) (C 2) (D 3) (E 4) )",
    initialCode: "procedure( resourceConstrainedASAP(nodes edges M)\n  ; Ready-list scheduling\n)",
    solutionCode: "; Solution: Topological Sort with Resource Bins\nprocedure( resourceConstrainedASAP(nodes edges M)\n  let( (inDegree ready queue schedule cycle)\n    inDegree = makeTable(\"in\" 0)\n    foreach( u nodes\n      let( (uEdges) uEdges = cadr(assoc(u edges))\n        foreach( v uEdges inDegree[v] = inDegree[v] + 1 )\n      )\n    )\n    ready = list()\n    foreach( u nodes if( inDegree[u] == 0 then ready = cons(u ready) ) )\n    schedule = list()\n    cycle = 0\n    while( ready\n      let( (scheduledThisCycle nxtReady)\n        scheduledThisCycle = 0\n        nxtReady = list()\n        ready = sort(ready 'alfa)\n        while( ready && scheduledThisCycle < M\n          let( (u) u = car(ready) ready = cdr(ready)\n            schedule = cons(list(u cycle) schedule)\n            scheduledThisCycle = scheduledThisCycle + 1\n            let( (uEdges) uEdges = cadr(assoc(u edges))\n              foreach( v uEdges\n                inDegree[v] = inDegree[v] - 1\n                if( inDegree[v] == 0 then nxtReady = cons(v nxtReady) )\n              )\n            )\n          )\n        )\n        ready = append(ready nxtReady)\n        cycle = cycle + 1\n      )\n    )\n    reverse(schedule)\n  )\n)"
  },
  {
    id: 'cell-legalization-tetris',
    title: 'Cell Legalization (Tetris Algorithm)',
    difficulty: 'Expert',
    tags: ['Placement', 'Geometry', 'Heuristic'],
    description: 'Legalize overlapping standard cells using a top-down sweep.',
    problemStatement: "Given a list of placed standard cells with continuous X, Y coordinates and widths/heights, their placement overlaps. Legalize them into discrete rows (height H) using a Tetris algorithm: Sort cells by Y descending, then drop each cell to the highest available legal X position in the rows below without causing overlap.",
    constraints: [
      "Cells N <= 500.",
      "Return the legalized (X, Y) positions."
    ],
    exampleInput: "cells = '( (c1 0.5 10.0 2 1) (c2 1.0 9.8 2 1) )\nrowH = 1",
    exampleOutput: "'( (c1 0 10) (c2 2 10) )",
    initialCode: "procedure( legalizeTetris(cells rowH)\n  ; Tetris legalization\n)",
    solutionCode: "; Solution: Simplified 1D Bin Dropping\nprocedure( legalizeTetris(cells rowH)\n  let( (sorted rows result)\n    sorted = sort(cells lambda((a b) caddr(a) > caddr(b)))\n    rows = makeTable(\"r\" list())\n    result = list()\n    foreach( cell sorted\n      let( (name x y w h placed placedRow placedX currRow)\n        name = car(cell) x = cadr(cell) y = caddr(cell) w = cadddr(cell) h = car(cddddr(cell))\n        currRow = round(y / rowH)\n        placed = nil\n        while( !placed\n          let( (rowOccupied xPos)\n            rowOccupied = rows[currRow]\n            xPos = round(x)\n            let( (overlap)\n              overlap = nil\n              foreach( occ rowOccupied\n                let( (ox ow) ox = car(occ) ow = cadr(occ)\n                  if( !(xPos + w <= ox || xPos >= ox + ow) then overlap = t )\n                )\n              )\n              if( !overlap then\n                rows[currRow] = cons(list(xPos w) rowOccupied)\n                result = cons(list(name xPos currRow * rowH) result)\n                placed = t\n              else currRow = currRow - 1 )\n            )\n          )\n        )\n      )\n    )\n    reverse(result)\n  )\n)"
  },
  {
    id: 'logic-depth-computation',
    title: 'Logic Depth Computation (Longest Path)',
    difficulty: 'Hard',
    tags: ['Synthesis', 'DAG', 'Timing'],
    description: 'Compute the logic depth for every node in a combinational network.',
    problemStatement: "Given a DAG of logic gates, compute the longest topological path from any Primary Input (PI) to every node. PIs have depth 0. The depth of a node is 1 + MAX(depth of all fanins). Return an association list of (node depth).",
    constraints: [
      "Nodes <= 10^5",
      "O(V + E) time limit using Memoized DFS or Kahn's Algorithm."
    ],
    exampleInput: "nodes = '(A B C D)\nfanins = '( (A nil) (B nil) (C (A B)) (D (C A)) )",
    exampleOutput: "'( (A 0) (B 0) (C 1) (D 2) )",
    initialCode: "procedure( computeLogicDepth(nodes fanins)\n  ; Longest path DAG\n)",
    solutionCode: "; Solution: Memoized DFS (DP on DAG)\nprocedure( computeLogicDepth(nodes fanins)\n  let( (depthTable result dfs)\n    depthTable = makeTable(\"depth\" -1)\n    procedure( dfs(u)\n      if( depthTable[u] != -1 then depthTable[u]\n      else\n        let( (uFanins maxFiDepth)\n          uFanins = cadr(assoc(u fanins))\n          if( !uFanins then depthTable[u] = 0\n          else\n            maxFiDepth = -1\n            foreach( fi uFanins\n              let( (fd) fd = dfs(fi)\n                if( fd > maxFiDepth then maxFiDepth = fd )\n              )\n            )\n            depthTable[u] = maxFiDepth + 1\n          )\n          depthTable[u]\n        )\n      )\n    )\n    foreach( n nodes dfs(n) )\n    result = list()\n    foreach( n nodes result = cons(list(n depthTable[n]) result) )\n    reverse(result)\n  )\n)"
  },
  {
    id: 'clock-tree-dme-zero-skew',
    title: 'Zero-Skew Clock Tree Synthesis (DME)',
    difficulty: 'Expert',
    tags: ['CTS', 'Algorithm', 'Routing', 'Clock'],
    description: 'Implement the bottom-up phase of the Deferred-Merge Embedding algorithm.',
    problemStatement: "Given a binary tree of clock sinks where leaf nodes are flip-flops (each with x, y, and load capacitance). Implement the bottom-up phase of the Elmore-delay based DME algorithm to find the exact zero-skew merging segment. Calculate the tapping distance required to balance the skew between two given subtrees.",
    constraints: [
      "Tree size <= 100",
      "For this challenge, return the distance x from child 1 required to balance the skew."
    ],
    exampleInput: "t1_d=10.0 t2_d=15.0 c1=2.0 c2=1.5 wR=0.1 wC=0.2 L=20.0",
    exampleOutput: "12.5",
    initialCode: "procedure( balanceDME(t1_d t2_d c1 c2 wR wC L)\n  ; Zero-skew math\n)",
    solutionCode: "; Solution: Elmore Delay Zero-Skew Binary Search\nprocedure( balanceDME(t1_d t2_d c1 c2 wR wC L)\n  let( (x)\n    let( (low high mid d1 d2 (tol 1e-5))\n      low = 0.0 high = L\n      while( high - low > tol\n        mid = (low + high) / 2.0\n        d1 = t1_d + wR * mid * (c1 + wC * mid / 2.0)\n        d2 = t2_d + wR * (L - mid) * (c2 + wC * (L - mid) / 2.0)\n        if( d1 < d2 then low = mid else high = mid )\n      )\n      mid\n    )\n  )\n)"
  },
  {
    id: 'boolean-sat-3',
    title: 'Logic Equivalence (3-SAT Solver)',
    difficulty: 'Hard',
    tags: ['Verification', 'Logic', 'Backtracking'],
    description: 'Implement a basic DPLL-style backtracking solver for 3-SAT to verify logic equivalence.',
    problemStatement: "Given a logic cone converted to Conjunctive Normal Form (3-SAT format). Each clause is a list of literals (integers, negative means NOT). Determine if the formula is satisfiable.",
    constraints: [
      "Variables <= 30",
      "Clauses <= 100",
      "Return t if satisfiable, nil otherwise."
    ],
    exampleInput: "vars = '(1 2 3)\nclauses = '( (1 2 -3) (-1 -2 3) (1 -2 3) )",
    exampleOutput: "t",
    initialCode: "procedure( solve3SAT(clauses vars)\n  ; Backtracking solver\n)",
    solutionCode: "; Solution: Simple Backtracking for 3-SAT\nprocedure( solve3SAT(clauses vars)\n  let( (assign)\n    assign = makeTable(\"a\" -1)\n    procedure( check(cls asgn)\n      let( (ok) ok=t\n        foreach( c cls\n          let( (c_ok unknown) c_ok=nil unknown=nil\n            foreach( l c\n              let( (var sign val)\n                var = abs(l) sign = if( l>0 then 1 else 0 )\n                val = asgn[var]\n                if( val == -1 then unknown = t\n                else if( val == sign then c_ok = t ) )\n              )\n            )\n            if( !c_ok && !unknown then ok = nil )\n          )\n        )\n        ok\n      )\n    )\n    procedure( backtrack(varList)\n      if( !varList then t\n      else\n        let( (v res) v = car(varList)\n          assign[v] = 0\n          if( check(clauses assign) then if( backtrack(cdr(varList)) then res = t ) )\n          if( !res then\n            assign[v] = 1\n            if( check(clauses assign) then if( backtrack(cdr(varList)) then res = t ) )\n          )\n          if( !res then assign[v] = -1 )\n          res\n        )\n      )\n    )\n    backtrack(vars)\n  )\n)"
  },
  {
    id: 'metal-fill-insertion',
    title: 'Metal Fill Density (Sliding Window)',
    difficulty: 'Hard',
    tags: ['DFM', 'Density', 'Sliding Window'],
    description: 'Check metal density constraints using a sliding window across a 1D scanline.',
    problemStatement: "Given a 1D array representing metal segments (1) and empty spaces (0). Calculate the maximum metal density in any sliding window of size W. Return the max density as a float [0.0, 1.0].",
    constraints: [
      "Array size N <= 1,000,000.",
      "O(N) time complexity required."
    ],
    exampleInput: "grid = '(1 0 1 1 0 0 1 1 1 0)\nW = 4",
    exampleOutput: "0.75 ; Max is 3 ones in window of size 4",
    initialCode: "procedure( maxMetalDensity(grid W)\n  ; Sliding window logic\n)",
    solutionCode: "; Solution: O(N) Sliding Window\nprocedure( maxMetalDensity(grid W)\n  let( (currSum maxSum len)\n    currSum = 0 maxSum = 0 len = length(grid)\n    for( i 0 W-1 currSum = currSum + nth(i grid) )\n    maxSum = currSum\n    for( i W len-1\n      currSum = currSum + nth(i grid) - nth(i-W grid)\n      if( currSum > maxSum then maxSum = currSum )\n    )\n    float(maxSum) / float(W)\n  )\n)"
  }

  ,{
    id: 'a-star-router',
    title: 'Obstacle-Aware Maze Router (A*)',
    difficulty: 'Expert',
    tags: ['Algorithms', 'Pathfinding', 'Graph', 'Routing'],
    description: 'Write an algorithmic point-to-point router to connect a source pin to a target pin on a discrete grid plane.',
    problemStatement: "The layout contains multiple obstacle bounding boxes that cannot be crossed. Implement the A* search algorithm using a priority queue to guarantee the shortest Manhattan path while minimizing computational overhead.",
    constraints: [
      "Grid bounds: 0 to 1000",
      "Must use Manhattan distance heuristic.",
      "Return the shortest path as a list of coordinates, or nil if blocked."
    ],
    exampleInput: "sourcePt = '(0 0)\ntargetPt = '(10 10)\nobstacles = '( (2 0 8 8) )",
    exampleOutput: "'( (0 0) ... (0 9) (1 9) ... (10 10) )",
    initialCode: "; Scenario: Obstacle-Aware Maze Router (A*)\n; Goal: Route from sourcePt to targetPt avoiding obstacles.\nprocedure( routeAStar(sourcePt targetPt obstacles gridStep)\n  let( (openSet closedSet cameFrom path)\n    ; Helper: Manhattan Distance Heuristic\n    procedure( hScore(p1 p2)\n      abs(car(p1) - car(p2)) + abs(cadr(p1) - cadr(p2))\n    )\n    \n    ; 1. Initialize Priority Queue\n    ; 2. A* Search Loop (explore neighbors, update costs)\n    ; 3. Reconstruct Path\n    \n    path\n  )\n)"
  },
  {
    id: 'via-stitching',
    title: 'Automatic Via-Stitching',
    difficulty: 'Expert',
    tags: ['Geometry', 'DRC', 'Layout'],
    description: 'Implement a procedure to automatically place via arrays (stitching) between two overlapping metal layers (M1 and M2).',
    problemStatement: "The algorithm must respect minimum via-to-via spacing and enclosure rules. Find the intersection area of two overlapping rectangles, calculate the maximum number of vias that fit, and handle enclosure requirements for both layers.",
    constraints: [
      "Must maximize via count.",
      "Return a list of (x y) coordinates for via placement."
    ],
    exampleInput: "m1Box = '(0 0 100 100)\nm2Box = '(50 50 150 150)\nviaSize = 2\nviaSpacing = 3\nenclosure = 1",
    exampleOutput: "'( (53 53) (58 53) ... )",
    initialCode: "; Scenario: Automatic Via-Stitching\n; Goal: Write a procedure 'generateViaStitching' that returns a list of coordinates.\nprocedure( generateViaStitching(m1Box m2Box viaSize viaSpacing enclosure)\n  let( (overlap xStart yStart xEnd yEnd vias)\n    ; 1. Calculate Overlap BBox\n    ; 2. Apply Enclosure Margins\n    ; 3. Generate Grid of Vias\n    \n    vias\n  )\n)"
  },
  {
    id: 'prop-cleanup',
    title: 'Hierarchical Cell Property Cleanup',
    difficulty: 'Expert',
    tags: ['Hierarchy', 'Database', 'Regex'],
    description: 'A design has been corrupted with redundant user properties. Write a recursive function to traverse a cell hierarchy and remove all properties matching a specific regex, except for protected properties.',
    problemStatement: "Traverse a cell hierarchy and remove all properties matching a specific regex, except for protected 'LVS_IGNORE' flags. Cycle detection must be implemented to prevent infinite recursion in complex hierarchies.",
    constraints: [
      "Must prevent infinite recursion (cycle detection).",
      "Return number of properties deleted."
    ],
    exampleInput: "cvId = dbOpenCellViewByType(\"lib\" \"cell\" \"layout\")\\npattern = \"^TMP_.*\"\\nprotected = '(\"LVS_IGNORE\")",
    exampleOutput: "42 ; Number of properties deleted",
    initialCode: "; Scenario: Hierarchical Cell Property Cleanup\n; Goal: Write 'cleanupHierarchy' to recursively scrub properties.\nprocedure( cleanupHierarchy(cvId pattern protected)\n  let( (regex deletedCount visited)\n    regex = pcreCompile(pattern)\n    deletedCount = 0\n    visited = makeTable(\"vis\" nil)\n    ; Implement recursive traversal and property deletion logic\n    deletedCount\n  )\n)"
  },
  {
    id: 'power-mesh',
    title: 'Power Mesh Resistance Estimator',
    difficulty: 'Expert',
    tags: ['Analysis', 'Graph', 'Physics'],
    description: 'Calculate the total equivalent resistance of a simplified power mesh grid between two probe points.',
    problemStatement: "Using a network-reduction approach (Star-Mesh transformation or simplified nodal analysis), convert a list of metal segments into a weighted graph and calculate the total equivalent resistance between two probe points.",
    constraints: [
      "Number of nodes <= 1000",
      "Return resistance as a float."
    ],
    exampleInput: "segments = '( (n1 n2 1.5) (n2 n3 2.0) (n1 n3 3.0) )\nstartNode = 'n1\nendNode = 'n3",
    exampleOutput: "1.615 ; parallel of 3.0 and (1.5+2.0)",
    initialCode: "; Scenario: Power Mesh Resistance Estimator\n; Goal: Calculate equivalent resistance between node A and node B.\nprocedure( estimateMeshResistance(segments startNode endNode)\n  let( (graph resistance)\n    ; Build adjacency list with resistances\n    ; Apply network reduction\n    \n    resistance\n  )\n)"
  }

];
