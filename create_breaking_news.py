from PIL import Image, ImageDraw, ImageFont
import os

width, height = 1080, 1440
# Vintage paper color
bg_color = (240, 235, 225) 
img = Image.new('RGB', (width, height), color=bg_color)
draw = ImageDraw.Draw(img)

# Try to use standard Windows fonts
try:
    font_title = ImageFont.truetype("timesbd.ttf", 110)
    font_sub = ImageFont.truetype("timesi.ttf", 35)
    font_small = ImageFont.truetype("times.ttf", 25)
    font_text = ImageFont.truetype("times.ttf", 22)
    font_logo = ImageFont.truetype("arialbd.ttf", 40)
except:
    font_title = ImageFont.load_default()
    font_sub = font_title
    font_small = font_title
    font_text = font_title
    font_logo = font_title

# Draw title
title_text = "BREAKING NEWS"
bbox = draw.textbbox((0,0), title_text, font=font_title)
tw = bbox[2] - bbox[0]
draw.text(((width - tw)/2, 60), title_text, font=font_title, fill=(30, 30, 30))

# Lines
draw.line([(50, 200), (1030, 200)], fill=(80, 80, 80), width=3)
draw.line([(50, 260), (1030, 260)], fill=(80, 80, 80), width=3)

# Subtitle
sub_text = "Berikut Para Remaja Blok M Tertangkap Basah"
bbox = draw.textbbox((0,0), sub_text, font=font_sub)
sw = bbox[2] - bbox[0]
draw.text(((width - sw)/2, 210), sub_text, font=font_sub, fill=(50, 50, 50))

# Small headers
draw.rectangle([(50, 280), (250, 320)], outline=(80,80,80), width=2)
draw.text((70, 285), "DAILY REPORT", font=font_small, fill=(50,50,50))

draw.rectangle([(830, 280), (1030, 320)], outline=(80,80,80), width=2)
draw.text((850, 285), "26 MAY 2025", font=font_small, fill=(50,50,50))

# Logo
logo_text = "JEPRETO"
bbox = draw.textbbox((0,0), logo_text, font=font_logo)
lw = bbox[2] - bbox[0]
draw.text(((width - lw)/2, 280), logo_text, font=font_logo, fill=(20, 20, 20))

# Cutout Rectangles (solid white so it can be made transparent)
# Top large photo
draw.rectangle([(80, 360), (1000, 880)], fill=(255, 255, 255), outline=(50,50,50), width=2)

# Bottom left photo
draw.rectangle([(80, 920), (510, 1260)], fill=(255, 255, 255), outline=(50,50,50), width=2)

# Bottom right photo
draw.rectangle([(570, 920), (1000, 1260)], fill=(255, 255, 255), outline=(50,50,50), width=2)

# Bottom Text
long_text = "Sebuah insiden mengejutkan terjadi di kawasan Blok M sore tadi. Sekelompok remaja yang dikenal sering menghabiskan waktu di area literasi dan kuliner legendaris ini akhirnya tertangkap basah oleh lensa kamera. Berdasarkan pantauan di lapangan, kawanan ini tidak melakukan perlawanan saat diminta untuk berpose. Petugas di lokasi melaporkan bahwa kelompok ini terbukti membawa 'barang bukti' berupa outfit yang terlalu keren dan kepercayaan diri tingkat tinggi yang melampaui batas kewajaran. Motif sementara diduga kuat karena rasa lapar akan konten dan keinginan untuk mengabadikan momen kebersamaan sebelum terjebak macetnya jalur MRT. Saat ini, para pelaku masih ditahan di dalam bingkai foto ini untuk penyelidikan lebih lanjut terkait tingkat keestetikan mereka."

import textwrap
wrapped = textwrap.fill(long_text, width=100)
draw.multiline_text((80, 1280), wrapped, font=font_text, fill=(50,50,50), spacing=5)

output_path = r'c:\laragon\www\difotoku\images\frame15.png'
img.save(output_path)
print(f"Saved {output_path}")
