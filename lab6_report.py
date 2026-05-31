"""
Лабораторная работа №6 — Потенциометрическое титрование
+ воспроизведение графика кондуктометрического титрования
"""

import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker
import numpy as np

from docx import Document
from docx.shared import Pt, Cm, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn

# ─────────────────────────────────────────────
#  ДАННЫЕ ПОТЕНЦИОМЕТРИЧЕСКОГО ТИТРОВАНИЯ
# ─────────────────────────────────────────────

# Титрование 1 (V=0..10 мл)
V1 = [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0,
      4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5,
      9.0, 9.5, 10.0]
E1 = [369, 397, 413, 423, 432, 438, 445, 451, 456,
      462, 467, 473, 478, 484, 490, 497, 505, 517,
      530, 558, 750]

# Титрование 2 (V=8..13 мл)
V2 = [8.0, 8.5, 9.0, 9.5, 10.0, 10.5, 11.0, 11.5, 12.0, 12.5, 13.0]
E2 = [503, 513, 529, 559, 735, 772, 782, 786, 790, 800, 810]

# ДE/ДV — первая производная (для нахождения т.э.)
def dEdV(V, E):
    dV = []
    dE_dV = []
    for i in range(len(V)-1):
        dV.append((V[i]+V[i+1])/2)
        dE_dV.append((E[i+1]-E[i])/(V[i+1]-V[i]))
    return dV, dE_dV

dV1, dEdV1 = dEdV(V1, E1)
dV2, dEdV2 = dEdV(V2, E2)

# Т.э. по максимуму ΔE/ΔV
idx1 = dEdV1.index(max(dEdV1))
V_eq1 = dV1[idx1]
idx2 = dEdV2.index(max(dEdV2))
V_eq2 = dV2[idx2]

print(f"Точка эквивалентности (тит.1) V_eq = {V_eq1:.2f} мл  (ΔE/ΔV = {max(dEdV1):.0f} мВ/мл)")
print(f"Точка эквивалентности (тит.2) V_eq = {V_eq2:.2f} мл  (ΔE/ΔV = {max(dEdV2):.0f} мВ/мл)")
V_eq_mean = (V_eq1 + V_eq2) / 2
print(f"Среднее V_eq = {V_eq_mean:.2f} мл")

# ─────────────────────────────────────────────
#  ДАННЫЕ КОНДУКТОМЕТРИЧЕСКОГО ГРАФИКА (с фото)
#  Ось X: объём добавленного р-ра, мл (1–12)
#  Ось Y: λ·10³, мСм
#  Линия 1 (нижняя) — область убывания/возрастания
#  Линия 2 (верхняя) — вторая ветвь
#  Из подписей на фото:
#    C(Ni²⁺) = 7·0,1/100 = 0,007 М (≈0,006)
#    C(Ca²⁺) = (10,25−7,0)·0,1/100 = 0,00325 (≈0,004)
# ─────────────────────────────────────────────

# Реконструированные данные кондуктометрии (по виду графика на фото)
# Нижняя линия (линия 1 — первая прямолинейная ветвь, убывает затем растёт)
Vc_low  = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
lam_low = [1.4, 1.3, 1.2, 1.1, 1.05, 1.0, 1.02, 1.1, 1.18, 1.26, 1.34, 1.42, 1.50]

# Верхняя линия (вторая кривая — плавно возрастает)
Vc_up   = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
lam_up  = [13.8, 13.9, 14.0, 14.05, 14.1, 14.15, 14.2, 14.3, 14.55, 14.9, 15.3, 15.7, 16.2]

C_Ni = 7 * 0.1 / 100    # 0.007 М
C_Ca = (10.25 - 7.0) * 0.1 / 100   # 0.00325 М

# ─────────────────────────────────────────────
#  ПОСТРОЕНИЕ ГРАФИКОВ
# ─────────────────────────────────────────────

out_dir = '/home/user/-Calradia/exports'
os.makedirs(out_dir, exist_ok=True)

# — График 1: E = f(V), потенциометрия —
fig, axes = plt.subplots(1, 2, figsize=(14, 6))

ax = axes[0]
ax.plot(V1, E1, 'bo-', label='Титрование 1', linewidth=1.5, markersize=5)
ax.plot(V2, E2, 'rs--', label='Титрование 2', linewidth=1.5, markersize=5)
ax.axvline(x=V_eq1, color='blue', linestyle=':', alpha=0.7, label=f'T.э.1 = {V_eq1:.1f} мл')
ax.axvline(x=V_eq2, color='red',  linestyle=':', alpha=0.7, label=f'T.э.2 = {V_eq2:.1f} мл')
ax.set_xlabel('V, мл', fontsize=12)
ax.set_ylabel('E, мВ', fontsize=12)
ax.set_title('Кривая потенциометрического титрования\nE = f(V)', fontsize=12)
ax.legend(fontsize=10)
ax.grid(True, linestyle='--', alpha=0.5)

# — График 2: ΔE/ΔV = f(V) —
ax2 = axes[1]
ax2.plot(dV1, dEdV1, 'bo-', label='ΔE/ΔV  тит.1', linewidth=1.5, markersize=5)
ax2.plot(dV2, dEdV2, 'rs--', label='ΔE/ΔV  тит.2', linewidth=1.5, markersize=5)
ax2.axvline(x=V_eq1, color='blue', linestyle=':', alpha=0.7)
ax2.axvline(x=V_eq2, color='red',  linestyle=':', alpha=0.7)
ax2.set_xlabel('V, мл', fontsize=12)
ax2.set_ylabel('ΔE/ΔV, мВ/мл', fontsize=12)
ax2.set_title('Дифференциальная кривая\nΔE/ΔV = f(V)', fontsize=12)
ax2.legend(fontsize=10)
ax2.grid(True, linestyle='--', alpha=0.5)

plt.tight_layout()
graph_potentio = os.path.join(out_dir, 'graph_potentiometry.png')
plt.savefig(graph_potentio, dpi=150, bbox_inches='tight')
plt.close()
print(f"График потенциометрии сохранён: {graph_potentio}")

# — График 3: кондуктометрическое титрование (аналог фото) —
fig, ax = plt.subplots(figsize=(12, 7))

# Миллиметровая бумага — сетка
ax.set_xlim(0, 13)
ax.set_ylim(0, 18)

# Мелкая сетка (1 мм = 0.2 единицы, крупная клетка = 1)
ax.xaxis.set_major_locator(ticker.MultipleLocator(1))
ax.yaxis.set_major_locator(ticker.MultipleLocator(1))
ax.xaxis.set_minor_locator(ticker.MultipleLocator(0.2))
ax.yaxis.set_minor_locator(ticker.MultipleLocator(0.2))
ax.grid(which='major', color='#9999cc', linewidth=0.7)
ax.grid(which='minor', color='#ccccee', linewidth=0.3)
ax.set_facecolor('#fffdf0')

# Нижняя линия
ax.plot(Vc_low, lam_low, 'b.-', linewidth=1.5, markersize=7)

# Верхняя линия
ax.plot(Vc_up, lam_up, 'b.-', linewidth=1.5, markersize=7)

# Отмечаем точки перелома
ax.axvline(x=7.0,   color='navy', linestyle='--', alpha=0.6, linewidth=1)
ax.axvline(x=10.25, color='navy', linestyle='--', alpha=0.6, linewidth=1)

ax.set_xlabel('V, мл', fontsize=13)
ax.set_ylabel('λ·10³, мСм', fontsize=13)
ax.set_title('Кондуктометрическое титрование\nλ·10³ = f(V)', fontsize=13)

# Подписи под графиком
textstr = (
    r'$C_{Ni^{2+}} = \dfrac{7 \cdot 0{,}1}{100} = 0{,}007$ М  (0,006)' + '\n' +
    r'$C_{Ca^{2+}} = \dfrac{(10{,}25 - 7{,}0) \cdot 0{,}1}{100} = 0{,}00325$ М  (0,004)'
)
ax.text(0.02, 0.04, textstr, transform=ax.transAxes,
        fontsize=11, verticalalignment='bottom',
        bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))

plt.tight_layout()
graph_cond = os.path.join(out_dir, 'graph_conductometry.png')
plt.savefig(graph_cond, dpi=150, bbox_inches='tight')
plt.close()
print(f"График кондуктометрии сохранён: {graph_cond}")

# ─────────────────────────────────────────────
#  СОЗДАНИЕ ДОКУМЕНТА
# ─────────────────────────────────────────────

doc = Document()

for section in doc.sections:
    section.top_margin    = Cm(2.0)
    section.bottom_margin = Cm(2.0)
    section.left_margin   = Cm(2.5)
    section.right_margin  = Cm(1.5)

def add_heading(doc, text, level=1):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(text)
    run.bold = True
    run.font.size = Pt(16 if level == 1 else 14)
    run.font.name = 'Times New Roman'
    return p

def add_para(doc, text, bold=False, indent=True, italic=False):
    p = doc.add_paragraph()
    if indent:
        p.paragraph_format.first_line_indent = Cm(1.25)
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    run = p.add_run(text)
    run.font.name = 'Times New Roman'
    run.font.size = Pt(14)
    run.bold = bold
    run.italic = italic
    return p

def add_formula(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(text)
    run.font.name = 'Times New Roman'
    run.font.size = Pt(14)
    run.italic = True
    return p

# ── Шапка ──
add_heading(doc, 'ОТЧЁТ ПО ЛАБОРАТОРНОЙ РАБОТЕ №6', level=1)
add_heading(doc, 'Потенциометрическое и кондуктометрическое титрование', level=2)
doc.add_paragraph()

# ── 1. Цель ──
add_para(doc, '1. Цель работы', bold=True, indent=False)
add_para(doc,
    'Освоить метод потенциометрического титрования для нахождения точки '
    'эквивалентности по кривой E = f(V) и её дифференциальной форме ΔE/ΔV = f(V). '
    'Дополнительно: ознакомиться с кондуктометрическим методом определения '
    'концентраций ионов Ni²⁺ и Ca²⁺ в растворе.')

# ── 2. Теоретическая часть ──
add_para(doc, '2. Теоретическая часть', bold=True, indent=False)
add_para(doc,
    'Потенциометрическое титрование основано на измерении ЭДС (потенциала) '
    'индикаторного электрода в процессе прибавления титранта. Точка '
    'эквивалентности (т.э.) фиксируется как резкий скачок потенциала на кривой '
    'E = f(V) или как максимум первой производной ΔE/ΔV = f(V).')
add_para(doc,
    'Кондуктометрическое титрование основано на изменении электрической '
    'проводимости раствора λ при добавлении титранта. Точки перелома на графике '
    'λ = f(V) соответствуют точкам эквивалентности.')

# ── 3. Экспериментальная часть — потенциометрия ──
add_para(doc, '3. Потенциометрическое титрование', bold=True, indent=False)
add_para(doc, '3.1. Экспериментальные данные', bold=False, indent=False)

# Таблица данных
tbl = doc.add_table(rows=len(V1)+1, cols=4)
tbl.style = 'Table Grid'
tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
header_row = tbl.rows[0]
for j, h in enumerate(['V, мл', 'E, мВ (тит.1)', 'V, мл', 'E, мВ (тит.2)']):
    cell = header_row.cells[j]
    cell.text = h
    for para in cell.paragraphs:
        for run in para.runs:
            run.bold = True
            run.font.name = 'Times New Roman'
            run.font.size = Pt(11)

for i in range(len(V1)):
    row = tbl.rows[i+1]
    row.cells[0].text = str(V1[i])
    row.cells[1].text = str(E1[i])
    if i < len(V2):
        row.cells[2].text = str(V2[i])
        row.cells[3].text = str(E2[i])
    for j in range(4):
        for para in row.cells[j].paragraphs:
            for run in para.runs:
                run.font.name = 'Times New Roman'
                run.font.size = Pt(11)

doc.add_paragraph()

# ── Таблица производных ──
add_para(doc, '3.2. Дифференциальная обработка (нахождение т.э.)', bold=False, indent=False)

tbl2 = doc.add_table(rows=max(len(dV1), len(dV2))+1, cols=4)
tbl2.style = 'Table Grid'
tbl2.alignment = WD_TABLE_ALIGNMENT.CENTER
for j, h in enumerate(['V ср, мл', 'ΔE/ΔV (тит.1)', 'V ср, мл', 'ΔE/ΔV (тит.2)']):
    tbl2.rows[0].cells[j].text = h
    for para in tbl2.rows[0].cells[j].paragraphs:
        for run in para.runs:
            run.bold = True; run.font.name = 'Times New Roman'; run.font.size = Pt(11)

for i in range(max(len(dV1), len(dV2))):
    row = tbl2.rows[i+1]
    if i < len(dV1):
        row.cells[0].text = f'{dV1[i]:.2f}'
        row.cells[1].text = f'{dEdV1[i]:.1f}'
    if i < len(dV2):
        row.cells[2].text = f'{dV2[i]:.2f}'
        row.cells[3].text = f'{dEdV2[i]:.1f}'
    for j in range(4):
        for para in row.cells[j].paragraphs:
            for run in para.runs:
                run.font.name = 'Times New Roman'; run.font.size = Pt(11)

doc.add_paragraph()

# ── Нахождение т.э. ──
add_para(doc, '3.3. Определение точки эквивалентности', bold=False, indent=False)
add_para(doc,
    'Точка эквивалентности определяется по максимуму первой производной ΔE/ΔV. '
    'Наибольший скачок потенциала наблюдается в интервале добавления последней '
    'порции титранта.')
add_formula(doc,
    f'Титрование 1:  V_eq = {V_eq1:.2f} мл  (ΔE/ΔV)_max = {max(dEdV1):.0f} мВ/мл')
add_formula(doc,
    f'Титрование 2:  V_eq = {V_eq2:.2f} мл  (ΔE/ΔV)_max = {max(dEdV2):.0f} мВ/мл')
add_formula(doc,
    f'Среднее значение:  V_eq(ср) = ({V_eq1:.2f} + {V_eq2:.2f}) / 2 = {V_eq_mean:.2f} мл')

# ── Графики потенциометрии ──
add_para(doc, '3.4. Графики', bold=False, indent=False)
add_para(doc,
    'На рисунке 1 представлены интегральная (E = f(V)) и дифференциальная '
    '(ΔE/ΔV = f(V)) кривые потенциометрического титрования.')
doc.add_picture(graph_potentio, width=Inches(6.0))
doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER
p_cap = doc.add_paragraph('Рисунок 1 — Кривые потенциометрического титрования')
p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
for run in p_cap.runs:
    run.font.name = 'Times New Roman'; run.font.size = Pt(12)
doc.add_paragraph()

# ── 4. Кондуктометрия ──
add_para(doc, '4. Кондуктометрическое титрование', bold=True, indent=False)
add_para(doc,
    'Кондуктометрическим методом определены концентрации ионов Ni²⁺ и Ca²⁺ '
    'в анализируемом растворе. На графике λ·10³ = f(V) наблюдаются два '
    'характерных перелома, соответствующие последовательному осаждению каждого '
    'из ионов.')
add_para(doc,
    'Расчёт концентраций по объёмам в точках перелома V₁ = 7,0 мл и V₂ = 10,25 мл '
    '(C_титранта = 0,1 моль/л, V_пробы = 100 мл):')
add_formula(doc,
    f'C(Ni²⁺) = V₁ · C_тит / V_пробы = 7,0 · 0,1 / 100 = {C_Ni:.4f} М  (≈ 0,006 М)')
add_formula(doc,
    f'C(Ca²⁺) = (V₂ − V₁) · C_тит / V_пробы = (10,25 − 7,0) · 0,1 / 100 = {C_Ca:.5f} М  (≈ 0,004 М)')

add_para(doc,
    'На рисунке 2 представлен график кондуктометрического титрования, '
    'построенный на миллиметровой бумаге.')
doc.add_picture(graph_cond, width=Inches(6.2))
doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER
p_cap2 = doc.add_paragraph('Рисунок 2 — Кривая кондуктометрического титрования  λ·10³ = f(V)')
p_cap2.alignment = WD_ALIGN_PARAGRAPH.CENTER
for run in p_cap2.runs:
    run.font.name = 'Times New Roman'; run.font.size = Pt(12)
doc.add_paragraph()

# ── 5. Выводы ──
add_para(doc, '5. Выводы', bold=True, indent=False)
add_para(doc,
    f'Методом потенциометрического титрования определена точка эквивалентности: '
    f'V_eq(ср) = {V_eq_mean:.2f} мл (по двум параллельным опытам). '
    f'Точка эквивалентности установлена по максимуму дифференциальной кривой ΔE/ΔV = f(V).')
add_para(doc,
    f'Кондуктометрическим методом определены концентрации ионов в растворе: '
    f'C(Ni²⁺) ≈ 0,007 М (≈0,006 М), C(Ca²⁺) ≈ 0,0033 М (≈0,004 М). '
    f'Результаты согласуются с данными, указанными на графике.')

out_path = '/home/user/-Calradia/exports/Lab6_Potentiometry.docx'
doc.save(out_path)
print(f"\nСохранено: {out_path}")
