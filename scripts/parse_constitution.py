import json
import os
import re

# Aggressive Spanish markers
SPANISH_KEYWORDS = {
    "del", "los", "las", "con", "por", "para", "como", "esta", "normas", "serán", "deberá", 
    "republica", "federal", "nigeria", "constitución", "gobierno", "un", "una", "en", "el", 
    "su", "sus", "al", "lo", "toda", "persona", "tiene", "derecho", "nacional", "estado",
    "asamblea", "legislativa", "poder", "ejecutivo", "judicatura", "donde", "cuando"
}

# Common translations for Spanish-only segments
TRANSLATIONS = {
    "Capítulo": "Chapter", "Capitulo": "Chapter", "Capìtulo": "Chapter",
    "Parte": "Part", "Anexo": "Schedule", "Normas generales": "General Provisions",
    "Objetivos fundamentales": "Fundamental Objectives", "Derechos fundamentales": "Fundamental Rights",
    "El órgano legislativo": "The Legislature", "El Poder Ejecutivo": "The Executive",
    "La judicatura": "The Judicature", "Territorio Capital Federal": "Federal Capital Territory",
    "Poderes legislativos": "Legislative Powers", "Tribunales electorales": "Election Tribunals",
    "Juramentos": "Oaths", "Funciones de un consejo de gobierno local": "Functions of a Local Government Council",
    "La Asamblea Nacional": "The National Assembly",
    "Asamblea Legislativa de un estado": "House of Assembly of a State",
    "Elecciones a una Asamblea Nacional": "Elections to a National Assembly",
    "Diversos": "Miscellaneous", "Normas diversas": "Miscellaneous Provisions",
    "Normas transitorias y salvedades": "Transitional Provisions and Savings",
    "Interpretación, citación y comienzo de vigencia": "Interpretation, Citation and Commencement",
    "Código de Conducta para los Funcionarios Públicos": "Code of Conduct for Public Officers",
    "Derecho a adquirir y poseer propiedades": "Right to acquire and own immovable property",
    "Expropiación": "Compulsory acquisition"
}

def clean_segment(text):
    """
    Intelligently pick the English version from a segment.
    """
    if isinstance(text, list):
        # Priority 1: Pick the first one that is definitely NOT Spanish
        for item in text:
            if not is_spanish(str(item)):
                return str(item)
        # Priority 2: If all look Spanish, try translating one
        for item in text:
            translated = translate_spanish(str(item))
            if translated != str(item):
                return translated
        # Fallback: First item
        return str(text[0])
    
    txt = str(text)
    if is_spanish(txt):
        return translate_spanish(txt)
    
    return txt

def translate_spanish(text):
    """Applies common translations to Spanish legal terms."""
    out = text
    for es, en in TRANSLATIONS.items():
        if es.lower() in out.lower():
            # Replace case-insensitively
            pattern = re.compile(re.escape(es), re.IGNORECASE)
            out = pattern.sub(en, out)
    return out

def is_spanish(text):
    """
    Checks if text is predominantly Spanish.
    """
    if not isinstance(text, str) or not text.strip():
        return False
    
    # Check for Spanish-unique characters
    if any(c in text for c in 'ñ¿¡'):
        return True
    
    # Accent characters are a strong hint but not definitive (could be names)
    accents = 'áéíóúü'
    
    words = re.findall(r'\b\w+\b', text.lower())
    if not words:
        return False
        
    # High-frequency Spanish words that are RARE in English
    # Removed "en" as it's common in English prefixes/words, but as a whole word it's Spanish
    SPANISH_MARKERS = {
        "del", "los", "las", "con", "por", "para", "como", "una", "el", "su", "sus", "al", "lo", "toda", "donde", "cuando", "esta", "esto", "este", "son", "entre", "sobre", "todo", "también", "está", "están", "serán", "deberá", "derecho", "libertad"
    }
    
    matches = sum(1 for w in words if w in SPANISH_MARKERS)
    
    # Predominantly Spanish if many markers are found
    if matches > 2:
        return True
    
    # Check for accented characters in common words
    if any(c in text.lower() for c in accents) and len(words) < 10:
        return True
        
    return False

def collect_all_text(node):
    """Recursively gathers all text in a sub-tree, prioritizing English segments."""
    out = []
    if isinstance(node, dict):
        content = node.get('content')
        if content is not None:
            out.append(clean_segment(content))
        
        # Handle 'section' which can be a list or a dictionary
        sections = node.get('section', [])
        if isinstance(sections, list):
            for s in sections:
                out.extend(collect_all_text(s))
        elif isinstance(sections, dict):
            out.extend(collect_all_text(sections))
            
    elif isinstance(node, list):
        # Top-level list could be content directly
        if len(node) > 0:
            out.append(clean_segment(node))
    elif isinstance(node, (str, int, float)):
        out.append(str(node))
    return out

def process_node(node, current_path=[]):
    flattened = []
    
    if isinstance(node, dict):
        content = node.get('content')
        title = clean_segment(content) if content is not None else ""
        
        # IMPROVED: A node is a section if it has a numeric title OR substantial content
        # This captures Sections 37, 40, 43 which are missing explicit numbers in this JSON
        is_numeric = bool(re.match(r'^\d+$', title.strip()))
        is_named = title in ["Preamble", "Citation", "Interpretation"]
        # If the 'title' (content) is actually a long sentence, treat it as a section body
        has_long_content = len(title) > 40 and any(kw in title for kw in ["person", "citizen", "Nigeria", "shall", "right", "law"])
        
        is_section = is_numeric or is_named or has_long_content
        
        new_path = current_path + [title] if title and not is_section else current_path
        
        if is_section:
            all_txt = collect_all_text(node)
            all_txt = [t for t in all_txt if t.strip()]
            
            effective_title = title if is_numeric or is_named else ""
            body_content = "\n".join(all_txt)

            if is_numeric and body_content.startswith(title):
                body_content = body_content[len(title):].strip()

            flattened.append({
                "path": " > ".join(current_path),
                "title": effective_title,
                "content": body_content,
                "metadata": node.get('metadata', {})
            })
        
        # ALWAYS recurse into sub-sections, whether they are a LIST or a DICT
        subs = node.get('section', [])
        if subs:
            if isinstance(subs, list):
                for s in subs:
                    if isinstance(s, (dict, list)):
                        flattened.extend(process_node(s, new_path))
                    elif isinstance(s, str):
                        txt = clean_segment(s)
                        if txt.strip() and len(txt) > 20:
                            flattened.append({
                                "path": " > ".join(new_path), "title": "", "content": txt, "metadata": node.get('metadata', {})
                            })
            elif isinstance(subs, dict):
                # Handle dictionary nesting
                flattened.extend(process_node(subs, new_path))
                    
    elif isinstance(node, list):
        for item in node:
            flattened.extend(process_node(item, current_path))
            
    return flattened

def main():
    input_path = "/Users/engmare/Downloads/Nigeria_2011.json"
    output_path = "/Users/engmare/personal-projects/knowthelaw/src/data/vector_constitution.json"

    print(f"Loading {input_path}...")
    with open(input_path, 'r') as f:
        raw = f.read()
    
    # Fix unquoted IDs in JSON (some numeric IDs aren't quoted)
    fixed = re.sub(r'(?<=[\[,])\s*([0-9]+[A-Z][A-Z0-9]*)\s*(?=[,\]])', r'"\1"', raw)
    data = json.loads(fixed)
    
    print("Processing nodes...")
    results = process_node(data['document']['section'])
    
    # Final cleanup
    final = []
    skipped_count = 0
    for r in results:
        content = r['content'].strip()
        # If it's mostly Spanish, we still filter it because we expect English pairs
        if is_spanish(content) and len(re.findall(r'\b(shall|the|of|Nigeria|Federal|Constitution)\b', content, re.I)) < 2:
            print(f"DEBUG: Skipping Spanish-looking content: {content[:100]}...")
            skipped_count += 1
            continue
            
        if len(content) < 5:
            continue
            
        final.append(r)

    print(f"Skipped {skipped_count} Spanish-only segments.")
    
    with open(output_path, 'w') as f:
        json.dump(final, f, indent=2)

    print(f"Success! Processed {len(final)} definitive sections into {output_path}")

if __name__ == "__main__":
    main()

if __name__ == "__main__":
    main()

if __name__ == "__main__":
    main()
