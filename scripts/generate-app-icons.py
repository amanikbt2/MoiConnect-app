import os
from PIL import Image

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS_DIR = os.path.join(BASE_DIR, 'assets')
PLAYSTORE_DIR = os.path.join(ASSETS_DIR, 'playstore_assets')
ANDROID_RES_DIR = os.path.join(BASE_DIR, 'android', 'app', 'src', 'main', 'res')

LOGO_PATH = os.path.join(ASSETS_DIR, 'm-logo-smooth.png')
if not os.path.exists(LOGO_PATH):
    raise FileNotFoundError(f"Logo not found at {LOGO_PATH}")

logo = Image.open(LOGO_PATH)
lw, lh = logo.size
aspect = lw / lh

GREEN = (5, 93, 6, 255) # Rich Moi Green #055D06

def make_solid_icon(size, logo_width, bg_color=GREEN):
    img = Image.new('RGBA', (size, size), bg_color)
    logo_h = int(logo_width / aspect)
    resized_logo = logo.resize((logo_width, logo_h), Image.Resampling.LANCZOS)
    x = (size - logo_width) // 2
    y = (size - logo_h) // 2
    img.paste(resized_logo, (x, y), resized_logo)
    return img

def make_transparent_icon(size, logo_width):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    logo_h = int(logo_width / aspect)
    resized_logo = logo.resize((logo_width, logo_h), Image.Resampling.LANCZOS)
    x = (size - logo_width) // 2
    y = (size - logo_h) // 2
    img.paste(resized_logo, (x, y), resized_logo)
    return img

def generate_all():
    os.makedirs(PLAYSTORE_DIR, exist_ok=True)

    # 1. Google Play Store (512x512 full-bleed square)
    playstore_icon = make_solid_icon(512, 330)
    playstore_icon.save(os.path.join(PLAYSTORE_DIR, 'icon.png'))
    playstore_icon.convert('RGB').save(os.path.join(PLAYSTORE_DIR, 'icon.jpg'), quality=95)

    # 2. Expo / App root icons
    icon_1024 = make_solid_icon(1024, 650)
    icon_1024.save(os.path.join(ASSETS_DIR, 'icon.png'))
    icon_1024.save(os.path.join(ASSETS_DIR, 'images', 'icon.png'))

    # 3. Android Adaptive Icon layers (1024x1024)
    adaptive_fg = make_transparent_icon(1024, 470)
    adaptive_fg.save(os.path.join(ASSETS_DIR, 'adaptive-icon.png'))
    adaptive_fg.save(os.path.join(ASSETS_DIR, 'android-icon-foreground.png'))
    adaptive_fg.save(os.path.join(ASSETS_DIR, 'images', 'android-icon-foreground.png'))

    adaptive_bg = Image.new('RGBA', (1024, 1024), GREEN)
    adaptive_bg.save(os.path.join(ASSETS_DIR, 'android-icon-background.png'))
    adaptive_bg.save(os.path.join(ASSETS_DIR, 'images', 'android-icon-background.png'))

    # 4. Web Favicon & Splash
    favicon = make_solid_icon(512, 330)
    favicon.save(os.path.join(ASSETS_DIR, 'favicon.png'))
    favicon.save(os.path.join(ASSETS_DIR, 'images', 'favicon.png'))

    splash = make_transparent_icon(1024, 520)
    splash.save(os.path.join(ASSETS_DIR, 'splash-icon.png'))
    splash.save(os.path.join(ASSETS_DIR, 'images', 'splash-icon.png'))

    mono = make_transparent_icon(192, 130)
    mono.save(os.path.join(ASSETS_DIR, 'android-icon-monochrome.png'))
    mono.save(os.path.join(ASSETS_DIR, 'images', 'android-icon-monochrome.png'))

    # 5. Native Android Mipmap densities
    densities = {
        'mdpi': (48, 108),
        'hdpi': (72, 162),
        'xhdpi': (96, 216),
        'xxhdpi': (144, 324),
        'xxxhdpi': (192, 432)
    }

    for folder, (legacy_size, adaptive_size) in densities.items():
        dir_path = os.path.join(ANDROID_RES_DIR, f'mipmap-{folder}')
        os.makedirs(dir_path, exist_ok=True)
        
        fg_w = int(adaptive_size * 0.46)
        fg_img = make_transparent_icon(adaptive_size, fg_w)
        fg_img.save(os.path.join(dir_path, 'ic_launcher_foreground.png'))

        leg_w = int(legacy_size * 0.64)
        leg_img = make_solid_icon(legacy_size, leg_w)
        leg_img.save(os.path.join(dir_path, 'ic_launcher.png'))
        leg_img.save(os.path.join(dir_path, 'ic_launcher_round.png'))

    anydpi_dir = os.path.join(ANDROID_RES_DIR, 'mipmap-anydpi-v26')
    os.makedirs(anydpi_dir, exist_ok=True)
    adaptive_fg.save(os.path.join(anydpi_dir, 'ic_launcher_foreground.png'))

    print("Successfully generated all app, Play Store, and native Android adaptive icons!")

if __name__ == '__main__':
    generate_all()
