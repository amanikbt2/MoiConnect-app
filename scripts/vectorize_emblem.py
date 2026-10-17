import math
from PIL import Image

def get_ordered_contour(mask, start_pt=None):
    w, h = mask.size
    # If no start point, find topmost-leftmost white pixel
    if start_pt is None:
        for y in range(h):
            for x in range(w):
                if mask.getpixel((x, y)) == 255:
                    start_pt = (x, y)
                    break
            if start_pt:
                break
    if not start_pt:
        return []

    # Directions: E, SE, S, SW, W, NW, N, NE
    dirs = [(1, 0), (1, 1), (0, 1), (-1, 1), (-1, 0), (-1, -1), (0, -1), (1, -1)]
    
    contour = [start_pt]
    curr = start_pt
    back_dir = 4 # coming from West
    
    max_steps = 10000
    for _ in range(max_steps):
        found = False
        start_check = (back_dir + 2) % 8
        for i in range(8):
            d_idx = (start_check + i) % 8
            dx, dy = dirs[d_idx]
            nx, ny = curr[0] + dx, curr[1] + dy
            if 0 <= nx < w and 0 <= ny < h and mask.getpixel((nx, ny)) == 255:
                curr = (nx, ny)
                contour.append(curr)
                back_dir = (d_idx + 4) % 8
                found = True
                break
        if not found or curr == start_pt:
            break
    return contour

def perpendicular_distance(pt, line_start, line_end):
    dx = line_end[0] - line_start[0]
    dy = line_end[1] - line_start[1]
    if dx == 0 and dy == 0:
        return math.hypot(pt[0] - line_start[0], pt[1] - line_start[1])
    return abs(dy * pt[0] - dx * pt[1] + line_end[0] * line_start[1] - line_end[1] * line_start[0]) / math.hypot(dx, dy)

def ramer_douglas_peucker(pts, epsilon):
    if len(pts) < 3:
        return pts
    dmax = 0.0
    index = 0
    for i in range(1, len(pts) - 1):
        d = perpendicular_distance(pts[i], pts[0], pts[-1])
        if d > dmax:
            index = i
            dmax = d
    if dmax > epsilon:
        res1 = ramer_douglas_peucker(pts[:index+1], epsilon)
        res2 = ramer_douglas_peucker(pts[index:], epsilon)
        return res1[:-1] + res2
    else:
        return [pts[0], pts[-1]]

def simplify_closed_contour(pts, epsilon):
    if len(pts) < 4:
        return pts
    # find point furthest from pts[0]
    furthest_idx = 0
    max_d = 0
    for i, p in enumerate(pts):
        d = math.hypot(p[0] - pts[0][0], p[1] - pts[0][1])
        if d > max_d:
            max_d = d
            furthest_idx = i
    part1 = ramer_douglas_peucker(pts[:furthest_idx+1], epsilon)
    part2 = ramer_douglas_peucker(pts[furthest_idx:], epsilon)
    res = part1[:-1] + part2
    return res

m_mask = Image.open('frontend/assets/m_mask.png')
c_mask = Image.open('frontend/assets/c_mask.png')

m_contour = get_ordered_contour(m_mask)
c_contour = get_ordered_contour(c_mask)

print(f'M raw contour points: {len(m_contour)}')
print(f'C raw contour points: {len(c_contour)}')

# Simplify with epsilon ~ 4.0 - 5.0
m_simp = simplify_closed_contour(m_contour, 4.5)
c_simp = simplify_closed_contour(c_contour, 4.5)

print(f'M simplified points: {len(m_simp)}')
print(f'C simplified points: {len(c_simp)}')

# Normalize to viewBox 0 0 100 100 or 0 0 24 24
# Overall bounds: minX=62, maxX=546 (span=484), minY=8, maxY=513 (span=505)
minX, maxX = 60, 550
minY, maxY = 5, 515
span = max(maxX - minX, maxY - minY)

def to_svg_path(pts, target_size=24, padding=1.5):
    usable = target_size - 2 * padding
    path_d = []
    for i, (x, y) in enumerate(pts):
        sx = padding + ((x - minX) / span) * usable
        sy = padding + ((y - minY) / span) * usable
        cmd = 'M' if i == 0 else 'L'
        path_d.append(f'{cmd}{sx:.2f} {sy:.2f}')
    path_d.append('Z')
    return ' '.join(path_d)

m_svg_24 = to_svg_path(m_simp, 24)
c_svg_24 = to_svg_path(c_simp, 24)

print('\n--- M SVG (24x24) ---')
print(m_svg_24)

print('\n--- C SVG (24x24) ---')
print(c_svg_24)

# Also generate a full precision 100x100 version
m_svg_100 = to_svg_path(m_simp, 100, padding=4)
c_svg_100 = to_svg_path(c_simp, 100, padding=4)

svg_file_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <!-- M Shape (Charcoal / Dynamic) -->
  <path d="{m_svg_100}" fill="#2E353C" />
  <!-- C Shape (Emerald Green) -->
  <path d="{c_svg_100}" fill="#008B46" />
</svg>
'''

with open('frontend/assets/mc-logo.svg', 'w') as f:
    f.write(svg_file_content)

print('\nSaved frontend/assets/mc-logo.svg successfully.')
