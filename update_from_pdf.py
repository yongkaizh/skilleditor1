functions = """
append append1 caar caaar caadr cadr caddr cdar cddr car cdr cons constar copy dtpr last lconc length lindex list listp nconc ncons nth nthcdr nthelem pairp range remd remdq remove removeListDuplicates remq reverse rplaca rplacd setcar setcdr subst tailp tconc xcons xCoord yCoord
arrayp arrayref assoc assq assv declare defprop defstruct defstructp defvar makeTable makeVector setarray tablep type typep vector vectorp
alphaNumCmp concat copyDefstructDeep get getSG getq getqq importSkillVar integerp otherp plist pop popf postArrayDec postArrayInc postArraySet postdecrement postincrement preArrayDec preArrayInc preArraySet predecrement preincrement push pushf putprop putpropq putpropqq quote remprop rotatef set setf setguard setplist setq symbolp symeval symstrp
charToInt intToChar listToVector stringToFunction stringToSymbol stringToTime symbolToString tableToList timeToString timeToTm tmToTime vectorToList
blankstrp buildString getchar index lowerCase lsprintf nindex outstringp parseString pcreCompile pcreExecute pcreGenCompileOptBits pcreGenExecOptBits pcreGetRecursionLimit pcreListCompileOptBits pcreListExecOptBits pcreMatchAssocList pcreMatchList pcreMatchp pcreObjectp pcrePrintLastMatchErr pcreReplace pcreSetRecursionLimit pcreSubpatCount pcreSubstitute readstring rexCompile rexExecute rexMagic rexMatchAssocList rexMatchList rexMatchp rexReplace rexSubstitute rindex sprintf strcat strcmp stringp strlen strncat strncmp strpbrk substring upperCase
abs add1 atof atoi ceiling defMathConstants difference evenp exp expt fix fixp fix2 float floatp floor int isInfinity isNaN leftshift log log10 max min minus minusp mod modf modulo nearlyEqual negativep oddp onep plus plusp quotient random realp remainder rightshift round round2 sort sortcar sqrt srandom sub1 times truncate xdifference xplus xquotient xtimes zerop zxtd
band bitfield bitfield1 bnand bnor bnot bor bxnor bxor setqbitfield setqbitfield1
acos asin atan atan2 cos sin tan
alphalessp and compareTime eq equal eqv geqp greaterp leqp lessp member memq memv neq nequal null numberp or sxtd
case caseq catch cond decode do exists existss for fors forall foralls foreach foreachs if go map mapc mapcan mapcar mapcon mapinto maplist not regExitAfter regExitBefore remExitProc return setof setofs throw unless when while
close compress display drain ed edi edit edl encrypt expandMacroDeep fileLength fileSeek fileTell fileTimeModified fprintf fscanf scanf sscanf get_filename getc getDirFiles getOutstring gets include infile info inportp instring isExecutable isFile isFileEncrypted isFileName isLargeFile isLink isPortAtEOF isReadable isWritable lineread linereadstring load loadi loadPort loadstring makeTempFileName newline numOpenFiles openportp outfile outportp outstring portp pprint print printf printlev println putc read readTable renameFile simplifyFilename simplifyFilenameUnique truename which write writeTable
arglist assert atom bcdp booleanp boundp describe fdoc gc gensym getMuffleWarnings getSkillVersion get_pname get_string getVersion getWarn help inScheme inSkill isVarImported makeSymbol measureTime muffleWarnings needNCells restoreFloat saveFloat schemeTopLevelEnv setPrompts sstatus status theEnvironment unbindVar
addDefstructClass alias apply argc argv begin clearExitProcs declareLambda declareNLambda declareSQNLambda defdynamic defglobalfun define define_syntax defmacro defsetf defun defUserInitProc destructuringBind dynamic dynamicLet err error errset errsetstring eval evalstring expandMacro fboundp flet funcall getd getFnWriteProtect getFunType getVarWriteProtect globalProc isCallable isMacro labels lambda let letrec letseq mprocedure nlambda nprocedure procedure procedurep prog prog1 prog2 progn putd setf_dynamic setFnWriteProtect setVarWriteProtect unalias unwindProtect warn
cdsGetInstPath cdsGetToolsPath cdsPlat changeWorkingDir cputime createDir createDirHier csh deleteDir deleteFile exit getCurrentTime getInstallPath getLogin getPrompts getShellEnvVar getSkillPath getTempDir getWorkingDir isDir prependInstallPath setShellEnvVar setSkillPath sh shell system unsetShellEnvVar vi vii vl
makeNamespace findNamespace useNamespace unuseNamespace importSymbol findSymbol addToExportList getSymbolNamespace removeFromExportList addToNamespace shadow shadowImport removeShadowImport unimportSymbol
"""

def append_to_manual():
    try:
        with open("src/data/manual.txt", "r") as f:
            existing = f.read()
    except:
        existing = ""

    count = 0
    with open("src/data/manual.txt", "a") as f:
        for func in functions.split():
            func = func.strip()
            if not func: continue
            if f"@function {func}\n" in existing:
                continue
            
            f.write(f"\n@function {func}\n")
            f.write(f"@usage {func}(...)\n")
            f.write(f"@description Core SKILL function: {func}\n")
            count += 1
    print(f"Added {count} functions to manual.txt")

append_to_manual()
