functions = [
    # Database (db)
    ("dbOpenCellViewByType", "dbOpenCellViewByType(t_libName t_cellName t_viewName [t_mode] [t_accessMode])", "Opens a cellview in memory and returns a database object. Mode can be 'r', 'w', or 'a'.", "cv = dbOpenCellViewByType(\"myLib\" \"myCell\" \"layout\" \"a\")"),
    ("dbCreateRect", "dbCreateRect(d_cellView l_layerId l_bBox)", "Creates a rectangle shape in the specified cellview on the specified layer.", "dbCreateRect(cv list(\"M1\" \"drawing\") list(0:0 10:10))"),
    ("dbCreateInst", "dbCreateInst(d_cellView d_masterId t_name l_pt t_orient [x_numInst])", "Creates an instance of a master cellview in the target cellview.", "dbCreateInst(cv masterCv \"I1\" 10:10 \"R0\")"),
    ("dbCreateLabel", "dbCreateLabel(d_cellView l_layerId l_pt t_label t_justify t_orient t_font n_height)", "Creates a text label in the cellview.", "dbCreateLabel(cv list(\"text\" \"drawing\") 0:0 \"Hello\" \"centerCenter\" \"R0\" \"roman\" 1.0)"),
    ("dbCreatePath", "dbCreatePath(d_cellView l_layerId l_points n_width)", "Creates a path (wire) in the cellview.", "dbCreatePath(cv list(\"M2\" \"drawing\") list(0:0 10:0 10:10) 0.5)"),
    ("dbCreatePolygon", "dbCreatePolygon(d_cellView l_layerId l_points)", "Creates a polygon in the cellview.", "dbCreatePolygon(cv list(\"M1\" \"drawing\") list(0:0 10:0 5:10))"),
    ("dbSave", "dbSave(d_cellView)", "Saves the cellview to disk.", "dbSave(cv)"),
    ("dbClose", "dbClose(d_cellView)", "Closes the cellview and frees it from memory.", "dbClose(cv)"),
    ("dbFindOpenCellView", "dbFindOpenCellView(t_libName t_cellName t_viewName)", "Finds an already open cellview in memory.", "cv = dbFindOpenCellView(\"myLib\" \"myCell\" \"layout\")"),
    
    # Layout (le)
    ("leGetValidLayerList", "leGetValidLayerList(t_techLibName)", "Returns a list of valid layout layers for the specified technology library.", "layers = leGetValidLayerList(\"tsmc18\")"),
    ("leSearchHierarchy", "leSearchHierarchy(d_cellView l_bBox n_depth t_type l_criteria)", "Searches the layout hierarchy for shapes matching the criteria.", "shapes = leSearchHierarchy(cv cv~>bBox 32 \"shape\" list(list(\"layer\" \"==\" list(\"M1\" \"drawing\"))))"),
    
    # Graphics Environment (ge)
    ("geGetWindowCellView", "geGetWindowCellView([w_windowId])", "Returns the cellview currently being edited in the specified window.", "cv = geGetWindowCellView()"),
    ("geGetEditCellView", "geGetEditCellView([w_windowId])", "Returns the cellview currently open for editing.", "cv = geGetEditCellView()"),
    ("geGetSelectedSet", "geGetSelectedSet([w_windowId])", "Returns a list of all currently selected objects in the window.", "sel = geGetSelectedSet()"),
    ("geDeselectAll", "geDeselectAll([w_windowId])", "Deselects all objects in the current window.", "geDeselectAll()"),
    ("geSelectFig", "geSelectFig(d_fig)", "Selects the specified figure in the layout.", "geSelectFig(myShape)"),
    
    # Human Interface (hi)
    ("hiDisplayForm", "hiDisplayForm(s_formHandle)", "Displays a Cadence Human Interface (HI) form.", "hiDisplayForm('myForm)"),
    ("hiCreateAppForm", "hiCreateAppForm(?name s_name ?formTitle t_title ?fields l_fields)", "Creates a new application form.", "hiCreateAppForm(?name 'myForm ?formTitle \"My Form\" ?fields list(myStringField))"),
    ("hiCreateStringField", "hiCreateStringField(?name s_name ?prompt t_prompt ?value t_val)", "Creates a string input field for a form.", "myStringField = hiCreateStringField(?name 'myStr ?prompt \"Enter Name\" ?value \"\")"),
    ("hiCreateButton", "hiCreateButton(?name s_name ?buttonText t_text ?callback t_callback)", "Creates a button for a form.", "btn = hiCreateButton(?name 'myBtn ?buttonText \"Click Me\" ?callback \"myCb()\")"),
    ("hiGetCurrentWindow", "hiGetCurrentWindow()", "Returns the window ID of the currently active window.", "win = hiGetCurrentWindow()"),
    ("hiDisplayBoundingBox", "hiDisplayBoundingBox(w_windowId l_bBox)", "Zooms the window to display the specified bounding box.", "hiDisplayBoundingBox(win cv~>bBox)"),
    
    # Techfile (tech)
    ("techGetTechFile", "techGetTechFile(d_cellView)", "Returns the technology file object attached to the cellview.", "tf = techGetTechFile(cv)"),
    ("techGetSpacingRule", "techGetSpacingRule(d_techFile t_ruleName t_layer1 [t_layer2])", "Retrieves a spacing rule from the tech file.", "space = techGetSpacingRule(tf \"minSpacing\" \"M1\")"),
    
    # General & I/O
    ("printf", "printf(t_formatString [g_arg1 ...])", "Formats and prints data to the standard output (CIW).", "printf(\"Hello %s\\n\" \"World\")"),
    ("sprintf", "sprintf(s_var t_formatString [g_arg1 ...])", "Formats data into a string and assigns it to a variable.", "sprintf(msg \"Value is %d\" 42)"),
    ("fprintf", "fprintf(p_port t_formatString [g_arg1 ...])", "Formats and prints data to the specified port.", "fprintf(port \"Data: %f\\n\" 3.14)"),
    ("warn", "warn(t_formatString [g_arg ...])", "Prints a warning message to the CIW.", "warn(\"Could not find cell %s\" cellName)"),
    ("error", "error(t_formatString [g_arg ...])", "Throws an error and halts execution, printing to the CIW.", "error(\"Invalid arguments passed\")"),
    ("open", "open(t_fileName t_mode)", "Opens a file and returns a port object. Mode can be 'r', 'w', or 'a'.", "port = open(\"output.txt\" \"w\")"),
    ("close", "close(p_port)", "Closes an open port.", "close(port)"),
    ("lineread", "lineread(p_port)", "Reads a line of text from a port and returns it as a list of symbols.", "data = lineread(port)"),
    ("gets", "gets(s_var p_port)", "Reads a string line from a port.", "gets(line port)"),
    
    # List Manipulation
    ("car", "car(l_list)", "Returns the first element of a list.", "firstElem = car(myList)"),
    ("cdr", "cdr(l_list)", "Returns the rest of the list (all but the first element).", "restElems = cdr(myList)"),
    ("cadr", "cadr(l_list)", "Returns the second element of a list.", "secondElem = cadr(myList)"),
    ("cons", "cons(g_element l_list)", "Adds an element to the front of a list.", "newList = cons(1 list(2 3))"),
    ("append", "append(l_list1 l_list2)", "Joins two lists together.", "combined = append(list(1 2) list(3 4))"),
    ("length", "length(l_list)", "Returns the number of elements in a list.", "num = length(myList)"),
    ("member", "member(g_element l_list)", "Checks if an element exists in a list. Returns the sublist starting with that element.", "if(member(\"A\" list(\"B\" \"A\" \"C\")) print(\"Found\"))"),
    ("reverse", "reverse(l_list)", "Returns the list in reverse order.", "revList = reverse(myList)"),
    ("sort", "sort(l_list u_compareFunc)", "Sorts a list using the specified comparison function.", "sorted = sort(myList 'alphalessp)"),
    
    # Control & Logic
    ("if", "if(g_condition then g_trueExpr [else g_falseExpr])", "Evaluates a condition and executes the true or false branch.", "if(x > 5 then print(\"Big\") else print(\"Small\"))"),
    ("when", "when(g_condition g_expr ...)", "Executes expressions if the condition is true.", "when(x > 5 print(\"Big\"))"),
    ("unless", "unless(g_condition g_expr ...)", "Executes expressions if the condition is false.", "unless(x > 5 print(\"Small\"))"),
    ("case", "case(g_val (g_match1 g_expr1) (g_match2 g_expr2) ...)", "Evaluates an expression matching the value.", "case(x (1 print(\"One\")) (2 print(\"Two\")))"),
    ("foreach", "foreach(s_var l_list g_expr ...)", "Iterates over a list, assigning each element to the variable.", "foreach(item myList print(item))"),
    ("for", "for(s_var n_start n_end g_expr ...)", "Iterates a variable from start to end.", "for(i 1 10 print(i))"),
    ("while", "while(g_condition g_expr ...)", "Executes expressions as long as the condition remains true.", "while(x > 0 x = x - 1)")
]

with open("manual.txt", "w") as f:
    for name, usage, desc, example in functions:
        f.write(f"@function {name}\n")
        f.write(f"@usage {usage}\n")
        f.write(f"@example {example}\n")
        f.write(f"@desc {desc}\n\n")

print("manual.txt generated successfully with examples.")
