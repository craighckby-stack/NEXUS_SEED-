/**
 * StaticAnalysisKernel handles configuration, parsing, caching,
 * and delegates efficient AST traversal to the injected AST Traversal Interface.
 */
class StaticAnalysisKernel {
    #rules;
    #config;
    #cache;
    #astParser; 
    #astTraverser;

    /**
     * @param {Object} dependencies 
     * @param {Array<Object>} dependencies.rules - A collection of analysis rule objects.
     * @param {Object} [dependencies.config={}] - Configuration options.
     * @param {ASTParserInterfaceKernel} dependencies.astParser - Tool for parsing source code (Injected).
     * @param {ASTTraversalInterfaceKernel} dependencies.astTraverser - Tool for high-performance AST traversal (Injected).
     */
    constructor({ rules, config = {}, astParser, astTraverser }) {
        this.#rules = rules;
        this.#config = config;
        this.#astParser = astParser;
        this.#astTraverser = astTraverser;

        this.#setupDependencies();
    }

    /**
     * Rigorous validation and setup for dependencies and internal state.
     * Extracts synchronous dependency configuration from the constructor.
     * @private
     */
    #setupDependencies() {
        if (!this.#rules || !Array.isArray(this.#rules)) {
            throw new Error("Rules array must be provided to StaticAnalysisKernel.");
        }
        if (!this.#astParser || typeof this.#astParser.parse !== 'function') {
            throw new Error("ASTParserInterfaceKernel dependency missing or invalid.");
        }
        if (!this.#astTraverser || typeof this.#astTraverser.traverse !== 'function' || typeof this.#astTraverser.setNodeHandler !== 'function') {
            // The traversal interface is required to accept a handler callback.
            throw new Error("ASTTraversalInterfaceKernel dependency missing or invalid. Must expose traverse() and setNodeHandler().");
        }

        this.#cache = new Map();
        
        // Configure the traverser with the kernel's rule application logic, ensuring DI is maintained.
        this.#astTraverser.setNodeHandler(this.#applyRules.bind(this));
    }

    /**
     * Executes analysis rules on a specific node.
     * This method is the callback handler for the injected #astTraverser.
     * @private
     */
    #applyRules(node, context) {
        let findings = [];
        
        for (const rule of this.#rules) {
            // Interactions with external rule objects (I/O interaction)
            if (rule.match && rule.match(node, context)) {
                const violation = rule.execute(node, context);
                if (violation) {
                    findings.push(violation);
                }
            }
        }
        return findings;
    }
    
    /**
     * I/O Proxy: Delegates source code parsing to the injected utility.
     * @private
     */
    #delegateToParserParse(sourceCode, parserOptions) {
        return this.#astParser.parse(sourceCode, parserOptions);
    }
    
    /**
     * I/O Proxy: Delegates the actual AST traversal to the injected utility.
     * @private
     */
    #delegateToTraverserTraverse(ast, context) {
        return this.#astTraverser.traverse(ast, context);
    }


    /**
     * Analyzes the provided source code.
     * @param {string} sourceCode
     * @returns {Array} List of analysis violations/findings.
     */
    analyze(sourceCode) {
        // Step 1: Cache check (Internal State Management)
        if (this.#cache.has(sourceCode)) {
            return this.#cache.get(sourceCode);
        }

        const analysisContext = { 
            source: sourceCode, 
            config: this.#config 
        };

        // Step 2: Parse (Delegated I/O)
        const ast = this.#delegateToParserParse(sourceCode, this.#config.parserOptions);
        
        // Step 3: Traverse (Delegated I/O)
        const results = this.#delegateToTraverserTraverse(ast, analysisContext); 
        
        this.#cache.set(sourceCode, results);
        return results;
    }
}

export default StaticAnalysisKernel;