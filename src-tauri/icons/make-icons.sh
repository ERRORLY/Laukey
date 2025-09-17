#!/bin/bash
SRC="laukey.png"

# Windows Store / UWP assets
convert "$SRC" -resize 30x30   Square30x30Logo.png
convert "$SRC" -resize 44x44   Square44x44Logo.png
convert "$SRC" -resize 71x71   Square71x71Logo.png
convert "$SRC" -resize 89x89   Square89x89Logo.png
convert "$SRC" -resize 107x107 Square107x107Logo.png
convert "$SRC" -resize 142x142 Square142x142Logo.png
convert "$SRC" -resize 150x150 Square150x150Logo.png
convert "$SRC" -resize 284x284 Square284x284Logo.png
convert "$SRC" -resize 310x310 Square310x310Logo.png
convert "$SRC" -resize 50x50   StoreLogo.png

# General PNG icons
convert "$SRC" -resize 32x32   32x32.png
convert "$SRC" -resize 128x128 128x128.png
convert "$SRC" -resize 256x256 icon.png
convert "$SRC" -resize 256x256 128x128@2x.png

# ICO (multi-resolution, Windows)
convert "$SRC" -define icon:auto-resize=16,24,32,48,64,128,256 icon.ico

# ICNS (macOS)
convert "$SRC" -resize 16x16   icon_16x16.png
convert "$SRC" -resize 32x32   icon_32x32.png
convert "$SRC" -resize 128x128 icon_128x128.png
convert "$SRC" -resize 256x256 icon_256x256.png
convert "$SRC" -resize 512x512 icon_512x512.png
convert "$SRC" -resize 1024x1024 icon_1024x1024.png
png2icns icon.icns icon_*.png
rm icon_*x*.png
