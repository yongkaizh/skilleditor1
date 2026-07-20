import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, ArrowRight, Code, TerminalSquare, BookOpen, Lightbulb, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TutorialSidebarProps {
  currentText: string;
  isActive: boolean;
  onClose: () => void;
  isInline?: boolean;
  onInsertCode?: (code: string) => void;
}

export interface QuizOption {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface Lesson {
  id: number;
  title: string;
  subtitle: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  instructions: string;
  hint: string;
  startHint?: string;
  validation: (text: string) => boolean;
  explanation: string;
  quiz?: QuizOption;
}

const LESSONS: Lesson[] = [
  // BEGINNER LESSONS (1 to 15)
  {
    id: 1,
    title: '1. First Steps: Hello World',
    subtitle: 'Syntax Basics',
    level: 'Beginner',
    instructions: 'Welcome! SKILL is a Lisp-based language used to automate Electronic Design Automation (EDA) tools like Virtuoso. Let\'s start simple. Use the `printf` function to output a greeting.',
    hint: 'printf("Hello World\\n")',
    validation: (text: string) => /printf\s*\(\s*"Hello World(?:\\\\n|\\n)"\s*\)/.test(text),
    explanation: 'The \\n character adds a new line so subsequent console outputs don\'t jumble together.',
    quiz: {
      question: "Which function is used in SKILL to print formatted output to the console?",
      options: ["printf", "printLine", "echo", "cout"],
      answerIndex: 0,
      explanation: "printf prints formatted text. println and print are also available, but printf supports standard %-formatting styles like %s and %d."
    }
  },
  {
    id: 2,
    title: '2. Variable Let Binding',
    subtitle: 'Local Variable Scoping',
    level: 'Beginner',
    instructions: 'In Lisp, isolating variables is crucial so you don\'t accidentally overwrite global states. The `let` construct creates a safe, isolated local scope. Declare a local variable `width` inside a `let` block and assign it 5.0.',
    hint: 'let( (width)\n  width = 5.0\n)',
    validation: (text: string) => /let\s*\(\s*\(\s*width\s*\)\s*width\s*=\s*\d+/.test(text) || /let\s*\(\s*\(\s*[a-zA-Z_]\w*\s*\)/.test(text),
    explanation: 'The list `(width)` defines variables that exist solely inside this scope.',
    quiz: {
      question: "What is the primary purpose of the 'let' construct in SKILL?",
      options: ["To declare global variables", "To loop through list arrays", "To create a safe, isolated local variable scope", "To perform mathematical calculations"],
      answerIndex: 2,
      explanation: "let isolates variables inside its block, preventing accidental pollution of the global workspace."
    }
  },
  {
    id: 3,
    title: '3. Multiple Bindings',
    subtitle: 'Scoping Initializations',
    level: 'Beginner',
    instructions: 'You can define and initialize multiple local variables together inside the header list of your `let` block. Let\'s initialize `w` to 10 and `h` to 20.',
    hint: 'let( ((w 10) (h 20))\n  w * h\n)',
    validation: (text: string) => /let\s*\(\s*\(\s*\(\s*w\s+10\s*\)\s*\(\s*h\s+20\s*\)\s*\)/.test(text),
    explanation: 'Using standard paired lists `((w 10) (h 20))` instantiates and binds values simultaneously.',
    quiz: {
      question: "In let( ((w 10) (h 20)) w * h ), how are w and h initialized?",
      options: ["w is initialized to 10, h to 20", "w is initialized to 20, h to 10", "w and h are both initialized to 0", "This syntax is invalid in SKILL"],
      answerIndex: 0,
      explanation: "The header of let accepts double-nested lists like ((w 10) (h 20)) to simultaneously declare and initialize local variables."
    }
  },
  {
    id: 4,
    title: '4. Basic Arithmetic',
    subtitle: 'Standard Operators',
    level: 'Beginner',
    instructions: 'SKILL supports classic infix operators. Write a simple addition statement assigning the sum of 10 and 25 to a variable `total`.',
    hint: 'total = 10 + 25',
    validation: (text: string) => /total\s*=\s*10\s*\+\s*25/.test(text),
    explanation: 'In SKILL, mathematical operators like +, -, *, / can be written either infix or prefix.'
  },
  {
    id: 5,
    title: '5. Floating Point Math',
    subtitle: 'Precision Coordinates',
    level: 'Beginner',
    instructions: 'Layout coordinates in Virtuoso are represented as floating-point microns. Divide 15.0 by 4.0 and save it in `ratio`.',
    hint: 'ratio = 15.0 / 4.0',
    validation: (text: string) => /ratio\s*=\s*15\.0\s*\/\s*4\.0/.test(text),
    explanation: 'Using decimal numbers ensures floating point calculations rather than integer division.'
  },
  {
    id: 6,
    title: '6. String Concatenation',
    subtitle: 'Building Layer Strings',
    level: 'Beginner',
    instructions: 'Automating layouts often requires dynamically building layer or file names. Use the `strcat` function to combine "Metal" and "1".',
    hint: 'strcat("Metal" "1")',
    validation: (text: string) => /strcat\s*\(\s*"Metal"\s*"1"\s*\)/.test(text),
    explanation: '`strcat` joins any number of strings together sequentially into a single string.'
  },
  {
    id: 7,
    title: '7. String Formatting',
    subtitle: 'Dynamic String Building',
    level: 'Beginner',
    instructions: 'The `sprintf` function is a robust way to format strings. Use `sprintf` with a nil first argument, a format string `"Layer %s"`, and `"M1"` as the specifier.',
    hint: 'sprintf(nil "Layer %s" "M1")',
    validation: (text: string) => /sprintf\s*\(\s*nil\s+"Layer %s"\s+"M1"\s*\)/.test(text),
    explanation: 'Passing `nil` as the first argument causes `sprintf` to return the formatted string instead of writing it to a port.'
  },
  {
    id: 8,
    title: '8. Creating Simple Lists',
    subtitle: 'The Heart of Lisp',
    level: 'Beginner',
    instructions: 'Lisp stands for "LISt Processing". Lists group coordinates, layers, or objects. Instantiate a simple list containing "M1", "M2", and "M3" using the `list` function.',
    hint: 'list("M1" "M2" "M3")',
    validation: (text: string) => /list\s*\(\s*"M1"\s+"M2"\s+"M3"\s*\)/.test(text),
    explanation: 'Lists can hold strings, numbers, symbols, and nested coordinates.',
    quiz: {
      question: "Which built-in function is the standard way to construct a list in SKILL?",
      options: ["array()", "list()", "create_list()", "vector()"],
      answerIndex: 1,
      explanation: "list(...) constructs a standard Lisp-style linked list containing the arguments provided."
    }
  },
  {
    id: 9,
    title: '9. Head of a List (car)',
    subtitle: 'Extracting First Element',
    level: 'Beginner',
    instructions: 'The `car` operator returns the very first item of a list. Use it to extract the first element from a list of coordinates.',
    hint: 'car(list(10 20 30))',
    validation: (text: string) => /car\s*\(\s*list\s*\(\s*10\s+20\s+30\s*\)\s*\)/.test(text),
    explanation: '`car` stands for "Contents of Address Register" (historical IBM hardware terms).',
    quiz: {
      question: "What does the 'car' operator return when applied to a list?",
      options: ["The last element", "All elements except the first", "The first element", "The length of the list"],
      answerIndex: 2,
      explanation: "car retrieves the head (first item) of a list."
    }
  },
  {
    id: 10,
    title: '10. Tail of a List (cdr)',
    subtitle: 'Accessing Remaining Items',
    level: 'Beginner',
    instructions: 'The `cdr` operator returns a new list containing everything *except* the first element. Extract the tail of our list of numbers.',
    hint: 'cdr(list(10 20 30))',
    validation: (text: string) => /cdr\s*\(\s*list\s*\(\s*10\s+20\s+30\s*\)\s*\)/.test(text),
    explanation: '`cdr` stands for "Contents of Decrement Register" and always returns a list.',
    quiz: {
      question: "What does the 'cdr' operator return when applied to list(10 20 30)?",
      options: ["10", "list(20 30)", "30", "nil"],
      answerIndex: 1,
      explanation: "cdr returns the tail of the list: a new list containing everything except the first element."
    }
  },
  {
    id: 11,
    title: '11. Index Access (nth)',
    subtitle: 'Accessing Elements',
    level: 'Beginner',
    instructions: 'To access a list element at a specific index, use the 0-indexed `nth` function. Retrieve the item at index 2 from our string list.',
    hint: 'nth(2 list("A" "B" "C"))',
    validation: (text: string) => /nth\s*\(\s*2\s+list\s*\(/.test(text),
    explanation: '`nth(idx list)` is equivalent to checking `list[idx]` in other languages.'
  },
  {
    id: 12,
    title: '12. List Length',
    subtitle: 'Getting List Sizes',
    level: 'Beginner',
    instructions: 'Use the built-in `length` function to calculate the size of a coordinate points list.',
    hint: 'length(list(1.0 2.0 3.0))',
    validation: (text: string) => /length\s*\(\s*list\s*\(/.test(text),
    explanation: '`length` operates in O(N) linear time on standard Lisp linked lists.'
  },
  {
    id: 13,
    title: '13. Strict Equality',
    subtitle: 'Value Comparisons',
    level: 'Beginner',
    instructions: 'Write a basic comparison comparing two variables `x` and `y` using the strict equality operator `==`.',
    hint: 'x == y',
    validation: (text: string) => /x\s*==\s*y/.test(text),
    explanation: 'In SKILL, `==` checks value equality, whereas `eq` checks reference equality.',
    quiz: {
      question: "What is the key difference between == and eq in SKILL?",
      options: [
        "== compares reference, eq compares value",
        "== compares value, eq compares reference",
        "There is no difference",
        "== is only for strings, eq is only for numbers"
      ],
      answerIndex: 1,
      explanation: "== evaluates value equivalence, while eq tests reference equality (whether they are the same object in memory)."
    }
  },
  {
    id: 14,
    title: '14. Logical Combining (AND)',
    subtitle: 'Boolean Conjunctions',
    level: 'Beginner',
    instructions: 'Standard boolean logic is fully supported. Check if width is greater than 0 AND height is less than 10.',
    hint: 'width > 0.0 && height < 10.0',
    validation: (text: string) => /width\s*>\s*\d*(?:\.\d+)?\s*&&\s*height\s*<\s*\d*(?:\.\d+)?/.test(text),
    explanation: '`&&` short-circuits, meaning it won\'t evaluate the right operand if the left is false.'
  },
  {
    id: 15,
    title: '15. Logical Alternatives (OR)',
    subtitle: 'Boolean Disjunctions',
    level: 'Beginner',
    instructions: 'Check if a shape is a metal layer OR a via layer using the alternative operator `||`.',
    hint: 'isMetal || isVia',
    validation: (text: string) => /isMetal\s*\|\|\s*isVia/.test(text),
    explanation: '`||` returns true if either condition evaluates to a non-nil value.'
  },

  // INTERMEDIATE LESSONS (16 to 35)
  {
    id: 16,
    title: '16. If-Then Conditional',
    subtitle: 'Branching Basics',
    level: 'Intermediate',
    instructions: 'Lisp conditional expressions are written with an explicit `then` keyword. Print "OK" if a boolean `flag` is true.',
    hint: 'if( flag then\n  printf("OK")\n)',
    validation: (text: string) => /if\s*\(\s*flag\s+then\s+printf/.test(text),
    explanation: 'The explicit `then` separates the test expression from the executable statements.',
    quiz: {
      question: "What explicit keyword must follow the test condition in a SKILL 'if' statement?",
      options: ["then", "else", "do", "begin"],
      answerIndex: 0,
      explanation: "SKILL's conditional uses if( condition then ... else ... ) where the 'then' keyword separates the test from the body."
    }
  },
  {
    id: 17,
    title: '17. If-Then-Else Branching',
    subtitle: 'Alternative Paths',
    level: 'Intermediate',
    instructions: 'Extend the conditional branching logic with an `else` branch to default-assign 0 if `x` is not greater than 0.',
    hint: 'if( x > 0 then\n  x\nelse\n  0\n)',
    validation: (text: string) => /if\s*\(\s*x\s*>\s*0\s+then\s+x\s+else\s+0/.test(text),
    explanation: 'The complete `if-then-else` structure acts as a ternary expression returning the executed branch value.'
  },
  {
    id: 18,
    title: '18. Conditional When Macro',
    subtitle: 'Clean Guard Clauses',
    level: 'Intermediate',
    instructions: 'When you only have a positive branch, the `when` macro is a much cleaner alternative to `if`. It executes a sequence of expressions when true.',
    hint: 'when( flag\n  printf("Initializing\\n")\n  setup()\n)',
    validation: (text: string) => /when\s*\(\s*flag\s+printf/.test(text),
    explanation: '`when` includes an implicit `progn`, allowing you to run multiple statements without wrappers.'
  },
  {
    id: 19,
    title: '19. Conditional Unless Macro',
    subtitle: 'Clean Negated Guards',
    level: 'Intermediate',
    instructions: 'The opposite of `when` is `unless`. It runs its body only if the condition evaluates to `nil`.',
    hint: 'unless( cv\n  error("No active layout cellview found!\\n")\n)',
    validation: (text: string) => /unless\s*\(\s*cv\s+error/.test(text),
    explanation: '`unless(cond ...)` is a cleaner shortcut for writing `if(!cond then ...)`.'
  },
  {
    id: 20,
    title: '20. Foreach Loop Iteration',
    subtitle: 'Iterating Over Lists',
    level: 'Intermediate',
    instructions: 'To process items sequentially, use the `foreach` macro. Let\'s loop through a list of layer strings and print each layer.',
    hint: 'foreach( layer list("M1" "M2" "M3")\n  printf("Processing layer: %s\\n" layer)\n)',
    validation: (text: string) => /foreach\s*\(\s*[a-zA-Z_]\w*\s+list\s*\(/.test(text),
    explanation: 'The loop variable is locally bound to each element of the list in turn.'
  },
  {
    id: 21,
    title: '21. Index Counting (for)',
    subtitle: 'Iterating Coordinates',
    level: 'Intermediate',
    instructions: 'To iterate with an index counter, use the `for` construct. Write a loop printing integers from 1 to 5.',
    hint: 'for( i 1 5\n  printf("Step %d\\n" i)\n)',
    validation: (text: string) => /for\s*\(\s*i\s+1\s+5/.test(text),
    explanation: 'The parameters specify: `for(variable start end body...)`.'
  },
  {
    id: 22,
    title: '22. While Loop Execution',
    subtitle: 'Iterative Loops',
    level: 'Intermediate',
    instructions: 'Execute a block of code repeatedly while a condition is met. Increment local counter `x` while it is less than 10.',
    hint: 'while( x < 10\n  printf("Count: %d\\n" x)\n  x = x + 1\n)',
    validation: (text: string) => /while\s*\(\s*x\s*<\s*10/.test(text),
    explanation: 'Ensure the loop body eventually alters the tested condition to avoid hanging Virtuoso!'
  },
  {
    id: 23,
    title: '23. Custom Procedure Declaration',
    subtitle: 'Creating Reusable Functions',
    level: 'Intermediate',
    instructions: 'To group logic, define a function using `procedure`. Declare a function named `double` that accepts a parameter `val` and multiplies it by 2.',
    hint: 'procedure( double(val)\n  val * 2\n)',
    validation: (text: string) => /procedure\s*\(\s*double\s*\(\s*val\s*\)/.test(text),
    explanation: 'In Lisp, the last evaluated expression is automatically returned as the procedure result.',
    quiz: {
      question: "In SKILL, what value is returned by a procedure if no 'return' is explicitly called?",
      options: ["Always t (true)", "Always nil", "The value of the last evaluated expression", "Nothing (void)"],
      answerIndex: 2,
      explanation: "Procedures in SKILL implicitly return the result of their final executed statement."
    }
  },
  {
    id: 24,
    title: '24. Disembodied Property Lists',
    subtitle: 'DPL Dictionaries',
    level: 'Intermediate',
    instructions: 'A DPL (Disembodied Property List) stores key-value pairs. It starts with `nil`, followed by quoted symbol keys. Construct a DPL for Metal1 with width 5.0.',
    hint: 'list(nil \'layer "M1" \'width 5.0)',
    validation: (text: string) => /list\s*\(\s*nil\s+'.+\)/.test(text),
    explanation: 'Quoted symbols like \'layer act as non-evaluated static keywords/keys.',
    quiz: {
      question: "What does a Disembodied Property List (DPL) always start with as its first element?",
      options: ["t", "nil", "a list of keys", "a hash table"],
      answerIndex: 1,
      explanation: "A DPL must start with nil so Virtuoso can distinguish it from standard key-value lists during property lookup."
    }
  },
  {
    id: 25,
    title: '25. DPL Value Retrieval',
    subtitle: 'Property Navigation',
    level: 'Intermediate',
    instructions: 'Use the specialized arrow operator `->` to fetch properties from your disembodied property list.',
    hint: 'myDPL->layer',
    validation: (text: string) => /[a-zA-Z_]\w*->[a-zA-Z_]\w*/.test(text),
    explanation: 'The arrow `->` compiles to high-performance property database searches.'
  },
  {
    id: 26,
    title: '26. DPL Property Mutation',
    subtitle: 'Updating Key Values',
    level: 'Intermediate',
    instructions: 'Use the arrow operator together with `=` to mutate or add properties dynamically in-place.',
    hint: 'myDPL->width = 1.2',
    validation: (text: string) => /[a-zA-Z_]\w*->width\s*=\s*\d*(?:\.\d+)?/.test(text),
    explanation: 'If the property key does not exist yet, Virtuoso creates it automatically.'
  },
  {
    id: 27,
    title: '27. Association Lists (Alists)',
    subtitle: 'Key-Value Sublists',
    level: 'Intermediate',
    instructions: 'An Alist is a list of sub-lists. Use `assoc` to search an Alist for a matching first element key, returning the matching sub-list.',
    hint: 'assoc("M1" list(list("M1" 0.5) list("M2" 0.6)))',
    validation: (text: string) => /assoc\s*\(\s*"M1"\s+list\s*\(/.test(text),
    explanation: '`assoc` is useful for quick config lookups of technology layer constraints.'
  },
  {
    id: 28,
    title: '28. Symbol Properties (plist)',
    subtitle: 'Attaching Data directly',
    level: 'Intermediate',
    instructions: 'In SKILL, any symbol can carry a property list. Use `putprop` to assign "Gold" under key \'quality to global symbol \'mySymbol.',
    hint: 'putprop(\'mySymbol "Gold" \'quality)',
    validation: (text: string) => /putprop\s*\(\s*'mySymbol\s+"Gold"\s+'quality\s*\)/.test(text),
    explanation: 'Properties attached to global symbols persist in memory across layouts.'
  },
  {
    id: 29,
    title: '29. List Mapcar Transformations',
    subtitle: 'Mapping List Elements',
    level: 'Intermediate',
    instructions: 'Transform elements of a list by applying a function (like a lambda expression) to each element using `mapcar`.',
    hint: 'mapcar(\'lambda( (x) x * 2 ) list(1 2 3))',
    validation: (text: string) => /mapcar\s*\(\s*'lambda\s*\(/.test(text),
    explanation: '`mapcar` returns a new list containing the results of each mapped application.'
  },
  {
    id: 30,
    title: '30. Filtering with Setof',
    subtitle: 'Conditional Subset Filters',
    level: 'Intermediate',
    instructions: 'To filter lists, use `setof`. Provide a loop variable, the list, and a conditional filter statement.',
    hint: 'setof( x list(1 2 3 4) x > 2 )',
    validation: (text: string) => /setof\s*\(\s*x\s+list\s*\(.+\s+x\s*>\s*2\s*\)/.test(text),
    explanation: '`setof` keeps all elements where the boolean test evaluates to non-nil.'
  },
  {
    id: 31,
    title: '31. Scoped Procedures',
    subtitle: 'Safe Function Local variables',
    level: 'Intermediate',
    instructions: 'Combine custom procedures with internal `let` bindings to prevent your function\'s temporary variables from leaking globally.',
    hint: 'procedure( addTen(val) let( (res)\n  res = val + 10\n  res\n))',
    validation: (text: string) => /procedure\s*\(.+let\s*\(\s*\(\s*res\s*\)/.test(text),
    explanation: 'Here, `res` is safely isolated. Outside this procedure, `res` remains unaffected.'
  },
  {
    id: 32,
    title: '32. Early Returns with Prog',
    subtitle: 'Escaping Scope Block early',
    level: 'Intermediate',
    instructions: 'While `let` returns the last line, the `prog` macro allows you to return early from any point using the `return` function.',
    hint: 'prog( (x)\n  x = 5\n  return(x)\n)',
    validation: (text: string) => /prog\s*\(.+\s*return\s*\(/.test(text),
    explanation: '`prog` is useful for complex algorithm steps requiring immediate conditional escapes.'
  },
  {
    id: 33,
    title: '33. Item Existence checks',
    subtitle: 'Searching lists with member',
    level: 'Intermediate',
    instructions: 'Check if an element exists in a list using the `member` function. It returns the remaining sublist starting with the item, or nil.',
    hint: 'member("M1" list("M2" "M1" "M3"))',
    validation: (text: string) => /member\s*\(\s*"M1"\s+list\s*\(/.test(text),
    explanation: 'Since anything non-nil acts as true, `member` is the defacto lookup check.'
  },
  {
    id: 34,
    title: '34. Dynamic Apply Function',
    subtitle: 'Invoking named parameters',
    level: 'Intermediate',
    instructions: 'Apply a function dynamically to a flat list of arguments using the `apply` construct.',
    hint: 'apply(\'plus list(1 2 3))',
    validation: (text: string) => /apply\s*\(\s*'plus/.test(text),
    explanation: 'This translates to `plus(1 2 3)`, returning 6.'
  },
  {
    id: 35,
    title: '35. Merging Lists with Append',
    subtitle: 'Combining Lists',
    level: 'Intermediate',
    instructions: 'Merge multiple lists together into one single unified array list using the `append` command.',
    hint: 'append(list(1 2) list(3 4))',
    validation: (text: string) => /append\s*\(\s*list\s*\(.+\)\s+list\s*\(/.test(text),
    explanation: '`append` duplicates the first list to attach the second, preserving both elements.'
  },

  // ADVANCED LESSONS (36 to 50)
  {
    id: 36,
    title: '36. Grab Workspace CellView',
    subtitle: 'Connecting layout editor',
    level: 'Advanced',
    instructions: 'To programmatically modify what a user is looking at, grab the active graphic cellview using `geGetWindowCellView`.',
    hint: 'cv = geGetWindowCellView()',
    validation: (text: string) => /cv\s*=\s*geGetWindowCellView\s*\(\s*\)/.test(text),
    explanation: '`ge` stands for Graphic Editor, referencing active viewport controls.'
  },
  {
    id: 37,
    title: '37. Opening Layout CellView',
    subtitle: 'Database Cell Reading',
    level: 'Advanced',
    instructions: 'To open an arbitrary cellview directly from a library database without user interaction, use the database-level `dbOpenCellViewByType` in read "r" mode.',
    hint: 'cv = dbOpenCellViewByType("analogLib" "res" "layout" "maskLayout" "r")',
    validation: (text: string) => /dbOpenCellViewByType\s*\(\s*"[a-zA-Z_]\w*"\s+"[a-zA-Z_]\w*"\s+"layout"\s+"maskLayout"\s+"r"\s*\)/.test(text),
    explanation: 'Modes include "r" (read), "w" (overwrite), and "a" (append).'
  },
  {
    id: 38,
    title: '38. Bounding Box Lower-Left',
    subtitle: 'Extracting Coordinate Minimums',
    level: 'Advanced',
    instructions: 'A cellview has a bounding box database attribute `bBox` (containing bottom-left and top-right points). Extract the lower-left point coordinate.',
    hint: 'lowerLeft(cv~>bBox)',
    validation: (text: string) => /lowerLeft\s*\(\s*[a-zA-Z_]\w*~>bBox\s*\)/.test(text),
    explanation: '`cv~>bBox` extracts layout limits from database properties using the Lisp arrow selector.'
  },
  {
    id: 39,
    title: '39. Bounding Box Upper-Right',
    subtitle: 'Extracting Coordinate Maximums',
    level: 'Advanced',
    instructions: 'Extract the upper-right point coordinate of the active layout cellview.',
    hint: 'upperRight(cv~>bBox)',
    validation: (text: string) => /upperRight\s*\(\s*[a-zA-Z_]\w*~>bBox\s*\)/.test(text),
    explanation: 'Combining `lowerLeft` and `upperRight` defines the exact bounding limits of layout scopes.'
  },
  {
    id: 40,
    title: '40. Coordinate Destructuring',
    subtitle: 'Extracting X Coordinates',
    level: 'Advanced',
    instructions: 'Points are represented as lists `(X Y)` or `X:Y`. Use `xCoord` to isolate the numeric X coordinate of a layout coordinate point.',
    hint: 'xCoord(point)',
    validation: (text: string) => /xCoord\s*\(\s*[a-zA-Z_]\w*\s*\)/.test(text),
    explanation: 'Similarly, `yCoord` extracts the vertical coordinate.'
  },
  {
    id: 41,
    title: '41. Drawing Layout Rectangles',
    subtitle: 'Instantiating Geometry',
    level: 'Advanced',
    instructions: 'Use the standard database construct `dbCreateRect` to draw a layout rectangle. Pass the cellview, a layer-purpose-pair (LPP) list, and the bounding coordinate box.',
    hint: 'dbCreateRect(cv list("M1" "drawing") list(0:0 10:10))',
    validation: (text: string) => /dbCreateRect\s*\(\s*[a-zA-Z_]\w*\s+list\s*\(\s*"M1"\s+"drawing"\s*\)\s+list\s*\(\s*\d+:\d+\s+\d+:\d+\s*\)\s*\)/.test(text),
    explanation: 'The coordinate shorthand `0:0` automatically represents the list `(0 0)`.'
  },
  {
    id: 42,
    title: '42. Drawing Connection Paths',
    subtitle: 'Instantiating Connections',
    level: 'Advanced',
    instructions: 'Paths represent routing lines. Use `dbCreatePath` with cellview, layer purpose, a list of route coordinate points, and a path width.',
    hint: 'dbCreatePath(cv list("M1" "drawing") list(0:0 10:0) 1.5)',
    validation: (text: string) => /dbCreatePath\s*\(\s*[a-zA-Z_]\w*\s+list\s*\(\s*"M1"\s+"drawing"\s*\)\s+list\s*\(\s*\d+:\d+\s+\d+:\d+\s*\)\s*1\.5\s*\)/.test(text),
    explanation: 'Paths are defined with coordinates tracing the exact center-line of the trace.'
  },
  {
    id: 43,
    title: '43. Layout Labels',
    subtitle: 'Placing Text Labels',
    level: 'Advanced',
    instructions: 'Label pins or signal nodes using `dbCreateLabel`. Specify coordinates, text, orientation, and font size.',
    hint: 'dbCreateLabel(cv list("M1" "label") 2:2 "GND" "centerCenter" "R0" "roman" 0.5)',
    validation: (text: string) => /dbCreateLabel\s*\(/.test(text),
    explanation: 'Labels are crucial for physical LVS layout validation checkers.'
  },
  {
    id: 44,
    title: '44. Layout Instances',
    subtitle: 'Hierarchy Instantiation',
    level: 'Advanced',
    instructions: 'To place cells inside other cells, use `dbCreateInst`. Pass the parent view, the child master cellview, name, location, and rotation orientation.',
    hint: 'dbCreateInst(cv master "I0" 0:0 "R0")',
    validation: (text: string) => /dbCreateInst\s*\(\s*[a-zA-Z_]\w*\s+[a-zA-Z_]\w*\s+"I0"\s+\d+:\d+\s+"R0"\s*\)/.test(text),
    explanation: '"R0" is standard 0-degree rotation. Other variables include "R90", "MX", etc.'
  },
  {
    id: 45,
    title: '45. Merge Overlapping Metal Lines',
    subtitle: '1D Boolean OR / Interval Merging',
    level: 'Advanced',
    instructions: 'In layout, overlapping metal segments on the same track must be merged to prevent DRC errors. Write a procedure `mergeMetalSegments` that takes a list of intervals `(start end)` and returns merged intervals.',
    startHint: 'Sort the intervals by their start coordinate first. Then iterate through them, checking if the current interval overlaps with the previous one. If it does, update the end of the previous interval to the maximum of both ends.',
    hint: 'procedure( mergeMetalSegments(intervals)\n  let( (sorted merged curr)\n    sorted = sort(intervals \'lambda((a b) car(a) < car(b)))\n    merged = list(car(sorted))\n    foreach( x cdr(sorted)\n      curr = car(merged)\n      if( car(x) <= cadr(curr) then\n        merged = cons(list(car(curr) max(cadr(curr) cadr(x))) cdr(merged))\n      else\n        merged = cons(x merged)\n      )\n    )\n    reverse(merged)\n  )\n)',
    validation: (text: string) => /mergeMetalSegments/.test(text) && /sort\s*\(/.test(text),
    explanation: 'This O(N log N) algorithm sorts intervals by start coordinate and merges overlaps iteratively.'
  },
  {
    id: 46,
    title: '46. Netlist Pair Matching',
    subtitle: 'Capacitance Target Matching (Two Sum)',
    level: 'Advanced',
    instructions: 'Given a list of capacitor instances with their capacitance values and a target total capacitance, find the first pair of capacitors that sum exactly to the target to balance a differential pair. Optimize it to O(N) using a hash table.',
    startHint: 'Use a hash table (created with `makeTable`) to store the values you have seen so far. For each capacitor, calculate the difference between the target and its value, and check if that difference is already in the table.',
    hint: 'procedure( findCapPair(caps target)\n  let( (seenTable diff found)\n    seenTable = makeTable("caps")\n    foreach( cap caps\n      diff = target - cap->value\n      if( seenTable[diff] then\n        found = list(seenTable[diff] cap)\n      else\n        seenTable[cap->value] = cap\n      )\n    )\n    found\n  )\n)',
    validation: (text: string) => /makeTable/.test(text) && /seenTable/.test(text),
    explanation: 'Hash tables (`makeTable`) allow O(1) lookups, speeding up pair finding compared to O(N^2) nested loops.'
  },
  {
    id: 47,
    title: '47. Transistor Sizing Optimization',
    subtitle: 'Monotonic Target Search (Binary Search)',
    level: 'Advanced',
    instructions: 'A simulation function `getDelay(width)` returns monotonically decreasing delay as width increases. Write `findOptimalWidth` to find the minimum integer width in `[minW, maxW]` that achieves `delay <= target` in O(log N) time using binary search.',
    startHint: 'This is a classic binary search problem on a monotonic function. Keep track of a `low` and `high` bound, and calculate the `mid` point. If `getDelay(mid)` is less than or equal to the target, move the `high` bound down and record the `best` width found so far.',
    hint: 'procedure( findOptimalWidth(minW maxW targetDelay)\n  let( (low high mid best)\n    low = minW\n    high = maxW\n    while( low <= high\n      mid = round((low + high) / 2)\n      if( getDelay(mid) <= targetDelay then\n        best = mid\n        high = mid - 1\n      else\n        low = mid + 1\n      )\n    )\n    best\n  )\n)',
    validation: (text: string) => /while/.test(text) && /mid\s*=/.test(text) && /low\s*<=\s*high/.test(text),
    explanation: 'Binary search is critical in CAD tools to efficiently converge on optimal device sizes without exhaustive simulation.'
  },
  {
    id: 48,
    title: '48. Connected Polygon Extraction',
    subtitle: 'Depth-First Graph Traversal',
    level: 'Advanced',
    instructions: 'Find the number of isolated electrical nets given a 2D grid where 1 represents metal and 0 represents space. Implement `countIsolatedNets` using a DFS procedure to mark visited metal tiles.',
    startHint: 'Iterate through every cell in the grid. If you find a 1 that hasn\'t been visited, you\'ve found a new net. Start a Depth-First Search (DFS) from that cell to mark all connected 1s as visited. Increment your net counter each time you start a new DFS.',
    hint: 'procedure( countIsolatedNets(grid rows cols)\n  let( (count dfs visited)\n    visited = makeTable("v")\n    dfs = lambda( (r c)\n      when( r>=0 && r<rows && c>=0 && c<cols && grid[r][c]==1 && !visited[sprintf(nil "%d_%d" r c)]\n        visited[sprintf(nil "%d_%d" r c)] = t\n        funcall(dfs r+1 c) funcall(dfs r-1 c) funcall(dfs r c+1) funcall(dfs r c-1)\n      )\n    )\n    count = 0\n    for( r 0 rows-1 for( c 0 cols-1\n      when( grid[r][c]==1 && !visited[sprintf(nil "%d_%d" r c)]\n        funcall(dfs r c) count++\n      )\n    ))\n    count\n  )\n)',
    validation: (text: string) => /dfs\s*=/.test(text) && /funcall/.test(text),
    explanation: 'Graph traversal algorithms like DFS/BFS are the foundation of LVS (Layout Versus Schematic) net extraction engines.'
  },
  {
    id: 49,
    title: '49. Cache Layout Masters',
    subtitle: 'LRU Cache Management',
    level: 'Advanced',
    instructions: 'Opening cellviews is expensive. Implement a Least Recently Used (LRU) cache class or procedure set for storing up to `capacity` layout master pointers, evicting the oldest unaccessed view.',
    hint: 'defclass( LRUCache () (capacity (cacheTable @initform makeTable("c")) (keys @initform nil)) )\ndefmethod( getMaster ((lru LRUCache) cellName)\n  if( lru->cacheTable[cellName] then\n    lru->keys = cons(cellName remove(cellName lru->keys))\n    lru->cacheTable[cellName]\n  else nil )\n)\ndefmethod( putMaster ((lru LRUCache) cellName master)\n  lru->keys = cons(cellName remove(cellName lru->keys))\n  lru->cacheTable[cellName] = master\n  when( length(lru->keys) > lru->capacity\n    removeKey = car(reverse(lru->keys))\n    lru->cacheTable[removeKey] = nil\n    lru->keys = reverse(cdr(reverse(lru->keys)))\n  )\n)',
    validation: (text: string) => /defclass/.test(text) && /LRUCache/.test(text),
    explanation: 'An LRU cache ensures fast retrieval of frequently instantiated cells while preventing memory bloat in Virtuoso.'
  },
  {
    id: 50,
    title: '50. Longest Common Subpath',
    subtitle: 'Routing Topology Comparison (LCS)',
    level: 'Advanced',
    instructions: 'To match differential pair routing, find the longest common sequence of routing directions (e.g. "N", "E", "S", "W") between two nets using Dynamic Programming.',
    startHint: 'This is the Longest Common Subsequence (LCS) problem. Create a 2D matrix (or a vector of vectors) to store the lengths of the longest common subpaths for all prefixes of the two paths. Use nested loops to fill the matrix.',
    hint: 'procedure( longestCommonRouting(pathA pathB)\n  let( (dp m n)\n    m = length(pathA)  n = length(pathB)\n    dp = makeVector(m+1)\n    for( i 0 m dp[i] = makeVector(n+1 0) )\n    for( i 1 m for( j 1 n\n      if( nth(i-1 pathA) == nth(j-1 pathB) then\n        dp[i][j] = dp[i-1][j-1] + 1\n      else\n        dp[i][j] = max(dp[i-1][j] dp[i][j-1])\n      )\n    ))\n    dp[m][n]\n  )\n)',
    validation: (text: string) => /makeVector/.test(text) && /dp/.test(text),
    explanation: 'Dynamic programming efficiently solves subset comparison problems crucial for symmetry and matching checks.'
  },

  // EXPERT LESSONS (51 to 65)
  {
    id: 51,
    title: '51. Exception Isolation with Errset',
    subtitle: 'Bulletproofing Scripts',
    level: 'Expert',
    instructions: 'In Virtuoso, a script crash can lock user design sessions. Bulletproof execution by wrapping dangerous operations inside the `errset` macro.',
    hint: 'errset(\n  printf("Potentially risky operation")\n  t\n)',
    validation: (text: string) => /errset\s*\(/.test(text),
    explanation: '`errset` traps internal errors. It returns `nil` if an error occurs rather than crashing.'
  },
  {
    id: 52,
    title: '52. Hierarchical Shape Traversals',
    subtitle: 'Deep Layout Extraction',
    level: 'Expert',
    instructions: 'Extract shape lists residing inside nested design cell instances using standard hierarchical mapping notations.',
    hint: 'cv~>instances~>shapes',
    validation: (text: string) => /cv~>instances~>shapes/.test(text),
    explanation: 'Lisp dynamically accumulates attributes across collection arrays automatically.'
  },
  {
    id: 53,
    title: '53. Coordinate Vector Translation',
    subtitle: 'Applying Transform Matrices',
    level: 'Expert',
    instructions: 'To translate local coordinates of nested shapes to top-level coordinates, use `dbTransformPoint`.',
    hint: 'dbTransformPoint(point transform)',
    validation: (text: string) => /dbTransformPoint\s*\(/.test(text),
    explanation: 'Calculates points against orientation transform vectors (origin, orientation).'
  },
  {
    id: 54,
    title: '54. Spatial Overlap Inspections',
    subtitle: 'Geometric BBox Checks',
    level: 'Expert',
    instructions: 'Query the layout database to find all shape objects intersecting a rectangular region using `dbGetOverlaps`.',
    hint: 'dbGetOverlaps(cv list(0:0 10:10))',
    validation: (text: string) => /dbGetOverlaps\s*\(\s*cv/.test(text),
    explanation: 'Crucial for writing custom DRC checkers or auto-via alignment helpers.'
  },
  {
    id: 55,
    title: '55. Recursive CellView Walkers',
    subtitle: 'Traversing Master Trees',
    level: 'Expert',
    instructions: 'Traverse layout hierarchy recursively. Pass master cell cellviews of instances to a walker block.',
    hint: 'procedure( traverse(cv)\n  foreach(inst cv~>instances\n    traverse(dbGetAnyInstMaster(inst))\n  )\n)',
    validation: (text: string) => /traverse/.test(text) && /dbGetAnyInstMaster/.test(text),
    explanation: 'Recursive traversers drill down to gather cell totals across child scopes.'
  },
  {
    id: 56,
    title: '56. Automatic Via Grid Array Generators',
    subtitle: 'Layout Matrix Loops',
    level: 'Expert',
    instructions: 'Create nested grid loops for via matrices. Draw layout contacts in horizontal/vertical grids.',
    hint: 'for( r 0 4\n  for( c 0 4\n    dbCreateRect(cv list("Via1" "drawing") list(c:r (c+0.5):(r+0.5)))\n  )\n)',
    validation: (text: string) => /for\s*\(.+for\s*\(/.test(text),
    explanation: 'Automating standard micro-layout grids dramatically cuts manual layout drawing overheads.'
  },
  {
    id: 57,
    title: '57. Concentric Guard Ring Synthesizers',
    subtitle: 'Automated Isolation Borders',
    level: 'Expert',
    instructions: 'Draw concentric shapes surrounding bounding coordinates of selection sets to isolate analog circuits.',
    hint: 'dbCreateRect(cv layer list((x1-1):(y1-1) (x2+1):(y2+1)))',
    validation: (text: string) => /x1\s*-\s*1/.test(text) || /x2\s*\+\s*1/.test(text),
    explanation: 'Concentric offsetting encloses noise-sensitive blocks inside substrate safety bounds.'
  },
  {
    id: 58,
    title: '58. Total Surface Area Counters',
    subtitle: 'Iterative Area Calculations',
    level: 'Expert',
    instructions: 'Loop through shapes checking layer-purpose-pairs to aggregate surface areas.',
    hint: 'foreach( s cv~>shapes\n  total = total + area(s)\n)',
    validation: (text: string) => /total\s*=\s*total\s*\+/.test(text) || /total\s*\+/.test(text),
    explanation: 'Surface area tallies help estimate capacitance or resistance characteristics.'
  },
  {
    id: 59,
    title: '59. Pin Connectivity Tracers',
    subtitle: 'Extracting Pin Terms',
    level: 'Expert',
    instructions: 'Check block layouts to trace all physical terminal connections using the `instTerms` handle.',
    hint: 'foreach( term inst~>instTerms\n  printf("Pin %s\\n" term~>name)\n)',
    validation: (text: string) => /instTerms/.test(text),
    explanation: 'Traversing terminals verifies layouts align with schematic logical nets.'
  },
  {
    id: 60,
    title: '60. Interactive Virtuoso Pulldown Menus',
    subtitle: 'Integrating CAD menus',
    level: 'Expert',
    instructions: 'Register custom tools inside the Virtuoso menu bar using `hiCreatePulldownMenu`.',
    hint: 'hiCreatePulldownMenu(\'myMenu "SKILL Tools" list(item1 item2))',
    validation: (text: string) => /hiCreatePulldownMenu\s*\(/.test(text),
    explanation: 'Extending Virtuoso menus launches automated tools straight from layouts.'
  },
  {
    id: 61,
    title: '61. Double Patterning coloring',
    subtitle: 'Graph Bipartiteness & Odd Cycles',
    level: 'Expert',
    instructions: 'In 20nm processes, features must be assigned to two masks. If any two polygons are closer than `d_min`, they must be different colors. Write `checkColoringConflict` to determine if a conflict graph is bipartite using BFS/DFS. Return `nil` if an odd cycle (unresolvable conflict) is found.',
    startHint: 'This is a classic Graph Bipartiteness problem. Use a hash table to store the color (0 or 1) of each node. Perform a BFS or DFS; for each neighbor of a node, assign it the opposite color. If you find a neighbor already colored with the same color as the current node, you have found an odd cycle and a conflict.',
    hint: 'procedure( checkColoringConflict(nodes adj)\n  let( (colors queue u v conflict)\n    colors = makeTable("c" -1)\n    conflict = nil\n    foreach( startNode nodes\n      when( colors[startNode] == -1 && !conflict\n        colors[startNode] = 0\n        queue = list(startNode)\n        while( queue && !conflict\n          u = car(queue) queue = cdr(queue)\n          foreach( v adj[u]\n            if( colors[v] == -1 then\n              colors[v] = 1 - colors[u]\n              queue = append(queue list(v))\n            else if( colors[v] == colors[u] then\n              conflict = t\n            ))\n          )\n        )\n      )\n    )\n    if( conflict then nil else colors )\n  )\n)',
    validation: (text: string) => /1\s*-\s*colors/.test(text) && /conflict/.test(text) && /queue/.test(text),
    explanation: 'Detecting odd cycles in conflict graphs is the core of Multi-Patterning decomposition in sub-20nm lithography.'
  },
  {
    id: 62,
    title: '62. Optimal Buffer Placement',
    subtitle: 'Min-Cost Path (Dynamic Programming)',
    level: 'Expert',
    instructions: 'A long wire is divided into segments, each with a capacitance. Placing a buffer costs energy but resets delay. Find the minimum cost to buffer the wire such that no segment delay exceeds `maxCap`.',
    hint: 'procedure( minBufferCost(caps maxCap bufferCost)\n  let( (n dp currCap)\n    n = length(caps)\n    dp = makeVector(n+1 1e9)  dp[0] = 0\n    for( i 1 n\n      currCap = 0\n      for( j i 1 ; step -1\n        currCap = currCap + nth(j-1 caps)\n        if( currCap <= maxCap then\n          dp[i] = min(dp[i] dp[j-1] + bufferCost)\n        else break()\n        )\n      )\n    )\n    dp[n]\n  )\n)',
    validation: (text: string) => /dp\[i\]/.test(text) && /min/.test(text),
    explanation: 'Dynamic programming helps find global optimums for repeater insertion in timing closure pipelines.'
  },
  {
    id: 63,
    title: '63. Trapped Routing Space',
    subtitle: 'Macro Congestion Profiling',
    level: 'Expert',
    instructions: 'Given an array of macro heights placed side-by-side, calculate the total "trapped" vertical routing area between them where routing channels can be safely formed (like the Trapping Rain Water problem).',
    startHint: 'This is the Trapping Rain Water problem. Use two pointers starting from both ends of the array. Track the maximum height seen from the left and from the right. The amount of "water" (routing space) above any macro is determined by the minimum of these two heights minus the macro\'s own height.',
    hint: 'procedure( trappedRoutingSpace(heights)\n  let( (left right leftMax rightMax area)\n    left = 0  right = length(heights)-1\n    leftMax = 0  rightMax = 0  area = 0\n    while( left < right\n      if( nth(left heights) < nth(right heights) then\n        if( nth(left heights) >= leftMax then leftMax = nth(left heights)\n        else area = area + (leftMax - nth(left heights)) )\n        left++\n      else\n        if( nth(right heights) >= rightMax then rightMax = nth(right heights)\n        else area = area + (rightMax - nth(right heights)) )\n        right--\n      )\n    )\n    area\n  )\n)',
    validation: (text: string) => /left\s*<\s*right/.test(text) && /leftMax/.test(text),
    explanation: 'Two-pointer algorithms can evaluate area capacities in O(N) time for rapid floorplan congestion analysis.'
  },
  {
    id: 64,
    title: '64. Critical Path Timing Analysis',
    subtitle: 'Longest Path in DAG',
    level: 'Expert',
    instructions: 'Calculate the Worst-Case Negative Slack by finding the longest path in a netlist DAG. Each gate has a delay and each net has a target arrival time at the sink. Use dynamic programming with topological sorting to find the max arrival time at the output pin.',
    startHint: 'This is the Longest Path in a DAG problem. Perform a topological sort first. Then, for each node in topological order, update the maximum arrival time of its successors: `arrival[v] = max(arrival[v], arrival[u] + delay(u,v))`. Finally, compare the arrival time at the sink to the required time.',
    hint: 'procedure( findCriticalPath(nodes adj delays)\n  let( (arrival order)\n    order = topoSort(nodes adj) ; Assume topoSort from prev lesson\n    arrival = makeTable("arr" 0.0)\n    foreach( u order\n      foreach( edge adj[u]\n        v = car(edge) w = cadr(edge)\n        if( arrival[u] + w > arrival[v] then\n          arrival[v] = arrival[u] + w\n        )\n      )\n    )\n    maxVal(arrival) ; Return the worst case delay\n  )\n)',
    validation: (text: string) => /arrival\[u\]\s*\+\s*w/.test(text) && /topoSort/.test(text),
    explanation: 'Identifying critical paths is the #1 priority for timing closure. It allows optimizers to focus on the slowest logic chains.'
  },
  {
    id: 65,
    title: '65. Non-Overlapping Macro Placement',
    subtitle: 'Backtracking Spatial Search (N-Queens)',
    level: 'Expert',
    instructions: 'Place `N` square IP macros on an `N x N` grid such that no two macros share the same row, column, or diagonal to prevent routing congestion and crosstalk. Return all valid configurations.',
    hint: 'procedure( placeMacros(n)\n  let( (results cols diag1 diag2 backtrack)\n    results = nil  cols = makeTable("c")  diag1 = makeTable("d1")  diag2 = makeTable("d2")\n    backtrack = lambda( (row currentPath)\n      if( row == n then\n        results = cons(reverse(currentPath) results)\n      else\n        for( col 0 n-1\n          unless( cols[col] || diag1[row+col] || diag2[row-col]\n            cols[col]=t diag1[row+col]=t diag2[row-col]=t\n            funcall(backtrack row+1 cons(col currentPath))\n            cols[col]=nil diag1[row+col]=nil diag2[row-col]=nil\n          )\n        )\n      )\n    )\n    funcall(backtrack 0 nil)\n    results\n  )\n)',
    validation: (text: string) => /backtrack/.test(text) && /funcall/.test(text),
    explanation: 'Backtracking explores the entire solution space for valid constraint-driven placement combinations.'
  },
  {
    id: 66,
    title: '66. Physical Connectivity Traversal (PEX)',
    subtitle: 'Database Graph Extraction',
    level: 'Expert',
    instructions: 'Real PEX engines must trace physical continuity. Write a procedure `tracePhysicalNet` that uses `dbGetOverlaps` to recursively find all metal shapes and vias electrically connected to a seed shape on the same net. Store them in a hash table to prevent infinite loops.',
    hint: 'procedure( tracePhysicalNet(seed cv visited)\n  let( (bbox)\n    unless( visited[seed]\n      visited[seed] = t\n      bbox = seed~>bBox\n      foreach( neighbor dbGetOverlaps(cv bbox)\n        when( neighbor~>net == seed~>net\n          tracePhysicalNet(neighbor cv visited)\n        )\n      )\n    )\n  )\n)',
    validation: (text: string) => /dbGetOverlaps/.test(text) && /~>net/.test(text) && /visited/.test(text),
    explanation: 'Connectivity tracing is the first step of Parasitic Extraction, turning layout polygons into an electrical graph.'
  },
  {
    id: 67,
    title: '67. Multi-Layer Resistance Solver',
    subtitle: 'Via-Aware Parasitic Summation',
    level: 'Expert',
    instructions: 'Calculate the total resistance of a path including vertical transitions. You must lookup sheet resistance for metals and a fixed contact resistance for Vias. Traverse the net and sum: R_total = sum(L/W * Rsheet) + sum(N_vias * Rcontact).',
    hint: 'procedure( calcNetResistance(shapes techData)\n  let( (totalR len wid layer rs rv)\n    totalR = 0.0\n    foreach( s shapes\n      if( s~>objType == "inst" || s~>objType == "via" then\n        rv = techData[s~>layerName]->contactRes || 0.1\n        totalR = totalR + rv\n      else\n        layer = s~>layerName\n        rs = techData[layer]->sheetRes\n        len = s~>length  wid = s~>width\n        totalR = totalR + (rs * (len / wid))\n      )\n    )\n    totalR\n  )\n)',
    validation: (text: string) => /~>objType/.test(text) && /sheetRes/.test(text) && /contactRes/.test(text),
    explanation: 'Distinguishing between lateral metal resistance and vertical via resistance is critical for IR-drop accuracy.'
  },
  {
    id: 68,
    title: '68. Global Routing via A* Search',
    subtitle: 'Grid-based Maze Routing',
    level: 'Expert',
    instructions: 'Find the optimal routing path between two pins `(x1, y1)` and `(x2, y2)` on a congested grid. Obstacles have infinite cost, while congested areas have high costs. Implement A* search using an estimated Manhattan distance heuristic to find the path with minimum total cost.',
    startHint: 'A* search improves Dijkstra by using a heuristic function `f(n) = g(n) + h(n)`, where `g(n)` is the cost from the start and `h(n)` is the estimated distance to the target (Manhattan distance). Use a priority queue to always expand the node with the lowest `f(n)`.',
    hint: 'procedure( routeAStar(start end grid)\n  let( (openSet gScore fScore u v h)\n    h = lambda((p target) abs(car(p)-car(target)) + abs(cadr(p)-cadr(target)))\n    gScore = makeTable("g" 1e9) gScore[start] = 0\n    fScore = makeTable("f" 1e9) fScore[start] = funcall(h start end)\n    openSet = list(list(fScore[start] start))\n    while( openSet\n      openSet = sort(openSet \'lambda((a b) car(a) < car(b)))\n      u = cadar(openSet) openSet = cdr(openSet)\n      if( u == end then return(reconstructPath()) )\n      foreach( v neighbors(u)\n        newG = gScore[u] + grid[v]\n        if( newG < gScore[v] then\n          gScore[v] = newG\n          fScore[v] = newG + funcall(h v end)\n          openSet = cons(list(fScore[v] v) openSet)\n        )\n      )\n    )\n  )\n)',
    validation: (text: string) => /gScore/.test(text) && /fScore/.test(text) && /Manhattan/.test(text) || /abs/.test(text),
    explanation: 'A* is the industry standard for point-to-point routing, balancing path length against congestion costs.'
  },
];

export const TutorialSidebar: React.FC<TutorialSidebarProps> = ({ currentText, isActive, onClose, isInline, onInsertCode }) => {
  const [currentLessonIdx, setCurrentLessonIdx] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<'All' | 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'>('All');
  const [isSolutionVisible, setIsSolutionVisible] = useState(false);
  const [isHintVisible, setIsHintVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizChecked, setQuizChecked] = useState<boolean>(false);

  // Reset visibility when lesson changes
  useEffect(() => {
    setIsSolutionVisible(false);
    setIsHintVisible(false);
    setSelectedOption(null);
    setQuizChecked(false);
  }, [currentLessonIdx]);

  // Load completed lessons from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('skill_tutorial_completed_ids');
    if (saved) {
      try {
        setCompletedLessons(JSON.parse(saved));
      } catch {
        // Ignore
      }
    }
  }, []);

  // Save completed lessons to localStorage when updated
  const updateCompletedLessons = (newCompleted: number[]) => {
    setCompletedLessons(newCompleted);
    localStorage.setItem('skill_tutorial_completed_ids', JSON.stringify(newCompleted));
  };

  // Validate the active lesson whenever editor contents change
  useEffect(() => {
    if (!isActive && !isInline) return;

    const lesson = LESSONS[currentLessonIdx];
    if (lesson.validation(currentText)) {
      if (!completedLessons.includes(lesson.id)) {
        updateCompletedLessons([...completedLessons, lesson.id]);
      }
    }
  }, [currentText, currentLessonIdx, isActive, isInline, completedLessons]);

  const handleSelectOption = (idx: number) => {
    setSelectedOption(idx);
    setQuizChecked(true);
  };

  const isLast = currentLessonIdx === LESSONS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      // Find the next lesson matching filters, or simply the next one
      const nextIdx = currentLessonIdx + 1;
      if (nextIdx < LESSONS.length) {
        setCurrentLessonIdx(nextIdx);
      }
    }
  };

  const progress = (completedLessons.length / LESSONS.length) * 100;

  // Filter lessons based on active level and search term
  const filteredLessons = LESSONS.filter(lesson => {
    const matchesLevel = selectedLevel === 'All' || lesson.level === selectedLevel;
    const matchesSearch = 
      lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.instructions.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesSearch;
  });


  const renderContent = () => (
    <div className="w-full flex flex-col h-full overflow-hidden bg-[#0b0c10]">
      <div className="p-4 border-b border-white/[0.04] bg-white/[0.01] shrink-0">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-indigo-500/10 p-1.5 rounded-lg">
            <BookOpen className="text-indigo-400" size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight uppercase tracking-wider">Lessons</h2>
            <p className="text-[10px] text-slate-500 font-medium">Interactive SKILL challenges</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input
              type="text"
              placeholder="Search challenges..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2 text-sm text-[#e2e8f0] placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all shadow-inner"
            />
          </div>
          <div className="flex overflow-x-auto gap-1.5 pb-1 no-scrollbar">
            {(['All', 'Beginner', 'Intermediate', 'Advanced', 'Expert'] as const).map((level) => {
              const isSelected = selectedLevel === level;
              return (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all whitespace-nowrap border ${
                    isSelected
                      ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                      : "bg-white/[0.02] border-white/[0.06] text-slate-500 hover:text-slate-300 hover:bg-white/[0.05]"
                  }`}
                >
                  {level}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 px-1">
          <span className="text-[9px] text-slate-600 font-bold uppercase tracking-[0.1em]">Progress</span>
          <span className="text-[10px] text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/10">
            {completedLessons.length}/{LESSONS.length} ({Math.round(progress)}%)
          </span>
        </div>
        <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden mt-2">
          <motion.div 
            className="h-full bg-indigo-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      <div className="p-2 overflow-y-auto flex-1 space-y-4 custom-scrollbar bg-black/10">
        {filteredLessons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="text-slate-700 mb-3" size={32} />
            <h5 className="text-slate-500 font-semibold text-xs">No matching challenges</h5>
          </div>
        ) : (
          <div className="space-y-1.5 px-1">
            {filteredLessons.map((lesson) => {
              const lessonIndex = LESSONS.findIndex(l => l.id === lesson.id);
              const isActiveLesson = lessonIndex === currentLessonIdx;
              const isCompleted = completedLessons.includes(lesson.id);
              
              return (
                <div 
                  key={lesson.id}
                  className={`relative overflow-hidden p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                    isActiveLesson 
                      ? 'bg-indigo-500/5 border-indigo-500/20 shadow-sm' 
                      : 'bg-white/[0.01] border-white/[0.04] hover:border-indigo-500/20 hover:bg-white/[0.03]'
                  }`}
                  onClick={() => setCurrentLessonIdx(lessonIndex)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 shrink-0">
                      {isCompleted ? (
                        <CheckCircle className="text-emerald-500/80" size={16} />
                      ) : isActiveLesson ? (
                        <div className="w-4 h-4 rounded-full border-2 border-indigo-500/50 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                        </div>
                      ) : (
                        <Circle className="text-slate-700" size={16} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`text-[9px] font-bold uppercase tracking-[0.1em] ${isActiveLesson ? 'text-indigo-400' : 'text-slate-600'}`}>
                          {lesson.subtitle}
                        </span>
                        <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          lesson.level === 'Expert' ? 'bg-red-500/10 text-red-400' : 
                          lesson.level === 'Advanced' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-indigo-500/10 text-indigo-400'
                        }`}>
                          {lesson.level}
                        </span>
                      </div>
                      <h4 className={`text-[13px] font-bold leading-tight ${isActiveLesson ? 'text-white' : 'text-slate-400'}`}>
                        {lesson.title}
                      </h4>
                      
                      <AnimatePresence>
                        {isActiveLesson && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <p className="text-slate-400 text-[11px] leading-relaxed mt-3 mb-4">
                              {lesson.instructions}
                            </p>
                            
                            <div className="space-y-4">
                              {lesson.startHint && (
                                <section>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setIsHintVisible(!isHintVisible);
                                    }}
                                    className="text-[9px] uppercase font-black tracking-widest text-indigo-400 mb-2 flex items-center gap-2 hover:text-indigo-300 transition-colors group"
                                  >
                                    <Lightbulb size={12} className={isHintVisible ? "text-amber-500" : ""} /> 
                                    {isHintVisible ? 'Hide' : 'Show'} Guiding Hint
                                  </button>
                                  <AnimatePresence>
                                    {isHintVisible && (
                                      <motion.div 
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-3 text-[11px] text-slate-400 leading-relaxed italic overflow-hidden"
                                      >
                                        {lesson.startHint}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </section>
                              )}

                              <section>
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="text-[9px] uppercase font-black tracking-widest text-slate-600 flex items-center gap-2">
                                    <TerminalSquare size={12} /> Solution Template
                                  </h5>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setIsSolutionVisible(!isSolutionVisible);
                                    }}
                                    className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                                  >
                                    {isSolutionVisible ? 'Hide' : 'Show'}
                                  </button>
                                </div>
                                <AnimatePresence>
                                  {isSolutionVisible && (
                                    <motion.div 
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="bg-black/30 border border-white/5 rounded-xl p-3 font-mono text-[11px] text-indigo-300/90 shadow-inner overflow-hidden"
                                    >
                                      {lesson.hint}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </section>

                              <div className="bg-indigo-500/[0.03] border border-indigo-500/10 p-3 rounded-xl flex items-start gap-2.5">
                                <Lightbulb size={14} className="text-amber-500/80 shrink-0 mt-0.5" />
                                <p className="text-[10px] text-slate-500 leading-relaxed">
                                  {lesson.explanation}
                                </p>
                              </div>

                              {lesson.quiz && (
                                <section className="bg-slate-950/60 border border-white/5 rounded-xl p-3.5 space-y-3.5 shadow-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="flex h-2 w-2 relative">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                    </span>
                                    <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">Interactive Concept Quiz</span>
                                  </div>
                                  <p className="text-[11px] font-bold text-slate-200 leading-relaxed">
                                    {lesson.quiz.question}
                                  </p>
                                  <div className="space-y-2">
                                    {lesson.quiz.options.map((option, idx) => {
                                      const isSelected = selectedOption === idx;
                                      const isCorrect = idx === lesson.quiz!.answerIndex;
                                      let btnClass = "w-full text-left p-3 rounded-xl text-[10px] leading-relaxed border transition-all duration-200 flex items-center justify-between ";
                                      
                                      if (quizChecked) {
                                        if (isCorrect) {
                                          btnClass += "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-semibold";
                                        } else if (isSelected) {
                                          btnClass += "bg-rose-500/10 border-rose-500/30 text-rose-300 font-semibold";
                                        } else {
                                          btnClass += "bg-white/[0.01] border-white/5 text-slate-500 opacity-70";
                                        }
                                      } else {
                                        if (isSelected) {
                                          btnClass += "bg-indigo-500/10 border-indigo-500/40 text-indigo-200 font-semibold shadow-md shadow-indigo-500/5";
                                        } else {
                                          btnClass += "bg-white/[0.01] border-white/5 text-slate-400 hover:bg-white/[0.03] hover:border-white/10";
                                        }
                                      }

                                      return (
                                        <button
                                          key={idx}
                                          disabled={quizChecked && isCorrect}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelectOption(idx);
                                          }}
                                          className={btnClass}
                                        >
                                          <span>{option}</span>
                                          {quizChecked && isCorrect && <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-1.5 py-0.5 rounded-md">✓ Correct</span>}
                                          {quizChecked && isSelected && !isCorrect && <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest bg-rose-500/10 px-1.5 py-0.5 rounded-md">✗ Incorrect</span>}
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {quizChecked && (
                                    <motion.div 
                                      initial={{ opacity: 0, y: -5 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      className={`p-3 rounded-xl text-[10px] leading-relaxed border ${
                                        selectedOption === lesson.quiz.answerIndex 
                                          ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-300/90" 
                                          : "bg-rose-500/5 border-rose-500/10 text-rose-300/90"
                                      }`}
                                    >
                                      <span className="font-extrabold uppercase tracking-widest text-[8px] block mb-1">
                                        {selectedOption === lesson.quiz.answerIndex ? "Excellent!" : "Oops, Not Quite:"}
                                      </span>
                                      {selectedOption === lesson.quiz.answerIndex ? lesson.quiz.explanation : "Read the instructions above and try selecting another option."}
                                    </motion.div>
                                  )}
                                </section>
                              )}

                              <div className="flex items-center justify-between gap-3 pt-2">
                                {onInsertCode && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onInsertCode(lesson.hint);
                                    }}
                                    className="flex-1 bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] text-white text-[10px] font-black uppercase tracking-widest py-2 rounded-lg transition-all flex items-center justify-center gap-2"
                                  >
                                    <Code size={14} /> Load Template
                                  </button>
                                )}
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleNext();
                                  }}
                                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest py-2 rounded-lg transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2"
                                >
                                  {isLast ? 'Complete' : 'Next Lesson'} <ArrowRight size={14} />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              );
            })}
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
      {isActive && (
        <motion.div 
          initial={isInline ? undefined : { opacity: 0 }}
          animate={isInline ? undefined : { opacity: 1 }}
          exit={isInline ? undefined : { opacity: 0 }}
          className={isInline ? "flex-1 flex flex-col h-full overflow-hidden" : "fixed inset-0 bg-[#0b0c10]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"}
          onClick={!isInline ? onClose : undefined}
        >
          <motion.div 
            initial={isInline ? undefined : { scale: 0.95, opacity: 0 }}
            animate={isInline ? undefined : { scale: 1, opacity: 1 }}
            exit={isInline ? undefined : { scale: 0.95, opacity: 0 }}
            className={isInline ? "flex-1 flex flex-col h-full overflow-hidden" : "w-full max-w-2xl max-h-[85vh] bg-[#12141a] rounded-2xl shadow-2xl border border-white/5 flex flex-col overflow-hidden"}
            onClick={!isInline ? (e) => e.stopPropagation() : undefined}
          >
            {renderContent()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
