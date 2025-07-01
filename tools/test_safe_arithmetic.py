#!/usr/bin/env python3
"""
Unit Tests für die SafeArithmetic Klasse.
Testet die sichere Auswertung arithmetischer Ausdrücke.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'ehs-sentinel', 'src'))

import unittest
from SafeArithmetic import SafeArithmetic, safe_eval_arithmetic

class TestSafeArithmetic(unittest.TestCase):
    """Test-Suite für die SafeArithmetic Klasse."""
    
    def setUp(self):
        """Setup für jeden Test."""
        self.calc = SafeArithmetic()
    
    def test_basic_arithmetic(self):
        """Test grundlegende arithmetische Operationen."""
        # Addition
        self.assertEqual(self.calc.evaluate("2 + 3"), 5)
        self.assertEqual(self.calc.evaluate("10 + 5"), 15)
        
        # Subtraktion
        self.assertEqual(self.calc.evaluate("10 - 3"), 7)
        self.assertEqual(self.calc.evaluate("5 - 10"), -5)
        
        # Multiplikation
        self.assertEqual(self.calc.evaluate("4 * 5"), 20)
        self.assertEqual(self.calc.evaluate("3 * 7"), 21)
        
        # Division
        self.assertEqual(self.calc.evaluate("10 / 2"), 5)
        self.assertEqual(self.calc.evaluate("15 / 3"), 5)
        self.assertAlmostEqual(self.calc.evaluate("10 / 3"), 3.333333333333333)
    
    def test_operator_precedence(self):
        """Test Operator-Präzedenz."""
        # Multiplikation vor Addition
        self.assertEqual(self.calc.evaluate("2 + 3 * 4"), 14)
        self.assertEqual(self.calc.evaluate("10 - 2 * 3"), 4)
        
        # Division vor Subtraktion
        self.assertEqual(self.calc.evaluate("10 - 8 / 2"), 6)
        
        # Klammern überschreiben Präzedenz
        self.assertEqual(self.calc.evaluate("(2 + 3) * 4"), 20)
        self.assertEqual(self.calc.evaluate("10 / (2 + 3)"), 2)
    
    def test_parentheses(self):
        """Test Klammer-Behandlung."""
        self.assertEqual(self.calc.evaluate("(5 + 3) * 2"), 16)
        self.assertEqual(self.calc.evaluate("2 * (10 - 5)"), 10)
        self.assertEqual(self.calc.evaluate("((2 + 3) * 4) / 2"), 10)
        
        # Verschachtelte Klammern
        self.assertEqual(self.calc.evaluate("(2 + (3 * 4)) / 2"), 7)
    
    def test_variables(self):
        """Test Variablen-Substitution."""
        variables = {"packed_value": 100, "value": 50}
        
        self.assertEqual(self.calc.evaluate("packed_value / 10", variables), 10)
        self.assertEqual(self.calc.evaluate("value * 2", variables), 100)
        self.assertEqual(self.calc.evaluate("packed_value + value", variables), 150)
        self.assertEqual(self.calc.evaluate("(packed_value - value) / 10", variables), 5)
    
    def test_decimal_numbers(self):
        """Test Dezimalzahlen."""
        self.assertAlmostEqual(self.calc.evaluate("3.14 * 2"), 6.28)
        self.assertAlmostEqual(self.calc.evaluate("10.5 / 2.5"), 4.2)
        self.assertAlmostEqual(self.calc.evaluate("1.5 + 2.7"), 4.2)
    
    def test_nasa_repository_examples(self):
        """Test mit echten Beispielen aus dem NASA Repository."""
        # Temperatur-Konvertierung
        result = self.calc.evaluate("packed_value / 10", {"packed_value": 235})
        self.assertAlmostEqual(result, 23.5)
        
        # Leistungs-Konvertierung
        result = self.calc.evaluate("packed_value / 8.6", {"packed_value": 860})
        self.assertAlmostEqual(result, 100.0)
        
        # Energie-Konvertierung
        result = self.calc.evaluate("packed_value / 1000", {"packed_value": 5000})
        self.assertEqual(result, 5.0)
        
        # Komplexere Berechnung
        result = self.calc.evaluate("(packed_value * 2) / 10", {"packed_value": 150})
        self.assertEqual(result, 30.0)
    
    def test_error_handling(self):
        """Test Fehlerbehandlung."""
        # Division durch Null
        with self.assertRaises(ValueError):
            self.calc.evaluate("10 / 0")
        
        # Unbekannte Variable
        with self.assertRaises(ValueError):
            self.calc.evaluate("unknown_var + 5")
        
        # Ungültiger Ausdruck
        with self.assertRaises(ValueError):
            self.calc.evaluate("2 + + 3")
        
        # Unbalancierte Klammern
        with self.assertRaises(ValueError):
            self.calc.evaluate("(2 + 3")
        
        with self.assertRaises(ValueError):
            self.calc.evaluate("2 + 3)")
        
        # Leerer Ausdruck
        with self.assertRaises(ValueError):
            self.calc.evaluate("")
        
        with self.assertRaises(ValueError):
            self.calc.evaluate("   ")
    
    def test_convenience_function(self):
        """Test der Convenience-Funktion."""
        result = safe_eval_arithmetic("packed_value / 10", packed_value=250)
        self.assertEqual(result, 25.0)
        
        result = safe_eval_arithmetic("value * 2 + 5", value=10)
        self.assertEqual(result, 25)
    
    def test_whitespace_handling(self):
        """Test Behandlung von Leerzeichen."""
        # Verschiedene Leerzeichen-Varianten sollten das gleiche Ergebnis liefern
        expressions = [
            "2+3*4",
            "2 + 3 * 4",
            " 2  +  3  *  4 ",
            "2+ 3*4",
            "2 +3* 4"
        ]
        
        for expr in expressions:
            self.assertEqual(self.calc.evaluate(expr), 14)
    
    def test_negative_numbers(self):
        """Test negative Zahlen."""
        # Negative Zahlen in Variablen
        result = self.calc.evaluate("packed_value / 10", {"packed_value": -150})
        self.assertEqual(result, -15.0)
        
        # Negative Zahlen in Ausdrücken (als Subtraktion interpretiert)
        self.assertEqual(self.calc.evaluate("0 - 5"), -5)
        self.assertEqual(self.calc.evaluate("10 - 15"), -5)

def run_tests():
    """Führt alle Tests aus."""
    print("🧪 Starte Tests für SafeArithmetic...")
    
    # Erstelle Test-Suite
    suite = unittest.TestLoader().loadTestsFromTestCase(TestSafeArithmetic)
    
    # Führe Tests aus
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Zusammenfassung
    if result.wasSuccessful():
        print(f"\n✅ Alle {result.testsRun} Tests erfolgreich!")
        return True
    else:
        print(f"\n❌ {len(result.failures)} Fehler, {len(result.errors)} Errors von {result.testsRun} Tests")
        return False

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)