```python
amount_index = match.start()
vendor_name = find_vendor_name(text, amount_index, vendor_keywords)
if vendor_name:
    financial_data.append({
        'council': council_name,
        'amount': amount,
        'vendor': vendor_name,
        'currency': currency_symbol if currency_symbol else "USD"
    })

try:
    logging.info(f"[FINANCIAL DATA] Extracted: {currency_symbol}{amount:.2f} to")
except ValueError as ve:
    logging.warning(f"[FINANCIAL DATA] Could not convert amount to float: '{match.group()}'")
except Exception as e:
    logging.error(f"[FINANCIAL DATA] Unexpected error processing financial data: {e}")

def find_vendor_name(text: str, amount_index: int, vendor_keywords: List[str]) -> str:
    best_vendor_name = ""
    for keyword in vendor_keywords:
        keyword_index = text.rfind(keyword, 0, amount_index)
        if keyword_index != -1:
            vendor_start = keyword_index + len(keyword)
            vendor_end = amount_index
            vendor_name = text[vendor_start:vendor_end].strip()
            vendor_name = vendor_name.replace(":", "").replace("-", "").strip()
            vendor_name = re.sub(r'\s{2,}', ' ', vendor_name)
            if len(vendor_name) >= 2 and any(c.isalnum() for c in vendor_name):
                if len(vendor_name) > len(best_vendor_name):
                    best_vendor_name = vendor_name
    return best_vendor_name

financial_data_schema = {
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "council": {"type": "string"},
            "amount": {"type": "number"},
            "vendor": {"type": "string"},
            "currency": {"type": "string"}
        }
    }
}

# 
# Example output:
# [FINANCIAL DATA] Extracted: $100.00 to Vendor XYZ
# [FINANCIAL DATA] Could not convert amount to float: 'abc'
# [FINANCIAL DATA] Unexpected error processing financial data: Error message
```