import os
import sys
import math
import subprocess
from PIL import Image, ImageDraw, ImageFont

# Dimensions & Framerate
WIDTH = 1280
HEIGHT = 720
FPS = 30
DURATION_SEC = 16
TOTAL_FRAMES = FPS * DURATION_SEC  # 480 frames

# Output file
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'public')
OUTPUT_VIDEO = os.path.join(OUTPUT_DIR, 'dms-dashboard-overview.mp4')
FFMPEG_PATH = r"C:\Program Files\Lenovo\GamingAI\2.2.0105.1301\services\editor\ffmpeg.exe"

# Fonts
FONT_BOLD_PATH = r"C:\Windows\Fonts\leelawdb.ttf"
FONT_REG_PATH = r"C:\Windows\Fonts\LeelawUI.ttf"

def get_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()

font_title_lg = get_font(FONT_BOLD_PATH, 34)
font_title = get_font(FONT_BOLD_PATH, 26)
font_subtitle = get_font(FONT_REG_PATH, 16)
font_stat_val = get_font(FONT_BOLD_PATH, 30)
font_stat_lbl = get_font(FONT_REG_PATH, 14)
font_badge = get_font(FONT_BOLD_PATH, 13)
font_sm = get_font(FONT_REG_PATH, 13)
font_xs = get_font(FONT_REG_PATH, 11)
font_mono = get_font(FONT_BOLD_PATH, 15)

def ease_out_cubic(x):
    return 1.0 - math.pow(1.0 - max(0.0, min(1.0, x)), 3)

def ease_in_out_quad(x):
    return 2 * x * x if x < 0.5 else 1 - math.pow(-2 * x + 2, 2) / 2

def draw_rounded_rect(draw, bbox, radius, fill=None, outline=None, width=1):
    x1, y1, x2, y2 = bbox
    draw.rounded_rectangle([x1, y1, x2, y2], radius=radius, fill=fill, outline=outline, width=width)

def draw_top_nav(draw, frame):
    # Top banner card
    draw_rounded_rect(draw, (30, 16, 1250, 76), 14, fill=(15, 23, 42, 240), outline=(51, 65, 85, 200), width=1)
    
    # Logo Box
    draw_rounded_rect(draw, (44, 26, 84, 66), 10, fill=(30, 58, 138, 255), outline=(59, 130, 246, 255), width=1)
    # Cross/Pulse inside Logo
    draw.rectangle([59, 34, 69, 58], fill=(56, 189, 248))
    draw.rectangle([49, 41, 79, 51], fill=(56, 189, 248))
    
    # Title & Subtitle
    draw.text((98, 26), "DMS Care Tools", font=font_title, fill=(255, 255, 255))
    draw.text((310, 34), "|", font=font_title, fill=(71, 85, 105))
    draw.text((330, 34), "ระบบสารสนเทศวิเคราะห์ข้อมูลบุคลากรทางการแพทย์ (Interactive Overview)", font=font_subtitle, fill=(148, 163, 184))
    
    # Live Pulsing Badge
    pulse = math.sin(frame * 0.2) * 0.5 + 0.5
    dot_color = (int(34 + 20 * pulse), int(197 + 30 * pulse), int(94 + 20 * pulse))
    draw_rounded_rect(draw, (1030, 28, 1234, 64), 18, fill=(16, 185, 129, 30), outline=(16, 185, 129, 120), width=1)
    draw.ellipse([1046, 41, 1056, 51], fill=dot_color)
    draw.text((1066, 36), "LIVE 4,205 บัญชี", font=font_badge, fill=(52, 211, 153))

def draw_bottom_bar(draw, frame):
    # Chapter Line
    chapters = [
        ("01 สรุปภาพรวม KPI", 0, 120),
        ("02 สัดส่วนตามสังกัด", 120, 240),
        ("03 ตัวกรอง 9 มิติ & แผนที่", 240, 360),
        ("04 ตาราง 5 แท็บ & ส่งออก", 360, 480)
    ]
    
    current_idx = min(3, frame // 120)
    
    # Container
    draw_rounded_rect(draw, (30, 644, 1250, 700), 12, fill=(15, 23, 42, 230), outline=(51, 65, 85, 180), width=1)
    
    # Render chapter pills
    pill_w = 280
    for i, (title, start, end) in enumerate(chapters):
        px = 50 + i * (pill_w + 24)
        is_active = (i == current_idx)
        if is_active:
            draw_rounded_rect(draw, (px, 652, px + pill_w, 692), 8, fill=(30, 58, 138, 220), outline=(59, 130, 246, 255), width=1)
            draw.text((px + 20, 660), title, font=font_badge, fill=(255, 255, 255))
            # Little indicator diamond
            draw.text((px + pill_w - 30, 660), "●", font=font_badge, fill=(56, 189, 248))
        else:
            draw.text((px + 20, 662), title, font=font_xs, fill=(100, 116, 139))

    # Real-time smooth progress line at bottom
    progress_w = int((frame / TOTAL_FRAMES) * 1220)
    draw.line([(30, 712), (1250, 712)], fill=(30, 41, 59), width=4)
    if progress_w > 0:
        draw.line([(30, 712), (30 + progress_w, 712)], fill=(56, 189, 248), width=4)

def render_scene_1(draw, frame):
    # Scene 1: Overview & 4 Major KPIs (0-120)
    t = frame / 120.0
    et = ease_out_cubic(t)
    
    # Section Header
    draw_rounded_rect(draw, (30, 94, 250, 126), 16, fill=(59, 130, 246, 35), outline=(59, 130, 246, 120), width=1)
    draw.text((45, 101), "★ ภาพรวมระดับประเทศ", font=font_badge, fill=(96, 165, 250))
    draw.text((30, 136), "ระบบข้อมูลกำลังคนและสถานพยาบาลทั่วประเทศ", font=font_title_lg, fill=(255, 255, 255))
    draw.text((30, 180), "ข้อมูล ณ 2567-2569 ครอบคลุม 13 เขตสุขภาพ 77 จังหวัด และ 2,911 หน่วยบริการ", font=font_subtitle, fill=(148, 163, 184))
    
    # 4 KPI Cards
    kpis = [
        {
            "label": "บุคลากรทั้งหมดในระบบ",
            "val_target": 4205,
            "val_suffix": " คน",
            "sub": "เพิ่มขึ้นจากทุกเขตสุขภาพ",
            "color": (59, 130, 246),
            "accent": "👥",
            "x": 30, "y": 220, "w": 285, "h": 180
        },
        {
            "label": "หน่วยบริการ / โรงพยาบาล",
            "val_target": 2911,
            "val_suffix": " แห่ง",
            "sub": "รพช., รพ.สต., รพท., รพศ.",
            "color": (16, 185, 129),
            "accent": "🏥",
            "x": 345, "y": 220, "w": 285, "h": 180
        },
        {
            "label": "สถานะเปิดใช้งาน (Active)",
            "val_target": 97.1,
            "is_pct": True,
            "val_suffix": "%",
            "sub": "4,083 บัญชี พร้อมปฏิบัติงาน",
            "color": (6, 182, 212),
            "accent": "🟢",
            "x": 660, "y": 220, "w": 285, "h": 180
        },
        {
            "label": "พื้นที่ครอบคลุมทั่วไทย",
            "val_target": 77,
            "val_suffix": " จังหวัด",
            "sub": "13 เขตสุขภาพ ครบ 100%",
            "color": (168, 85, 247),
            "accent": "🗺️",
            "x": 965, "y": 220, "w": 285, "h": 180
        }
    ]
    
    for kpi in kpis:
        x, y, w, h = kpi["x"], kpi["y"], kpi["w"], kpi["h"]
        # Card body
        draw_rounded_rect(draw, (x, y, x + w, y + h), 16, fill=(15, 23, 42, 230), outline=(51, 65, 85, 220), width=1)
        
        # Color bar top
        draw_rounded_rect(draw, (x, y, x + w, y + 6), 6, fill=kpi["color"])
        
        # Label
        draw.text((x + 20, y + 24), kpi["label"], font=font_stat_lbl, fill=(148, 163, 184))
        
        # Value animated
        if kpi.get("is_pct"):
            current_val = kpi["val_target"] * et
            val_str = f"{current_val:.1f}{kpi['val_suffix']}"
        else:
            current_val = int(kpi["val_target"] * et)
            val_str = f"{current_val:,}{kpi['val_suffix']}"
            
        draw.text((x + 20, y + 54), val_str, font=font_stat_val, fill=(255, 255, 255))
        
        # Subtext badge
        draw_rounded_rect(draw, (x + 20, y + 120, x + w - 20, y + 154), 8, fill=(30, 41, 59, 200))
        draw.text((x + 32, y + 128), kpi["sub"], font=font_xs, fill=(203, 213, 225))
        
    # Bottom showcase banner in Scene 1
    draw_rounded_rect(draw, (30, 426, 1250, 620), 16, fill=(15, 23, 42, 200), outline=(51, 65, 85, 180), width=1)
    draw.text((54, 446), "📈 แนวโน้มการสมัครใช้งาน (Registration Trend 2567-2569)", font=font_title, fill=(255, 255, 255))
    draw.text((54, 480), "อัตราการขยายตัวของผู้ใช้งานต่อเนื่องทั่วประเทศ ครอบคลุมทั้งบุคลากรระดับปฐมภูมิ ทุติยภูมิ และตติยภูมิ", font=font_subtitle, fill=(148, 163, 184))
    
    # Animated mini line graph
    graph_x = 54
    graph_y = 520
    graph_w = 1140
    graph_h = 70
    points = [
        (0.0, 0.1), (0.15, 0.25), (0.3, 0.2), (0.45, 0.5), (0.6, 0.65), (0.75, 0.55), (0.9, 0.85), (1.0, 0.95)
    ]
    coords = []
    for px, py in points:
        actual_x = graph_x + int(px * graph_w * et)
        actual_y = graph_y + graph_h - int(py * graph_h * et)
        coords.append((actual_x, actual_y))
    
    if len(coords) > 1:
        for idx in range(len(coords) - 1):
            draw.line([coords[idx], coords[idx + 1]], fill=(56, 189, 248), width=3)
        for cx, cy in coords:
            draw.ellipse([cx - 4, cy - 4, cx + 4, cy + 4], fill=(255, 255, 255), outline=(59, 130, 246), width=2)

def render_scene_2(draw, frame):
    # Scene 2: Affiliation Breakdown (Matches "สัดส่วนตามสังกัด" chart!)
    t = (frame - 120) / 120.0
    et = ease_out_cubic(t)
    
    # Section Header
    draw_rounded_rect(draw, (30, 94, 250, 126), 16, fill=(16, 185, 129, 35), outline=(16, 185, 129, 120), width=1)
    draw.text((45, 101), "📊 สัดส่วนตามสังกัด", font=font_badge, fill=(52, 211, 153))
    draw.text((30, 136), "โครงสร้างต้นสังกัดของบุคลากร (Affiliation Breakdown)", font=font_title_lg, fill=(255, 255, 255))
    draw.text((30, 180), "การกระจายตัวของ 4,205 บุคลากร ตามหน่วยงานต้นสังกัดและระดับสถานพยาบาล", font=font_subtitle, fill=(148, 163, 184))
    
    # Left Card: Donut Chart Visualization (Simulating affiliationsChart)
    draw_rounded_rect(draw, (30, 220, 620, 620), 16, fill=(15, 23, 42, 240), outline=(51, 65, 85, 220), width=1)
    draw.text((54, 240), "แผนภูมิวงกลมแสดงสัดส่วนสังกัด", font=font_title, fill=(255, 255, 255))
    draw.text((54, 272), "สป. (สำนักงานปลัดกระทรวงสาธารณสุข) ครองสัดส่วนหลัก 49.3%", font=font_subtitle, fill=(148, 163, 184))
    
    # Donut center and radii
    cx, cy = 325, 455
    r_outer = 140
    r_inner = 80
    
    slices = [
        {"name": "สป.", "pct": 49.3, "color": (59, 130, 246), "count": 2074},
        {"name": "อปท.", "pct": 32.1, "color": (16, 185, 129), "count": 1348},
        {"name": "กรมการแพทย์", "pct": 9.8, "color": (245, 158, 11), "count": 414},
        {"name": "อบจ.", "pct": 5.2, "color": (139, 92, 246), "count": 220},
        {"name": "อื่นๆ", "pct": 3.6, "color": (236, 72, 153), "count": 149},
    ]
    
    start_angle = -90
    total_angle = 360 * et
    current_drawn = 0
    
    for s in slices:
        sweep = s["pct"] * 3.6
        if current_drawn + sweep <= total_angle:
            actual_sweep = sweep
        elif current_drawn < total_angle:
            actual_sweep = total_angle - current_drawn
        else:
            actual_sweep = 0
            
        if actual_sweep > 0:
            draw.pieslice(
                [cx - r_outer, cy - r_outer, cx + r_outer, cy + r_outer],
                start=start_angle + current_drawn,
                end=start_angle + current_drawn + actual_sweep,
                fill=s["color"]
            )
        current_drawn += sweep
        
    # Cut out inner hole for doughnut
    draw.ellipse([cx - r_inner, cy - r_inner, cx + r_inner, cy + r_inner], fill=(15, 23, 42))
    draw.ellipse([cx - r_inner, cy - r_inner, cx + r_inner, cy + r_inner], outline=(51, 65, 85), width=2)
    
    # Text inside Donut hole
    draw.text((cx - 38, cy - 22), "รวมสังกัด", font=font_stat_lbl, fill=(148, 163, 184))
    draw.text((cx - 48, cy), "4,205", font=font_title, fill=(255, 255, 255))
    draw.text((cx - 24, cy + 30), "คน", font=font_stat_lbl, fill=(148, 163, 184))
    
    # Right Card: Detailed Table & Level Breakdown
    draw_rounded_rect(draw, (660, 220, 1250, 620), 16, fill=(15, 23, 42, 240), outline=(51, 65, 85, 220), width=1)
    draw.text((684, 240), "รายละเอียด 5 สังกัด & ระดับโรงพยาบาล", font=font_title, fill=(255, 255, 255))
    
    # Affiliation items
    item_y = 286
    for s in slices:
        # Dot
        draw.ellipse([684, item_y + 4, 698, item_y + 18], fill=s["color"])
        # Name
        draw.text((710, item_y), s["name"], font=font_subtitle, fill=(255, 255, 255))
        # Count & Pct
        val_text = f"{s['count']:,} คน ({s['pct']}%)"
        draw.text((1110, item_y), val_text, font=font_subtitle, fill=(203, 213, 225))
        
        # Progress line
        bar_w = int(480 * (s["pct"] / 50.0) * et)
        draw.rounded_rectangle([710, item_y + 26, 1190, item_y + 30], radius=2, fill=(30, 41, 59))
        draw.rounded_rectangle([710, item_y + 26, 710 + bar_w, item_y + 30], radius=2, fill=s["color"])
        
        item_y += 44
        
    # Divider
    draw.line([(684, item_y + 8), (1226, item_y + 8)], fill=(51, 65, 85), width=1)
    
    # Hospital Level highlights
    draw.text((684, item_y + 18), "ระดับสถานพยาบาลที่มีสัดส่วนสูงสุด:", font=font_stat_lbl, fill=(148, 163, 184))
    levels = [
        ("รพช. (ชุมชน)", "1,607 คน (38.2%)", (56, 189, 248)),
        ("รพ.สต. (ตำบล)", "1,489 คน (35.4%)", (52, 211, 153)),
        ("รพท./รพศ. (ศูนย์)", "586 คน (13.9%)", (251, 191, 36)),
    ]
    lx = 684
    for lname, lval, lcol in levels:
        draw_rounded_rect(draw, (lx, item_y + 42, lx + 170, item_y + 88), 10, fill=(30, 41, 59, 200), outline=lcol, width=1)
        draw.text((lx + 10, item_y + 48), lname, font=font_xs, fill=(148, 163, 184))
        draw.text((lx + 10, item_y + 66), lval, font=font_sm, fill=(255, 255, 255))
        lx += 184

def render_scene_3(draw, frame):
    # Scene 3: Cascading 9 Filters & Thailand Map GIS (240-360)
    t = (frame - 240) / 120.0
    et = ease_out_cubic(t)
    
    # Section Header
    draw_rounded_rect(draw, (30, 94, 250, 126), 16, fill=(168, 85, 247, 35), outline=(168, 85, 247, 120), width=1)
    draw.text((45, 101), "⚡ ตัวกรองอัจฉริยะ 9 มิติ", font=font_badge, fill=(192, 132, 252))
    draw.text((30, 136), "ระบบกรองข้อมูลแบบ Cascading เชื่อมโยงระดับ อำเภอ & ตำบล", font=font_title_lg, fill=(255, 255, 255))
    draw.text((30, 180), "ฟิลเตอร์ทำงานสองทิศทาง เลือกจังหวัด ➔ จำกัดอำเภอ/ตำบลอัตโนมัติ หรือเลือกอำเภอ ➔ เติมจังหวัดทันที", font=font_subtitle, fill=(148, 163, 184))
    
    # Left Card: The 9 Filter Badges
    draw_rounded_rect(draw, (30, 220, 680, 620), 16, fill=(15, 23, 42, 240), outline=(51, 65, 85, 220), width=1)
    draw.text((54, 240), "9 มิติการกรองข้อมูลที่ทำงานประสานกัน", font=font_title, fill=(255, 255, 255))
    
    filter_tags = [
        ("1. ปี พ.ศ. (ปีลงทะเบียน)", "2567, 2568, 2569", (59, 130, 246)),
        ("2. เดือน (เดือนที่สมัคร)", "มกราคม - ธันวาคม", (14, 165, 233)),
        ("3. เขตสุขภาพ", "เขต 1 ถึง เขต 13", (6, 182, 212)),
        ("4. จังหวัด (77 จังหวัด)", "เชื่อมโยงกับแผนที่ GIS", (16, 185, 129)),
        ("5. อำเภอ (Cascade อัจฉริยะ)", "อัปเดตตามจังหวัดอัตโนมัติ", (34, 197, 94)),
        ("6. ตำบล (Cascade อัจฉริยะ)", "อัปเดตตามอำเภออัตโนมัติ", (132, 204, 22)),
        ("7. สังกัด", "สป., อปท., DMS, อบจ.", (245, 158, 11)),
        ("8. ระดับสถานพยาบาล", "รพช., รพ.สต., รพท., รพศ.", (249, 115, 22)),
        ("9. ตำแหน่งงาน & หน่วยบริการ", "21 กลุ่มตำแหน่ง / 2,911 แห่ง", (168, 85, 247)),
    ]
    
    fy = 280
    for idx, (fname, fsub, fcol) in enumerate(filter_tags):
        # Staggered entry animation
        if et > (idx / 12.0):
            draw_rounded_rect(draw, (54, fy, 656, fy + 32), 6, fill=(30, 41, 59, 220), outline=fcol, width=1)
            draw.text((68, fy + 7), "✔", font=font_xs, fill=fcol)
            draw.text((90, fy + 6), fname, font=font_sm, fill=(255, 255, 255))
            draw.text((380, fy + 7), fsub, font=font_xs, fill=(148, 163, 184))
        fy += 36
        
    # Right Card: Thailand Interactive Map Simulation
    draw_rounded_rect(draw, (710, 220, 1250, 620), 16, fill=(15, 23, 42, 240), outline=(51, 65, 85, 220), width=1)
    draw.text((734, 240), "🗺️ แผนที่ประเทศไทย Leaflet GIS", font=font_title, fill=(255, 255, 255))
    draw.text((734, 272), "คลิกจังหวัดเพื่อดูสัดส่วน รพ. และกรองทั้งแดชบอร์ด", font=font_subtitle, fill=(148, 163, 184))
    
    # Graphic map region nodes
    map_nodes = [
        {"name": "เขต 1 (ภาคเหนือบน)", "x": 860, "y": 340, "users": 382},
        {"name": "เขต 4 (ภาคกลาง)", "x": 920, "y": 420, "users": 415},
        {"name": "เขต 7 (อีสานกลาง)", "x": 1050, "y": 390, "users": 490},
        {"name": "เขต 8 (อีสานบน)", "x": 1080, "y": 330, "users": 368},
        {"name": "เขต 11 (ภาคใต้บน)", "x": 890, "y": 510, "users": 342},
        {"name": "เขต 13 (กทม.)", "x": 950, "y": 460, "users": 414},
    ]
    
    pulse_map = math.sin(frame * 0.25) * 6
    for node in map_nodes:
        nx, ny = node["x"], node["y"]
        # Outer pulsing radar ring
        draw.ellipse([nx - 14 - pulse_map, ny - 14 - pulse_map, nx + 14 + pulse_map, ny + 14 + pulse_map], outline=(56, 189, 248, 120), width=1)
        # Inner node
        draw.ellipse([nx - 8, ny - 8, nx + 8, ny + 8], fill=(59, 130, 246), outline=(255, 255, 255), width=2)
        # Label
        draw.text((nx + 14, ny - 8), f"{node['name']}: {node['users']} คน", font=font_xs, fill=(226, 232, 240))

def render_scene_4(draw, frame):
    # Scene 4: 5 Table Tabs & CSV Export (360-480)
    t = (frame - 360) / 120.0
    et = ease_out_cubic(t)
    
    # Section Header
    draw_rounded_rect(draw, (30, 94, 250, 126), 16, fill=(245, 158, 11, 35), outline=(245, 158, 11, 120), width=1)
    draw.text((45, 101), "📋 ตารางสรุป 5 แท็บ & ส่งออก", font=font_badge, fill=(251, 191, 36))
    draw.text((30, 136), "ตารางวิเคราะห์เชิงลึก 5 มุมมอง และการส่งออกข้อมูล CSV", font=font_title_lg, fill=(255, 255, 255))
    draw.text((30, 180), "รองรับการดูรายบุคคล รายเขตสุขภาพ รายจังหวัด หน่วยบริการ และกลุ่มตำแหน่งงาน พร้อมปุ่ม Export", font=font_subtitle, fill=(148, 163, 184))
    
    # Table Card
    draw_rounded_rect(draw, (30, 220, 1250, 620), 16, fill=(15, 23, 42, 240), outline=(51, 65, 85, 220), width=1)
    
    # Tab switcher simulation
    tabs = [
        ("👤 ผู้ใช้งานรายบุคคล (4,205)", True),
        ("🏛️ สรุปรายเขตสุขภาพ (13)", False),
        ("🗺️ สรุปรายจังหวัด (77)", False),
        ("🏥 หน่วยบริการ (2,911)", False),
        ("💼 ตำแหน่งงาน (21)", False),
    ]
    
    tx = 54
    for tname, is_act in tabs:
        tw = 210
        if is_act:
            draw_rounded_rect(draw, (tx, 240, tx + tw, 276), 8, fill=(30, 58, 138), outline=(59, 130, 246), width=1)
            draw.text((tx + 12, 248), tname, font=font_badge, fill=(255, 255, 255))
        else:
            draw_rounded_rect(draw, (tx, 240, tx + tw, 276), 8, fill=(30, 41, 59))
            draw.text((tx + 12, 248), tname, font=font_xs, fill=(148, 163, 184))
        tx += tw + 14
        
    # Table Header Row
    draw_rounded_rect(draw, (54, 292, 1226, 326), 6, fill=(30, 41, 59))
    draw.text((70, 300), "ลำดับ", font=font_xs, fill=(148, 163, 184))
    draw.text((130, 300), "ชื่อสถานพยาบาล / หน่วยบริการ", font=font_xs, fill=(148, 163, 184))
    draw.text((450, 300), "จังหวัด / เขตสุขภาพ", font=font_xs, fill=(148, 163, 184))
    draw.text((650, 300), "สังกัด", font=font_xs, fill=(148, 163, 184))
    draw.text((800, 300), "ตำแหน่งงาน", font=font_xs, fill=(148, 163, 184))
    draw.text((1050, 300), "สถานะการใช้งาน", font=font_xs, fill=(148, 163, 184))
    
    # Table Rows
    sample_rows = [
        ("1", "โรงพยาบาลเชียงรายประชานุเคราะห์", "เชียงราย (เขต 1)", "สป. (กระทรวง สธ.)", "แพทย์ / นายแพทย์", "Active 🟢"),
        ("2", "รพ.สต. บ้านหนองหอย", "ขอนแก่น (เขต 7)", "อปท. (ท้องถิ่น)", "พยาบาลวิชาชีพ", "Active 🟢"),
        ("3", "โรงพยาบาลชลบุรี", "ชลบุรี (เขต 6)", "สป. (กระทรวง สธ.)", "เภสัชกร", "Active 🟢"),
        ("4", "รพ.สต. ทุ่งหวัง", "สงขลา (เขต 12)", "อบจ. สงขลา", "นักวิชาการสาธารณสุข", "Active 🟢"),
        ("5", "สถาบันสุขภาพเด็กแห่งชาติฯ", "กรุงเทพฯ (เขต 13)", "กรมการแพทย์ (DMS)", "ทันตแพทย์", "Active 🟢"),
    ]
    
    ry = 338
    for row in sample_rows:
        draw_rounded_rect(draw, (54, ry, 1226, ry + 36), 4, fill=(15, 23, 42, 180))
        draw.text((70, ry + 8), row[0], font=font_xs, fill=(203, 213, 225))
        draw.text((130, ry + 8), row[1], font=font_xs, fill=(255, 255, 255))
        draw.text((450, ry + 8), row[2], font=font_xs, fill=(148, 163, 184))
        draw.text((650, ry + 8), row[3], font=font_xs, fill=(56, 189, 248))
        draw.text((800, ry + 8), row[4], font=font_xs, fill=(203, 213, 225))
        draw.text((1050, ry + 8), row[5], font=font_xs, fill=(52, 211, 153))
        ry += 42
        
    # Big Export CSV Showcase Button
    btn_pulse = math.sin(frame * 0.3) * 0.05 + 1.0
    btn_w = int(320 * btn_pulse)
    btn_x = 640 - (btn_w // 2)
    draw_rounded_rect(draw, (btn_x, 550, btn_x + btn_w, 600), 12, fill=(16, 185, 129), outline=(52, 211, 153), width=2)
    draw.text((btn_x + 36, 560), "📥 ส่งออกรายงาน CSV (Export Ready)", font=font_badge, fill=(255, 255, 255))

def generate_video():
    print(f"Generating DMS Overview Video: {TOTAL_FRAMES} frames ({DURATION_SEC}s @ {FPS}fps)...")
    
    ffmpeg_cmd = [
        FFMPEG_PATH,
        "-y",
        "-f", "rawvideo",
        "-vcodec", "rawvideo",
        "-s", f"{WIDTH}x{HEIGHT}",
        "-pix_fmt", "rgb24",
        "-r", str(FPS),
        "-i", "-",
        "-c:v", "h264_mf",
        "-b:v", "3000k",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        OUTPUT_VIDEO
    ]
    
    proc = subprocess.Popen(
        ffmpeg_cmd,
        stdin=subprocess.PIPE,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE
    )
    
    for f in range(TOTAL_FRAMES):
        # Create base canvas with dark navy background
        img = Image.new("RGB", (WIDTH, HEIGHT), (11, 16, 27))
        draw = ImageDraw.Draw(img)
        
        # Subtle horizontal grid line background
        for y_line in range(0, HEIGHT, 40):
            draw.line([(0, y_line), (WIDTH, y_line)], fill=(15, 23, 42), width=1)
            
        # Draw Top Navigation & Status
        draw_top_nav(draw, f)
        
        # Draw Active Scene
        if f < 120:
            render_scene_1(draw, f)
        elif f < 240:
            render_scene_2(draw, f)
        elif f < 360:
            render_scene_3(draw, f)
        else:
            render_scene_4(draw, f)
            
        # Draw Bottom Chapter Bar & Progress Line
        draw_bottom_bar(draw, f)
        
        # Pipe frame bytes
        proc.stdin.write(img.tobytes())
        
        if (f + 1) % 60 == 0:
            print(f"Rendered {f + 1}/{TOTAL_FRAMES} frames ({(f + 1)/FPS:.1f}s)...")
            
    proc.stdin.close()
    err = proc.stderr.read().decode('utf-8', errors='ignore')
    proc.wait()
    
    if proc.returncode == 0:
        file_size = os.path.getsize(OUTPUT_VIDEO) / (1024 * 1024)
        print(f"Success! Video written to {OUTPUT_VIDEO} ({file_size:.2f} MB)")
    else:
        print(f"FFmpeg Error (exit code {proc.returncode}):\n{err}")
        sys.exit(1)

if __name__ == "__main__":
    generate_video()
