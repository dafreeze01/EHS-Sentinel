#!/bin/bash

# Dieses Script inkrementiert automatisch die Patch-Version in config.yaml

# Pfad zur Konfigurationsdatei
CONFIG_FILE="ehs-sentinel/config.yaml"

# Prüfe ob die Datei existiert
if [ ! -f "$CONFIG_FILE" ]; then
    echo "Fehler: $CONFIG_FILE nicht gefunden!"
    exit 1
fi

# Aktuelle Version aus config.yaml extrahieren
CURRENT_VERSION_LINE=$(grep "^version:" "$CONFIG_FILE")
if [ -z "$CURRENT_VERSION_LINE" ]; then
    echo "Fehler: Keine Version in $CONFIG_FILE gefunden!"
    exit 1
fi

# Version extrahieren (Format: version: "1.2.3")
CURRENT_VERSION=$(echo "$CURRENT_VERSION_LINE" | sed 's/version: *"\([^"]*\)".*/\1/')

# Version in Komponenten aufteilen
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

# Prüfe ob alle Komponenten numerisch sind
if ! [[ "$MAJOR" =~ ^[0-9]+$ ]] || ! [[ "$MINOR" =~ ^[0-9]+$ ]] || ! [[ "$PATCH" =~ ^[0-9]+$ ]]; then
    echo "Fehler: Ungültiges Versionsformat '$CURRENT_VERSION'. Erwartet: MAJOR.MINOR.PATCH"
    exit 1
fi

# Patch-Version inkrementieren
NEW_PATCH=$((PATCH + 1))
NEW_VERSION="$MAJOR.$MINOR.$NEW_PATCH"

# Version in der Datei aktualisieren
sed -i "s/version: \"$CURRENT_VERSION\"/version: \"$NEW_VERSION\"/" "$CONFIG_FILE"

# Prüfe ob die Änderung erfolgreich war
if grep -q "version: \"$NEW_VERSION\"" "$CONFIG_FILE"; then
    echo "✅ Version erfolgreich aktualisiert: $CURRENT_VERSION → $NEW_VERSION"
    echo "📁 Datei: $CONFIG_FILE"
else
    echo "❌ Fehler beim Aktualisieren der Version!"
    exit 1
fi

# Datei zum Commit hinzufügen
git add "$CONFIG_FILE"

echo "🚀 Version $NEW_VERSION bereit für Commit"