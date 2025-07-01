"""
Sichere Alternative zu eval() für arithmetische Ausdrücke.
Unterstützt nur grundlegende mathematische Operationen.
"""
import re
import operator
from typing import Union, Dict, Any
from CustomLogger import logger

class SafeArithmetic:
    """
    Sichere Auswertung von arithmetischen Ausdrücken ohne eval().
    Unterstützt: +, -, *, /, (), Variablen (packed_value, value)
    """
    
    # Erlaubte Operatoren
    OPERATORS = {
        '+': operator.add,
        '-': operator.sub,
        '*': operator.mul,
        '/': operator.truediv,
    }
    
    def __init__(self):
        # Regex für Token-Parsing
        self.token_pattern = re.compile(r'(\d+\.?\d*|[+\-*/()]|[a-zA-Z_][a-zA-Z0-9_]*)')
    
    def evaluate(self, expression: str, variables: Dict[str, Union[int, float]] = None) -> Union[int, float]:
        """
        Wertet einen arithmetischen Ausdruck sicher aus.
        
        Args:
            expression: Der zu evaluierende Ausdruck (z.B. "packed_value / 10")
            variables: Dictionary mit Variablenwerten
            
        Returns:
            Das Ergebnis der Berechnung
            
        Raises:
            ValueError: Bei ungültigen Ausdrücken oder unbekannten Variablen
        """
        if not expression or not expression.strip():
            raise ValueError("Leerer Ausdruck")
            
        if variables is None:
            variables = {}
            
        try:
            # Tokenize den Ausdruck
            tokens = self._tokenize(expression)
            
            # Parse und evaluiere
            result = self._parse_expression(tokens, variables)
            
            return result
            
        except Exception as e:
            logger.warning(f"Fehler bei der Auswertung von '{expression}': {e}")
            raise ValueError(f"Ungültiger arithmetischer Ausdruck: {expression}")
    
    def _tokenize(self, expression: str) -> list:
        """Zerlegt den Ausdruck in Token."""
        # Entferne Whitespace und finde alle Token
        tokens = self.token_pattern.findall(expression.replace(' ', ''))
        if not tokens:
            raise ValueError("Keine gültigen Token gefunden")
        return tokens
    
    def _parse_expression(self, tokens: list, variables: Dict[str, Union[int, float]]) -> Union[int, float]:
        """
        Parst und evaluiert den Ausdruck mit Operator-Präzedenz.
        Verwendet den Shunting-Yard-Algorithmus für korrekte Präzedenz.
        """
        # Konvertiere zu Postfix-Notation (RPN)
        postfix = self._to_postfix(tokens, variables)
        
        # Evaluiere Postfix-Ausdruck
        return self._evaluate_postfix(postfix)
    
    def _to_postfix(self, tokens: list, variables: Dict[str, Union[int, float]]) -> list:
        """Konvertiert Infix zu Postfix-Notation (Shunting-Yard)."""
        output = []
        operator_stack = []
        
        # Operator-Präzedenz
        precedence = {'+': 1, '-': 1, '*': 2, '/': 2}
        
        for token in tokens:
            if self._is_number(token):
                output.append(float(token))
            elif token in variables:
                output.append(float(variables[token]))
            elif token in self.OPERATORS:
                # Pop Operatoren mit höherer oder gleicher Präzedenz
                while (operator_stack and 
                       operator_stack[-1] != '(' and
                       operator_stack[-1] in precedence and
                       precedence.get(operator_stack[-1], 0) >= precedence.get(token, 0)):
                    output.append(operator_stack.pop())
                operator_stack.append(token)
            elif token == '(':
                operator_stack.append(token)
            elif token == ')':
                # Pop bis zur öffnenden Klammer
                while operator_stack and operator_stack[-1] != '(':
                    output.append(operator_stack.pop())
                if not operator_stack:
                    raise ValueError("Unbalancierte Klammern")
                operator_stack.pop()  # Entferne '('
            else:
                raise ValueError(f"Unbekanntes Token: {token}")
        
        # Pop verbleibende Operatoren
        while operator_stack:
            if operator_stack[-1] in '()':
                raise ValueError("Unbalancierte Klammern")
            output.append(operator_stack.pop())
        
        return output
    
    def _evaluate_postfix(self, postfix: list) -> Union[int, float]:
        """Evaluiert einen Postfix-Ausdruck."""
        stack = []
        
        for token in postfix:
            if isinstance(token, (int, float)):
                stack.append(token)
            elif token in self.OPERATORS:
                if len(stack) < 2:
                    raise ValueError("Ungültiger Ausdruck: Nicht genug Operanden")
                
                b = stack.pop()
                a = stack.pop()
                
                # Spezielle Behandlung für Division durch Null
                if token == '/' and b == 0:
                    raise ValueError("Division durch Null")
                
                result = self.OPERATORS[token](a, b)
                stack.append(result)
            else:
                raise ValueError(f"Unbekanntes Token in Postfix: {token}")
        
        if len(stack) != 1:
            raise ValueError("Ungültiger Ausdruck: Falsche Anzahl von Operanden")
        
        return stack[0]
    
    def _is_number(self, token: str) -> bool:
        """Prüft, ob ein Token eine Zahl ist."""
        try:
            float(token)
            return True
        except ValueError:
            return False

# Globale Instanz für einfache Verwendung
safe_arithmetic = SafeArithmetic()

def safe_eval_arithmetic(expression: str, **variables) -> Union[int, float]:
    """
    Convenience-Funktion für sichere arithmetische Auswertung.
    
    Args:
        expression: Arithmetischer Ausdruck
        **variables: Variablen als Keyword-Argumente
        
    Returns:
        Ergebnis der Berechnung
    """
    return safe_arithmetic.evaluate(expression, variables)