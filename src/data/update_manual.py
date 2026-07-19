import json

functions = [
    ("append", "append(l_list1 l_list2)", "Creates a list containing the elements of l_list1 followed by the elements of l_list2.", "append('(1 2) '(3 4)) => (1 2 3 4)"),
    ("append1", "append1(l_list g_arg)", "Adds new arguments to the end of a list.", "append1('(1 2 3) 4) => (1 2 3 4)"),
    ("car", "car(l_list)", "Returns the first element of a list. car is nondestructive.", "car('(a b c)) => a"),
    ("cdr", "cdr(l_list)", "Returns the tail of the list, that is, the list without its first element.", "cdr('(a b c)) => (b c)"),
    ("cons", "cons(g_element l_list)", "Adds an element to the beginning of a list.", "cons(1 nil) => (1)"),
    ("length", "length(l_list)", "Determines the length of a list, array, association table, or string.", "length('(a b c d)) => 4"),
    ("list", "list([g_arg1 ...])", "Creates a list with the given elements.", "list(1 2 3) => (1 2 3)"),
    ("nth", "nth(x_index0 l_list)", "Returns an index-selected element of a list, assuming a zero-based index.", "nth(1 '(a b c)) => b"),
    ("reverse", "reverse(l_list)", "Returns a copy of the given list with the elements in reverse order.", "reverse('(1 2 3)) => (3 2 1)"),
    ("arrayp", "arrayp(g_value)", "Checks if an object is an array.", "declare(x[10]) arrayp(x) => t"),
    ("defvar", "defvar(s_varName [g_value])", "Defines a variable and assigns it a value.", "defvar(x 3) => 3"),
    ("makeTable", "makeTable(S_name [g_default_value])", "Creates an empty association table.", "myTable = makeTable(\"atable1\" 0)"),
    ("type", "type(s_object)", "Returns a symbol that indicates the type of a SKILL object.", "type('foo) => symbol"),
    ("concat", "concat(Sx_arg1 [Sx_arg2 ...])", "Concatenates strings, symbols, or integers into a single symbol.", "concat(\"ab\" 123 'xy) => ab123xy"),
    ("setq", "setq(s_variableName g_newValueExp)", "Sets a variable to a new value.", "setq(x 5) => 5"),
    ("buildString", "buildString(l_strings [S_glueCharacters])", "Concatenates a list of strings with specified separation characters.", "buildString('(\"test\" \"il\") \".\") => \"test.il\""),
    ("parseString", "parseString(S_string [S_breakCharacters])", "Breaks a string into a list of substrings with break characters.", "parseString(\"Now is the time\") => (\"Now\" \"is\" \"the\" \"time\")"),
    ("rexCompile", "rexCompile(t_pattern)", "Compiles a regular expression string pattern.", "rexCompile(\"^[a-zA-Z]+\") => t"),
    ("rexExecute", "rexExecute(S_target)", "Matches a string or symbol against the previously compiled pattern.", "rexExecute(\"123abc\") => nil"),
    ("rexReplace", "rexReplace(t_source t_replacement x_index)", "Returns a copy of the source string with replacements.", "rexReplace(\"abc\" \"def\" 0)"),
    ("sprintf", "sprintf({s_Var | nil} t_formatString [g_arg1 ...])", "Formats the output and assigns the resultant string to the variable.", "sprintf(nil \"%d\" 42) => \"42\""),
    ("strcat", "strcat(S_string1 [S_string2 ...])", "Takes input strings or symbols and concatenates them.", "strcat(\"ab\" \"xyz\") => \"abxyz\""),
    ("abs", "abs(n_number)", "Returns the absolute value of a floating-point number or integer.", "abs(-209.625) => 209.625"),
    ("max", "max(n_num1 [n_num2 ...])", "Returns the maximum of the values passed in.", "max(6) => 6"),
    ("min", "min(n_num1 [n_num2 ...])", "Returns the minimum of the values passed in.", "min(3) => 3"),
    ("random", "random([x_number])", "Returns a random integer between zero and a given number minus one.", "random(93) => 26"),
    ("round", "round(n_arg)", "Rounds a floating-point number to its closest integer value.", "round(1.5) => 2"),
    ("and", "and(g_arg1 g_arg2 [g_arg3...])", "Evaluates from left to right its arguments to see if the result is nil.", "and(18 12) => 12"),
    ("or", "or(g_arg1 g_arg2 [g_arg3...])", "Evaluates from left to right its arguments to see if the result is non-nil.", "or(nil t) => t"),
    ("case", "case(g_keyForm l_clause1 [l_clause2 ...])", "Branches to one of the clauses depending on the value of the given expression.", "case(month (\"January\" 1) (t 'Other))"),
    ("cond", "cond(l_clause1 ...)", "Examines conditional clauses from left to right until a clause is satisfied.", "cond(((null x) (println \"Arg is null\")))"),
    ("for", "for(s_loopVar x_initialValue x_finalValue g_expr1)", "Evaluates the sequence for each loop variable value.", "for(i 1 10 sum = sum + i)"),
    ("foreach", "foreach(s_formalVar g_exprList g_expr1)", "Evaluates expressions for each element of a list of values.", "foreach(x '(1 2 3) println(x))"),
    ("if", "if(g_condition g_thenExpression [g_elseExpression])", "Selectively evaluates two groups of one or more expressions.", "if((x > 5) 1 0) => 0"),
    ("when", "when(g_condition g_expr1 ...)", "Evaluates a condition. If true, evaluates sequence of expressions.", "when(x < 0 println(\"x is negative\"))"),
    ("while", "while(g_condition g_expr1 ...)", "Repeatedly evaluates expressions until the condition is false.", "while((i <= 10) i++)"),
    ("close", "close(p_port)", "Drains, closes, and frees a port.", "close(p) => t"),
    ("infile", "infile(S_fileName)", "Opens an input port ready to read a file.", "in = infile(\"~/test/input.il\")"),
    ("outfile", "outfile(S_fileName [t_mode])", "Opens an output port ready to write to a file.", "p = outfile(\"/tmp/out.il\" \"w\")"),
    ("print", "print(g_value [p_outputPort])", "Prints a SKILL object using the default format.", "print(\"hello\") => nil"),
    ("println", "println(g_value [p_outputPort])", "Prints a SKILL object using the default format, then a newline.", "println(\"hello\") => nil"),
    ("defun", "defun(s_funcName (l_formalArglist) g_expr1 ...)", "Defines a function with the name and formal argument list.", "defun(cube (x) x**3)"),
    ("let", "let(l_bindings g_expr1 ...)", "Provides a faster alternative to prog for binding local variables only.", "let(((x 1)) x+1) => 2")
]

with open("manual.txt", "a") as f:
    for name, usage, desc, example in functions:
        f.write(f"@function {name}\n")
        f.write(f"@usage {usage}\n")
        f.write(f"@example {example}\n")
        f.write(f"@desc {desc}\n\n")

print("Added more functions to manual.txt")
