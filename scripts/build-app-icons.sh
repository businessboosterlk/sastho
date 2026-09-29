#!/bin/sh
# THE HOME SCREEN ICONS, made from the client's own logo file and nothing else. The whole mark is shown,
# never cropped (WHOLE MARK LAW). The logo is 409 pixels wide, so it is placed at its own size or smaller
# and never stretched past it by more than a twentieth.
#   any       the mark at 84 percent of the tile
#   maskable  the mark at 72 percent, inside the 80 percent circle Android and Chrome crop to
# Needs ImageMagick (magick). There is no Pillow on this Mac.
set -e
cd "$(dirname "$0")/.."
L=public/assets/logo.png
tile() { magick -size 512x512 xc:'#ffffff' \( "$L" -resize "$1" \) -gravity center -composite -strip "$2"; }
tile 430x public/icon-512.png
tile 369x public/icon-maskable-512.png
magick public/icon-512.png -resize 192x192 -strip public/icon-192.png
magick public/icon-512.png -resize 180x180 -strip public/apple-touch-icon.png
magick public/icon-512.png -resize 96x96 -strip public/assets/icon-96.png
magick public/icon-512.png -resize 32x32 -strip public/favicon.png
echo "icons written"; ls -la public/*.png public/assets/icon-96.png
