import xlrd

book = xlrd.open_workbook("Balancete Consolidado 2025.xls")
print("Sheets:", book.sheet_names())
for sheet_name in book.sheet_names():
    sheet = book.sheet_by_name(sheet_name)
    print(f"\nSheet: {sheet_name}")
    row_limit = min(5, sheet.nrows)
    for row_idx in range(row_limit):
        print(sheet.row_values(row_idx))
    if sheet.nrows > row_limit:
        print("...")
