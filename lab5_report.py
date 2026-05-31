"""
Лабораторная работа №5 — Гравиметрический метод анализа
Определение содержания SO₄²⁻ в растворе гравиметрическим методом (осаждение BaSO₄)
"""

import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np

from docx import Document
from docx.shared import Pt, Cm, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import copy

# ─────────────────────────────────────────────
#  ДАННЫЕ
# ─────────────────────────────────────────────

# Часть А: обезвоживание BaCl₂·2H₂O
m_hydrate   = 0.23805   # г  навеска гидрата
delta_m     = 0.0296    # г  потеря при сушке (вода)
M_hydrate   = 244.26    # г/моль  BaCl₂·2H₂O
M_BaCl2     = 208.23    # г/моль  BaCl₂
M_H2O       = 18.015    # г/моль  H₂O
box_no      = 33
m_box_full  = 14.6645   # г  бюкс с навеской до сушки
m_dried     = m_hydrate - delta_m  # г  навеска после сушки

# Теоретическое содержание H₂O
w_H2O_theor = 2 * M_H2O / M_hydrate * 100    # %
# Экспериментальное содержание H₂O
w_H2O_exp   = delta_m / m_hydrate * 100       # %
# Экспериментальная масса BaCl₂
m_BaCl2_exp = m_hydrate - delta_m             # г  = 0.2085

# Часть Б: осаждение BaSO₄, определение SO₄²⁻
M_BaSO4     = 233.39    # г/моль
M_SO4       = 96.06     # г/моль
m_navеska   = 0.5227    # г  навеска анализируемого образца
crucible_no = 22
m_crucible  = 18.7078   # г  масса тигля
m_after1    = 19.2020   # г  после 1-го прокаливания
m_after2    = 19.2011   # г  после 2-го прокаливания (расхождение ≤1 мг → принять)
m_BaSO4_exp = m_after2 - m_crucible   # г  = 0.4933

# Гравиметрический фактор
F = M_SO4 / M_BaSO4
# Содержание SO₄²⁻
w_SO4 = m_BaSO4_exp * F / m_navеska * 100     # %

# Объём H₂SO₄ (1 М), необходимый для осаждения
# n(BaSO₄)_теор = m_BaSO4_target/M_BaSO4 = 0.5/233.39
m_BaSO4_target = 0.5    # г
n_H2SO4 = m_BaSO4_target / M_BaSO4
V_H2SO4 = n_H2SO4 * 1000 / 1.0   # мл  при C=1 моль/л
V_H2SO4_excess = V_H2SO4 * 1.5   # с 50%-избытком

print("=== Результаты Лаб. 5 ===")
print(f"m(BaCl₂·2H₂O) навеска     = {m_hydrate:.5f} г")
print(f"Потеря при сушке Δm        = {delta_m:.4f} г")
print(f"w(H₂O) теор.               = {w_H2O_theor:.2f} %")
print(f"w(H₂O) эксп.               = {w_H2O_exp:.2f} %")
print(f"m(BaCl₂) эксп.             = {m_BaCl2_exp:.4f} г")
print(f"m(BaSO₄) осадок            = {m_BaSO4_exp:.4f} г")
print(f"w(SO₄²⁻)                   = {w_SO4:.2f} %")
print(f"V(H₂SO₄, 1M) расч.         = {V_H2SO4:.4f} мл → {V_H2SO4:.3f} мл")
print(f"V(H₂SO₄, 1M) с избытком    = {V_H2SO4_excess:.4f} мл")

# ─────────────────────────────────────────────
#  СОЗДАНИЕ ДОКУМЕНТА
# ─────────────────────────────────────────────

doc = Document()

# Поля
for section in doc.sections:
    section.top_margin    = Cm(2.0)
    section.bottom_margin = Cm(2.0)
    section.left_margin   = Cm(2.5)
    section.right_margin  = Cm(1.5)

def style_normal(doc):
    style = doc.styles['Normal']
    style.font.name = 'Times New Roman'
    style.font.size = Pt(14)
    return style

def add_heading(doc, text, level=1):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(text)
    run.bold = True
    run.font.size = Pt(14 if level > 1 else 16)
    run.font.name = 'Times New Roman'
    return p

def add_para(doc, text, bold=False, indent=True):
    p = doc.add_paragraph()
    if indent:
        p.paragraph_format.first_line_indent = Cm(1.25)
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    run = p.add_run(text)
    run.font.name = 'Times New Roman'
    run.font.size = Pt(14)
    run.bold = bold
    return p

def add_formula(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(text)
    run.font.name = 'Times New Roman'
    run.font.size = Pt(14)
    run.italic = True
    return p

style_normal(doc)

# ── Шапка ──
add_heading(doc, 'ОТЧЁТ ПО ЛАБОРАТОРНОЙ РАБОТЕ №5', level=1)
add_heading(doc, 'Гравиметрический метод анализа', level=2)
add_heading(doc, 'Определение содержания сульфат-ионов в растворе', level=2)
doc.add_paragraph()

# ── 1. Цель ──
add_para(doc, '1. Цель работы', bold=True, indent=False)
add_para(doc,
    'Освоить гравиметрический метод количественного анализа на примере '
    'определения массовой доли сульфат-ионов SO₄²⁻ в анализируемом образце '
    'путём осаждения в форме BaSO₄ и последующего прокаливания осадка.')

# ── 2. Теоретическая часть ──
add_para(doc, '2. Теоретическая часть', bold=True, indent=False)
add_para(doc,
    'Гравиметрический анализ основан на точном измерении массы вещества или '
    'его соединения с известным составом. Метод включает четыре основных этапа: '
    '1) приготовление навески и растворение образца; 2) осаждение определяемого '
    'компонента в виде малорастворимого соединения; 3) фильтрование, промывание '
    'и высушивание (прокаливание) осадка; 4) взвешивание и расчёт результата.')
add_para(doc,
    'Сульфат-ионы осаждают хлоридом бария в кислой среде по реакции:')
add_formula(doc, 'Ba²⁺  +  SO₄²⁻  →  BaSO₄↓')
add_para(doc,
    'Осадок сульфата бария BaSO₄ (Mr = 233,39) не растворим в воде и кислотах, '
    'что обеспечивает высокую точность определения. Гравиметрический фактор:')
add_formula(doc, f'F = M(SO₄²⁻) / M(BaSO₄) = {M_SO4:.2f} / {M_BaSO4:.2f} = {F:.5f}')

# ── 3. Приборы и реагенты ──
add_para(doc, '3. Приборы и реагенты', bold=True, indent=False)
add_para(doc,
    'Аналитические весы, электрическая муфельная печь, сушильный шкаф, '
    'воронки стеклянные, беззольные фильтры «синяя лента», тигли фарфоровые, '
    'эксикатор, пипетки, стаканы химические на 250–400 мл.')
add_para(doc,
    'Реагенты: раствор BaCl₂ (0,1 М), раствор H₂SO₄ (разбавленный, 1 М), '
    'соляная кислота (2–3 мл конц. HCl), промывная жидкость (горячая '
    'дистиллированная вода), раствор AgNO₃ (для проверки на Cl⁻).')

# ── 4. Ход работы ──
add_para(doc, '4. Ход работы', bold=True, indent=False)
add_para(doc, '4.1. Приготовление раствора H₂SO₄ и расчёт объёма', bold=False, indent=False)
add_para(doc,
    f'Для осаждения BaSO₄ с расчётной навеской 0,5 г рассчитан объём '
    f'раствора H₂SO₄ (C = 1 моль/л), необходимый для количественного осаждения:')
add_formula(doc,
    f'n(H₂SO₄) = m(BaSO₄)теор / M(BaSO₄) = {m_BaSO4_target:.1f} / {M_BaSO4:.2f} = {n_H2SO4:.5f} моль')
add_formula(doc,
    f'V(H₂SO₄) = n / C · 1000 = {n_H2SO4:.5f} / 1,0 · 1000 = {V_H2SO4:.3f} мл')
add_para(doc,
    f'С учётом 50%-го избытка осадителя (для обеспечения полноты осаждения):')
add_formula(doc,
    f'V₁,₅(H₂SO₄) = {V_H2SO4:.3f} · 1,5 = {V_H2SO4_excess:.4f} мл ≈ {V_H2SO4_excess:.2f} мл')

add_para(doc, '4.2. Контроль обезвоживания BaCl₂·2H₂O', bold=False, indent=False)
add_para(doc,
    f'Для приготовления раствора осадителя BaCl₂ была приготовлена навеска '
    f'гидрата: m(BaCl₂·2H₂O) = {m_hydrate:.5f} г (люкс №{box_no}, '
    f'масса бюкса с навеской {m_box_full:.4f} г). '
    f'После высушивания в сушильном шкафу масса навеска уменьшилась на '
    f'Δm = {delta_m:.4f} г (ушла гигроскопическая влага).')
add_formula(doc,
    f'w(H₂O)эксп = Δm / m(BaCl₂·2H₂O) · 100% = {delta_m:.4f} / {m_hydrate:.5f} · 100% = {w_H2O_exp:.2f}%')
add_formula(doc,
    f'w(H₂O)теор = 2·M(H₂O) / M(BaCl₂·2H₂O) · 100% = 2·{M_H2O:.3f} / {M_hydrate:.2f} · 100% = {w_H2O_theor:.2f}%')
add_para(doc,
    f'Масса безводного BaCl₂ в навеске:')
add_formula(doc,
    f'm(BaCl₂) = m(BaCl₂·2H₂O) − Δm = {m_hydrate:.4f} − {delta_m:.4f} = {m_BaCl2_exp:.4f} г '
    f'(теоретическая ≈ 0,2000 г)')

add_para(doc, '4.3. Осаждение и фильтрование BaSO₄', bold=False, indent=False)
add_para(doc,
    f'Навеска анализируемого образца: m = {m_navеska:.4f} г. '
    f'Навеску растворили в большом стакане, добавили 2–3 мл конц. HCl '
    f'и разбавили водой до ~150 мл. В малый цилиндр отмерили '
    f'{V_H2SO4_excess:.2f} мл H₂SO₄ (1 М) и разбавили до 30 мл. '
    f'Осадитель добавляли медленно по каплям при перемешивании и нагревании, '
    f'после чего раствор оставили для созревания осадка.')
add_para(doc,
    'Осадок отфильтровали через беззольный фильтр («синяя лента»), '
    'промывая горячей водой тремя порциями. Полноту промывания контролировали '
    'по реакции промывной жидкости с AgNO₃ в кислой среде (HNO₃): '
    'отсутствие осадка AgCl свидетельствует об удалении Cl⁻.')

add_para(doc, '4.4. Прокаливание и взвешивание', bold=False, indent=False)
add_para(doc,
    f'Фильтр с осадком поместили в предварительно взвешенный тигель '
    f'№{crucible_no} (m = {m_crucible:.4f} г) и прокалили в муфельной '
    f'печи до постоянной массы.')

# Таблица взвешиваний
doc.add_paragraph()
tbl = doc.add_table(rows=4, cols=2)
tbl.style = 'Table Grid'
tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
headers = ['Параметр', 'Значение']
rows_data = [
    ['Масса тигля (пустой), г', f'{m_crucible:.4f}'],
    [f'Масса тигля + BaSO₄ (1-е прокаливание), г', f'{m_after1:.4f}'],
    [f'Масса тигля + BaSO₄ (2-е прокаливание), г', f'{m_after2:.4f}'],
]
for i, (k, v) in enumerate([('Параметр','Значение')] + rows_data):
    row = tbl.rows[i]
    for j, cell_text in enumerate([k, v]):
        cell = row.cells[j]
        cell.text = cell_text
        for para in cell.paragraphs:
            for run in para.runs:
                run.font.name = 'Times New Roman'
                run.font.size = Pt(12)
                if i == 0:
                    run.bold = True
doc.add_paragraph()

add_para(doc,
    f'Расхождение между двумя прокаливаниями составляет '
    f'{abs(m_after1 - m_after2)*1000:.1f} мг < 1 мг, '
    f'что соответствует критерию постоянной массы. '
    f'Принято значение после второго прокаливания.')

# ── 5. Расчёт результатов ──
add_para(doc, '5. Расчёт результатов', bold=True, indent=False)
add_formula(doc,
    f'm(BaSO₄) = m(тигель+осадок) − m(тигель) = {m_after2:.4f} − {m_crucible:.4f} = {m_BaSO4_exp:.4f} г')
add_para(doc, 'Массовая доля SO₄²⁻:')
add_formula(doc,
    f'w(SO₄²⁻) = m(BaSO₄) · F / m(навески) · 100%')
add_formula(doc,
    f'w(SO₄²⁻) = {m_BaSO4_exp:.4f} · {F:.5f} / {m_navеska:.4f} · 100% = {w_SO4:.2f}%')

# ── 6. Выводы ──
add_para(doc, '6. Выводы', bold=True, indent=False)
add_para(doc,
    f'Гравиметрическим методом определена массовая доля сульфат-ионов '
    f'в анализируемом образце: w(SO₄²⁻) = {w_SO4:.2f}%. '
    f'Масса осадка BaSO₄ составила {m_BaSO4_exp:.4f} г. '
    f'Расхождение между повторными прокаливаниями не превышает 1 мг, '
    f'что подтверждает достижение постоянной массы и корректность результата.')

out_path = '/home/user/-Calradia/exports/Lab5_Gravimetry.docx'
os.makedirs(os.path.dirname(out_path), exist_ok=True)
doc.save(out_path)
print(f"\nСохранено: {out_path}")
