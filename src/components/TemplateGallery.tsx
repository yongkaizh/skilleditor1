import React from "react";
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  LayoutTemplate,
  Cpu,
  Search,
  Sparkles,
  FormInput,
  Database,
  Trash2,
  Layers,
  FilePlus,
  Code,
} from "lucide-react";

interface TemplateGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (text: string) => void;
  onInsert?: (text: string) => void;
  isInline?: boolean;
}

const CATEGORIES = ["All", "Layout", "UI", "Database", "Analysis"];

const TEMPLATES = [
  {
    id: "menu",
    title: "Virtuoso Menu Registration",
    category: "UI",
    icon: <Sparkles size={24} className="text-blue-400" />,
    desc: "Boilerplate to register a custom pull-down menu in Virtuoso.",
    content: `; Register Custom Menu
procedure( createMyMenu()
    let( (item1 item2 myMenu)
        item1 = hiCreateMenuItem(
            ?name 'item1
            ?itemText "Do Action 1"
            ?callback "printf(\\"Action 1 Executed\\\\n\\")"
        )
        item2 = hiCreateMenuItem(
            ?name 'item2
            ?itemText "Do Action 2"
            ?callback "printf(\\"Action 2 Executed\\\\n\\")"
        )
        myMenu = hiCreatePulldownMenu(
            'myCustomMenu
            "My Tools"
            list(item1 item2)
        )
        hiInsertBannerMenu(hiGetCurrentWindow() myMenu hiGetNumMenus(hiGetCurrentWindow()))
    )
)
createMyMenu()`,
  },
  {
    id: "form",
    title: "Custom UI Form",
    category: "UI",
    icon: <FormInput size={24} className="text-green-400" />,
    desc: "Boilerplate using hiCreateAppForm and string fields.",
    content: `; Custom App Form
procedure( showMyForm()
    let( (stringField form)
        stringField = hiCreateStringField(
            ?name 'myStringField
            ?prompt "Enter Value:"
            ?defValue "Default"
        )
        
        form = hiCreateAppForm(
            ?name 'myForm
            ?formTitle "My Custom UI Form"
            ?fields list(
                list(stringField 10:10 300:30 100)
            )
            ?callback "printf(\\"User entered: %s\\\\n\\" myForm->myStringField->value)"
        )
        
        hiDisplayForm(form)
    )
)
showMyForm()`,
  },
  {
    id: "db",
    title: "Hierarchical Search",
    category: "Database",
    icon: <Search size={24} className="text-purple-400" />,
    desc: "Recursive function to traverse a layout cellview and its instances.",
    content: `; Recursive Hierarchical Search
procedure( searchHierarchy(cv level)
    let( (prefix)
        prefix = buildString(makeList(level "  ") "")
        printf("%sProcessing cellview: %s\\n" prefix cv~>cellName)
        
        foreach( inst cv~>instances
            printf("%sFound instance: %s (master: %s)\\n" prefix inst~>name inst~>master~>cellName)
            
            ; Recurse into master
            if( inst~>master then
                searchHierarchy(inst~>master level+1)
            )
        )
    )
)
; Usage: searchHierarchy(geGetWindowCellView() 0)`,
  },
  {
    id: "pcell",
    title: "PCell Generator",
    category: "Layout",
    icon: <Cpu size={24} className="text-orange-400" />,
    desc: "Structure for creating a simple Parameterized Cell.",
    content: `; Basic PCell Boilerplate
pcDefinePCell(
    list(ddGetObj("myLib") "myPCell" "layout")
    
    (
        (width 10.0)
        (length 5.0)
    )
    
    let( (cv layer)
        cv = pcCellView
        layer = list("M1" "drawing")
        
        dbCreateRect(cv layer list(0:0 width:length))
        
        t
    )
)`,
  },
  {
    id: 'export',
    title: 'Export Shapes to CSV',
    category: 'Database',
    icon: <Database size={24} className="text-emerald-400" />,
    desc: 'Iterate over rectangles in a cellview and export their coordinates.',
    content: `; Export Rectangles to CSV
procedure( exportShapesToCSV(cv filename)
    let( (port layer bbox x1 y1 x2 y2)
        port = outfile(filename)
        if( port then
            fprintf(port "Layer,X1,Y1,X2,Y2\\n")
            foreach( shape cv~>shapes
                if( shape~>objType == "rect" then
                    layer = nth(0 shape~>lpp)
                    bbox = shape~>bBox
                    x1 = xCoord(lowerLeft(bbox))
                    y1 = yCoord(lowerLeft(bbox))
                    x2 = xCoord(upperRight(bbox))
                    y2 = yCoord(upperRight(bbox))
                    fprintf(port "%s,%.3f,%.3f,%.3f,%.3f\\n" layer x1 y1 x2 y2)
                )
            )
            close(port)
            printf("*Success* Exported to %s\\n" filename)
        else
            printf("*Error* Could not open file %s for writing\\n" filename)
        )
    )
)
; Usage: exportShapesToCSV(geGetWindowCellView() "/tmp/shapes.csv")`
  },
  {
    id: 'delete_layer',
    title: 'Delete Shapes by Layer',
    category: 'Layout',
    icon: <Trash2 size={24} className="text-red-400" />,
    desc: 'Find all shapes on a specific layer and delete them from the database.',
    content: `; Delete Shapes by Layer
procedure( deleteShapesByLayer(cv targetLayer)
    let( (count)
        count = 0
        foreach( shape cv~>shapes
            if( nth(0 shape~>lpp) == targetLayer then
                dbDeleteObject(shape)
                count++
            )
        )
        printf("*Success* Deleted %d shapes on layer %s\\n" count targetLayer)
    )
)
; Usage: deleteShapesByLayer(geGetWindowCellView() "M1")`
  },
  {
    id: 'flatten',
    title: 'Flatten Selected Instances',
    category: 'Layout',
    icon: <Layers size={24} className="text-cyan-400" />,
    desc: 'Iterate over the current selection and flatten any instances.',
    content: `; Flatten Selected Instances
procedure( flattenSelectedInstances()
    let( (cv selectedInsts count)
        cv = geGetWindowCellView()
        selectedInsts = setof(obj geGetSelSet() obj~>objType == "inst")
        count = 0
        
        foreach( inst selectedInsts
            ; Flatten instance with 1 level of hierarchy, preserving shapes
            dbFlattenInst(inst 1 t nil)
            count++
        )
        
        printf("*Success* Flattened %d instances\\n" count)
    )
)
; Usage: flattenSelectedInstances()`
  },
  {
    id: "via_array",
    title: "Via Matrix Array Generator",
    category: "Layout",
    icon: <Cpu size={24} className="text-yellow-400" />,
    desc: "Generate a precision grid array of via shapes with configurable rows, columns, and spacing.",
    content: `; Configurable Via Matrix Generator
procedure( generateViaMatrix(cv startX startY rows cols width height spaceX spaceY layerName)
    let( (currX currY count)
        count = 0
        for( r 0 rows-1
            currY = startY + r * (height + spaceY)
            for( c 0 cols-1
                currX = startX + c * (width + spaceX)
                
                ; Create individual via rect
                dbCreateRect(
                    cv 
                    list(layerName "drawing") 
                    list(currX:currY (currX + width):(currY + height))
                )
                count++
            )
        )
        printf("*Success* Placed a %dx%d via matrix (%d vias) on layer %s\\n" rows cols count layerName)
    )
)
; Usage: generateViaMatrix(geGetWindowCellView() 0.0 0.0 5 10 0.5 0.5 0.25 0.25 "Via1")`,
  },
  {
    id: "guard_ring",
    title: "Selection Guard Ring Generator",
    category: "Layout",
    icon: <Layers size={24} className="text-pink-400" />,
    desc: "Automatically wrap all selected layout objects in a concentric, styled substrate guard ring.",
    content: `; Create Guard Ring Surrounding Selection
procedure( createGuardRingAroundSelection(layerName offset width)
    let( (cv selObjs overallBbox x1 y1 x2 y2 innerBbox)
        cv = geGetWindowCellView()
        selObjs = geGetSelSet()
        
        if( selObjs then
            ; Initialize bounding coordinates from first object
            overallBbox = car(selObjs)~>bBox
            x1 = xCoord(lowerLeft(overallBbox))
            y1 = yCoord(lowerLeft(overallBbox))
            x2 = xCoord(upperRight(overallBbox))
            y2 = yCoord(upperRight(overallBbox))
            
            ; Merge bounding boxes of all other selected objects
            foreach( obj cdr(selObjs)
                overallBbox = obj~>bBox
                x1 = min(x1 xCoord(lowerLeft(overallBbox)))
                y1 = min(y1 yCoord(lowerLeft(overallBbox)))
                x2 = max(x2 xCoord(upperRight(overallBbox)))
                y2 = max(y2 yCoord(upperRight(overallBbox)))
            )
            
            ; Draw the guard ring shapes (4 rects around the border)
            ; Bottom rect
            dbCreateRect(cv list(layerName "drawing") 
                list((x1 - offset - width):(y1 - offset - width) (x2 + offset + width):(y1 - offset)))
            ; Top rect
            dbCreateRect(cv list(layerName "drawing") 
                list((x1 - offset - width):(y2 + offset) (x2 + offset + width):(y2 + offset + width)))
            ; Left rect
            dbCreateRect(cv list(layerName "drawing") 
                list((x1 - offset - width):(y1 - offset) (x1 - offset):(y2 + offset)))
            ; Right rect
            dbCreateRect(cv list(layerName "drawing") 
                list((x2 + offset):(y1 - offset) (x2 + offset + width):(y2 + offset)))
                
            printf("*Success* Created guard ring around %d objects with layer %s\\n" length(selObjs) layerName)
        else
            printf("*Warning* No layout objects selected to wrap!\\n")
        )
    )
)
; Usage: createGuardRingAroundSelection("M1" 1.0 0.5)`,
  },
  {
    id: "area_calculator",
    title: "Layer Area Calculator & Labeller",
    category: "Analysis",
    icon: <Search size={24} className="text-cyan-400" />,
    desc: "Iterate through all shapes to calculate the exact aggregate surface area of any layer, then draw an active text label.",
    content: `; Layer Area Calculator & Text Labeller
procedure( calculateAndLabelLayerArea(cv targetLayer labelX labelY)
    let( (totalArea bbox width height x1 y1 x2 y2 labelText)
        totalArea = 0.0
        
        foreach( shape cv~>shapes
            if( nth(0 shape~>lpp) == targetLayer && shape~>objType == "rect" then
                bbox = shape~>bBox
                x1 = xCoord(lowerLeft(bbox))
                y1 = yCoord(lowerLeft(bbox))
                x2 = xCoord(upperRight(bbox))
                y2 = yCoord(upperRight(bbox))
                
                width = x2 - x1
                height = y2 - y1
                totalArea = totalArea + (width * height)
            )
        )
        
        ; Log result to console
        printf("--- Layer %s Total Area: %.4f square microns ---\\n" targetLayer totalArea)
        
        ; Create a permanent database text label
        labelText = sprintf(nil "Layer %s Area: %.2fu²" targetLayer totalArea)
        dbCreateLabel(
            cv 
            list(targetLayer "label") 
            labelX:labelY 
            labelText 
            "centerCenter" 
            "R0" 
            "roman" 
            0.5
        )
        t
    )
)
; Usage: calculateAndLabelLayerArea(geGetWindowCellView() "M1" 0.0 -2.0)`,
  },
  {
    id: "resistance_calc",
    title: "Physical P2P Resistance Extractor",
    category: "Analysis",
    icon: <Cpu size={24} className="text-red-400" />,
    desc: "Sophisticated PEX-lite algorithm that traces physical continuity via database overlaps and calculates multi-layer resistance including via contacts.",
    content: `; Physical Point-to-Point Resistance Extractor (PEX-lite)
; Traces connectivity from start point to end point using database overlaps
procedure( calculatePhysicalResistance(cv startPoint endPoint techFile)
    let( (visited totalR extractPath targetFound)
        visited = makeTable("v")
        totalR = 0.0
        targetFound = nil
        
        ; Recursive connectivity search with resistance accumulation
        extractPath = lambda( (shape)
            unless( visited[shape] || targetFound
                visited[shape] = t
                
                ; Calculate shape resistance
                if( shape~>objType == "via" || shape~>objType == "inst" then
                    ; Lookup via resistance from techFile DPL
                    totalR = totalR + (techFile[shape~>layerName]->contactRes || 0.05)
                else
                    ; R = (L/W) * sheetRes
                    let( (rs w l)
                        rs = techFile[shape~>layerName]->sheetRes || 0.1
                        w = shape~>width || 1.0
                        l = shape~>length || 1.0
                        totalR = totalR + (rs * (l / w))
                    )
                )

                ; Check if we reached the target coordinate region
                if( dbPointInBBox(endPoint shape~>bBox) then
                    targetFound = t
                    printf("Target reached at %L via %s\\n" endPoint shape~>layerName)
                else
                    ; Find overlapping neighbors on same net
                    foreach( neighbor dbGetOverlaps(cv shape~>bBox)
                        when( neighbor~>net == shape~>net
                             funcall(extractPath neighbor)
                        )
                    )
                )
            )
        )

        ; Find starting shape at startPoint
        let( (startShape)
            startShape = car(dbGetOverlaps(cv list(startPoint startPoint)))
            if( startShape then
                funcall(extractPath startShape)
                if( targetFound then
                    printf("Total Extracted Resistance: %.4f Ohms\\n" totalR)
                else
                    warn("No physical path found between %L and %L\\n" startPoint endPoint)
                )
            else
                error("No metal found at start point %L\\n" startPoint)
            )
        )
        totalR
    )
)

; Usage: 
; tech = makeTable("tech")
; tech["M1"] = list(nil 'sheetRes 0.08)
; tech["Via1"] = list(nil 'contactRes 0.15)
; calculatePhysicalResistance(geGetWindowCellView() 0:0 50:50 tech)`,
  },
  {
    id: "drc_spacing",
    title: "DRC Spacing Checker",
    category: "Analysis",
    icon: <Database size={24} className="text-yellow-400" />,
    desc: "Find spacing violations between shapes on a given layer.",
    content: `; DRC Minimum Spacing Checker
procedure( checkDrcSpacing(cv layerName minSpacing)
    let( (rects violations bbox1 bbox2 x1_1 y1_1 x2_1 y2_1 x1_2 y1_2 x2_2 y2_2 dx dy dist)
        rects = setof(s cv~>shapes s~>layerName == layerName && s~>objType == "rect")
        violations = 0
        printf("--- Checking spacing on Layer: %s (Min: %.3fu) ---\\n" layerName minSpacing)
        
        for( i 0 length(rects)-2
            for( j i+1 length(rects)-1
                bbox1 = nth(i rects)~>bBox
                bbox2 = nth(j rects)~>bBox
                
                x1_1 = xCoord(lowerLeft(bbox1))  y1_1 = yCoord(lowerLeft(bbox1))
                x2_1 = xCoord(upperRight(bbox1)) y2_1 = yCoord(upperRight(bbox1))
                
                x1_2 = xCoord(lowerLeft(bbox2))  y1_2 = yCoord(lowerLeft(bbox2))
                x2_2 = xCoord(upperRight(bbox2)) y2_2 = yCoord(upperRight(bbox2))
                
                ; Compute horizontal & vertical separation (0 or negative if overlapping)
                dx = max(0.0 max(x1_1 - x2_2 x1_2 - x2_1))
                dy = max(0.0 max(y1_1 - y2_2 y1_2 - y2_1))
                
                dist = sqrt(dx*dx + dy*dy)
                if( dist > 0.0 && dist < minSpacing then
                    printf("  *VIOLATION* Shapes %d and %d are too close! Spacing: %.3fu\\n" i j dist)
                    violations++
                )
            )
        )
        printf("DRC completed. Found %d spacing violations.\\n" violations)
        violations
    )
)
; Usage: checkDrcSpacing(geGetWindowCellView() "M1" 0.25)`,
  },
  {
    id: "align_shapes",
    title: "Horizontal/Vertical Shape Aligner",
    category: "Layout",
    icon: <Layers size={24} className="text-violet-400" />,
    desc: "Align selected layout shapes to the left, right, top, or bottom of the first selected shape.",
    content: `; Shape Aligner Tool
procedure( alignSelectedShapes(alignType)
    let( (selObjs refObj refBbox refVal targetObj targetBbox curWidth curHeight dx dy)
        selObjs = geGetSelSet()
        if( length(selObjs) < 2 then
            printf("*Warning* Please select at least 2 shapes to align!\\n")
        else
            refObj = car(selObjs)
            refBbox = refObj~>bBox
            
            ; Align types: "left", "right", "bottom", "top"
            foreach( obj cdr(selObjs)
                refBbox = refObj~>bBox
                targetBbox = obj~>bBox
                curWidth = xCoord(upperRight(targetBbox)) - xCoord(lowerLeft(targetBbox))
                curHeight = yCoord(upperRight(targetBbox)) - yCoord(lowerLeft(targetBbox))
                dx = 0.0  dy = 0.0
                
                if( alignType == "left" then
                    dx = xCoord(lowerLeft(refBbox)) - xCoord(lowerLeft(targetBbox))
                else if( alignType == "right" then
                    dx = xCoord(upperRight(refBbox)) - xCoord(upperRight(targetBbox))
                else if( alignType == "bottom" then
                    dy = yCoord(lowerLeft(refBbox)) - yCoord(lowerLeft(targetBbox))
                else if( alignType == "top" then
                    dy = yCoord(upperRight(refBbox)) - yCoord(upperRight(targetBbox))
                )
                
                ; Move target object by delta offsets
                if( dx != 0.0 || dy != 0.0 then
                    dbMoveObject(obj geGetWindowCellView() list(dx:dy "R0"))
                )
            )
            printf("*Success* Aligned %d shapes to the %s boundary\\n" length(selObjs)-1 alignType)
         )
    )
)
; Usage: alignSelectedShapes("left")`,
  },
  {
    id: "schematic_replacer",
    title: "Schematic Instance Replacer",
    category: "UI",
    icon: <FormInput size={24} className="text-sky-400" />,
    desc: "Find all schematic instances matching an old cell name and swap them with a new cell master.",
    content: `; Find and replace schematic instances
procedure( replaceSchematicInstances(cvId oldCellName newLibName newCellName)
    let( (newMaster count)
        newMaster = dbOpenCellViewByType(newLibName newCellName "symbol" "" "r")
        count = 0
        if( newMaster then
            foreach( inst cvId~>instances
                if( inst~>cellName == oldCellName then
                    inst~>master = newMaster
                    count++
                )
            )
            printf("*Success* Swapped %d instances of '%s' with '%s/%s' symbol\\n" count oldCellName newLibName newCellName)
            dbClose(newMaster)
        else
            printf("*Error* Could not find symbol master for %s/%s\\n" newLibName newCellName)
        )
    )
)
; Usage: replaceSchematicInstances(geGetWindowCellView() "nfet_old" "analogLib" "nmos4")`,
  },
  {
    id: "via_stitching",
    title: "Auto Via Stitching Tool",
    category: "Layout",
    icon: <Cpu size={24} className="text-pink-400" />,
    desc: "Find overlapping bounding boxes of two rectangular shapes and generate a stitched via array in the overlap.",
    content: `; Automatic Via Stitching between Metal1 and Metal2
procedure( generateViaStitching(shape1 shape2 viaSize viaSpacing enclosure)
    let( (cv bbox1 bbox2 x1 y1 x2 y2 overlapBbox ovX1 ovY1 ovX2 ovY2 rows cols width height startX startY)
        cv = geGetWindowCellView()
        bbox1 = shape1~>bBox
        bbox2 = shape2~>bBox
        
        ; Find intersection bounding box
        ovX1 = max(xCoord(lowerLeft(bbox1)) xCoord(lowerLeft(bbox2)))
        ovY1 = max(yCoord(lowerLeft(bbox1)) yCoord(lowerLeft(bbox2)))
        ovX2 = min(xCoord(upperRight(bbox1)) xCoord(upperRight(bbox2)))
        ovY2 = min(yCoord(upperRight(bbox1)) yCoord(upperRight(bbox2)))
        
        if( ovX1 < ovX2 && ovY1 < ovY2 then
            ; Apply enclosure/margin constraints
            ovX1 = ovX1 + enclosure
            ovY1 = ovY1 + enclosure
            ovX2 = ovX2 - enclosure
            ovY2 = ovY2 - enclosure
            
            width = ovX2 - ovX1
            height = ovY2 - ovY1
            
            if( width >= viaSize && height >= viaSize then
                ; Calculate optimal rows and columns for via grids
                cols = floor((width - viaSize) / (viaSize + viaSpacing)) + 1
                rows = floor((height - viaSize) / (viaSize + viaSpacing)) + 1
                
                ; Center the via matrix inside the overlap region
                startX = ovX1 + (width - (cols * viaSize + (cols - 1) * viaSpacing)) / 2.0
                startY = ovY1 + (height - (rows * viaSize + (rows - 1) * viaSpacing)) / 2.0
                
                for( r 0 rows-1
                    for( c 0 cols-1
                        dbCreateRect(cv list("Via1" "drawing") 
                            list(
                                (startX + c * (viaSize + viaSpacing)):(startY + r * (viaSize + viaSpacing))
                                (startX + c * (viaSize + viaSpacing) + viaSize):(startY + r * (viaSize + viaSpacing) + viaSize)
                            )
                        )
                    )
                )
                printf("*Success* Generated a %dx%d via stitching grid inside overlap area\\n" rows cols)
            else
                printf("*Warning* Overlap region too small for via stitching!\\n")
            )
        else
            printf("*Warning* Shapes do not physically overlap!\\n")
        )
    )
)
; Usage: generateViaStitching(rect1 rect2 0.4 0.3 0.1)`,
  },
];

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  isOpen,
  onClose,
  onSelect,
  onInsert,
  isInline,
}) => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("All");

  const filteredTemplates = React.useMemo(() => {
    return TEMPLATES.filter((tpl) => {
      const matchesSearch = 
        tpl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.desc.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || tpl.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const renderContent = () => (
    <div className="w-full flex flex-col h-full overflow-hidden bg-[#0b0c10]">
      <div className="p-4 border-b border-white/[0.04] bg-white/[0.01] shrink-0">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-indigo-500/10 p-1.5 rounded-lg">
            <LayoutTemplate className="text-indigo-400" size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight uppercase tracking-wider">Templates</h2>
            <p className="text-[10px] text-slate-500 font-medium">Cadence SKILL recipes</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2 text-sm text-[#e2e8f0] placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all shadow-inner"
            />
          </div>
          <div className="flex overflow-x-auto gap-1.5 pb-1 no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all whitespace-nowrap border ${
                  selectedCategory === cat
                    ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                    : "bg-white/[0.02] border-white/[0.06] text-slate-500 hover:text-slate-300 hover:bg-white/[0.05]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 px-1">
          <span className="text-[9px] text-slate-600 font-bold uppercase tracking-[0.1em]">Results</span>
          <span className="text-[10px] text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/10">
            {filteredTemplates.length}
          </span>
        </div>
      </div>
      
      <div className="p-2 overflow-y-auto flex-1 space-y-3 custom-scrollbar bg-black/10">
        {filteredTemplates.map((tpl) => (
          <div
            key={tpl.id}
            onClick={() => {
              onSelect(tpl.content);
              if (!isInline) onClose();
            }}
            className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-xl transition-all duration-200 hover:border-indigo-500/30 hover:bg-indigo-500/5 group flex flex-col gap-3 cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white/5 rounded-lg border border-white/10 shrink-0 group-hover:scale-105 group-hover:border-indigo-500/30 transition-all duration-300">
                <span className="opacity-70">{tpl.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-semibold text-xs text-white group-hover:text-indigo-400 transition-colors truncate">{tpl.title}</h4>
                  <span className="text-[9px] text-slate-500 bg-white/[0.02] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold border border-white/[0.05]">{tpl.category}</span>
                </div>
                <p className="text-slate-500 text-[10px] mt-1 leading-relaxed line-clamp-2">{tpl.desc}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-auto pt-2 border-t border-white/[0.04] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(tpl.content);
                  if (!isInline) onClose();
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-colors"
              >
                <FilePlus size={12} /> New File
              </button>
              {onInsert && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onInsert(tpl.content);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-colors"
                >
                  <Code size={12} /> Insert
                </button>
              )}
            </div>
          </div>
        ))}
        {filteredTemplates.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="text-slate-700 mb-3" size={32} />
            <h5 className="text-slate-500 font-semibold text-xs">No matching templates</h5>
          </div>
        )}
      </div>
    </div>
  );

  if (isInline) {
    return renderContent();
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-8"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-5xl h-full max-h-[85vh] bg-[#0b0c10] shadow-2xl rounded-3xl border border-white/10 flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-500/10 p-3 rounded-2xl border border-indigo-500/20 shadow-lg shadow-indigo-500/10">
                  <LayoutTemplate className="text-indigo-400" size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">SKILL Template Library</h3>
                  <p className="text-slate-400 text-sm font-medium">Accelerate development with industry-standard patterns</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="text-slate-500 hover:text-white bg-white/5 hover:bg-white/10 p-2.5 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden">
              {renderContent()}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
