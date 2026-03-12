import json

def find_missing_sections(data):
    titles = []
    def recurse(node):
        if isinstance(node, dict):
            if 'content' in node:
                titles.append(str(node.get('content')))
            if 'title' in node:
                 titles.append(str(node.get('title')))
            for v in node.values():
                recurse(v)
        elif isinstance(node, list):
            for item in node:
                recurse(item)
    
    recurse(data)
    
    found_320 = any("320" in t for t in titles)
    found_citation = any("Citation" in t for t in titles)
    
    print(f"Found 320: {found_320}")
    print(f"Found Citation: {found_citation}")
    
    # Let's count sections that look like numbers
    import re
    sections = set()
    for t in titles:
        # Match standalone numbers or numbers at the start of lists
        matches = re.findall(r"'(\d+)'", t)
        for m in matches:
            sections.add(int(m))
    
    print(f"Total numeric sections found in raw JSON: {len(sections)}")
    print(f"Max section: {max(sections) if sections else 'None'}")

with open("/Users/engmare/Downloads/Nigeria_2011.json", 'r') as f:
    # Use my fix logic to load it properly
    raw = f.read()
    import re
    # Wrap unquoted alpha-numeric IDs
    fixed = re.sub(r'(?<=[\[,])\s*([0-9]+[A-Z][A-Z0-9]*)\s*(?=[,\]])', r'"\1"', raw)
    data = json.loads(fixed)
    find_missing_sections(data)
