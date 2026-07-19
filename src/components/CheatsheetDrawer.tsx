import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Book, FileText, Monitor, Database, GitBranch, Search, Calculator, Info, ChevronLeft, Code } from 'lucide-react';

interface CheatsheetDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (text: string) => void;
  isInline?: boolean;
  manualFns?: any[];
}

interface CheatsheetItem {
  name: string;
  desc: string;
  text: string;
  example?: string;
  category?: string;
}

const SNIPPETS = [
  {
    category: 'Core',
    icon: <GitBranch size={16} className="text-blue-400" />,
    items: [
      { name: 'Procedure', desc: 'Define a function with arguments and local scope.', text: 'procedure( ${1:myFunc}(${2:args})\n    let( (${3:local_vars})\n        ${4:; body}\n    )\n)' },
      { name: 'Let Binding', desc: 'Declare isolated local variables with initial values.', text: 'let( ((${1:var1} ${2:val1}) (${3:var2} ${4:val2}))\n    ${5:; body}\n)' },
      { name: 'If Statement', desc: 'Conditional logic with then/else branches.', text: 'if( ${1:condition} then\n    ${2:; true}\nelse\n    ${3:; false}\n)' },
      { name: 'Foreach Loop', desc: 'Iterate over a list, binding each element.', text: 'foreach( ${1:item} ${2:list}\n    ${3:; body}\n)' },
      { name: 'For Loop', desc: 'Incrementally iterate between bounds.', text: 'for( ${1:i} ${2:start} ${3:end}\n    ${4:; body}\n)' },
      { name: 'While Loop', desc: 'Execute block while condition evaluates to true.', text: 'while( ${1:condition}\n    ${2:; body}\n)' },
      { name: 'Case Statement', desc: 'Multi-branch pattern matching.', text: 'case( ${1:variable}\n    (${2:value1}\n        ${3:; body}\n    )\n    (t\n        ${4:; default}\n    )\n)' },
    ]
  },
  {
    category: 'File I/O',
    icon: <FileText size={16} className="text-green-400" />,
    items: [
      { name: 'Printf', desc: 'Print formatted output to the CIW / terminal.', text: 'printf("${1:Message: %L\\n}" ${2:var})' },
      { name: 'Sprintf', desc: 'Format a string and assign it to a variable.', text: '${1:str} = sprintf(nil "${2:Value is: %L}" ${3:var})' },
      { name: 'Write to File', desc: 'Open a port to write text output to a file.', text: 'let( (port)\n    port = outfile("${1:/tmp/output.txt}")\n    fprintf(port "${2:Data\\n}")\n    close(port)\n)' },
      { name: 'Read from File', desc: 'Open a port to read a file line-by-line.', text: 'let( (port line)\n    port = infile("${1:/tmp/input.txt}")\n    while( gets(line port)\n        printf("Line: %s" line)\n    )\n    close(port)\n)' },
      { name: 'Warn/Error', desc: 'Generate system-level layout warnings or errors.', text: '${1|warn,error|}("${2:Message: %s}" ${3:msg})' },
    ]
  },
  {
    category: 'Database',
    icon: <Database size={16} className="text-purple-400" />,
    items: [
      { name: 'Open CellView', desc: 'Open or create a design cellview by type.', text: 'cv = dbOpenCellViewByType("${1:libName}" "${2:cellName}" "${3:layout}" "maskLayout" "a")' },
      { name: 'Create Rect', desc: 'Draw a rectangle in layout space.', text: 'dbCreateRect(${1:cv} list("${2:M1}" "${3:drawing}") list(${4:0:0} ${5:10:10}))' },
      { name: 'Create Path', desc: 'Instantiate a multi-point layout path with width.', text: 'dbCreatePath(${1:cv} list("${2:M1}" "${3:drawing}") list(${4:0:0 10:10}) ${5:1.0})' },
      { name: 'Create Label', desc: 'Place database-level text labels on layouts.', text: 'dbCreateLabel(${1:cv} list("${2:M1}" "${3:label}") ${4:0:0} "${5:Label Text}" "centerCenter" "R0" "roman" ${6:0.5})' },
      { name: 'Create Inst', desc: 'Instantiate a cell master into a cellview.', text: 'dbCreateInst(${1:cv} ${2:masterCv} "${3:I0}" ${4:0:0} "${5:R0}")' },
      { name: 'Delete Object', desc: 'Delete an object from the Virtuoso database.', text: 'dbDeleteObject(${1:shape})' },
      { name: 'Get CellView Shapes', desc: 'Get all graphic shapes within a cellview.', text: '${1:shapes} = ${2:cv}~>shapes' },
      { name: 'Get Shape Layer', desc: 'Extract the layer name from a shape lpp.', text: '${1:layerName} = car(${2:shape}~>lpp)' },
    ]
  },
  {
    category: 'UI',
    icon: <Monitor size={16} className="text-orange-400" />,
    items: [
      { name: 'Display Dialog', desc: 'Show a basic warning/acknowledgement dialog box.', text: "hiDisplayAppDBox(\n    ?name '${1:myDialog}\n    ?dboxText \"${2:Hello User}\"\n    ?buttonLayout 'Close\n)" },
      { name: 'String Field', desc: 'Create a text input field for a form.', text: "${1:field} = hiCreateStringField(\n    ?name '${2:myField}\n    ?prompt \"${3:Enter Text:}\"\n    ?defValue \"${4:Default}\"\n)" },
      { name: 'Create Form', desc: 'Compile fields into an interactive app form.', text: "hiCreateAppForm(\n    ?name '${1:myForm}\n    ?formTitle \"${2:Title}\"\n    ?fields list(${3:field1} ${4:field2})\n)" },
      { name: 'Display Form', desc: 'Render and display a custom application form.', text: 'hiDisplayForm(${1:form})' },
      { name: 'File Selector', desc: 'Open a native operating system file explorer dialog.', text: "hiDisplayFileDialog(\n    ?title \"${1:Select SKILL file}\"\n    ?filter \"${2:*.il}\"\n    ?callback \"${3:myFileCallback}\"\n)" },
    ]
  },
  {
    category: 'Math',
    icon: <Calculator size={16} className="text-pink-400" />,
    items: [
      { name: 'First Item (car)', desc: 'Retrieve the first element of a Lisp list.', text: 'car(${1:myList})' },
      { name: 'Tail Items (cdr)', desc: 'Retrieve everything except the first item.', text: 'cdr(${1:myList})' },
      { name: 'Get Nth Item', desc: 'Access an element at a specific index (0-based).', text: 'nth(${1:0} ${2:myList})' },
      { name: 'Point Coordinates', desc: 'Extract X or Y from a point list (e.g. 5:10).', text: 'xCoord(${1:point}) ; or yCoord(point)' },
      { name: 'BBox Corners', desc: 'Retrieve lower-left or upper-right of a bounding box.', text: 'lowerLeft(${1:bbox}) ; or upperRight(bbox)' },
      { name: 'Distance', desc: 'Calculate the Euclidean distance between two points.', text: 'sqrt((xCoord(${1:p2}) - xCoord(${2:p1}))**2 + (yCoord(${1:p2}) - yCoord(${2:p1}))**2)' },
    ]
  },
  {
    category: 'Connectivity',
    icon: <Search size={16} className="text-cyan-400" />,
    items: [
      { name: 'Find Net', desc: 'Get a net object by name from a cellview.', text: "net = dbFindNetByName(${1:cv} \"${2:VDD}\")" },
      { name: 'Create Pin', desc: 'Attach a pin interface to a net.', text: "dbCreatePin(${1:net} ${2:shape} \"${3:PIN_NAME}\")" },
      { name: 'Inst Master', desc: 'Access the master cellview of an instance.', text: "master = dbGetAnyInstMaster(${1:inst})" },
      { name: 'Check Schematic', desc: 'Validate schematic connectivity and save.', text: "schCheck(${1:cv})\nschSave(${1:cv})" },
    ]
  },
  {
    category: 'Layout',
    icon: <GitBranch size={16} className="text-emerald-400" />,
    items: [
      { name: 'ROD Rect', desc: 'Create a named ROD rectangle for alignment.', text: "rodCreateRect(?name \"${1:myRect}\" ?layer list(\"${2:M1}\" \"drawing\") ?bBox list(${3:0:0} ${4:1:1}))" },
      { name: 'ROD Align', desc: 'Align two ROD objects relative to each other.', text: "rodAlign(?alignObj ${1:obj1} ?alignPoint \"${2:lowerLeft}\" ?refObj ${3:obj2} ?refPoint \"${4:upperRight}\")" },
      { name: 'Set Entry Layer', desc: 'Define the active layer for manual drawing.', text: "leSetEntryLayer(list(\"${1:M1}\" \"drawing\"))" },
      { name: 'Layer Visible', desc: 'Toggle layer visibility in the editor.', text: "leSetLayerVisible(list(\"${1:M1}\" \"drawing\") ${2:t})" },
    ]
  }
];

const CATEGORIES = ["All", "Core", "Layout", "Schematic", "Database", "Connectivity", "UI", "Math", "File I/O", "String", "RegEx", "Library"];

export const CheatsheetDrawer: React.FC<CheatsheetDrawerProps> = ({ isOpen, onClose, onInsert, isInline, manualFns = [] }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedItem, setSelectedItem] = useState<CheatsheetItem | null>(null);

  const manualSections = React.useMemo(() => {
    if (!manualFns.length) return [];
    
    const filtered = manualFns.filter(fn => {
      const matchesSearch = 
        fn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (fn.description && fn.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        fn.usage.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === "All" || selectedCategory === "Library" || fn.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });

    // Group by category if All is selected, otherwise just show the category items
    const grouped: Record<string, any[]> = {};
    filtered.forEach(fn => {
      const cat = fn.category || "General";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push({
        name: fn.name,
        desc: fn.description || "Standard SKILL function",
        text: fn.usage.replace(/\[|\]/g, ''),
        example: fn.example,
        category: cat
      });
    });

    return Object.entries(grouped).map(([cat, items]) => ({
      category: `Library: ${cat}`,
      icon: <Book size={16} className="text-yellow-400" />,
      items: items
    }));
  }, [manualFns, searchQuery, selectedCategory]);

  const filteredSnippets = React.useMemo(() => {
    return SNIPPETS.map(section => {
      const matchesCategory = selectedCategory === "All" || section.category === selectedCategory;
      if (!matchesCategory) return { ...section, items: [] };

      const items = section.items.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.desc && item.desc.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.text.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return { ...section, items };
    }).filter(section => section.items.length > 0);
  }, [searchQuery, selectedCategory]);

  const allSections = [...filteredSnippets, ...manualSections];

  const renderContent = () => (
    <div className="w-full flex flex-col h-full overflow-hidden bg-[#0b0c10] relative">
      <AnimatePresence mode="wait">
        {selectedItem ? (
          <motion.div 
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute inset-0 flex flex-col bg-[#0b0c10] z-10"
          >
            <div className="p-4 border-b border-white/[0.04] bg-white/[0.01] flex items-center justify-between shrink-0">
              <button 
                onClick={() => setSelectedItem(null)}
                className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-xs font-bold uppercase tracking-wider transition-all group"
              >
                <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                Back
              </button>
              <button
                onClick={() => {
                  onInsert(selectedItem.text);
                }}
                className="bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all border border-indigo-500/20 flex items-center gap-1.5"
              >
                <Code size={14} />
                Insert
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
              <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 text-[9px] font-bold rounded uppercase tracking-wider">
                    Snippet
                  </span>
                  {selectedItem.category && (
                    <span className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">
                      {selectedItem.category}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight leading-tight">{selectedItem.name}</h2>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{selectedItem.desc}</p>
              </div>

              <div className="space-y-4">
                <section>
                  <h4 className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2 flex items-center gap-2">
                    <Code size={12} className="text-indigo-400" />
                    Usage Syntax
                  </h4>
                  <div className="bg-[#1a1c23] border border-white/5 rounded-xl p-4 font-mono text-[11px] text-indigo-300 shadow-inner overflow-x-auto whitespace-pre">
                    {selectedItem.text}
                  </div>
                </section>

                {selectedItem.example && (
                  <section>
                    <h4 className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2 flex items-center gap-2">
                      <Monitor size={12} className="text-emerald-400" />
                      Practical Example
                    </h4>
                    <div className="bg-black/40 border border-white/5 rounded-xl p-4 font-mono text-[11px] text-emerald-400 shadow-inner whitespace-pre overflow-x-auto">
                      {selectedItem.example}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute inset-0 flex flex-col"
          >
            <div className="p-4 border-b border-white/[0.04] bg-white/[0.01] shrink-0">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-indigo-500/10 p-1.5 rounded-lg">
                  <Book className="text-indigo-400" size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white tracking-tight uppercase tracking-wider">Cheatsheet</h2>
                  <p className="text-[10px] text-slate-500 font-medium">Quick reference & snippets</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                  <input
                    type="text"
                    placeholder="Search SKILL snippets..."
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
                  {allSections.reduce((acc, s) => acc + s.items.length, 0)}
                </span>
              </div>
            </div>

            <div className="p-2 overflow-y-auto flex-1 space-y-4 custom-scrollbar bg-black/10">
              {allSections.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Calculator className="text-slate-700 mb-3" size={32} />
                  <h5 className="text-slate-500 font-semibold text-xs">No matching snippets</h5>
                </div>
              ) : (
                <div className="space-y-6 px-1">
                  {allSections.map((section) => (
                    <div key={section.category}>
                      <h3 className="text-[10px] uppercase tracking-wider text-slate-500 flex items-center gap-2 mb-3 font-black px-1">
                        <span className="opacity-70">{section.icon}</span>
                        {section.category}
                      </h3>
                      <div className="flex flex-col gap-1.5">
                        {section.items.map((item, itemIdx) => (
                          <div key={`${item.name}-${itemIdx}`} className="relative group">
                            <button 
                              className="w-full bg-white/[0.02] border border-white/[0.04] text-[#e2e8f0] p-3 pr-10 rounded-xl text-left cursor-pointer transition-all hover:border-indigo-500/30 hover:bg-indigo-500/5 flex flex-col gap-1" 
                              onClick={() => {
                                onInsert(item.text);
                              }}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="font-semibold text-[13px] group-hover:text-indigo-400 transition-colors font-mono">{item.name}</span>
                                <span className="text-[9px] text-indigo-500/50 font-mono bg-indigo-500/5 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest font-bold">Insert</span>
                              </div>
                              {item.desc && (
                                <p className="text-[10px] text-slate-500 leading-relaxed font-normal line-clamp-1">{item.desc}</p>
                              )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedItem(item);
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-600 hover:text-indigo-400 transition-all rounded-lg hover:bg-indigo-500/10 active:scale-90"
                              title="View details"
                            >
                              <Info size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end" 
          onClick={onClose}
        >
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-[85vw] max-w-[320px] bg-[#0b0c10] border-l border-white/10 h-full flex flex-col shadow-2xl" 
            onClick={(e) => e.stopPropagation()}
          >
            {renderContent()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
