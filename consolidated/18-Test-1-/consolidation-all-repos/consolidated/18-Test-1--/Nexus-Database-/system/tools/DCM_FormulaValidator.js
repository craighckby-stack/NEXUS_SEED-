/**
 * DCM_FormulaValidator.js
 * Ensures formulas adhere to the constraints defined in DCM_FormulaContext.json
 * before deployment to the L8 Runtime Engine.
 */
class DCM_FormulaValidator {
    constructor(contextDefinition) {
        this.context = contextDefinition;
        this.allowedFunctions = this._flattenFunctions(contextDefinition.allowed_functions);
        this.allowedScopes = this._buildScopeRegex(contextDefinition.scope_definition);
        this.allowedAliases = this._flattenAliases(contextDefinition.context_aliases);
    }

    _flattenFunctions(funcs) {
        return new Set(Object.values(funcs).flat());
    }

    _flattenAliases(aliases) {
        return new Set(Object.values(aliases).flat());
    }

    _buildScopeRegex(scopes) {
        // Generates a comprehensive regex for allowed variables (e.g., /^(T|S|H)-[A-Za-z0-9_]+$/)
        const prefixes = Object.keys(scopes).map(k => scopes[k].replace('-*', '')).join('|');
        return new RegExp(`^(${prefixes})-[A-Za-z0-9_]+$`);
    }

    validate(formulaString) {
        if (!formulaString || typeof formulaString !== 'string') {
            return { valid: false, message: 'Input is not a valid formula string.' };
        }
        
        // 1. Syntax Check (Placeholder for real parser integration)
        // Assume successful parsing into tokens/AST for demonstration.
        // ...

        const tokens = this.mockTokenize(formulaString);
        
        // 2. Constraint Check
        for (const token of tokens) {
            if (token.type === 'FUNCTION' && !this.allowedFunctions.has(token.value)) {
                return { valid: false, message: `Disallowed function detected: ${token.value}` };
            }
            if (token.type === 'VARIABLE') {
                const isAllowedVariable = this.allowedScopes.test(token.value);
                const isAllowedAlias = this.allowedAliases.has(token.value);
                if (!isAllowedVariable && !isAllowedAlias) {
                    return { valid: false, message: `Disallowed variable or keyword: ${token.value}` };
                }
            }
        }

        // 3. Complexity Check (Requires AST analysis, placeholder)
        // if (AST.maxRecursionDepth > this.context.execution_constraints.recursion_limit) {...}

        return { valid: true, message: 'Formula validated against DCM context constraints.' };
    }

    // Simple mock tokenizer for example demonstration
    mockTokenize(formula) {
        // NOTE: A real implementation requires a robust lexer/parser combination.
        const regex = /([A-Z]+(?=\())|([A-Z][A-Z0-9_-]*)|([0-9.]+)/g;
        let match;
        const tokens = [];
        while ((match = regex.exec(formula)) !== null) {
            let type;
            let value = match[0];
            
            if (value.includes('-')) { 
                type = 'VARIABLE'; 
            } else if (value.toUpperCase() === value) {
                 if (formula.includes(value + '(')) {
                     type = 'FUNCTION';
                 } else {
                     type = 'VARIABLE'; // Covers CONSTANTS/ALIASES too
                 }
            } else { 
                type = 'LITERAL';
            }
            tokens.push({ type, value });
        }
        return tokens;
    }
}
