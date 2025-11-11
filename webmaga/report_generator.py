"""
Módulo para generar reportes en PDF y Word
Utiliza las plantillas PlantillaPDF.pdf y PlantillaWord.docx
"""

import os
from datetime import datetime
from django.conf import settings
from django.http import HttpResponse
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
from io import BytesIO

# Intentar importar xhtml2pdf (compatible con Windows)
try:
    from xhtml2pdf import pisa
    XHTML2PDF_AVAILABLE = True
except ImportError:
    XHTML2PDF_AVAILABLE = False
    # Intentar weasyprint como alternativa (requiere dependencias del sistema)
    try:
        import weasyprint
        WEASYPRINT_AVAILABLE = True
    except ImportError:
        WEASYPRINT_AVAILABLE = False


# Información del pie de página
FOOTER_EMAIL = "magabvpurulha@gmail.com"
FOOTER_UBICACION = "km 164.5, CA 14"


def get_template_path(template_name):
    """Obtiene la ruta completa de la plantilla"""
    return os.path.join(settings.BASE_DIR, template_name)


def format_date(date_str):
    """Formatea una fecha en formato legible"""
    if not date_str or date_str == '-':
        return '-'
    try:
        if isinstance(date_str, str):
            date_obj = datetime.strptime(date_str, '%Y-%m-%d')
        else:
            date_obj = date_str
        return date_obj.strftime('%d/%m/%Y')
    except:
        return str(date_str)


def format_table_word(table):
    """Formatea una tabla Word con bordes visibles y centrado"""
    try:
        # Centrar la tabla
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        
        # Agregar bordes a todas las celdas
        from docx.oxml import parse_xml
        from docx.oxml.ns import nsdecls
        
        # Definir bordes para la tabla
        tbl = table._tbl
        tblBorders = OxmlElement('w:tblBorders')
        
        for border_name in ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']:
            border = OxmlElement(f'w:{border_name}')
            border.set(qn('w:val'), 'single')
            border.set(qn('w:sz'), '4')
            border.set(qn('w:space'), '0')
            border.set(qn('w:color'), '000000')
            tblBorders.append(border)
        
        tblPr = tbl.tblPr
        if tblPr is None:
            tblPr = OxmlElement('w:tblPr')
            tbl.insert(0, tblPr)
        tblPr.append(tblBorders)
        
        # Agregar bordes a cada celda
        for row in table.rows:
            for cell in row.cells:
                tc = cell._tc
                tcPr = tc.tcPr
                if tcPr is None:
                    tcPr = OxmlElement('w:tcPr')
                    tc.insert(0, tcPr)
                
                tcBorders = OxmlElement('w:tcBorders')
                for border_name in ['top', 'left', 'bottom', 'right']:
                    border = OxmlElement(f'w:{border_name}')
                    border.set(qn('w:val'), 'single')
                    border.set(qn('w:sz'), '4')
                    border.set(qn('w:space'), '0')
                    border.set(qn('w:color'), '000000')
                    tcBorders.append(border)
                tcPr.append(tcBorders)
        
    except Exception as e:
        print(f"Advertencia al formatear tabla: {str(e)}")
    
    return table


def add_footer_word(doc):
    """Agrega pie de página al documento Word"""
    try:
        section = doc.sections[0]
        footer = section.footer
        
        # Limpiar footer existente - eliminar todos los párrafos
        for paragraph in list(footer.paragraphs):
            p = paragraph._element
            p.getparent().remove(p)
        
        # Crear párrafo para el pie de página
        footer_para = footer.add_paragraph()
        footer_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        
        # Agregar información
        footer_run = footer_para.add_run(f"Correo: {FOOTER_EMAIL} | Ubicación: {FOOTER_UBICACION}")
        footer_run.font.size = Pt(9)
        footer_run.font.color.rgb = RGBColor(128, 128, 128)
        
    except Exception as e:
        # Si hay error al agregar footer, no fallar completamente
        print(f"Advertencia: No se pudo agregar pie de página a Word: {str(e)}")
    
    return doc


def add_footer_pdf(html_content):
    """Agrega pie de página al HTML para PDF"""
    footer_html = f"""
    <div style="position: fixed; bottom: 0; width: 100%; text-align: center; 
                font-size: 9pt; color: #808080; padding: 10px; border-top: 1px solid #ddd;">
        Correo: {FOOTER_EMAIL} | Ubicación: {FOOTER_UBICACION}
    </div>
    """
    # Insertar antes del cierre del body
    html_content = html_content.replace('</body>', footer_html + '</body>')
    return html_content


def generate_word_report(report_type, report_data, filters_info=None):
    """Genera un reporte en formato Word"""
    try:
        # Cargar plantilla Word si existe
        template_path = get_template_path('PlantillaWord.docx')
        if os.path.exists(template_path):
            try:
                doc = Document(template_path)
                # Limpiar contenido existente pero mantener estilos y formato
                # Eliminar todos los párrafos de la plantilla
                for paragraph in list(doc.paragraphs):
                    p = paragraph._element
                    p.getparent().remove(p)
            except Exception as e:
                # Si hay error al cargar la plantilla, crear documento nuevo
                print(f"Error al cargar plantilla Word: {str(e)}")
                doc = Document()
        else:
            # Si no existe la plantilla, crear documento nuevo
            doc = Document()
        
        # Agregar título (más compacto, sin filtros)
        title = doc.add_heading(f'{get_report_title(report_type)}', 0)
        title.alignment = WD_ALIGN_PARAGRAPH.CENTER
        
        # Agregar fecha de generación (más compacto)
        date_para = doc.add_paragraph()
        date_para.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        date_run = date_para.add_run(f'Fecha de generación: {datetime.now().strftime("%d/%m/%Y %H:%M:%S")}')
        date_run.font.size = Pt(9)
        date_run.font.color.rgb = RGBColor(102, 102, 102)
        
        # Generar contenido según el tipo de reporte
        generate_word_content(doc, report_type, report_data)
        
        # Agregar pie de página
        add_footer_word(doc)
        
        # Guardar en BytesIO
        output = BytesIO()
        doc.save(output)
        output.seek(0)
        
        return output
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise Exception(f"Error al generar reporte Word: {str(e)}")


def get_image_base64(image_path):
    """Convierte una imagen a base64 para incluirla en el PDF"""
    try:
        import base64
        full_path = os.path.join(settings.BASE_DIR, 'src', 'static', image_path)
        if os.path.exists(full_path):
            with open(full_path, 'rb') as img_file:
                img_data = img_file.read()
                img_base64 = base64.b64encode(img_data).decode('utf-8')
                # Determinar el tipo de imagen por extensión
                ext = os.path.splitext(full_path)[1].lower()
                mime_type = 'image/png' if ext == '.png' else 'image/jpeg'
                return f'data:{mime_type};base64,{img_base64}'
        return None
    except Exception as e:
        print(f"Error al convertir imagen a base64: {str(e)}")
        return None


def generate_pdf_report(report_type, report_data, filters_info=None):
    """Genera un reporte en formato PDF usando la misma plantilla de Word"""
    try:
        # Generar primero el Word (que usa la plantilla)
        word_buffer = generate_word_report(report_type, report_data, filters_info)
        word_buffer.seek(0)  # Asegurar que el buffer esté al inicio
        
        # Intentar convertir Word a PDF usando docx2pdf
        try:
            from docx2pdf import convert
            import tempfile
            
            # Crear archivos temporales
            with tempfile.NamedTemporaryFile(suffix='.docx', delete=False) as temp_word:
                temp_word.write(word_buffer.read())
                temp_word_path = temp_word.name
            
            with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_pdf:
                temp_pdf_path = temp_pdf.name
            
            # Convertir Word a PDF
            convert(temp_word_path, temp_pdf_path)
            
            # Leer el PDF generado
            pdf_file = BytesIO()
            with open(temp_pdf_path, 'rb') as f:
                pdf_file.write(f.read())
            
            # Limpiar archivos temporales
            try:
                os.unlink(temp_word_path)
                os.unlink(temp_pdf_path)
            except:
                pass
            
            pdf_file.seek(0)
            return pdf_file
            
        except ImportError:
            # Si docx2pdf no está disponible, usar método HTML como fallback
            pass
        except Exception as e:
            # Si hay error en la conversión, usar método HTML como fallback
            print(f"Error al convertir Word a PDF: {str(e)}")
            pass
        
        # Fallback: Generar HTML del reporte (método anterior)
        html_content = generate_html_content(report_type, report_data, filters_info)
        
        # Obtener imágenes en base64
        logo_header = get_image_base64('img/logos/logo maga letras png.png')
        logo_watermark = get_image_base64('img/logos/maga_logo.png')
        
        # Agregar estilos CSS (compatible con xhtml2pdf)
        # Usar @page para pie de página y encabezado con texto
        header_html = ""
        if logo_header:
            # Logo más pequeño, similar al tamaño en Word
            header_html = f"""
            <div class="page-header">
                <img src="{logo_header}" style="max-width: 100px; height: auto;" />
            </div>
            """
        
        watermark_style = ""
        if logo_watermark:
            watermark_style = f"""
            background-image: url('{logo_watermark}');
            background-size: 350px 350px;
            background-repeat: no-repeat;
            background-position: center;
            opacity: 0.1;
            """
        
        footer_text = f"Correo: {FOOTER_EMAIL} | Ubicación: {FOOTER_UBICACION}"
        
        css_styles = f"""
        <style>
            @page {{
                size: A4;
                margin: 2.5cm 2cm 2.5cm 2cm;
            }}
            .page-header {{
                text-align: center;
                padding: 0.2cm 0;
                margin-bottom: 0.3cm;
            }}
            .page-footer {{
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                text-align: center;
                font-size: 8pt;
                color: #666;
                padding: 0.5cm;
                background-color: white;
                border-top: 1px solid #ddd;
            }}
            body {{
                font-family: Arial, sans-serif;
                font-size: 10pt;
                line-height: 1.4;
                color: #333;
                margin-bottom: 2cm;
                {watermark_style}
            }}
            h1 {{
                color: #2c3e50;
                text-align: center;
                font-size: 16pt;
                margin-top: 0.2cm;
                margin-bottom: 0.5cm;
                padding: 0;
            }}
            h2 {{
                color: #0772d2;
                font-size: 14pt;
                font-weight: bold;
                margin-top: 0.8cm;
                margin-bottom: 0.5cm;
                padding: 0.3cm 0.5cm;
                background: linear-gradient(135deg, #f0f7ff 0%, #e6f2ff 100%);
                border-left: 4px solid #0772d2;
                border-radius: 4px;
                page-break-before: always;
            }}
            h2:first-of-type {{
                page-break-before: auto !important;
            }}
            .section-break {{
                page-break-before: always;
            }}
            .section-break:first-child {{
                page-break-before: auto !important;
            }}
            h3 {{
                color: #2c3e50;
                font-size: 12pt;
                font-weight: 600;
                margin-top: 0.6cm;
                margin-bottom: 0.4cm;
                padding-bottom: 0.2cm;
                border-bottom: 2px solid #e0e0e0;
            }}
            p {{
                margin: 0.25cm 0;
                line-height: 1.5;
            }}
            .date-info {{
                text-align: right;
                font-size: 9pt;
                color: #666;
                margin-bottom: 0.5cm;
                font-style: italic;
            }}
            table {{
                width: 100%;
                border-collapse: collapse;
                margin: 0.5cm auto;
                font-size: 9pt;
                page-break-inside: avoid;
                border: 1px solid #000;
            }}
            th {{
                background-color: #2c3e50;
                color: white;
                padding: 6px;
                text-align: left;
                font-weight: bold;
                border: 1px solid #000;
            }}
            td {{
                padding: 5px;
                border: 1px solid #000;
            }}
            tr:nth-child(even) {{
                background-color: #f5f5f5;
            }}
            .metric-box {{
                background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
                padding: 0.5cm 0.6cm;
                margin: 0.5cm 0;
                border: 1px solid #e0e0e0;
                border-left: 4px solid #0772d2;
                border-radius: 6px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            }}
            .metric-label {{
                font-weight: 600;
                color: #2c3e50;
                font-size: 9.5pt;
                display: inline-block;
                min-width: 180px;
            }}
            .metric-value {{
                font-size: 16pt;
                color: #0772d2;
                margin-top: 2px;
                font-weight: bold;
            }}
            ul, ol {{
                margin: 0.3cm 0;
                padding-left: 1.5cm;
            }}
            li {{
                margin: 0.2cm 0;
            }}
        </style>
        """
        
        footer_html = f"""
        <div class="page-footer">
            {footer_text}
        </div>
        """
        
        full_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            {css_styles}
        </head>
        <body>
            {header_html}
            {html_content}
            {footer_html}
        </body>
        </html>
        """
        
        # Generar PDF usando xhtml2pdf (compatible con Windows)
        pdf_file = BytesIO()
        
        if XHTML2PDF_AVAILABLE:
            # Usar xhtml2pdf
            result = pisa.CreatePDF(
                src=full_html,
                dest=pdf_file,
                encoding='utf-8'
            )
            
            if result.err:
                raise Exception(f"Error al generar PDF con xhtml2pdf: {result.err}")
                
        elif WEASYPRINT_AVAILABLE:
            # Usar weasyprint como alternativa
            weasyprint.HTML(string=full_html).write_pdf(pdf_file)
        else:
            raise Exception("No hay librerías de PDF disponibles. Instale xhtml2pdf o weasyprint.")
        
        pdf_file.seek(0)
        return pdf_file
        
    except Exception as e:
        raise Exception(f"Error al generar reporte PDF: {str(e)}")


def get_report_title(report_type):
    """Obtiene el título del reporte según su tipo"""
    titles = {
        'actividades-por-region-comunidad': 'Actividades por Región o Comunidad',
        'beneficiarios-por-region-comunidad': 'Beneficiarios por Región o Comunidad',
        'actividad-de-personal': 'Actividad de Personal',
        'avances-eventos-generales': 'Avances de Eventos Generales',
        'reporte-evento-individual': 'Reporte de Evento Individual',
        'comunidades': 'Reporte de Comunidades',
        'actividad-usuarios': 'Actividad de Usuarios',
        'reporte-general': 'Reporte General'
    }
    return titles.get(report_type, 'Reporte')


def generate_word_content(doc, report_type, report_data):
    """Genera el contenido específico del reporte en Word"""
    
    if report_type == 'actividades-por-region-comunidad':
        generate_word_actividades_region_comunidad(doc, report_data)
    elif report_type == 'beneficiarios-por-region-comunidad':
        generate_word_beneficiarios_region_comunidad(doc, report_data)
    elif report_type == 'actividad-de-personal':
        generate_word_actividad_personal(doc, report_data)
    elif report_type == 'avances-eventos-generales':
        generate_word_avances_eventos(doc, report_data)
    elif report_type == 'reporte-evento-individual':
        generate_word_evento_individual(doc, report_data)
    elif report_type == 'comunidades':
        generate_word_comunidades(doc, report_data)
    elif report_type == 'actividad-usuarios':
        generate_word_actividad_usuarios(doc, report_data)
    elif report_type == 'reporte-general':
        generate_word_reporte_general(doc, report_data)
    else:
        doc.add_paragraph('Tipo de reporte no reconocido.')


def generate_html_content(report_type, report_data, filters_info=None):
    """Genera el contenido HTML del reporte para PDF"""
    
    html_parts = []
    
    # Título (sin líneas azules, más compacto)
    html_parts.append(f'<h1>{get_report_title(report_type)}</h1>')
    
    # Fecha de generación (más compacto)
    html_parts.append(f'<p class="date-info">Fecha de generación: {datetime.now().strftime("%d/%m/%Y %H:%M:%S")}</p>')
    
    # Contenido según tipo
    if report_type == 'actividades-por-region-comunidad':
        html_parts.append(generate_html_actividades_region_comunidad(report_data))
    elif report_type == 'beneficiarios-por-region-comunidad':
        html_parts.append(generate_html_beneficiarios_region_comunidad(report_data))
    elif report_type == 'actividad-de-personal':
        html_parts.append(generate_html_actividad_personal(report_data))
    elif report_type == 'avances-eventos-generales':
        html_parts.append(generate_html_avances_eventos(report_data))
    elif report_type == 'reporte-evento-individual':
        html_parts.append(generate_html_evento_individual(report_data))
    elif report_type == 'comunidades':
        html_parts.append(generate_html_comunidades(report_data))
    elif report_type == 'actividad-usuarios':
        html_parts.append(generate_html_actividad_usuarios(report_data))
    elif report_type == 'reporte-general':
        html_parts.append(generate_html_reporte_general(report_data))
    else:
        html_parts.append('<p>Tipo de reporte no reconocido.</p>')
    
    return '\n'.join(html_parts)


# ========== FUNCIONES ESPECÍFICAS PARA WORD ==========

def generate_word_actividades_region_comunidad(doc, data):
    """Genera contenido Word para actividades por región/comunidad"""
    if not data or len(data) == 0:
        doc.add_paragraph('No se encontraron datos para este reporte.')
        return
    
    # Separar items con resumen (sin actividades) de la entrada con todas las actividades
    items_resumen = []
    todas_actividades_item = None
    
    for item in data:
        # Si tiene actividades y es la entrada de "Todas las Actividades" o similar
        if item.get('actividades') and len(item.get('actividades', [])) > 0:
            todas_actividades_item = item
        else:
            items_resumen.append(item)
    
    # ========== SECCIÓN 1: TABLAS DE RESUMEN (2 por página) ==========
    for idx, item in enumerate(items_resumen):
        # Salto de página cada 2 items (página nueva cada 2 tablas)
        if idx > 0 and idx % 2 == 0:
            doc.add_page_break()
        
        # Título de la comunidad/región
        heading = doc.add_heading(item.get('nombre', 'N/A'), level=3)
        
        # Crear tabla de resumen para esta comunidad/región
        table = doc.add_table(rows=1, cols=2)
        format_table_word(table)
        
        # Ajustar ancho de columnas (más espacio para 2 por página)
        from docx.shared import Inches
        table.columns[0].width = Inches(2.5)
        table.columns[1].width = Inches(4.5)
        
        # Encabezado de la tabla
        header_cells = table.rows[0].cells
        header_cells[0].text = "Información"
        header_cells[1].text = "Valor"
        header_cells[0].paragraphs[0].runs[0].bold = True
        header_cells[1].paragraphs[0].runs[0].bold = True
        
        # Agregar filas de datos
        row = table.add_row()
        row.cells[0].text = "Región"
        row.cells[1].text = str(item.get('region', '-'))
        
        row = table.add_row()
        row.cells[0].text = "Total de actividades"
        row.cells[1].text = str(item.get('total_actividades', 0))
        
        row = table.add_row()
        row.cells[0].text = "Total de beneficiarios"
        row.cells[1].text = str(item.get('total_beneficiarios', 0))
        
        row = table.add_row()
        row.cells[0].text = "Beneficiarios individuales"
        row.cells[1].text = str(item.get('beneficiarios_individuales', 0))
        
        row = table.add_row()
        row.cells[0].text = "Beneficiarios familias"
        row.cells[1].text = str(item.get('beneficiarios_familias', 0))
        
        row = table.add_row()
        row.cells[0].text = "Beneficiarios instituciones"
        row.cells[1].text = str(item.get('beneficiarios_instituciones', 0))
        
        row = table.add_row()
        row.cells[0].text = "Responsables"
        row.cells[1].text = str(item.get('responsables', '-'))
        
        row = table.add_row()
        row.cells[0].text = "Colaboradores"
        row.cells[1].text = str(item.get('colaboradores', '-'))
        
        # Espacio entre tablas
        doc.add_paragraph()
    
    # ========== SECCIÓN 2: TABLA GENERAL DE DETALLES DE ACTIVIDADES ==========
    if todas_actividades_item and todas_actividades_item.get('actividades'):
        doc.add_page_break()
        doc.add_heading('Detalles de Actividades', level=2)
        
        table = doc.add_table(rows=1, cols=7)
        format_table_word(table)
        
        # Encabezados
        headers = ['Nombre', 'Fecha', 'Estado', 'Tipo', 'Comunidad', 'Responsable', 'Beneficiarios']
        header_cells = table.rows[0].cells
        for i, header in enumerate(headers):
            header_cells[i].text = header
            header_cells[i].paragraphs[0].runs[0].bold = True
        
        # Datos
        for actividad in todas_actividades_item['actividades']:
            row_cells = table.add_row().cells
            row_cells[0].text = str(actividad.get('nombre', '-'))
            row_cells[1].text = format_date(actividad.get('fecha', '-'))
            row_cells[2].text = str(actividad.get('estado', '-'))
            row_cells[3].text = str(actividad.get('tipo_actividad', '-'))
            row_cells[4].text = str(actividad.get('comunidad', '-'))
            row_cells[5].text = str(actividad.get('responsable', '-'))
            row_cells[6].text = str(actividad.get('total_beneficiarios', 0))


def generate_word_beneficiarios_region_comunidad(doc, data):
    """Genera contenido Word para beneficiarios por región/comunidad - Tabla general con saltos por comunidad"""
    if not data or len(data) == 0:
        doc.add_paragraph('No se encontraron datos para este reporte.')
        return
    
    # Agrupar beneficiarios por comunidad
    # En este reporte, cada elemento en data es un beneficiario individual
    comunidades_map = {}
    for beneficiario in data:
        comunidad_key = beneficiario.get('comunidad', 'Sin comunidad')
        if comunidad_key not in comunidades_map:
            comunidades_map[comunidad_key] = {
                'comunidad': comunidad_key,
                'region': beneficiario.get('region', '-'),
                'beneficiarios': []
            }
        comunidades_map[comunidad_key]['beneficiarios'].append(beneficiario)
    
    if not comunidades_map:
        doc.add_paragraph('No se encontraron beneficiarios para este reporte.')
        return
    
    # Crear tabla general
    doc.add_heading('Beneficiarios por Comunidad o Región', level=2)
    
    table = doc.add_table(rows=1, cols=6)
    format_table_word(table)
    
    # Encabezados
    headers = ['Nombre', 'Tipo', 'Comunidad', 'Evento', 'DPI/Documento', 'Teléfono']
    header_cells = table.rows[0].cells
    for i, header in enumerate(headers):
        header_cells[i].text = header
        header_cells[i].paragraphs[0].runs[0].bold = True
    
    # Agregar beneficiarios agrupados por comunidad
    for comunidad_key in sorted(comunidades_map.keys()):
        comunidad_data = comunidades_map[comunidad_key]
        
        # Fila de encabezado de comunidad (fila destacada)
        row = table.add_row()
        row_cells = row.cells
        
        # Primera celda con el nombre de la comunidad
        row_cells[0].text = f"{comunidad_data['comunidad']} ({comunidad_data['region']}) - {len(comunidad_data['beneficiarios'])} beneficiario{'s' if len(comunidad_data['beneficiarios']) != 1 else ''}"
        row_cells[0].paragraphs[0].runs[0].bold = True
        row_cells[0].paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
        row_cells[0].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        
        # Combinar todas las celdas (de 0 a 5)
        for i in range(1, 6):
            row_cells[0].merge(row_cells[i])
        
        # Aplicar fondo gris claro al encabezado de comunidad
        from docx.oxml import OxmlElement
        from docx.oxml.ns import qn
        shading_elm = OxmlElement('w:shd')
        shading_elm.set(qn('w:fill'), 'D0D0D0')  # Gris un poco más oscuro
        row_cells[0]._tc.get_or_add_tcPr().append(shading_elm)
        
        # Cambiar el color del texto a negro
        row_cells[0].paragraphs[0].runs[0].font.color.rgb = RGBColor(0, 0, 0)
        
        # Agregar beneficiarios de esta comunidad
        for beneficiario in comunidad_data['beneficiarios']:
            row_cells = table.add_row().cells
            row_cells[0].text = str(beneficiario.get('nombre', '-'))
            row_cells[1].text = str(beneficiario.get('tipo', '-'))
            row_cells[2].text = str(beneficiario.get('comunidad', '-'))
            row_cells[3].text = str(beneficiario.get('evento', '-'))
            # DPI/Documento
            row_cells[4].text = str(beneficiario.get('dpi', beneficiario.get('documento', '-')))
            # Teléfono
            row_cells[5].text = str(beneficiario.get('telefono', '-'))


def generate_word_actividad_personal(doc, data):
    """Genera contenido Word para actividad de personal"""
    if not data or len(data) == 0:
        doc.add_paragraph('No se encontraron datos para este reporte.')
        return
    
    for idx, item in enumerate(data):
        # Salto de página antes de cada sección (excepto la primera)
        if idx > 0:
            doc.add_page_break()
        
        heading = doc.add_heading(f"{item.get('colaborador', 'N/A')}", level=2)
        
        # Información general con mejor formato
        info_para = doc.add_paragraph()
        info_para.add_run("Total de actividades: ").bold = True
        info_para.add_run(f"{item.get('total_actividades', 0)}").font.color.rgb = RGBColor(7, 114, 210)
        
        info_para = doc.add_paragraph()
        info_para.add_run("Total de beneficiarios: ").bold = True
        info_para.add_run(f"{item.get('total_beneficiarios', 0)}").font.color.rgb = RGBColor(7, 114, 210)
        doc.add_paragraph()
        
        if item.get('actividades') and len(item['actividades']) > 0:
            # Salto de página antes de la tabla
            doc.add_page_break()
            doc.add_heading('Actividades', level=3)
            table = doc.add_table(rows=1, cols=6)
            # Formatear tabla con bordes y centrado
            format_table_word(table)
            
            headers = ['Nombre', 'Fecha', 'Estado', 'Tipo', 'Comunidad', 'Beneficiarios']
            header_cells = table.rows[0].cells
            for i, header in enumerate(headers):
                header_cells[i].text = header
                header_cells[i].paragraphs[0].runs[0].bold = True
            
            for actividad in item['actividades']:
                row_cells = table.add_row().cells
                row_cells[0].text = str(actividad.get('nombre', '-'))
                row_cells[1].text = format_date(actividad.get('fecha', '-'))
                row_cells[2].text = str(actividad.get('estado', '-'))
                row_cells[3].text = str(actividad.get('tipo_actividad', '-'))
                row_cells[4].text = str(actividad.get('comunidad', '-'))
                row_cells[5].text = str(actividad.get('total_beneficiarios', 0))


def generate_word_avances_eventos(doc, data):
    """Genera contenido Word para avances de eventos"""
    if not data or len(data) == 0:
        doc.add_paragraph('No se encontraron datos para este reporte.')
        return
    
    for idx, item in enumerate(data):
        # Salto de página antes de cada sección (excepto la primera)
        if idx > 0:
            doc.add_page_break()
        
        heading = doc.add_heading(f"Evento: {item.get('evento_nombre', 'N/A')}", level=2)
        
        # Información general con mejor formato
        info_para = doc.add_paragraph()
        info_para.add_run("Fecha del evento: ").bold = True
        info_para.add_run(f"{format_date(item.get('fecha_evento', '-'))}")
        
        info_para = doc.add_paragraph()
        info_para.add_run("Total de avances: ").bold = True
        info_para.add_run(f"{item.get('total_avances', 0)}").font.color.rgb = RGBColor(7, 114, 210)
        doc.add_paragraph()
        
        if item.get('avances') and len(item['avances']) > 0:
            # Salto de página antes de los avances
            doc.add_page_break()
            doc.add_heading('Avances', level=3)
            for avance in item['avances']:
                doc.add_paragraph(f"Fecha: {format_date(avance.get('fecha', '-'))}")
                doc.add_paragraph(f"Descripción: {avance.get('descripcion', '-')}")
                if avance.get('evidencias'):
                    doc.add_paragraph(f"Evidencias: {', '.join(avance.get('evidencias', []))}")
                doc.add_paragraph()


def generate_word_evento_individual(doc, data):
    """Genera contenido Word para evento individual"""
    if not data:
        doc.add_paragraph('No se encontraron datos para este reporte.')
        return
    
    doc.add_heading('Información del Evento', level=2)
    
    # Información general con mejor formato
    info_para = doc.add_paragraph()
    info_para.add_run("Nombre: ").bold = True
    info_para.add_run(f"{data.get('nombre', '-')}").font.color.rgb = RGBColor(7, 114, 210)
    
    info_para = doc.add_paragraph()
    info_para.add_run("Tipo: ").bold = True
    info_para.add_run(f"{data.get('tipo', '-')}").font.color.rgb = RGBColor(7, 114, 210)
    
    info_para = doc.add_paragraph()
    info_para.add_run("Fecha: ").bold = True
    info_para.add_run(f"{format_date(data.get('fecha', '-'))}")
    
    info_para = doc.add_paragraph()
    info_para.add_run("Estado: ").bold = True
    info_para.add_run(f"{data.get('estado', '-')}")
    
    info_para = doc.add_paragraph()
    info_para.add_run("Comunidad: ").bold = True
    info_para.add_run(f"{data.get('comunidad', '-')}")
    
    info_para = doc.add_paragraph()
    info_para.add_run("Responsable: ").bold = True
    info_para.add_run(f"{data.get('responsable', '-')}")
    doc.add_paragraph()
    
    if data.get('avances') and len(data['avances']) > 0:
        # Salto de página antes de los avances
        doc.add_page_break()
        doc.add_heading('Avances', level=2)
        for avance in data['avances']:
            doc.add_heading(f"Avance del {format_date(avance.get('fecha', '-'))}", level=3)
            doc.add_paragraph(avance.get('descripcion', '-'))
            if avance.get('evidencias'):
                doc.add_paragraph(f"Evidencias: {', '.join(avance.get('evidencias', []))}")
            doc.add_paragraph()
    
    if data.get('beneficiarios') and len(data['beneficiarios']) > 0:
        # Salto de página antes de la tabla de beneficiarios
        doc.add_page_break()
        doc.add_heading('Beneficiarios', level=2)
        table = doc.add_table(rows=1, cols=4)
        # Formatear tabla con bordes y centrado
        format_table_word(table)
        
        headers = ['Nombre', 'Tipo', 'Comunidad', 'Detalles']
        header_cells = table.rows[0].cells
        for i, header in enumerate(headers):
            header_cells[i].text = header
            header_cells[i].paragraphs[0].runs[0].bold = True
        
        for beneficiario in data['beneficiarios']:
            row_cells = table.add_row().cells
            row_cells[0].text = str(beneficiario.get('nombre', '-'))
            row_cells[1].text = str(beneficiario.get('tipo', '-'))
            row_cells[2].text = str(beneficiario.get('comunidad', '-'))
            row_cells[3].text = str(beneficiario.get('detalles', '-'))


def generate_word_comunidades(doc, data):
    """Genera contenido Word para reporte de comunidades"""
    if not data or len(data) == 0:
        doc.add_paragraph('No se encontraron datos para este reporte.')
        return
    
    for idx, item in enumerate(data):
        # Salto de página antes de cada sección (excepto la primera)
        if idx > 0:
            doc.add_page_break()
        
        heading = doc.add_heading(f"{item.get('nombre', 'N/A')}", level=2)
        
        # Información general con mejor formato
        info_para = doc.add_paragraph()
        info_para.add_run("Región: ").bold = True
        info_para.add_run(f"{item.get('region', '-')}").font.color.rgb = RGBColor(7, 114, 210)
        
        info_para = doc.add_paragraph()
        info_para.add_run("Total de proyectos: ").bold = True
        info_para.add_run(f"{item.get('total_proyectos', 0)}").font.color.rgb = RGBColor(7, 114, 210)
        
        info_para = doc.add_paragraph()
        info_para.add_run("Total de beneficiarios: ").bold = True
        info_para.add_run(f"{item.get('total_beneficiarios', 0)}").font.color.rgb = RGBColor(7, 114, 210)
        doc.add_paragraph()
        
        if item.get('proyectos') and len(item['proyectos']) > 0:
            # Salto de página antes de los proyectos
            doc.add_page_break()
            doc.add_heading('Proyectos', level=3)
            for proyecto in item['proyectos']:
                doc.add_paragraph(f"• {proyecto.get('nombre', '-')} - {format_date(proyecto.get('fecha', '-'))}")


def generate_word_actividad_usuarios(doc, data):
    """Genera contenido Word para actividad de usuarios"""
    if not data or len(data) == 0:
        doc.add_paragraph('No se encontraron datos para este reporte.')
        return
    
    for idx, item in enumerate(data):
        # Salto de página antes de cada sección (excepto la primera)
        if idx > 0:
            doc.add_page_break()
        
        heading = doc.add_heading(f"Usuario: {item.get('usuario', 'N/A')}", level=2)
        
        # Información general con mejor formato
        info_para = doc.add_paragraph()
        info_para.add_run("Total de cambios: ").bold = True
        info_para.add_run(f"{item.get('total_cambios', 0)}").font.color.rgb = RGBColor(7, 114, 210)
        doc.add_paragraph()
        
        if item.get('cambios') and len(item['cambios']) > 0:
            # Salto de página antes de la tabla
            doc.add_page_break()
            doc.add_heading('Cambios Realizados', level=3)
            table = doc.add_table(rows=1, cols=5)
            # Formatear tabla con bordes y centrado
            format_table_word(table)
            
            headers = ['Fecha', 'Tipo', 'Entidad', 'Descripción', 'Detalles']
            header_cells = table.rows[0].cells
            for i, header in enumerate(headers):
                header_cells[i].text = header
                header_cells[i].paragraphs[0].runs[0].bold = True
            
            for cambio in item['cambios']:
                row_cells = table.add_row().cells
                row_cells[0].text = format_date(cambio.get('fecha', '-'))
                row_cells[1].text = str(cambio.get('tipo', '-'))
                row_cells[2].text = str(cambio.get('entidad', '-'))
                row_cells[3].text = str(cambio.get('descripcion', '-'))
                row_cells[4].text = str(cambio.get('detalles', '-'))


def generate_word_reporte_general(doc, data):
    """Genera contenido Word para reporte general - Datos primero, luego tablas"""
    if not data:
        doc.add_paragraph('No se encontraron datos para este reporte.')
        return
    
    # ========== SECCIÓN 1: TODOS LOS DATOS EN UNA MISMA HOJA ==========
    doc.add_heading('Resumen General', level=2)
    
    # Tipos de eventos (dato)
    if 'tipos_eventos' in data:
        tipos = data['tipos_eventos']
        info_para = doc.add_paragraph()
        info_para.add_run("Total de Tipos de Evento: ").bold = True
        info_para.add_run(f"Capacitación: {tipos.get('capacitacion', 0)}, Entrega: {tipos.get('entrega', 0)}, Proyecto de Ayuda: {tipos.get('proyecto_ayuda', 0)}").font.color.rgb = RGBColor(7, 114, 210)
        doc.add_paragraph()
    
    # Total de beneficiarios alcanzado (dato)
    if 'total_beneficiarios' in data:
        info_para = doc.add_paragraph()
        info_para.add_run("Total de Beneficiarios Alcanzados: ").bold = True
        info_para.add_run(f"{data['total_beneficiarios']}").font.color.rgb = RGBColor(7, 114, 210)
        doc.add_paragraph()
    
    # Tipos de beneficiarios (dato)
    if 'tipos_beneficiarios' in data:
        tipos = data['tipos_beneficiarios']
        info_para = doc.add_paragraph()
        info_para.add_run("Total de Tipos de Beneficiarios: ").bold = True
        info_para.add_run(f"Individuales: {tipos.get('individual', 0)}, Familias: {tipos.get('familia', 0)}, Instituciones: {tipos.get('institucion', 0)}, Mujeres: {tipos.get('mujeres', 0)}, Hombres: {tipos.get('hombres', 0)}").font.color.rgb = RGBColor(7, 114, 210)
        doc.add_paragraph()
    
    # Total de comunidades alcanzadas (dato - solo el número)
    if 'total_comunidades' in data:
        total_comunidades = data['total_comunidades']
        info_para = doc.add_paragraph()
        info_para.add_run("Total de Comunidades Alcanzadas: ").bold = True
        info_para.add_run(f"{total_comunidades.get('total', 0)}").font.color.rgb = RGBColor(7, 114, 210)
        doc.add_paragraph()
    
    # Total de avances en Proyectos (dato)
    if 'total_avances' in data:
        info_para = doc.add_paragraph()
        info_para.add_run("Total de Avances en Proyectos: ").bold = True
        info_para.add_run(f"{data['total_avances']}").font.color.rgb = RGBColor(7, 114, 210)
        doc.add_paragraph()
    
    # Evento con más avances y cambios (pequeña tabla)
    if 'evento_mas_avances' in data and data['evento_mas_avances']:
        evento = data['evento_mas_avances']
        doc.add_heading('Evento con Más Avances y Cambios', level=3)
        table = doc.add_table(rows=1, cols=3)
        format_table_word(table)
        
        headers = ['Nombre', 'Total de Avances', 'Total de Cambios']
        header_cells = table.rows[0].cells
        for i, header in enumerate(headers):
            header_cells[i].text = header
            header_cells[i].paragraphs[0].runs[0].bold = True
        
        row_cells = table.add_row().cells
        row_cells[0].text = str(evento.get('nombre', '-'))
        row_cells[1].text = str(evento.get('total_avances', 0))
        row_cells[2].text = str(evento.get('total_cambios', 0))
        doc.add_paragraph()
    
    # ========== SECCIÓN 2: TABLAS - CADA UNA EN SU PROPIA HOJA ==========
    
    # Tabla 1: Total de eventos
    if 'total_eventos' in data:
        total_eventos = data['total_eventos']
        if total_eventos.get('lista_eventos') and len(total_eventos['lista_eventos']) > 0:
            doc.add_page_break()
            doc.add_heading('Total de Eventos', level=2)
            info_para = doc.add_paragraph()
            info_para.add_run(f"Total: {total_eventos.get('total', 0)}").bold = True
            doc.add_paragraph()
            
            table = doc.add_table(rows=1, cols=6)
            format_table_word(table)
            
            headers = ['Nombre', 'Tipo', 'Estado', 'Fecha', 'Comunidad', 'Beneficiarios']
            header_cells = table.rows[0].cells
            for i, header in enumerate(headers):
                header_cells[i].text = header
                header_cells[i].paragraphs[0].runs[0].bold = True
            
            for evento in total_eventos['lista_eventos']:
                row_cells = table.add_row().cells
                row_cells[0].text = str(evento.get('nombre', '-'))
                row_cells[1].text = str(evento.get('tipo', '-'))
                row_cells[2].text = str(evento.get('estado', '-'))
                row_cells[3].text = format_date(evento.get('fecha', '-'))
                row_cells[4].text = str(evento.get('comunidad', '-'))
                row_cells[5].text = str(evento.get('beneficiarios', 0))
    
    # Tabla 2: Total de comunidades alcanzadas (si tiene lista)
    if 'total_comunidades' in data:
        total_comunidades = data['total_comunidades']
        if total_comunidades.get('lista_comunidades') and len(total_comunidades['lista_comunidades']) > 0:
            doc.add_page_break()
            doc.add_heading('Total de Comunidades Alcanzadas', level=2)
            info_para = doc.add_paragraph()
            info_para.add_run(f"Total: {total_comunidades.get('total', 0)}").bold = True
            doc.add_paragraph()
            
            table = doc.add_table(rows=1, cols=2)
            format_table_word(table)
            
            headers = ['Comunidad', 'Región']
            header_cells = table.rows[0].cells
            for i, header in enumerate(headers):
                header_cells[i].text = header
                header_cells[i].paragraphs[0].runs[0].bold = True
            
            for comunidad in total_comunidades['lista_comunidades']:
                row_cells = table.add_row().cells
                row_cells[0].text = str(comunidad.get('nombre', '-'))
                row_cells[1].text = str(comunidad.get('region', '-'))
    
    # Tabla 3: Comunidades con más beneficiarios y eventos
    if 'comunidades_mas_beneficiarios' in data and len(data['comunidades_mas_beneficiarios']) > 0:
        doc.add_page_break()
        doc.add_heading('Comunidades con Más Beneficiarios y Eventos', level=2)
        comunidades = data['comunidades_mas_beneficiarios']
        
        table = doc.add_table(rows=1, cols=3)
        format_table_word(table)
        
        headers = ['Comunidad', 'Total de Beneficiarios', 'Total de Eventos']
        header_cells = table.rows[0].cells
        for i, header in enumerate(headers):
            header_cells[i].text = header
            header_cells[i].paragraphs[0].runs[0].bold = True
        
        for com in comunidades:
            row_cells = table.add_row().cells
            row_cells[0].text = str(com.get('nombre', '-'))
            row_cells[1].text = str(com.get('total_beneficiarios', 0))
            row_cells[2].text = str(com.get('total_eventos', 0))
    
    # Tabla 4: Eventos con más beneficiarios
    if 'eventos_mas_beneficiarios' in data and len(data['eventos_mas_beneficiarios']) > 0:
        doc.add_page_break()
        doc.add_heading('Eventos con Más Beneficiarios', level=2)
        eventos = data['eventos_mas_beneficiarios']
        
        table = doc.add_table(rows=1, cols=2)
        format_table_word(table)
        
        headers = ['Evento', 'Total de Beneficiarios']
        header_cells = table.rows[0].cells
        for i, header in enumerate(headers):
            header_cells[i].text = header
            header_cells[i].paragraphs[0].runs[0].bold = True
        
        for evento in eventos:
            row_cells = table.add_row().cells
            row_cells[0].text = str(evento.get('nombre', '-'))
            row_cells[1].text = str(evento.get('total_beneficiarios', 0))


# ========== FUNCIONES ESPECÍFICAS PARA HTML/PDF ==========

def generate_html_actividades_region_comunidad(data):
    """Genera HTML para actividades por región/comunidad"""
    html_parts = []
    
    if not data or len(data) == 0:
        return '<p>No se encontraron datos para este reporte.</p>'
    
    # Separar items con resumen (sin actividades) de la entrada con todas las actividades
    items_resumen = []
    todas_actividades_item = None
    
    for item in data:
        # Si tiene actividades y es la entrada de "Todas las Actividades" o similar
        if item.get('actividades') and len(item.get('actividades', [])) > 0:
            todas_actividades_item = item
        else:
            items_resumen.append(item)
    
    # ========== SECCIÓN 1: TABLAS DE RESUMEN (2 por página) ==========
    for idx, item in enumerate(items_resumen):
        # Salto de página cada 2 items
        if idx > 0 and idx % 2 == 0:
            html_parts.append('<div class="section-break"></div>')
        
        # Tabla de resumen (2 por página, más espacio)
        html_parts.append(f'<h3 style="text-align: center; margin-bottom: 0.3cm; font-size: 11pt;">{item.get("nombre", "N/A")}</h3>')
        html_parts.append('<table style="width: 48%; display: inline-table; margin: 0.3cm 1%; vertical-align: top; font-size: 9pt; border: 1px solid #000;">')
        html_parts.append('<thead>')
        html_parts.append('<tr><th style="width: 50%;">Información</th><th style="width: 50%;">Valor</th></tr>')
        html_parts.append('</thead>')
        html_parts.append('<tbody>')
        
        html_parts.append('<tr><td style="font-weight: bold; padding: 5px;">Región:</td><td style="padding: 5px;">' + str(item.get('region', '-')) + '</td></tr>')
        html_parts.append('<tr><td style="font-weight: bold; padding: 5px;">Total actividades:</td><td style="padding: 5px; color: #0772d2;">' + str(item.get('total_actividades', 0)) + '</td></tr>')
        html_parts.append('<tr><td style="font-weight: bold; padding: 5px;">Total beneficiarios:</td><td style="padding: 5px; color: #0772d2;">' + str(item.get('total_beneficiarios', 0)) + '</td></tr>')
        html_parts.append('<tr><td style="font-weight: bold; padding: 5px;">Individuales:</td><td style="padding: 5px;">' + str(item.get('beneficiarios_individuales', 0)) + '</td></tr>')
        html_parts.append('<tr><td style="font-weight: bold; padding: 5px;">Familias:</td><td style="padding: 5px;">' + str(item.get('beneficiarios_familias', 0)) + '</td></tr>')
        html_parts.append('<tr><td style="font-weight: bold; padding: 5px;">Instituciones:</td><td style="padding: 5px;">' + str(item.get('beneficiarios_instituciones', 0)) + '</td></tr>')
        html_parts.append('<tr><td style="font-weight: bold; padding: 5px;">Responsables:</td><td style="padding: 5px; font-size: 8pt;">' + str(item.get('responsables', '-')) + '</td></tr>')
        html_parts.append('<tr><td style="font-weight: bold; padding: 5px;">Colaboradores:</td><td style="padding: 5px; font-size: 8pt;">' + str(item.get('colaboradores', '-')) + '</td></tr>')
        
        html_parts.append('</tbody></table>')
        
        # Agregar salto de línea después de cada 2 tablas
        if (idx + 1) % 2 == 0:
            html_parts.append('<div style="clear: both; page-break-after: always;"></div>')
    
    # ========== SECCIÓN 2: TABLA GENERAL DE DETALLES DE ACTIVIDADES ==========
    if todas_actividades_item and todas_actividades_item.get('actividades'):
        html_parts.append('<div class="section-break"><h2>Detalles de Actividades</h2>')
        html_parts.append('<table>')
        html_parts.append('<thead><tr><th>Nombre</th><th>Fecha</th><th>Estado</th><th>Tipo</th><th>Comunidad</th><th>Responsable</th><th>Beneficiarios</th></tr></thead>')
        html_parts.append('<tbody>')
        
        for actividad in todas_actividades_item['actividades']:
            html_parts.append('<tr>')
            html_parts.append(f'<td>{actividad.get("nombre", "-")}</td>')
            html_parts.append(f'<td>{format_date(actividad.get("fecha", "-"))}</td>')
            html_parts.append(f'<td>{actividad.get("estado", "-")}</td>')
            html_parts.append(f'<td>{actividad.get("tipo_actividad", "-")}</td>')
            html_parts.append(f'<td>{actividad.get("comunidad", "-")}</td>')
            html_parts.append(f'<td>{actividad.get("responsable", "-")}</td>')
            html_parts.append(f'<td>{actividad.get("total_beneficiarios", 0)}</td>')
            html_parts.append('</tr>')
        
        html_parts.append('</tbody></table></div>')
    
    return '\n'.join(html_parts)


def generate_html_beneficiarios_region_comunidad(data):
    """Genera HTML para beneficiarios por región/comunidad - Tabla general con saltos por comunidad"""
    html_parts = []
    
    if not data or len(data) == 0:
        return '<p>No se encontraron datos para este reporte.</p>'
    
    # Agrupar beneficiarios por comunidad
    # En este reporte, cada elemento en data es un beneficiario individual
    comunidades_map = {}
    for beneficiario in data:
        comunidad_key = beneficiario.get('comunidad', 'Sin comunidad')
        if comunidad_key not in comunidades_map:
            comunidades_map[comunidad_key] = {
                'comunidad': comunidad_key,
                'region': beneficiario.get('region', '-'),
                'beneficiarios': []
            }
        comunidades_map[comunidad_key]['beneficiarios'].append(beneficiario)
    
    if not comunidades_map:
        return '<p>No se encontraron beneficiarios para este reporte.</p>'
    
    # Crear tabla general
    html_parts.append('<h2>Beneficiarios por Comunidad o Región</h2>')
    html_parts.append('<table>')
    html_parts.append('<thead><tr><th>Nombre</th><th>Tipo</th><th>Comunidad</th><th>Evento</th><th>DPI/Documento</th><th>Teléfono</th></tr></thead>')
    html_parts.append('<tbody>')
    
    # Agregar beneficiarios agrupados por comunidad
    for comunidad_key in sorted(comunidades_map.keys()):
        comunidad_data = comunidades_map[comunidad_key]
        
        # Fila de encabezado de comunidad (fila destacada con fondo gris claro)
        html_parts.append(f'<tr style="background-color: #D0D0D0; color: #000000;">')
        html_parts.append(f'<td colspan="6" style="font-weight: bold; padding: 8px; text-align: center;">')
        html_parts.append(f'{comunidad_data["comunidad"]} ({comunidad_data["region"]}) - {len(comunidad_data["beneficiarios"])} beneficiario{"s" if len(comunidad_data["beneficiarios"]) != 1 else ""}')
        html_parts.append('</td>')
        html_parts.append('</tr>')
        
        # Agregar beneficiarios de esta comunidad
        for beneficiario in comunidad_data['beneficiarios']:
            html_parts.append('<tr>')
            html_parts.append(f'<td>{beneficiario.get("nombre", "-")}</td>')
            html_parts.append(f'<td>{beneficiario.get("tipo", "-")}</td>')
            html_parts.append(f'<td>{beneficiario.get("comunidad", "-")}</td>')
            html_parts.append(f'<td>{beneficiario.get("evento", "-")}</td>')
            # DPI/Documento
            html_parts.append(f'<td>{beneficiario.get("dpi", beneficiario.get("documento", "-"))}</td>')
            # Teléfono
            html_parts.append(f'<td>{beneficiario.get("telefono", "-")}</td>')
            html_parts.append('</tr>')
    
    html_parts.append('</tbody></table>')
    
    return '\n'.join(html_parts)


def generate_html_actividad_personal(data):
    """Genera HTML para actividad de personal"""
    html_parts = []
    
    if not data or len(data) == 0:
        return '<p>No se encontraron datos para este reporte.</p>'
    
    for idx, item in enumerate(data):
        class_attr = ' class="section-break"' if idx > 0 else ''
        html_parts.append(f'<h2{class_attr}>{item.get("colaborador", "N/A")}</h2>')
        html_parts.append(f'<div class="metric-box">')
        html_parts.append(f'<p style="margin: 0.25cm 0;"><span class="metric-label">Total de actividades:</span> <strong style="color: #0772d2;">{item.get("total_actividades", 0)}</strong></p>')
        html_parts.append(f'<p style="margin: 0.25cm 0;"><span class="metric-label">Total de beneficiarios:</span> <strong style="color: #0772d2;">{item.get("total_beneficiarios", 0)}</strong></p>')
        html_parts.append(f'</div>')
        
        if item.get('actividades') and len(item['actividades']) > 0:
            html_parts.append('<h3>Actividades</h3>')
            html_parts.append('<table>')
            html_parts.append('<thead><tr><th>Nombre</th><th>Fecha</th><th>Estado</th><th>Tipo</th><th>Comunidad</th><th>Beneficiarios</th></tr></thead>')
            html_parts.append('<tbody>')
            
            for actividad in item['actividades']:
                html_parts.append('<tr>')
                html_parts.append(f'<td>{actividad.get("nombre", "-")}</td>')
                html_parts.append(f'<td>{format_date(actividad.get("fecha", "-"))}</td>')
                html_parts.append(f'<td>{actividad.get("estado", "-")}</td>')
                html_parts.append(f'<td>{actividad.get("tipo_actividad", "-")}</td>')
                html_parts.append(f'<td>{actividad.get("comunidad", "-")}</td>')
                html_parts.append(f'<td>{actividad.get("total_beneficiarios", 0)}</td>')
                html_parts.append('</tr>')
            
            html_parts.append('</tbody></table>')
    
    return '\n'.join(html_parts)


def generate_html_avances_eventos(data):
    """Genera HTML para avances de eventos"""
    html_parts = []
    
    if not data or len(data) == 0:
        return '<p>No se encontraron datos para este reporte.</p>'
    
    for idx, item in enumerate(data):
        class_attr = ' class="section-break"' if idx > 0 else ''
        html_parts.append(f'<h2{class_attr}>Evento: {item.get("evento_nombre", "N/A")}</h2>')
        html_parts.append(f'<div class="metric-box">')
        html_parts.append(f'<p style="margin: 0.25cm 0;"><span class="metric-label">Fecha del evento:</span> <strong>{format_date(item.get("fecha_evento", "-"))}</strong></p>')
        html_parts.append(f'<p style="margin: 0.25cm 0;"><span class="metric-label">Total de avances:</span> <strong style="color: #0772d2;">{item.get("total_avances", 0)}</strong></p>')
        html_parts.append(f'</div>')
        
        if item.get('avances') and len(item['avances']) > 0:
            html_parts.append('<h3>Avances</h3>')
            for avance in item['avances']:
                html_parts.append('<div class="metric-box">')
                html_parts.append(f'<p style="margin: 0.2cm 0;"><strong>Fecha:</strong> {format_date(avance.get("fecha", "-"))}</p>')
                html_parts.append(f'<p style="margin: 0.2cm 0;"><strong>Descripción:</strong> {avance.get("descripcion", "-")}</p>')
                if avance.get('evidencias'):
                    html_parts.append(f'<p style="margin: 0.2cm 0;"><strong>Evidencias:</strong> {", ".join(avance.get("evidencias", []))}</p>')
                html_parts.append('</div>')
    
    return '\n'.join(html_parts)


def generate_html_evento_individual(data):
    """Genera HTML para evento individual"""
    html_parts = []
    
    if not data:
        return '<p>No se encontraron datos para este reporte.</p>'
    
    html_parts.append('<h2>Información del Evento</h2>')
    html_parts.append('<div class="metric-box">')
    html_parts.append(f'<p style="margin: 0.25cm 0;"><span class="metric-label">Nombre:</span> <strong>{data.get("nombre", "-")}</strong></p>')
    html_parts.append(f'<p style="margin: 0.25cm 0;"><span class="metric-label">Tipo:</span> <strong>{data.get("tipo", "-")}</strong></p>')
    html_parts.append(f'<p style="margin: 0.25cm 0;"><span class="metric-label">Fecha:</span> <strong>{format_date(data.get("fecha", "-"))}</strong></p>')
    html_parts.append(f'<p style="margin: 0.25cm 0;"><span class="metric-label">Estado:</span> <strong>{data.get("estado", "-")}</strong></p>')
    html_parts.append(f'<p style="margin: 0.25cm 0;"><span class="metric-label">Comunidad:</span> <strong>{data.get("comunidad", "-")}</strong></p>')
    html_parts.append(f'<p style="margin: 0.25cm 0;"><span class="metric-label">Responsable:</span> <strong>{data.get("responsable", "-")}</strong></p>')
    html_parts.append('</div>')
    
    if data.get('avances') and len(data['avances']) > 0:
        html_parts.append('<h2>Avances</h2>')
        for avance in data['avances']:
            html_parts.append('<div class="metric-box">')
            html_parts.append(f'<p style="margin: 0.2cm 0;"><strong>Fecha:</strong> {format_date(avance.get("fecha", "-"))}</p>')
            html_parts.append(f'<p style="margin: 0.2cm 0;"><strong>Descripción:</strong> {avance.get("descripcion", "-")}</p>')
            if avance.get('evidencias'):
                html_parts.append(f'<p style="margin: 0.2cm 0;"><strong>Evidencias:</strong> {", ".join(avance.get("evidencias", []))}</p>')
            html_parts.append('</div>')
    
    if data.get('beneficiarios') and len(data['beneficiarios']) > 0:
        html_parts.append('<h2>Beneficiarios</h2>')
        html_parts.append('<table>')
        html_parts.append('<thead><tr><th>Nombre</th><th>Tipo</th><th>Comunidad</th><th>Detalles</th></tr></thead>')
        html_parts.append('<tbody>')
        
        for beneficiario in data['beneficiarios']:
            html_parts.append('<tr>')
            html_parts.append(f'<td>{beneficiario.get("nombre", "-")}</td>')
            html_parts.append(f'<td>{beneficiario.get("tipo", "-")}</td>')
            html_parts.append(f'<td>{beneficiario.get("comunidad", "-")}</td>')
            html_parts.append(f'<td>{beneficiario.get("detalles", "-")}</td>')
            html_parts.append('</tr>')
        
        html_parts.append('</tbody></table>')
    
    return '\n'.join(html_parts)


def generate_html_comunidades(data):
    """Genera HTML para reporte de comunidades"""
    html_parts = []
    
    if not data or len(data) == 0:
        return '<p>No se encontraron datos para este reporte.</p>'
    
    for idx, item in enumerate(data):
        class_attr = ' class="section-break"' if idx > 0 else ''
        html_parts.append(f'<h2{class_attr}>{item.get("nombre", "N/A")}</h2>')
        html_parts.append(f'<div class="metric-box">')
        html_parts.append(f'<p style="margin: 0.25cm 0;"><span class="metric-label">Región:</span> <strong>{item.get("region", "-")}</strong></p>')
        html_parts.append(f'<p style="margin: 0.25cm 0;"><span class="metric-label">Total de proyectos:</span> <strong style="color: #0772d2;">{item.get("total_proyectos", 0)}</strong></p>')
        html_parts.append(f'<p style="margin: 0.25cm 0;"><span class="metric-label">Total de beneficiarios:</span> <strong style="color: #0772d2;">{item.get("total_beneficiarios", 0)}</strong></p>')
        html_parts.append(f'</div>')
        
        if item.get('proyectos') and len(item['proyectos']) > 0:
            html_parts.append('<h3>Proyectos</h3>')
            html_parts.append('<ul>')
            for proyecto in item['proyectos']:
                html_parts.append(f'<li>{proyecto.get("nombre", "-")} - {format_date(proyecto.get("fecha", "-"))}</li>')
            html_parts.append('</ul>')
    
    return '\n'.join(html_parts)


def generate_html_actividad_usuarios(data):
    """Genera HTML para actividad de usuarios"""
    html_parts = []
    
    if not data or len(data) == 0:
        return '<p>No se encontraron datos para este reporte.</p>'
    
    for idx, item in enumerate(data):
        class_attr = ' class="section-break"' if idx > 0 else ''
        html_parts.append(f'<h2{class_attr}>Usuario: {item.get("usuario", "N/A")}</h2>')
        html_parts.append(f'<div class="metric-box">')
        html_parts.append(f'<p style="margin: 0.25cm 0;"><span class="metric-label">Total de cambios:</span> <strong style="color: #0772d2;">{item.get("total_cambios", 0)}</strong></p>')
        html_parts.append(f'</div>')
        
        if item.get('cambios') and len(item['cambios']) > 0:
            html_parts.append('<h3>Cambios Realizados</h3>')
            html_parts.append('<table>')
            html_parts.append('<thead><tr><th>Fecha</th><th>Tipo</th><th>Entidad</th><th>Descripción</th><th>Detalles</th></tr></thead>')
            html_parts.append('<tbody>')
            
            for cambio in item['cambios']:
                html_parts.append('<tr>')
                html_parts.append(f'<td>{format_date(cambio.get("fecha", "-"))}</td>')
                html_parts.append(f'<td>{cambio.get("tipo", "-")}</td>')
                html_parts.append(f'<td>{cambio.get("entidad", "-")}</td>')
                html_parts.append(f'<td>{cambio.get("descripcion", "-")}</td>')
                html_parts.append(f'<td>{cambio.get("detalles", "-")}</td>')
                html_parts.append('</tr>')
            
            html_parts.append('</tbody></table>')
    
    return '\n'.join(html_parts)


def generate_html_reporte_general(data):
    """Genera HTML para reporte general - Datos primero, luego tablas"""
    html_parts = []
    
    if not data:
        return '<p>No se encontraron datos para este reporte.</p>'
    
    # ========== SECCIÓN 1: TODOS LOS DATOS EN UNA MISMA HOJA ==========
    html_parts.append('<h2>Resumen General</h2>')
    
    # Tipos de eventos (dato)
    if 'tipos_eventos' in data:
        tipos = data['tipos_eventos']
        html_parts.append('<div class="metric-box">')
        html_parts.append(f'<p style="margin: 0.25cm 0;"><span class="metric-label">Total de Tipos de Evento:</span> <strong style="color: #0772d2;">Capacitación: {tipos.get("capacitacion", 0)}, Entrega: {tipos.get("entrega", 0)}, Proyecto de Ayuda: {tipos.get("proyecto_ayuda", 0)}</strong></p>')
        html_parts.append('</div>')
    
    # Total de beneficiarios alcanzado (dato)
    if 'total_beneficiarios' in data:
        html_parts.append('<div class="metric-box">')
        html_parts.append(f'<p style="margin: 0.25cm 0;"><span class="metric-label">Total de Beneficiarios Alcanzados:</span> <strong style="color: #0772d2; font-size: 14pt;">{data["total_beneficiarios"]}</strong></p>')
        html_parts.append('</div>')
    
    # Tipos de beneficiarios (dato)
    if 'tipos_beneficiarios' in data:
        tipos = data['tipos_beneficiarios']
        html_parts.append('<div class="metric-box">')
        html_parts.append(f'<p style="margin: 0.25cm 0;"><span class="metric-label">Total de Tipos de Beneficiarios:</span> <strong style="color: #0772d2;">Individuales: {tipos.get("individual", 0)}, Familias: {tipos.get("familia", 0)}, Instituciones: {tipos.get("institucion", 0)}, Mujeres: {tipos.get("mujeres", 0)}, Hombres: {tipos.get("hombres", 0)}</strong></p>')
        html_parts.append('</div>')
    
    # Total de comunidades alcanzadas (dato - solo el número)
    if 'total_comunidades' in data:
        total_comunidades = data['total_comunidades']
        html_parts.append('<div class="metric-box">')
        html_parts.append(f'<p style="margin: 0.25cm 0;"><span class="metric-label">Total de Comunidades Alcanzadas:</span> <strong style="color: #0772d2; font-size: 14pt;">{total_comunidades.get("total", 0)}</strong></p>')
        html_parts.append('</div>')
    
    # Total de avances en Proyectos (dato)
    if 'total_avances' in data:
        html_parts.append('<div class="metric-box">')
        html_parts.append(f'<p style="margin: 0.25cm 0;"><span class="metric-label">Total de Avances en Proyectos:</span> <strong style="color: #0772d2; font-size: 14pt;">{data["total_avances"]}</strong></p>')
        html_parts.append('</div>')
    
    # Evento con más avances y cambios (pequeña tabla)
    if 'evento_mas_avances' in data and data['evento_mas_avances']:
        evento = data['evento_mas_avances']
        html_parts.append('<h3>Evento con Más Avances y Cambios</h3>')
        html_parts.append('<table style="width: 80%; margin: 0 auto;">')
        html_parts.append('<thead><tr><th>Nombre</th><th>Total de Avances</th><th>Total de Cambios</th></tr></thead>')
        html_parts.append('<tbody>')
        html_parts.append('<tr>')
        html_parts.append(f'<td>{evento.get("nombre", "-")}</td>')
        html_parts.append(f'<td>{evento.get("total_avances", 0)}</td>')
        html_parts.append(f'<td>{evento.get("total_cambios", 0)}</td>')
        html_parts.append('</tr>')
        html_parts.append('</tbody></table>')
    
    # ========== SECCIÓN 2: TABLAS - CADA UNA EN SU PROPIA HOJA ==========
    
    # Tabla 1: Total de eventos
    if 'total_eventos' in data:
        total_eventos = data['total_eventos']
        if total_eventos.get('lista_eventos') and len(total_eventos['lista_eventos']) > 0:
            html_parts.append('<div class="section-break"><h2>Total de Eventos</h2>')
            html_parts.append(f'<div class="metric-box"><p style="margin: 0.25cm 0;"><span class="metric-label">Total:</span> <strong>{total_eventos.get("total", 0)}</strong></p></div>')
            html_parts.append('<table>')
            html_parts.append('<thead><tr><th>Nombre</th><th>Tipo</th><th>Estado</th><th>Fecha</th><th>Comunidad</th><th>Beneficiarios</th></tr></thead>')
            html_parts.append('<tbody>')
            
            for evento in total_eventos['lista_eventos']:
                html_parts.append('<tr>')
                html_parts.append(f'<td>{evento.get("nombre", "-")}</td>')
                html_parts.append(f'<td>{evento.get("tipo", "-")}</td>')
                html_parts.append(f'<td>{evento.get("estado", "-")}</td>')
                html_parts.append(f'<td>{format_date(evento.get("fecha", "-"))}</td>')
                html_parts.append(f'<td>{evento.get("comunidad", "-")}</td>')
                html_parts.append(f'<td>{evento.get("beneficiarios", 0)}</td>')
                html_parts.append('</tr>')
            
            html_parts.append('</tbody></table></div>')
    
    # Tabla 2: Total de comunidades alcanzadas (si tiene lista)
    if 'total_comunidades' in data:
        total_comunidades = data['total_comunidades']
        if total_comunidades.get('lista_comunidades') and len(total_comunidades['lista_comunidades']) > 0:
            html_parts.append('<div class="section-break"><h2>Total de Comunidades Alcanzadas</h2>')
            html_parts.append(f'<div class="metric-box"><p style="margin: 0.25cm 0;"><span class="metric-label">Total:</span> <strong>{total_comunidades.get("total", 0)}</strong></p></div>')
            html_parts.append('<table>')
            html_parts.append('<thead><tr><th>Comunidad</th><th>Región</th></tr></thead>')
            html_parts.append('<tbody>')
            
            for comunidad in total_comunidades['lista_comunidades']:
                html_parts.append('<tr>')
                html_parts.append(f'<td>{comunidad.get("nombre", "-")}</td>')
                html_parts.append(f'<td>{comunidad.get("region", "-")}</td>')
                html_parts.append('</tr>')
            
            html_parts.append('</tbody></table></div>')
    
    # Tabla 3: Comunidades con más beneficiarios y eventos
    if 'comunidades_mas_beneficiarios' in data and len(data['comunidades_mas_beneficiarios']) > 0:
        html_parts.append('<div class="section-break"><h2>Comunidades con Más Beneficiarios y Eventos</h2>')
        comunidades = data['comunidades_mas_beneficiarios']
        html_parts.append('<table>')
        html_parts.append('<thead><tr><th>Comunidad</th><th>Total de Beneficiarios</th><th>Total de Eventos</th></tr></thead>')
        html_parts.append('<tbody>')
        
        for com in comunidades:
            html_parts.append('<tr>')
            html_parts.append(f'<td>{com.get("nombre", "-")}</td>')
            html_parts.append(f'<td>{com.get("total_beneficiarios", 0)}</td>')
            html_parts.append(f'<td>{com.get("total_eventos", 0)}</td>')
            html_parts.append('</tr>')
        
        html_parts.append('</tbody></table></div>')
    
    # Tabla 4: Eventos con más beneficiarios
    if 'eventos_mas_beneficiarios' in data and len(data['eventos_mas_beneficiarios']) > 0:
        html_parts.append('<div class="section-break"><h2>Eventos con Más Beneficiarios</h2>')
        eventos = data['eventos_mas_beneficiarios']
        html_parts.append('<table>')
        html_parts.append('<thead><tr><th>Evento</th><th>Total de Beneficiarios</th></tr></thead>')
        html_parts.append('<tbody>')
        
        for evento in eventos:
            html_parts.append('<tr>')
            html_parts.append(f'<td>{evento.get("nombre", "-")}</td>')
            html_parts.append(f'<td>{evento.get("total_beneficiarios", 0)}</td>')
            html_parts.append('</tr>')
        
        html_parts.append('</tbody></table></div>')
    
    return '\n'.join(html_parts)

