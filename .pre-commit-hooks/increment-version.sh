#!/bin/bash

# Dieses Script inkrementiert automatisch die Patch-Version in startEHSSentinel.py

# Pfad zur Datei
FILE="ehs-sentinel/src/startEHSSentinel.py"

# Aktuelle Version extrahieren
CURRENT_VERSION_LINE=$(grep "VERSION_PATCH =" "$FILE")
CURRENT_PATCH=$(echo "$CURRENT_VERSION_LINE" | grep -oP 'VERSION_PATCH = "\K[0-9]+')

# Neue Patch-Version berechnen
NEW_PATCH=$((CURRENT_PATCH + 1))

# Version in der Datei aktualisieren
sed -i "s/VERSION_PATCH = \"$CURRENT_PATCH\"/VERSION_PATCH = \"$NEW_PATCH\"/" "$FILE"

echo "Version aktualisiert: Patch-Version von $CURRENT_PATCH auf $NEW_PATCH erhöht"

# Datei zum Commit hinzufügen
git add "$FILE"