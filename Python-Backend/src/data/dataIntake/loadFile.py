from src.data.dataIntake.fileTypes.loadX import load_pdf, load_csv, load_docx, load_html, load_json, load_md, load_pptx, load_txt, load_xlsx, load_py


file_handlers = {
    "pdf": load_pdf,
    "docx": load_docx,
    "txt": load_txt,
    "md": load_md,
    "html": load_html,
    "csv": load_csv,
    "json": load_json,
    "pptx": load_pptx,
    "xlsx": load_xlsx,
    "py": load_py,
}


def load_document(file: str):
    try:
        file_type = file.split(".")[-1].lower()
        print("file_type:", file_type)
        handler = file_handlers.get(file_type)
        print("handler:", handler)

        if handler:
            return handler(file)
        else:
            print(f"Unsupported file type: {file_type}")
            return None
    except Exception as e:
        print(f"Error loading file: {str(e)}")
        return None
