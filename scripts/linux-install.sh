#!/bin/bash

# ==========================================
# CONFIGURATION
# ==========================================
APPIMAGE_URL="https://github.com/ERRORLY/Laukey/releases/download/v0.2/Laukey_0.2.0_amd64.AppImage"
ICON_URL="https://github.com/ERRORLY/Laukey/blob/main/images/laukey-logo.png?raw=true"
APP_NAME="Laukey"
APPIMAGE_FILE="Laukey.AppImage"
ICON_FILE="Laukey.png"

# ==========================================
# SETUP DIRECTORIES & PATHS
# ==========================================
BIN_DIR="$HOME/.local/bin"
ICON_DIR="$HOME/.local/share/icons"
DESKTOP_DIR="$HOME/.local/share/applications"
TMP_DIR=$(mktemp -d)

# Create directories if they don't exist
mkdir -p "$BIN_DIR"
mkdir -p "$ICON_DIR"
mkdir -p "$DESKTOP_DIR"

# Ensure temp directory deletes itself on exit
trap 'rm -rf "$TMP_DIR"' EXIT

# ==========================================
# DOWNLOAD FILES
# ==========================================
echo "Downloading AppImage..."
if ! curl -L "$APPIMAGE_URL" -o "$TMP_DIR/$APPIMAGE_FILE"; then
    echo "❌ Error: Failed to download AppImage. Check your URL."
    exit 1
fi

echo "Downloading Icon..."
if ! curl -L "$ICON_URL" -o "$TMP_DIR/$ICON_FILE"; then
    echo "❌ Error: Failed to download Icon. Check your URL."
    exit 1
fi

# ==========================================
# EXECUTION & INSTALLATION
# ==========================================

# 1. Move AppImage to local binaries and make executable
echo "Installing AppImage..."
cp "$TMP_DIR/$APPIMAGE_FILE" "$BIN_DIR/$APPIMAGE_FILE"
chmod +x "$BIN_DIR/$APPIMAGE_FILE"

# 2. Move Icon to local icons directory
echo "Installing Icon..."
EXT="${ICON_FILE##*.}"
cp "$TMP_DIR/$ICON_FILE" "$ICON_DIR/${APP_NAME// /_}.$EXT"

# 3. Create Desktop Entry
echo "Creating Desktop Shortcut..."
DESKTOP_FILE="$DESKTOP_DIR/${APP_NAME// /_}.desktop"

cat <<EOF > "$DESKTOP_FILE"
[Desktop Entry]
Name=$APP_NAME
Comment=A Local Password Manager
Exec=$BIN_DIR/$APPIMAGE_FILE
Icon=${APP_NAME// /_}
Type=Application
Categories=Utility;
Terminal=false
StartupWMClass=$APP_NAME
EOF

# Update desktop database if available
if command -v update-desktop-database &> /dev/null; then
    update-desktop-database "$DESKTOP_DIR"
fi

echo "=========================================="
echo "Setup complete! $APP_NAME should now appear in your application menu."
echo "=========================================="
