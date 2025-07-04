#!/bin/bash

# Lokales Build-Script für EHS-Sentinel Home Assistant Addon
# Dieses Script baut das Docker Image lokal und macht es für Home Assistant verfügbar

set -e

echo "🔨 Starte lokales Build für EHS-Sentinel Addon..."

# Prüfe ob Docker läuft
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker ist nicht verfügbar oder läuft nicht!"
    exit 1
fi

# Bestimme die Architektur
ARCH=$(uname -m)
case $ARCH in
    x86_64)
        BUILD_ARCH="amd64"
        BASE_IMAGE="ghcr.io/home-assistant/amd64-base-python:3.11-alpine3.18"
        ;;
    aarch64|arm64)
        BUILD_ARCH="aarch64"
        BASE_IMAGE="ghcr.io/home-assistant/aarch64-base-python:3.11-alpine3.18"
        ;;
    armv7l)
        BUILD_ARCH="armv7"
        BASE_IMAGE="ghcr.io/home-assistant/armv7-base-python:3.11-alpine3.18"
        ;;
    armv6l)
        BUILD_ARCH="armhf"
        BASE_IMAGE="ghcr.io/home-assistant/armhf-base-python:3.11-alpine3.18"
        ;;
    i386|i686)
        BUILD_ARCH="i386"
        BASE_IMAGE="ghcr.io/home-assistant/i386-base-python:3.11-alpine3.18"
        ;;
    *)
        echo "❌ Nicht unterstützte Architektur: $ARCH"
        exit 1
        ;;
esac

echo "📋 Erkannte Architektur: $ARCH -> $BUILD_ARCH"
echo "🐳 Base Image: $BASE_IMAGE"

# Kopiere alle Python-Dateien in das src Verzeichnis
echo "📁 Kopiere Quelldateien..."
mkdir -p ehs-sentinel/src
mkdir -p ehs-sentinel/data
mkdir -p ehs-sentinel/tools

# Kopiere alle Python-Dateien (außer helpertils und startEHSSentinel.py)
for file in *.py; do
    if [ "$file" != "startEHSSentinel.py" ] && [ -f "$file" ]; then
        cp "$file" ehs-sentinel/src/
    fi
done

# Kopiere die spezielle Addon-Version von startEHSSentinel.py
if [ -f "ehs-sentinel/src/startEHSSentinel.py" ]; then
    echo "✅ Addon-Version von startEHSSentinel.py bereits vorhanden"
else
    echo "❌ Addon-Version von startEHSSentinel.py fehlt!"
    exit 1
fi

# Kopiere requirements.txt
cp requirements.txt ehs-sentinel/

# Kopiere NasaRepository.yml falls vorhanden
if [ -f "data/NasaRepository.yml" ]; then
    cp data/NasaRepository.yml ehs-sentinel/data/
else
    echo "⚠️  Warnung: data/NasaRepository.yml nicht gefunden - verwende Beispiel-Repository"
fi

# Kopiere Tools-Verzeichnis
cp -r tools/* ehs-sentinel/tools/

# Baue das Docker Image
echo "🔨 Baue Docker Image..."
cd ehs-sentinel

docker build \
    --build-arg BUILD_FROM="$BASE_IMAGE" \
    --build-arg BUILD_ARCH="$BUILD_ARCH" \
    --build-arg BUILD_VERSION="1.0.0" \
    -t "local/ehs-sentinel-addon:latest" \
    -t "local/ehs-sentinel-addon:1.0.0" \
    .

echo "✅ Docker Image erfolgreich gebaut!"
echo ""
echo "📋 Verfügbare Images:"
docker images | grep "ehs-sentinel-addon"
echo ""
echo "🎉 Das Addon kann jetzt in Home Assistant installiert werden!"
echo ""
echo "📝 Nächste Schritte:"
echo "1. Gehen Sie zu Home Assistant -> Einstellungen -> Add-ons -> Add-on Store"
echo "2. Klicken Sie auf die drei Punkte (⋮) oben rechts -> Repositories"
echo "3. Fügen Sie diesen lokalen Pfad hinzu: $(pwd)/.."
echo "4. Das 'EHS-Sentinel' Addon sollte nun verfügbar sein"
echo ""
echo "💡 Tipp: Falls das Addon nicht erscheint, starten Sie Home Assistant neu"