from PIL import Image, ImageDraw, ImageFont
import os

OUT = os.path.dirname(os.path.abspath(__file__))
BG = (15, 23, 42)  # slate-900
FG = (255, 255, 255)

def make(size, padding_ratio=0.15, fname=None):
    img = Image.new('RGBA', (size, size), BG + (255,))
    d = ImageDraw.Draw(img)
    # Bell/notification icon
    cx, cy = size // 2, size // 2
    r = int(size * 0.30)
    # bell body
    bell_w = int(size * 0.45)
    bell_h = int(size * 0.45)
    top = cy - bell_h // 2
    # rounded body
    d.rounded_rectangle([cx - bell_w//2, top, cx + bell_w//2, top + bell_h], radius=int(size*0.08), fill=FG)
    # top circle
    d.ellipse([cx - int(size*0.05), top - int(size*0.06), cx + int(size*0.05), top + int(size*0.04)], fill=FG)
    # clapper
    d.ellipse([cx - int(size*0.06), top + bell_h, cx + int(size*0.06), top + bell_h + int(size*0.12)], fill=FG)
    img.save(os.path.join(OUT, fname))
    print('wrote', fname, size)

make(192, fname='icon-192.png')
make(512, fname='icon-512.png')
# maskable variant (safe zone center 80%)
img = Image.new('RGBA', (512, 512), BG + (255,))
d = ImageDraw.Draw(img)
cx = cy = 256
bell_w = int(512 * 0.35)
bell_h = int(512 * 0.35)
top = cy - bell_h // 2
d.rounded_rectangle([cx - bell_w//2, top, cx + bell_w//2, top + bell_h], radius=40, fill=FG)
d.ellipse([cx - 20, top - 30, cx + 20, top + 20], fill=FG)
d.ellipse([cx - 30, top + bell_h, cx + 30, top + bell_h + 60], fill=FG)
img.save(os.path.join(OUT, 'icon-maskable.png'))
print('wrote icon-maskable.png 512')
